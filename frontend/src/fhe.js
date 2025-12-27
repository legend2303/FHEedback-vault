import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from "@zama-fhe/relayer-sdk";

let fheInstance = null;

export async function getFHE() {
  if (!fheInstance) {
    await initSDK();
    fheInstance = await createInstance({
      ...SepoliaConfig,
      provider: window.ethereum,
    });
  }
  return fheInstance;
}
