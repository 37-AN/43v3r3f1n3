// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IndustrialAssetToken is ERC20, Ownable {
    struct AssetDetails {
        string assetType;
        string description;
        uint256 totalSupply;
        uint256 pricePerToken;
        bool complianceStatus;
        mapping(address => uint256) resourceAllocation;
    }

    mapping(string => AssetDetails) public assets;
    mapping(string => bool) public complianceChecks;

    event AssetTokenized(string symbol, string assetType, uint256 totalSupply);
    event ComplianceStatusUpdated(string symbol, bool status);
    event ResourceAllocated(string symbol, address user, uint256 amount);

    constructor() ERC20("Industrial Asset", "IND") Ownable(msg.sender) {}

    function tokenizeAsset(
        string memory symbol,
        string memory assetType,
        string memory description,
        uint256 initialSupply,
        uint256 price
    ) public onlyOwner {
        require(assets[symbol].totalSupply == 0, "Asset already exists");
        
        AssetDetails storage newAsset = assets[symbol];
        newAsset.assetType = assetType;
        newAsset.description = description;
        newAsset.totalSupply = initialSupply;
        newAsset.pricePerToken = price;
        newAsset.complianceStatus = true;

        _mint(msg.sender, initialSupply);
        
        emit AssetTokenized(symbol, assetType, initialSupply);
    }

    function updateComplianceStatus(string memory symbol, bool status) public onlyOwner {
        require(assets[symbol].totalSupply > 0, "Asset does not exist");
        assets[symbol].complianceStatus = status;
        emit ComplianceStatusUpdated(symbol, status);
    }

    function allocateResource(string memory symbol, address user, uint256 amount) public onlyOwner {
        require(assets[symbol].totalSupply > 0, "Asset does not exist");
        require(assets[symbol].complianceStatus, "Asset not compliant");
        
        assets[symbol].resourceAllocation[user] = amount;
        emit ResourceAllocated(symbol, user, amount);
    }

    function getAssetDetails(string memory symbol) public view returns (
        string memory assetType,
        string memory description,
        uint256 totalSupply,
        uint256 pricePerToken,
        bool complianceStatus
    ) {
        AssetDetails storage asset = assets[symbol];
        return (
            asset.assetType,
            asset.description,
            asset.totalSupply,
            asset.pricePerToken,
            asset.complianceStatus
        );
    }
}