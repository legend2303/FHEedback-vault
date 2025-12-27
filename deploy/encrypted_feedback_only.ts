import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedFeedback = await deploy("EncryptedFeedback", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedFeedback contract: `, deployedEncryptedFeedback.address);
};

export default func;
func.id = "deploy_encrypted_feedback_only";
func.tags = ["EncryptedFeedbackOnly"];
