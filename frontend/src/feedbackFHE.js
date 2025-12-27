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

  // ✅ CORRECT for browser SDK 0.3.0-8
  const encrypted = await fhevm.encrypt32(
    Number(score),
    CONTRACT_ADDRESS,
    address
  );

  const tx = await contract.submitFeedback(
    questionId,
    encrypted.handle,
    encrypted.proof
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
      active: q.active,
      createdAt: Number(q.createdAt) * 1000,
    });
  }
  return out;
}
