import { ethers } from "ethers";
import { getFHE } from "./fhe";
import { CONTRACT_ADDRESS, ABI } from "./constants";

/**
 * Submit encrypted score (0–100)
 */
export async function submitEncryptedFeedback(questionId, score) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const fhe = getFHE();

  // Create encrypted input
  const input = await fhe.createEncryptedInput(
    CONTRACT_ADDRESS,
    userAddress
  );

  input.addUint32(score);

  const encrypted = await input.encrypt();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
  );

  const tx = await contract.submitFeedback(
    questionId,
    encrypted.handles[0],
    encrypted.inputProof
  );

  await tx.wait();
}

/**
 * Generate user reencryption keys
 */
export function generateKeys() {
  const fhe = getFHE();
  return fhe.generateKeypair();
}

/**
 * Ask user to sign EIP-712
 */
export async function getUserSignature(publicKey) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const user = await signer.getAddress();

  const fhe = getFHE();
  const eip712 = fhe.createEIP712(publicKey, CONTRACT_ADDRESS);

  const signature = await window.ethereum.request({
    method: "eth_signTypedData_v4",
    params: [user, JSON.stringify(eip712)],
  });

  return { signature, user };
}

/**
 * Decrypt encrypted handle
 */
export async function decryptValue(
  encryptedHandle,
  keys,
  signature,
  userAddress
) {
  const fhe = getFHE();

  return fhe.userDecrypt(
    encryptedHandle,
    keys.privateKey,
    keys.publicKey,
    signature,
    CONTRACT_ADDRESS,
    userAddress
  );
}
