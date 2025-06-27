const hre = require("hardhat");

async function main() {
  // Funding deadline: August 15, 2025 (UNIX timestamp)
  const fundingDeadline = 1755216000;

  // Function to get January 1st of the year after the funding deadline
  function getNextJanuaryTimestamp(fundingDeadline) {
    const deadlineDate = new Date(fundingDeadline * 1000);
    let year = deadlineDate.getUTCFullYear();
    year += 1; // Always next year
    return Math.floor(Date.UTC(year, 0, 1) / 1000);
  }
  const expectedHarvestDate = getNextJanuaryTimestamp(fundingDeadline);

  // Investment object with your values
  const investment = {
    contractId: 1,
    tokenId: 3,
    farmerId: 4,
    investorId: 2,
    farmerAddress: "0x000000000000000000000000000000000000dead", 
    cropName: "Oranges",
    cropVariety: "Red",
    pricePerToken: 10, 
    tokenCount: 50,
    expectedROI: 950, 
    fundingDeadline: fundingDeadline,
    expectedHarvestDate: expectedHarvestDate,
    deliveryType: 0 // 0 = Cash, 1 = InKind
  };

  // Deploy the contract
  const CropChain = await hre.ethers.getContractFactory("CropChainTokenizedInvestment");
  const cropChain = await CropChain.deploy();
  await cropChain.waitForDeployment();
  console.log("Contract deployed to:", await cropChain.getAddress());

  // Store the investment on-chain
  const tx = await cropChain.createInvestment(
    investment.contractId,
    investment.tokenId,
    investment.farmerId,
    investment.investorId,
    investment.farmerAddress,
    investment.cropName,
    investment.cropVariety,
    investment.pricePerToken,
    investment.tokenCount,
    investment.expectedROI,
    investment.fundingDeadline,
    investment.expectedHarvestDate,
    investment.deliveryType
  );
  await tx.wait();
  console.log("Investment stored on-chain!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});