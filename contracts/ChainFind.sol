// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainFind — Decentralised Lost & Found Registry
 * @dev Deploy on Polygon Amoy Testnet
 */
contract ChainFind {

    enum ItemStatus { REGISTERED, LOST, FOUND, RETURNED, REVOKED }

    struct Item {
        string    tokenId;
        address   owner;
        string    ipfsHash;
        ItemStatus status;
        uint256   rewardAmount;
        address   finder;
        uint256   registeredAt;
        uint256   updatedAt;
        string    revokeReason;
    }

    struct LostReport {
        string  tokenId;
        string  location;
        uint256 lostAt;
        uint256 rewardAmount;
        bool    active;
    }

    struct FoundReport {
        string  tokenId;
        address finder;
        string  location;
        string  descriptionHash;
        uint256 foundAt;
        bool    confirmed;
    }

    address public contractOwner;
    uint256 public platformFeePercent = 2;

    mapping(string => Item)        public items;
    mapping(string => LostReport)  public lostReports;
    mapping(string => FoundReport) public foundReports;
    mapping(address => uint256)    public finderReputation;
    mapping(address => uint256)    public finderReturnCount;

    string[] public allTokenIds;

    event ItemRegistered(string indexed tokenId, address indexed owner, string ipfsHash, uint256 timestamp);
    event LostReported(string indexed tokenId, string location, uint256 rewardAmount, uint256 timestamp);
    event FoundReported(string indexed tokenId, address indexed finder, string location, uint256 timestamp);
    event ReturnConfirmed(string indexed tokenId, address indexed finder, uint256 reward, uint256 timestamp);
    event ItemRevoked(string indexed tokenId, string reason, uint256 timestamp);

    modifier onlyItemOwner(string memory tokenId) {
        require(items[tokenId].owner == msg.sender, "Not item owner");
        _;
    }
    modifier exists(string memory tokenId) {
        require(items[tokenId].registeredAt != 0, "Item not found");
        _;
    }

    constructor() { contractOwner = msg.sender; }

    function registerItem(string memory tokenId, string memory ipfsHash) external {
        require(items[tokenId].registeredAt == 0, "Token ID exists");
        items[tokenId] = Item(tokenId, msg.sender, ipfsHash, ItemStatus.REGISTERED, 0, address(0), block.timestamp, block.timestamp, "");
        allTokenIds.push(tokenId);
        emit ItemRegistered(tokenId, msg.sender, ipfsHash, block.timestamp);
    }

    function reportLost(string memory tokenId, string memory location) external payable onlyItemOwner(tokenId) exists(tokenId) {
        require(items[tokenId].status == ItemStatus.REGISTERED, "Must be REGISTERED");
        items[tokenId].status = ItemStatus.LOST;
        items[tokenId].rewardAmount = msg.value;
        items[tokenId].updatedAt = block.timestamp;
        lostReports[tokenId] = LostReport(tokenId, location, block.timestamp, msg.value, true);
        emit LostReported(tokenId, location, msg.value, block.timestamp);
    }

    function submitFound(string memory tokenId, string memory location, string memory descHash) external exists(tokenId) {
        require(items[tokenId].status == ItemStatus.LOST, "Must be LOST");
        require(items[tokenId].owner != msg.sender, "Owner cannot be finder");
        items[tokenId].status = ItemStatus.FOUND;
        items[tokenId].finder = msg.sender;
        items[tokenId].updatedAt = block.timestamp;
        lostReports[tokenId].active = false;
        foundReports[tokenId] = FoundReport(tokenId, msg.sender, location, descHash, block.timestamp, false);
        emit FoundReported(tokenId, msg.sender, location, block.timestamp);
    }

    function confirmReturn(string memory tokenId) external onlyItemOwner(tokenId) exists(tokenId) {
        require(items[tokenId].status == ItemStatus.FOUND, "Must be FOUND");
        address finder = items[tokenId].finder;
        uint256 reward = items[tokenId].rewardAmount;
        items[tokenId].status = ItemStatus.RETURNED;
        items[tokenId].rewardAmount = 0;
        items[tokenId].updatedAt = block.timestamp;
        foundReports[tokenId].confirmed = true;
        finderReputation[finder] += 50;
        finderReturnCount[finder] += 1;
        if (reward > 0) {
            uint256 fee = (reward * platformFeePercent) / 100;
            payable(finder).transfer(reward - fee);
            payable(contractOwner).transfer(fee);
        }
        emit ReturnConfirmed(tokenId, finder, reward, block.timestamp);
    }

    function revokeItem(string memory tokenId, string memory reason) external onlyItemOwner(tokenId) exists(tokenId) {
        uint256 refund = items[tokenId].rewardAmount;
        items[tokenId].status = ItemStatus.REVOKED;
        items[tokenId].revokeReason = reason;
        items[tokenId].rewardAmount = 0;
        items[tokenId].updatedAt = block.timestamp;
        if (refund > 0) payable(msg.sender).transfer(refund);
        emit ItemRevoked(tokenId, reason, block.timestamp);
    }

    function getItem(string memory tokenId) external view returns (Item memory) { return items[tokenId]; }
    function getLostReport(string memory tokenId) external view returns (LostReport memory) { return lostReports[tokenId]; }
    function getFoundReport(string memory tokenId) external view returns (FoundReport memory) { return foundReports[tokenId]; }
    function getFinderStats(address finder) external view returns (uint256, uint256) { return (finderReputation[finder], finderReturnCount[finder]); }
    function getAllTokenIds() external view returns (string[] memory) { return allTokenIds; }

    receive() external payable {}
}
