import {
  initSDK,
  createInstance,
  SepoliaConfig
} from "@zama-fhe/relayer-sdk/web";

let fheInstance = null;

export async function initFHE(signer) {
  if (!fheInstance) {
    await initSDK();
    fheInstance = await createInstance({
      ...SepoliaConfig,
      signer
    });
    console.log("✅ FHE initialized");
  }
  return fheInstance;
}
