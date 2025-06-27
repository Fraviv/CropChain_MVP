from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Boolean, Float, DateTime
from database import Base
from schemas import MonthEnum, RegistrationStatusEnum
from datetime import datetime, timezone
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import relationship
from enum import Enum

class Farmer(Base):
    __tablename__ = "farmers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    region = Column(String)
    farm_size_ha = Column(Float, nullable=True)
    contact = Column(String, nullable=True)
    identity_document = Column(String, nullable=True)
    registration_status = Column(SqlEnum(RegistrationStatusEnum, name="registration_status_enum"),
    default=RegistrationStatusEnum.pending)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    account_id = Column(Integer, ForeignKey("farmer_accounts.id"))
    address = Column(String, nullable=False)  # New field
    
    account = relationship("FarmerAccount", backref="profile")
    tokens = relationship("Token", back_populates="farmer")


class Crop(Base):
    __tablename__ = "crops"
    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, index=True)
    variety = Column(String, nullable=True)
    planting_date = Column(Date)
    expected_harvest_month = Column(SqlEnum(MonthEnum)) 
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    farm_location = Column(String, nullable=True)
    organic_certified = Column(Boolean, default=False)
    
    tokens = relationship("Token", back_populates="crop")


class TokenStatusEnum(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"))
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    token_count = Column(Integer)
    price_per_token = Column(Integer)
    expected_yield_unit = Column(String)
    expected_total_yield = Column(Integer)
    expected_roi = Column(Float) 
    tokens_sold = Column(Integer, default=0)
    is_funded = Column(Boolean, default=False)
    funding_deadline = Column(Date)
    currency = Column(String, default="USDT")
    status = Column(String, default="open")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    token_status = Column(SqlEnum(TokenStatusEnum, name="token_status_enum"), default=TokenStatusEnum.pending)
    
    crop = relationship("Crop", back_populates="tokens")
    farmer = relationship("Farmer", back_populates="tokens")


class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"))
    investor_id = Column(String)
    quantity = Column(Integer)
    invested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PayoutStatusEnum(str, Enum):
    pending = "pending"
    delivered = "delivered"
    defaulted = "defaulted"


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"))
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    investor_id = Column(Integer, ForeignKey("investor_accounts.id"))
    quantity = Column(Integer)
    price_per_token = Column(Integer)
    total_value = Column(Integer)
    delivery_type = Column(String)  # "money" or "product"
    expected_roi = Column(Float)
    expected_harvest_month = Column(SqlEnum(MonthEnum))
    payout_status = Column(SqlEnum(PayoutStatusEnum, name="payout_status_enum"), default=PayoutStatusEnum.pending)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FarmerAccount(Base):
    __tablename__ = "farmer_accounts"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class InvestorAccount(Base):
    __tablename__ = "investor_accounts"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))