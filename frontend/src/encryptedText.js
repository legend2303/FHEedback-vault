import { ethers } from "ethers";
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";
import PrivateNotesDeployment from "../../deployments/sepolia/PrivateNotes.json";

const CONTRACT_ADDRESS = PrivateNotesDeployment.address;
const CONTRACT_ABI = PrivateNotesDeployment.abi;

/**
 * Convert text to 4-byte chunks
 * @param {string} text - Text to chunk
 * @returns {number[]} Array of uint32 chunks
 */
export function textToChunks(text) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  const chunks = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk =
      (bytes[i] ?? 0) |
      ((bytes[i + 1] ?? 0) << 8) |
      ((bytes[i + 2] ?? 0) << 16) |
      ((bytes[i + 3] ?? 0) << 24);
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Convert 4-byte chunks back to text
 * @param {number[]} chunks - Array of uint32 chunks
 * @returns {string} Decrypted text
 */
export function chunksToText(chunks) {
  const bytes = [];
  
  for (const chunk of chunks) {
    bytes.push(chunk & 0xff);
    bytes.push((chunk >> 8) & 0xff);
    bytes.push((chunk >> 16) & 0xff);
    bytes.push((chunk >> 24) & 0xff);
  }

  // Remove trailing null bytes
  while (bytes[bytes.length - 1] === 0) {
    bytes.pop();
  }

  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

/**
 * Encrypt and store text note
 * @param {string} text - Text to encrypt and store
 * @param {object} signer - Ethers signer
 * @param {string} address - User's wallet address
 */
export async function setEncryptedNote(text, signer, address) {
  if (!signer || !address) {
    throw new Error("Wallet not connected");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Note cannot be empty");
  }

  if (text.length > 1024) {
    throw new Error("Note too long (max 1024 chars)");
  }

  await initSDK();

  // Convert text to chunks
  const chunks = textToChunks(text);

  const instance = await createInstance({
    ...SepoliaConfig,
    provider: window.ethereum,
  });

  // Encrypt each chunk
  const input = await instance.createEncryptedInput(CONTRACT_ADDRESS, address);
  chunks.forEach((chunk) => input.addUint32(chunk));
  const payload = await input.encrypt();

  // Store on-chain
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.setNote(payload.data, payload.inputProof);
  await tx.wait();

  return tx.hash;
}

/**
 * Get encrypted note chunk count
 */
export async function getNoteChunkCount(signer) {
  if (!signer) throw new Error("Wallet not connected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const count = await contract.getNoteChunkCount();
  return Number(count);
}

/**
 * Grant another address permission to read your note
 */
export async function allowNoteRead(reader, signer) {
  if (!signer) throw new Error("Wallet not connected");
  if (!reader || !ethers.isAddress(reader)) throw new Error("Invalid address");

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.allowRead(reader);
  await tx.wait();

  return tx.hash;
}

/**
 * Clear your note
 */
export async function clearNote(signer) {
  if (!signer) throw new Error("Wallet not connected");

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.clearNote();
  await tx.wait();

  return tx.hash;
}
