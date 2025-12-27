import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

let fheInstance = null;

export async function initFHE() {
  fheInstance = await createInstance({
    chainId: SepoliaConfig.chainId,
    rpcUrl: SepoliaConfig.rpcUrl,
    relayerUrl: SepoliaConfig.relayerUrl,
  });

  return fheInstance;
}

export function getFHE() {
  if (!fheInstance) {
    throw new Error("FHE not initialized");
  }
  return fheInstance;
}
