from sqlalchemy.orm import Session, joinedload
import models, schemas
from datetime import date
from typing import Optional
from passlib.hash import bcrypt
from passlib.context import CryptContext

def create_farmer(db: Session, farmer: schemas.FarmerCreate, account_id: int):
    db_farmer = models.Farmer(
        name=farmer.name,
        country=farmer.country,
        region=farmer.region,
        address=farmer.address,  # New field
        farm_size_ha=farmer.farm_size_ha,
        contact=farmer.contact,
        identity_document=farmer.identity_document,
        account_id=account_id
    )
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

def update_farmer_status(db: Session, farmer_id: int, new_status: schemas.RegistrationStatusEnum):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise ValueError("Farmer not found")
    
    farmer.registration_status = new_status
    db.commit()
    db.refresh(farmer)
    return farmer

def create_crop(db: Session, crop: schemas.CropCreate):
    db_crop = models.Crop(
        crop_name=crop.crop_name,
        variety=crop.variety,
        planting_date=crop.planting_date,
        expected_harvest_month=crop.expected_harvest_month, 
        farmer_id=crop.farmer_id,
        farm_location=crop.farm_location,
        organic_certified=crop.organic_certified
    )
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop

def create_token(db: Session, token: schemas.TokenCreate):
    crop = db.query(models.Crop).filter(models.Crop.id == token.crop_id).first()
    if not crop:
        raise ValueError("Crop not found")

    db_token = models.Token(
        crop_id=token.crop_id,
        farmer_id=crop.farmer_id, 
        token_count=token.token_count,
        price_per_token=token.price_per_token,
        expected_yield_unit=token.expected_yield_unit,
        expected_total_yield=token.expected_total_yield,
        expected_roi=token.expected_roi,
        funding_deadline=token.funding_deadline,
        currency=token.currency,
        token_status=models.TokenStatusEnum.pending
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def create_contract(db: Session, contract_data: schemas.ContractCreate, investor_id: int):
    # Get the token and validate availability
    token = db.query(models.Token).filter(models.Token.id == contract_data.token_id).first()
    if not token:
        raise ValueError("Token not found")
    
    # Check if enough tokens are available
    available_tokens = token.token_count - token.tokens_sold
    if contract_data.quantity > available_tokens:
        raise ValueError(f"Only {available_tokens} tokens available")
    
    # Validate delivery type
    if contract_data.delivery_type not in ["money", "product"]:
        raise ValueError("Delivery type must be 'money' or 'product'")
    
    # Calculate total value
    total_value = contract_data.quantity * token.price_per_token
    
    # Create the contract
    db_contract = models.Contract(
        token_id=contract_data.token_id,
        farmer_id=token.farmer_id,
        investor_id=investor_id,
        quantity=contract_data.quantity,
        price_per_token=token.price_per_token,
        total_value=total_value,
        delivery_type=contract_data.delivery_type,
        expected_roi=token.expected_roi,
        expected_harvest_month=token.crop.expected_harvest_month,
        payout_status=models.PayoutStatusEnum.pending
    )
    
    # Update token sold count
    token.tokens_sold += contract_data.quantity
    if token.tokens_sold == token.token_count:
        token.is_funded = True
        token.status = "funded"
    
    # Also create an investment record for backward compatibility
    investment = models.Investment(
        token_id=contract_data.token_id,
        investor_id=str(investor_id),
        quantity=contract_data.quantity
    )
    
    db.add(db_contract)
    db.add(investment)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def get_open_tokens(db: Session):
    tokens = db.query(models.Token).filter(models.Token.is_funded == False).all()
    return tokens

def invest_in_token(db: Session, token_id: int, investor_id: str, quantity: int):
    token = db.query(models.Token).filter(models.Token.id == token_id).first()
    if not token:
        raise ValueError("Token not found")

    if token.is_funded:
        raise ValueError("Token is already fully funded")

    available = token.token_count - token.tokens_sold
    if quantity > available:
        raise ValueError(f"Only {available} tokens available")

    # Update funding
    token.tokens_sold += quantity
    if token.tokens_sold == token.token_count:
        token.is_funded = True
        token.status = "funded"

    # Log investment
    investment = models.Investment(
        token_id=token_id,
        investor_id=investor_id,
        quantity=quantity
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment

def get_investments_by_investor(db: Session, investor_id: str):
    return db.query(models.Investment).filter(models.Investment.investor_id == investor_id).all()

def get_contracts_by_investor(db: Session, investor_id: int):
    return db.query(models.Contract).filter(models.Contract.investor_id == investor_id).all()

def get_tokens_by_crop(db: Session, crop_id: int):
    return db.query(models.Token).filter(models.Token.crop_id == crop_id).all()

def get_filtered_tokens(
    db: Session,
    country: str = None,
    region: str = None,
    crop_name: str = None,
    crop_variety: str = None,
    farmer_id: int = None,
    min_roi: float = None,
    deadline: date = None,
    funded_only: bool = None,
    created_after: date = None,
    status: str = None,
    organic_only: bool = False
):
    query = db.query(models.Token) \
    .options(joinedload(models.Token.crop), joinedload(models.Token.farmer)) \
    .join(models.Crop) \
    .join(models.Farmer)
    if funded_only is not None:
        query = query.filter(models.Token.is_funded == funded_only)
    else:
        query = query.filter(models.Token.status == "open")  # default for investors
    if status:
        query = query.filter(models.Token.status.ilike(status))
    if country:
        query = query.filter(models.Farmer.country.ilike(f"%{country}%"))
    if region:
        query = query.filter(models.Farmer.region.ilike(f"%{region}%"))
    if crop_name:
        query = query.filter(models.Crop.crop_name.ilike(f"%{crop_name}%"))
    if crop_variety:
        query = query.filter(models.Crop.variety.ilike(f"%{crop_variety}%"))
    if farmer_id:
        query = query.filter(models.Farmer.id == farmer_id)
    if min_roi:
        query = query.filter(models.Token.expected_roi >= min_roi)
    if deadline:
        query = query.filter(models.Token.funding_deadline <= deadline)
    if created_after:
        query = query.filter(models.Token.created_at >= created_after)
    if organic_only:
        query = query.filter(models.Crop.organic_certified == True)
    return query.all()

def get_all_tokens(
    db: Session,
    status: Optional[str] = None,
    funded_only: Optional[bool] = None,
    min_roi: Optional[float] = None,
    created_after: Optional[date] = None
):
    query = db.query(models.Token)\
        .options(joinedload(models.Token.crop), joinedload(models.Token.farmer))

    if status:
        query = query.filter(models.Token.status.ilike(status))

    if funded_only is not None:
        query = query.filter(models.Token.is_funded == funded_only)

    if min_roi:
        query = query.filter(models.Token.expected_roi >= min_roi)

    if created_after:
        query = query.filter(models.Token.created_at >= created_after)

    return query.all()


def create_farmer_account(db: Session, data: schemas.FarmerRegisterRequest):
    hashed_pw = bcrypt.hash(data.password)
    account = models.FarmerAccount(email=data.email, hashed_password=hashed_pw)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

def authenticate_farmer(db: Session, data: schemas.FarmerLoginRequest):
    account = db.query(models.FarmerAccount).filter(models.FarmerAccount.email == data.email).first()
    if account and bcrypt.verify(data.password, account.hashed_password):
        return account
    return None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_investor_account(db: Session, data: schemas.InvestorRegisterRequest):
    hashed = pwd_context.hash(data.password)
    investor = models.InvestorAccount(email=data.email, hashed_password=hashed)
    db.add(investor)
    db.commit()
    db.refresh(investor)
    return investor

def verify_investor_credentials(db: Session, data: schemas.InvestorLoginRequest):
    investor = db.query(models.InvestorAccount).filter(models.InvestorAccount.email == data.email).first()
    if investor and pwd_context.verify(data.password, investor.hashed_password):
        return investor
    return None