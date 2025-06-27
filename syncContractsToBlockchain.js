const { ethers } = require("hardhat");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// 1. Load contract ABI and address
const artifact = require("../artifacts/contracts/CropChainTokenizedInvestment.sol/CropChainTokenizedInvestment.json");
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // <-- your deployed address

// 2. Open SQLite DB
const dbPath = path.resolve(__dirname, "../../cropchain.db");
const db = new sqlite3.Database(dbPath);

async function main() {
  // 3. Get signer and contract
  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, signer);

  // 4. Query all contracts with joined cropName and cropVariety
  const sql = `
    SELECT contracts.*, tokens.crop_id, crops.crop_name, crops.variety
    FROM contracts
    JOIN tokens ON contracts.token_id = tokens.id
    JOIN crops ON tokens.crop_id = crops.id
  `;

  db.all(sql, async (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      process.exit(1);
    }
    for (const row of rows) {
      try {
        // You may need to fetch farmerAddress from another table if needed
        const farmerAddress = "0x000000000000000000000000000000000000dead"; // TODO: fetch from farmers table if needed
        const deliveryType = row.delivery_type === "money" ? 0 : 1;
        const expectedROI = Math.round(row.expected_roi * 100); // e.g. 9.5% -> 950
        const fundingDeadline = Math.floor(new Date(row.created_at).getTime() / 1000); // placeholder
        const expectedHarvestDate = Math.floor(new Date().getTime() / 1000); // placeholder

        const tx = await contract.createInvestment(
          row.id, // contractId
          row.token_id,
          row.farmer_id,
          row.investor_id,
          farmerAddress,
          row.crop_name,
          row.variety,
          row.price_per_token,
          row.quantity, // tokenCount
          expectedROI,
          fundingDeadline,
          expectedHarvestDate,
          deliveryType
        );
        await tx.wait();
        console.log(`Synced contract ${row.id} (${row.crop_name}, ${row.variety}) to blockchain.`);
      } catch (e) {
        console.error(`Error syncing contract ${row.id}:`, e);
      }
    }
    db.close();
  });
}

main().catch((e) => {
  console.error(e);
  db.close();
  process.exit(1);
});