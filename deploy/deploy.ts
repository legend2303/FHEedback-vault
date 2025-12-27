import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract: `, deployedFHECounter.address);

  const deployedPrivateNotes = await deploy("PrivateNotes", {
    from: deployer,
    log: true,
  });

  console.log(`PrivateNotes contract: `, deployedPrivateNotes.address);

  const deployedEncryptedFeedback = await deploy("EncryptedFeedback", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedFeedback contract: `, deployedEncryptedFeedback.address);
};
export default func;
func.id = "deploy_contracts"; // id required to prevent reexecution
func.tags = ["FHECounter", "PrivateNotes", "EncryptedFeedback"];
