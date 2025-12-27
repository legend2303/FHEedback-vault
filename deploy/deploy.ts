import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Only deploy EncryptedFeedback for the main dApp
  const deployedEncryptedFeedback = await deploy("EncryptedFeedback", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedFeedback contract: `, deployedEncryptedFeedback.address);
};
export default func;
func.id = "deploy_contracts"; // id required to prevent reexecution
func.tags = ["EncryptedFeedback"];
