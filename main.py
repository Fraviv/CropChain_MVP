from fastapi import FastAPI, Depends, HTTPException, Query, status, Form, File, UploadFile, Body
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models, crud, schemas
import logging
from schemas import TokenOut, TokenStatusEnum
from typing import Optional
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
from jwt_auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
    get_current_user
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/register_farmer", response_model=schemas.FarmerOut)
def register_farmer(
    name: str = Form(...),
    country: str = Form(...),
    region: str = Form(...),
    address: str = Form(...),
    farm_size_ha: float = Form(...),
    contact: str = Form(None),
    identity_document: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    email = user_data.get("sub")
    account = db.query(models.FarmerAccount).filter_by(email=email).first()
    if not account:
        raise HTTPException(status_code=404, detail="Farmer account not found")

    # Save the uploaded file
    file_location = f"identity_docs/{identity_document.filename}"
    with open(file_location, "wb") as f:
        f.write(identity_document.file.read())

    farmer_data = schemas.FarmerCreate(
        name=name,
        country=country,
        region=region,
        address=address,
        farm_size_ha=farm_size_ha,
        contact=contact,
        identity_document=file_location
    )
    return crud.create_farmer(db=db, farmer=farmer_data, account_id=account.id)


@app.post("/update_farmer_status", response_model=schemas.FarmerOut)
def update_farmer_status(
    update: schemas.FarmerStatusUpdate,
    db: Session = Depends(get_db)
):
    try:
        return crud.update_farmer_status(db=db, farmer_id=update.farmer_id, new_status=update.new_status)
    except ValueError:
        raise HTTPException(status_code=404, detail="Farmer not found")


@app.post("/add_crop", response_model=schemas.CropOut)
def add_crop(crop: schemas.CropCreate, db: Session = Depends(get_db)):
    return crud.create_crop(db=db, crop=crop)


@app.post("/tokenize_crop", response_model=schemas.TokenOut)
def tokenize_crop(token: schemas.TokenCreate, db: Session = Depends(get_db)):
    try:
        db_token = crud.create_token(db=db, token=token)

        crop = db_token.crop
        farmer = db_token.farmer

        funding_percentage = round((db_token.tokens_sold / db_token.token_count) * 100, 2) if db_token.token_count else 0.0
        tokens_left = db_token.token_count - db_token.tokens_sold

        return schemas.TokenOut(
            **db_token.__dict__,
            crop_name=crop.crop_name,
            crop_variety=crop.variety,
            country=farmer.country,
            region=farmer.region,
            organic_certified=crop.organic_certified,
            funding_percentage=funding_percentage,
            tokens_left=tokens_left
        )
    except Exception as e:
        print(f"Error in tokenize_crop: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/tokens_available", response_model=list[schemas.TokenOut])
def tokens_available(
    country: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    crop_name: Optional[str] = Query(None),
    crop_variety: Optional[str] = Query(None),
    farmer_id: Optional[int] = Query(None),
    min_roi: Optional[float] = Query(None),
    deadline: Optional[date] = Query(None),
    created_after: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    funded_only: Optional[bool] = Query(None, description="Filter for funded tokens"),
    organic_only: Optional[bool] = Query(None, description="Filter for organic crops"),
    db: Session = Depends(get_db)
):
    try:
        tokens = crud.get_filtered_tokens(
            db=db,
            country=country,
            region=region,
            crop_name=crop_name,
            crop_variety=crop_variety,
            farmer_id=farmer_id,
            min_roi=min_roi,
            deadline=deadline,
            created_after=created_after,
            status=status,
            funded_only=funded_only,
            organic_only=organic_only
        )

        response = []
        for token in tokens:
            if not token.crop or not token.farmer:
                print(f"Skipping token {token.id} due to missing crop or farmer relation.")
                continue

            funding_percentage = round((token.tokens_sold / token.token_count) * 100, 2) if token.token_count else 0.0
            tokens_left = token.token_count - token.tokens_sold

            response.append(
                schemas.TokenOut(
                    id=token.id,
                    crop_id=token.crop_id,
                    crop_name=token.crop.crop_name,
                    crop_variety=token.crop.variety,
                    country=token.farmer.country,
                    region=token.farmer.region,
                    organic_certified=token.crop.organic_certified,
                    token_count=token.token_count,
                    price_per_token=token.price_per_token,
                    expected_yield_unit=token.expected_yield_unit,
                    expected_total_yield=token.expected_total_yield,
                    expected_roi=token.expected_roi,
                    tokens_sold=token.tokens_sold,
                    is_funded=token.is_funded,
                    funding_deadline=token.funding_deadline,
                    currency=token.currency,
                    status=token.status,
                    created_at=token.created_at,
                    funding_percentage=funding_percentage,
                    tokens_left=tokens_left,
                    token_status=token.token_status,
                    planting_date=token.crop.planting_date,
                    expected_harvest_month=token.crop.expected_harvest_month
                )
            )

        return response

    except Exception as e:
        print(f"Error in tokens_available: {e}")
        return []


@app.post("/invest_token", response_model=schemas.InvestmentOut)
def invest_token(investment: schemas.TokenInvestmentRequest, db: Session = Depends(get_db)):
    try:
        return crud.invest_in_token(
            db=db,
            token_id=investment.token_id,
            investor_id=investment.investor_id,
            quantity=investment.quantity
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/create_contract", response_model=schemas.ContractOut)
def create_contract(
    contract_data: schemas.ContractCreate, 
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    try:
        # Get investor ID from authenticated user
        email = user_data.get("sub")
        investor = db.query(models.InvestorAccount).filter_by(email=email).first()
        if not investor:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        return crud.create_contract(
            db=db,
            contract_data=contract_data,
            investor_id=investor.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in create_contract: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/tokens_by_crop/{crop_id}", response_model=list[schemas.TokenOut])
def tokens_by_crop(crop_id: int, db: Session = Depends(get_db)):
    tokens = crud.get_tokens_by_crop(db=db, crop_id=crop_id)
    response = []
    for token in tokens:
        percentage = round((token.tokens_sold / token.token_count) * 100, 2) if token.token_count else 0.0
        response.append(schemas.TokenOut(**token.__dict__, funding_percentage=percentage))
    return response


@app.get("/tokens_all", response_model=list[schemas.TokenOut])
def tokens_all(
    status: Optional[str] = Query(None),
    funded_only: Optional[bool] = Query(None),
    min_roi: Optional[float] = Query(None),
    created_after: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        tokens = crud.get_all_tokens(
            db=db,
            status=status,
            funded_only=funded_only,
            min_roi=min_roi,
            created_after=created_after
        )

        response = []
        for token in tokens:
            if not token.crop or not token.farmer:
                print(f"Skipping token {token.id} due to missing crop or farmer relation.")
                continue

            funding_percentage = round((token.tokens_sold / token.token_count) * 100, 2) if token.token_count else 0.0
            tokens_left = token.token_count - token.tokens_sold

            response.append(
                schemas.TokenOut(
                    id=token.id,
                    crop_id=token.crop_id,
                    crop_name=token.crop.crop_name,
                    crop_variety=token.crop.variety,
                    country=token.farmer.country,
                    region=token.farmer.region,
                    organic_certified=token.crop.organic_certified,
                    token_count=token.token_count,
                    price_per_token=token.price_per_token,
                    expected_yield_unit=token.expected_yield_unit,
                    expected_total_yield=token.expected_total_yield,
                    expected_roi=token.expected_roi,
                    tokens_sold=token.tokens_sold,
                    is_funded=token.is_funded,
                    funding_deadline=token.funding_deadline,
                    currency=token.currency,
                    status=token.status,
                    created_at=token.created_at,
                    funding_percentage=funding_percentage,
                    tokens_left=tokens_left,
                    token_status=token.token_status
                )
            )
        return response

    except Exception as e:
        print(f"Error in /tokens_all: {e}")
        return []
    

@app.get("/crops_by_farmer", response_model=list[schemas.CropOut])
def crops_by_farmer(farmer_id: int, db: Session = Depends(get_db)):
    crops = db.query(models.Crop).filter(models.Crop.farmer_id == farmer_id).all()
    return crops


@app.get("/tokens_by_farmer", response_model=list[schemas.TokenOut])
def tokens_by_farmer(farmer_id: int, db: Session = Depends(get_db)):
    tokens = db.query(models.Token).filter(models.Token.farmer_id == farmer_id, models.Token.token_status == models.TokenStatusEnum.verified).all()

    response = []
    for token in tokens:
        if not token.crop or not token.farmer:
            continue

        funding_percentage = round((token.tokens_sold / token.token_count) * 100, 2) if token.token_count else 0.0
        tokens_left = token.token_count - token.tokens_sold

        response.append(schemas.TokenOut(
            id=token.id,
            crop_id=token.crop_id,
            crop_name=token.crop.crop_name,
            crop_variety=token.crop.variety,
            country=token.farmer.country,
            region=token.farmer.region,
            organic_certified=token.crop.organic_certified,
            token_count=token.token_count,
            price_per_token=token.price_per_token,
            expected_yield_unit=token.expected_yield_unit,
            expected_total_yield=token.expected_total_yield,
            expected_roi=token.expected_roi,
            tokens_sold=token.tokens_sold,
            is_funded=token.is_funded,
            funding_deadline=token.funding_deadline,
            currency=token.currency,
            status=token.status,
            created_at=token.created_at,
            funding_percentage=funding_percentage,
            tokens_left=tokens_left,
            token_status=token.token_status,
            planting_date=token.crop.planting_date,
            expected_harvest_month=token.crop.expected_harvest_month
        ))
    return response


@app.post("/farmer_signup", response_model=schemas.AuthWithFarmer)
def farmer_signup(data: schemas.FarmerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.FarmerAccount).filter(models.FarmerAccount.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new farmer
    farmer = crud.create_farmer_account(db, data)

    # Generate access token using email
    access_token = create_access_token({"sub": farmer.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "farmer": farmer
    }


@app.post("/farmer_login", response_model=schemas.AuthWithFarmer)
def farmer_login(data: schemas.FarmerLoginRequest, db: Session = Depends(get_db)):
    farmer = db.query(models.FarmerAccount).filter(models.FarmerAccount.email == data.email).first()
    if not farmer or not verify_password(data.password, farmer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": farmer.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "farmer": {"id": farmer.id, "email": farmer.email}
    }


@app.post("/investor_signup", response_model=schemas.AuthWithInvestor)
def investor_signup(data: schemas.InvestorRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.InvestorAccount).filter(models.InvestorAccount.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    investor = crud.create_investor_account(db, data)
    access_token = create_access_token({"sub": investor.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "investor": investor
    }


@app.post("/investor_login", response_model=schemas.AuthWithInvestor)
def investor_login(data: schemas.InvestorLoginRequest, db: Session = Depends(get_db)):
    investor = db.query(models.InvestorAccount).filter(models.InvestorAccount.email == data.email).first()
    if not investor or not verify_password(data.password, investor.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": investor.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "investor": investor
    }


@app.get("/investments", response_model=list[schemas.InvestmentOut])
def get_my_investments(user_data=Depends(get_current_user), db: Session = Depends(get_db)):
    email = user_data.get("sub")
    investor = db.query(models.InvestorAccount).filter_by(email=email).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return db.query(models.Investment).filter_by(investor_id=investor.id).all()

@app.get("/farmer_dashboard")
def get_my_farmer_data(user_data=Depends(get_current_user), db: Session = Depends(get_db)):
    email = user_data.get("sub")
    account = db.query(models.FarmerAccount).filter_by(email=email).first()
    if not account:
        raise HTTPException(status_code=404, detail="FarmerAccount not found")
    farmer = db.query(models.Farmer).filter_by(account_id=account.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    # Only include tokens that are verified
    farmer.tokens = [token for token in farmer.tokens if token.token_status == models.TokenStatusEnum.verified]
    # Manual mapping to ensure farmer_id is present
    return {
        "farmer_id": farmer.id,
        "name": farmer.name,
        "country": farmer.country,
        "region": farmer.region,
        "address": farmer.address,
        "farm_size_ha": farmer.farm_size_ha,
        "contact": farmer.contact,
        "identity_document": farmer.identity_document,
        "registration_status": farmer.registration_status,
        "registered_at": farmer.registered_at,
        # Add any other fields you want to include
    }


@app.post("/update_token_status")
def update_token_status(
    token_id: int = Body(...),
    new_status: TokenStatusEnum = Body(...),
    db: Session = Depends(get_db)
):
    token = db.query(models.Token).filter(models.Token.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    token.token_status = new_status
    db.commit()
    db.refresh(token)
    return {"message": "Token status updated", "token_id": token_id, "new_status": new_status}


@app.get("/my_contracts", response_model=list[schemas.ContractOut])
def my_contracts(user_data=Depends(get_current_user), db: Session = Depends(get_db)):
    email = user_data.get("sub")
    investor = db.query(models.InvestorAccount).filter_by(email=email).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    contracts = db.query(models.Contract).filter_by(investor_id=investor.id).all()
    result = []
    for contract in contracts:
        token = db.query(models.Token).filter_by(id=contract.token_id).first()
        crop_name = None
        crop_variety = None
        if token and token.crop_id:
            crop = db.query(models.Crop).filter_by(id=token.crop_id).first()
            if crop:
                crop_name = crop.crop_name
                crop_variety = crop.variety
        result.append(schemas.ContractOut(
            id=contract.id,
            token_id=contract.token_id,
            farmer_id=contract.farmer_id,
            investor_id=contract.investor_id,
            quantity=contract.quantity,
            price_per_token=contract.price_per_token,
            total_value=contract.total_value,
            delivery_type=contract.delivery_type,
            expected_roi=contract.expected_roi,
            expected_harvest_month=contract.expected_harvest_month,
            payout_status=contract.payout_status,
            created_at=contract.created_at,
            crop_name=crop_name,
            crop_variety=crop_variety
        ))
    return result