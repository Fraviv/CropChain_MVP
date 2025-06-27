# CropChain

Tokenizing Smallholder Farmers' Harvests & Connecting Them with Investors

---

## Overview
CropChain is a full-stack web application that enables smallholder farmers to tokenize their future harvests and connect with global investors. The platform leverages blockchain technology for transparency and trust, and provides a modern, user-friendly interface for both farmers and investors.

- **Frontend:** React + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Blockchain:** Solidity smart contracts (Hardhat)
- **Blockchain Explorer:** React-based viewer for on-chain data

---

## Folder Structure

```
MVP/
├── main.py                # FastAPI backend entry point
├── crud.py, models.py     # Backend logic and ORM models
├── schemas.py             # Pydantic schemas
├── database.py            # DB connection
├── cropchain.db           # SQLite database
├── frontend/              # Main web frontend (React + Tailwind)
├── blockchain-frontend/   # Blockchain explorer frontend (React)
├── cropchain-blockchain/  # Smart contracts, deployment & sync scripts (Hardhat)
└── identity_docs/         # Uploaded farmer identity documents
```

---

## Getting Started

### 1. Backend (FastAPI)

```sh
# (Recommended) Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # (create if missing: fastapi, uvicorn, sqlalchemy, passlib, jose, etc.)

# Run the backend
uvicorn main:app --reload
```
- The API will be available at [http://localhost:8000](http://localhost:8000)
- Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React + Tailwind)

```sh
cd frontend
npm install
npm run dev
```
- The app will be available at [http://localhost:5175](http://localhost:5175)

### 3. Blockchain (Hardhat + Solidity)

```sh
cd cropchain-blockchain
npm install
npx hardhat node
# In a new terminal:
npx hardhat run scripts/deployAndStore.js --network localhost
npx hardhat run scripts/syncContractsToBlockchain.js --network localhost
```
- Update the contract address in `blockchain-frontend/src/InvestmentViewer.js` after deployment.

### 4. Blockchain Explorer Frontend

```sh
cd blockchain-frontend
npm install
npm start
```
- The explorer will be available at [http://localhost:3000](http://localhost:3000)

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
This project is licensed under the MIT License. 