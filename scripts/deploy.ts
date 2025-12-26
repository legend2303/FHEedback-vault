import { ethers } from "hardhat";

async function main() {
  const PrivateNotes = await ethers.getContractFactory("PrivateNotes");
  const privateNotes = await PrivateNotes.deploy();

  await privateNotes.waitForDeployment();

  console.log("PrivateNotes deployed to:", await privateNotes.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
