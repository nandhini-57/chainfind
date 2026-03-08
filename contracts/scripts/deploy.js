const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");
  const ChainFind = await ethers.getContractFactory("ChainFind");
  const contract = await ChainFind.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("✅ ChainFind deployed to:", address);
  console.log("Set CONTRACT_ADDRESS=" + address + " in backend/.env");
}
main().catch((e) => { console.error(e); process.exit(1); });
