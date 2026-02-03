const hre = require("hardhat");

/**
 * Minimal deployment script for EscrowStatusRegistry
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.js --network sepolia
 *   npx hardhat run scripts/deploy.js --network hardhat (local)
 */
async function main() {
  console.log("Deploying EscrowStatusRegistry...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy contract
  const EscrowStatusRegistry = await hre.ethers.getContractFactory("EscrowStatusRegistry");
  const registry = await EscrowStatusRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("EscrowStatusRegistry deployed to:", address);
  console.log("Owner:", await registry.owner());

  // Verify deployment
  console.log("\n=== Deployment Verification ===");
  console.log("Contract address:", address);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // For verification (if using Etherscan)
  if (hre.network.name !== "hardhat") {
    console.log("\n=== Verification Command ===");
    console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
