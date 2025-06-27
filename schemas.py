from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from enum import Enum
from typing import Optional


class MonthEnum(str, Enum):
    january = "January"
    february = "February"
    march = "March"
    april = "April"
    may = "May"
    june = "June"
    july = "July"
    august = "August"
    september = "September"
    october = "October"
    november = "November"
    december = "December"

class RegistrationStatusEnum(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class TokenStatusEnum(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class PayoutStatusEnum(str, Enum):
    pending = "pending"
    delivered = "delivered"
    defaulted = "defaulted"


# This is the schema for creating a farmer
class FarmerCreate(BaseModel):
    name: str
    country: str
    region: str
    address: str  # New field
    farm_size_ha: Optional[float] = None
    contact: Optional[str] = None
    identity_document: Optional[str] = None  # e.g. URL or filename

class FarmerOut(BaseModel):
    farmer_id: int = Field(alias="id")
    name: str
    country: str
    region: str
    address: str  # New field
    farm_size_ha: Optional[float]
    contact: Optional[str]
    identity_document: str
    registration_status: RegistrationStatusEnum
    registered_at: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }

class FarmerStatusUpdate(BaseModel):
    farmer_id: int
    new_status: RegistrationStatusEnum


# This is the schema for creating a crop
class CropCreate(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    planting_date: date
    expected_harvest_month: MonthEnum
    farmer_id: int
    farm_location: Optional[str] = None
    organic_certified: Optional[bool] = False

class CropOut(BaseModel):
    crop_id: int = Field(alias="id")
    crop_name: str
    variety: Optional[str]
    planting_date: date
    expected_harvest_month: MonthEnum
    farmer_id: int
    farm_location: Optional[str]
    organic_certified: bool
    
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }

# This is the schema for creating a token
class TokenCreate(BaseModel):
    crop_id: int
    token_count: int
    price_per_token: int
    expected_yield_unit: str
    expected_total_yield: int
    expected_roi: float 
    funding_deadline: date
    currency: str = "USDT"
    token_status: TokenStatusEnum = TokenStatusEnum.pending

class TokenOut(BaseModel):
    token_id: int = Field(alias="id")
    crop_id: int
    crop_name: str
    crop_variety: str
    country: str
    region: str
    organic_certified: bool
    token_count: int
    price_per_token: int
    expected_yield_unit: str
    expected_total_yield: int
    expected_roi: float  
    tokens_sold: int
    is_funded: bool
    funding_deadline: date
    currency: str
    status: str
    created_at: datetime
    funding_percentage: Optional[float] = None
    tokens_left: Optional[int] = None
    token_status: TokenStatusEnum
    planting_date: Optional[date] = None
    expected_harvest_month: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }

# This is the schema for investment requests
class TokenInvestmentRequest(BaseModel):
    token_id: int
    investor_id: str
    quantity: int

class InvestmentOut(BaseModel):
    investment_id: int = Field(alias="id")
    token_id: int
    investor_id: str
    quantity: int
    invested_at: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }

# This is the schema for creating a contract
class ContractCreate(BaseModel):
    token_id: int
    quantity: int
    delivery_type: str  # "money" or "product"

class ContractOut(BaseModel):
    id: int
    token_id: int
    farmer_id: int
    investor_id: int
    quantity: int
    price_per_token: int
    total_value: int
    delivery_type: str
    expected_roi: float
    expected_harvest_month: MonthEnum
    payout_status: PayoutStatusEnum
    created_at: datetime
    crop_name: Optional[str] = None
    crop_variety: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }


class FarmerRegisterRequest(BaseModel):
    email: EmailStr
    password: str

class FarmerLoginRequest(BaseModel):
    email: EmailStr
    password: str

class FarmerAuthOut(BaseModel):
    id: int
    email: EmailStr

    model_config = {
        "from_attributes": True
    }

class AuthWithFarmer(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerAuthOut

class InvestorRegisterRequest(BaseModel):
    email: str
    password: str

class InvestorLoginRequest(BaseModel):
    email: str
    password: str

class InvestorAccountOut(BaseModel):
    investor_id: int = Field(alias="id")
    email: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "ser_json_by_alias": True
    }

class AuthWithInvestor(BaseModel):
    access_token: str
    token_type: str
    investor: InvestorAccountOut