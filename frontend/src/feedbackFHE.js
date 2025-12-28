import { ethers } from "ethers";
import { getFHE } from "./fhe";
import EncryptedFeedbackDeployment from "../../deployments/sepolia/EncryptedFeedback.json";

const CONTRACT_ADDRESS = EncryptedFeedbackDeployment.address;
const ABI = EncryptedFeedbackDeployment.abi;

export async function submitEncryptedFeedback(
  questionId,
  score,
  signer,
  address
) {
  if (!signer || !address) {
    throw new Error("Wallet not connected");
  }

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  const fhevm = await getFHE();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
  );

  // Friendly pre-check to avoid revert when already submitted
  const alreadySubmitted = await contract.hasSubmitted(questionId, address);
  if (alreadySubmitted) {
    throw new Error("You already submitted feedback for this question.");
  }

  // Build encrypted payload bound to contract + user
  const input = await fhevm.createEncryptedInput(CONTRACT_ADDRESS, address);
  input.add32(Number(score));
  const encrypted = await input.encrypt();

  const tx = await contract.submitFeedback(
    questionId,
    encrypted.handles[0],
    encrypted.inputProof
  );

  await tx.wait();
  return tx.hash;
}


export async function createQuestion(text, signer) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const tx = await contract.createQuestion(text);
  await tx.wait();
  return tx.hash;
}

export async function decryptMyFeedback(questionId, signer, address) {
  const fhe = await getFHE();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const handle = await contract.getMyFeedback(questionId);
  const handleHex = typeof handle === "string" ? handle : ethers.hexlify(handle);
  if (handleHex === ethers.ZeroHash) {
    throw new Error("No feedback found for this question.");
  }

  const { publicKey, privateKey } = fhe.generateKeypair();
  const start = Math.floor(Date.now() / 1000);
  const days = 7;

  const typedData = fhe.createEIP712(publicKey, [CONTRACT_ADDRESS], start, days);

  let signature;
  try {
    signature = await signer.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );
  } catch {
    signature = await window.ethereum.request({
      method: "eth_signTypedData_v4",
      params: [
        address,
        JSON.stringify({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
      ],
    });
  }

  const result = await fhe.userDecrypt(
    [handleHex],
    privateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    address,
    start,
    days
  );

  return Number(result[handleHex]);
}

export async function listQuestions() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const count = Number(await contract.questionCount());
  const out = [];

  for (let i = 0; i < count; i++) {
    const q = await contract.getQuestion(i);
    out.push({
      id: i,
      text: q.text,
      creator: q.creator,
      active: q.active,
      createdAt: Number(q.createdAt) * 1000,
    });
  }
  return out;
}

export async function deactivateQuestion(questionId, signer) {
  if (!signer) {
    throw new Error("Wallet not connected");
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const tx = await contract.deactivateQuestion(questionId);
  await tx.wait();
  return tx.hash;
}
