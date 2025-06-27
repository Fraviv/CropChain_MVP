// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title CropChainTokenizedInvestment
/// @notice Stores tokenized crop investment data on-chain

contract CropChainTokenizedInvestment {
    struct Investment {
        uint256 contractId;         // Unique contract ID (off-chain reference)
        uint256 tokenId;            // Unique ID for the tokenized crop batch
        uint256 farmerId;           // Off-chain farmer ID
        uint256 investorId;         // Off-chain investor ID (last investor, or use investorMap for all)
        address farmerAddress;      // Wallet address of the farmer (recipient of funds)
        string cropName;            // Name of the crop (e.g., "Oranges")
        string cropVariety;         // Variety of the crop (e.g., "Red")
        uint256 pricePerToken;      // Price per token (in smallest unit, e.g. wei or USDT decimals)
        uint256 tokenCount;         // Total number of tokens available
        uint256 tokensSold;         // Number of tokens sold
        uint256 expectedROI;        // Expected ROI (e.g. 117 = 17% if using 2 decimals)
        uint256 fundingDeadline;    // Timestamp for fundraising cutoff
        uint256 expectedHarvestDate;// Timestamp or month (can use uint8 for month)
        DeliveryType deliveryType;  // Enum for delivery type
        bool isFunded;              // Whether the goal is reached
        uint256 creationTimestamp;  // When the contract was deployed
    }

    enum DeliveryType { Cash, InKind }

    // Mapping from contractId to Investment struct
    mapping(uint256 => Investment) public investments;

    // Mapping from contractId to investor address to quantity purchased
    mapping(uint256 => mapping(address => uint256)) public investorMap;

    event InvestmentCreated(uint256 contractId, uint256 tokenId, uint256 farmerId, uint256 investorId, address farmer, string cropName, string cropVariety);
    event TokensPurchased(uint256 contractId, address investor, uint256 quantity);

    /// @notice Create a new investment (only owner/factory in production)
    function createInvestment(
        uint256 contractId,
        uint256 tokenId,
        uint256 farmerId,
        uint256 investorId,
        address farmerAddress,
        string memory cropName,
        string memory cropVariety,
        uint256 pricePerToken,
        uint256 tokenCount,
        uint256 expectedROI,
        uint256 fundingDeadline,
        uint256 expectedHarvestDate,
        DeliveryType deliveryType
    ) external {
        require(investments[contractId].contractId == 0, "Already exists");
        investments[contractId] = Investment({
            contractId: contractId,
            tokenId: tokenId,
            farmerId: farmerId,
            investorId: investorId,
            farmerAddress: farmerAddress,
            cropName: cropName,
            cropVariety: cropVariety,
            pricePerToken: pricePerToken,
            tokenCount: tokenCount,
            tokensSold: 0,
            expectedROI: expectedROI,
            fundingDeadline: fundingDeadline,
            expectedHarvestDate: expectedHarvestDate,
            deliveryType: deliveryType,
            isFunded: false,
            creationTimestamp: block.timestamp
        });
        emit InvestmentCreated(contractId, tokenId, farmerId, investorId, farmerAddress, cropName, cropVariety);
    }

    /// @notice Purchase tokens for a given contractId
    function purchaseTokens(uint256 contractId, uint256 quantity) external payable {
        Investment storage inv = investments[contractId];
        require(inv.contractId != 0, "Investment does not exist");
        require(block.timestamp <= inv.fundingDeadline, "Funding closed");
        require(inv.tokensSold + quantity <= inv.tokenCount, "Not enough tokens left");
        // Payment logic (e.g. require(msg.value == quantity * inv.pricePerToken)) can be added here

        inv.tokensSold += quantity;
        investorMap[contractId][msg.sender] += quantity;

        if (inv.tokensSold == inv.tokenCount) {
            inv.isFunded = true;
        }
        emit TokensPurchased(contractId, msg.sender, quantity);
    }

    // Add more functions as needed (e.g. withdraw, update status, etc.)
}