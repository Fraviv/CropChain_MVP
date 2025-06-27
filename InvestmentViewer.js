// Update CONTRACT_ADDRESS to your deployed contract address if redeployed.
import React, { useState } from "react";
import { ethers } from "ethers";

// Replace with your actual deployed contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  // Only the relevant ABI fragment for investments mapping
  {
    "inputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "name": "investments",
    "outputs": [
      { "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "farmerId", "type": "uint256" },
      { "internalType": "uint256", "name": "investorId", "type": "uint256" },
      { "internalType": "address", "name": "farmerAddress", "type": "address" },
      { "internalType": "string", "name": "cropName", "type": "string" },
      { "internalType": "string", "name": "cropVariety", "type": "string" },
      { "internalType": "uint256", "name": "pricePerToken", "type": "uint256" },
      { "internalType": "uint256", "name": "tokenCount", "type": "uint256" },
      { "internalType": "uint256", "name": "tokensSold", "type": "uint256" },
      { "internalType": "uint256", "name": "expectedROI", "type": "uint256" },
      { "internalType": "uint256", "name": "fundingDeadline", "type": "uint256" },
      { "internalType": "uint256", "name": "expectedHarvestDate", "type": "uint256" },
      { "internalType": "uint8", "name": "deliveryType", "type": "uint8" },
      { "internalType": "bool", "name": "isFunded", "type": "bool" },
      { "internalType": "uint256", "name": "creationTimestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function InvestmentViewer() {
  const [contractId, setContractId] = useState("1"); // Default to 1
  const [investment, setInvestment] = useState(null);
  const [error, setError] = useState("");

  const fetchInvestment = async () => {
    setError("");
    try {
      // Connect to local Hardhat node
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const inv = await contract.investments(contractId);
      // If contractId is not set, contractId will be 0 (default struct)
      if (!inv || inv.contractId.toString() === "0") {
        setInvestment(null);
        setError("No investment found for this contractId.");
        return;
      }
      setInvestment(inv);
    } catch (err) {
      setError("Error fetching investment: " + err.message + "\nCheck that the contract address is correct and the blockchain node is running.");
      setInvestment(null);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Investment Viewer</h2>
      <input
        type="number"
        placeholder="Enter contractId"
        value={contractId}
        onChange={e => setContractId(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={fetchInvestment}>Fetch Investment</button>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {investment && (
        <div style={{ marginTop: 24 }}>
          <h3>Investment #{investment.contractId.toString()}</h3>
          <ul>
            <li><b>Token ID:</b> {investment.tokenId.toString()}</li>
            <li><b>Farmer ID:</b> {investment.farmerId.toString()}</li>
            <li><b>Investor ID:</b> {investment.investorId.toString()}</li>
            <li><b>Farmer Address:</b> {investment.farmerAddress}</li>
            <li><b>Crop Name:</b> {investment.cropName}</li>
            <li><b>Crop Variety:</b> {investment.cropVariety}</li>
            <li><b>Price Per Token:</b> {investment.pricePerToken.toString()}</li>
            <li><b>Token Count:</b> {investment.tokenCount.toString()}</li>
            <li><b>Tokens Sold:</b> {investment.tokensSold.toString()}</li>
            <li><b>Expected ROI:</b> {investment.expectedROI.toString()}</li>
            <li><b>Funding Deadline:</b> {new Date(Number(investment.fundingDeadline) * 1000).toLocaleString()}</li>
            <li><b>Expected Harvest Date:</b> {new Date(Number(investment.expectedHarvestDate) * 1000).toLocaleString()}</li>
            <li><b>Delivery Type:</b> {investment.deliveryType.toString()}</li>
            <li><b>Is Funded:</b> {investment.isFunded ? "Yes" : "No"}</li>
            <li><b>Creation Timestamp:</b> {new Date(Number(investment.creationTimestamp) * 1000).toLocaleString()}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default InvestmentViewer;