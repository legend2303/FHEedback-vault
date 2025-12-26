import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { initFHE } from "./fhe.js";

export default function FeedbackApp() {
  const [instance, setInstance] = useState(null);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeFHE = async () => {
      try {
        if (!window.ethereum) {
          setStatus("MetaMask not found");
          return;
        }

        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAddress(accounts[0]);

        // Initialize FHE
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const fheInstance = await initFHE(signer);

        setInstance(fheInstance);
        setStatus("✅ FHE Ready");
      } catch (error) {
        console.error("Init error:", error);
        setStatus(`Error: ${error.message}`);
      }
    };

    initializeFHE();
  }, []);

  const handleSubmit = async () => {
    if (!instance) {
      setStatus("FHE not ready");
      return;
    }

    setLoading(true);
    try {
      setStatus("Encrypting...");

      // Example: Create an encrypted input and encrypt a value
      const encryptedValue = await instance.encrypt32(42);
      console.log("✅ Encrypted value:", encryptedValue);

      setStatus("✅ Encryption successful");
    } catch (error) {
      console.error("Encrypt error:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>FHEVM Feedback</h1>
      <div style={{ marginBottom: "10px" }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <strong>Address:</strong> {address || "Not connected"}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!instance || loading}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        {loading ? "Processing..." : "Test Encryption"}
      </button>
    </div>
  );
}
