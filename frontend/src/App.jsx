import { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";

/* ================= CONFIG ================= */

const CONTRACT_ADDRESS = "0x03a050542cf694E96ae9E48795e4caA24c8b737D";
const SEPOLIA_CHAIN_ID = 11155111n;

const ABI = [
  "function submitPrivateNote(bytes)",
  "function getMyNotes() view returns (bytes[], uint256[])",
  "function deleteNote(uint256)",
];

/* ================= STYLES ================= */

const STYLES = {
  container: {
    minHeight: "100vh",
    background: "#0f0f0f",
    color: "#fff",
    padding: 40,
    fontFamily: "system-ui",
  },
  walletBtn: {
    position: "fixed",
    top: 20,
    right: 20,
  },
  textarea: {
    width: 420,
    height: 120,
    padding: 10,
    background: "#1e1e1e",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8,
    fontFamily: "system-ui",
  },
  button: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  },
  buttonPrimary: {
    background: "#4ade80",
    color: "#000",
  },
  buttonSecondary: {
    background: "#3b82f6",
    color: "#fff",
    marginLeft: 10,
  },
  buttonDanger: {
    padding: "6px 12px",
    borderRadius: 4,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
  },
  notesListItem: {
    marginBottom: 10,
    padding: 10,
    background: "#1e1e1e",
    borderRadius: 6,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  noteText: {
    flex: 1,
    wordBreak: "break-word",
  },
  status: {
    marginTop: 20,
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  statusSuccess: {
    background: "#1e3a1f",
    color: "#86efac",
  },
  statusError: {
    background: "#3f1f1f",
    color: "#fca5a5",
  },
  statusInfo: {
    background: "#1f2e3f",
    color: "#93c5fd",
  },
};

/* ================= APP ================= */

export default function App() {
  const { address, isConnected } = useAccount();

  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteIndices, setNoteIndices] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [status, setStatus] = useState("Connect wallet to begin");
  const [contract, setContract] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------- Init contract after wallet connects ---------- */
  useEffect(() => {
    if (!isConnected) {
      setContract(null);
      setNotes([]);
      setShowNotes(false);
      setStatus("Connect wallet to begin");
      return;
    }

    (async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId !== SEPOLIA_CHAIN_ID) {
          setStatus("❌ Please switch wallet to Sepolia");
          return;
        }

        const signer = await provider.getSigner();
        const ctr = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        setContract(ctr);
        setStatus("✅ Wallet connected. Ready.");
      } catch (err) {
        console.error(err);
        setStatus("❌ Initialization failed");
      }
    })();
  }, [isConnected]);

  /* ---------- Save private note ---------- */
  const saveNote = useCallback(async () => {
    if (!note || !contract) return;

    setIsLoading(true);
    try {
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setStatus("⏳ Confirm transaction in wallet…");

      const encrypted = ethers.toUtf8Bytes(note);
      const tx = await contract.submitPrivateNote(encrypted, {
        gasLimit: 300_000,
      });

      await tx.wait();

      setNote("");
      setStatus("✅ Private note saved");
      if (showNotes) {
        // Auto-refresh notes if viewing
        await loadNotes();
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction cancelled or failed");
    } finally {
      setIsLoading(false);
    }
  }, [note, contract, showNotes]);

  /* ---------- Load notes ---------- */
  const loadNotes = useCallback(async () => {
    if (!contract) return;

    try {
      setStatus("⏳ Loading your private notes…");
      const [encryptedNotes, indices] = await contract.getMyNotes();
      const decrypted = encryptedNotes.map((b) => ethers.toUtf8String(b));

      setNotes(decrypted);
      setNoteIndices(indices.map(idx => Number(idx)));
      setStatus(`✅ Loaded ${decrypted.length} notes`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to load notes");
    }
  }, [contract]);

  /* ---------- Toggle notes visibility ---------- */
  const toggleNotes = useCallback(async () => {
    if (!contract) return;

    if (showNotes) {
      setShowNotes(false);
      setNotes([]);
      setNoteIndices([]);
      setStatus("Notes hidden");
      return;
    }

    setShowNotes(true);
    await loadNotes();
  }, [contract, showNotes, loadNotes]);

  /* ---------- Delete note ---------- */
  const deleteNote = useCallback(async (displayIndex) => {
    if (!contract) return;

    const contractIndex = noteIndices[displayIndex];
    setDeletingIndex(displayIndex);

    try {
      setStatus("⏳ Deleting note…");

      const tx = await contract.deleteNote(contractIndex, {
        gasLimit: 300_000,
      });

      await tx.wait();

      setNotes(notes.filter((_, i) => i !== displayIndex));
      setNoteIndices(noteIndices.filter((_, i) => i !== displayIndex));
      setStatus("✅ Note deleted");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to delete note");
    } finally {
      setDeletingIndex(null);
    }
  }, [contract, noteIndices, notes]);

  /* ---------- Status styling ---------- */
  const statusStyle = useMemo(() => {
    if (status.includes("✅")) return { ...STYLES.status, ...STYLES.statusSuccess };
    if (status.includes("❌")) return { ...STYLES.status, ...STYLES.statusError };
    return { ...STYLES.status, ...STYLES.statusInfo };
  }, [status]);

  const shortAddr = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);

  /* ================= UI ================= */

  return (
    <div style={STYLES.container}>
      {/* Wallet Button */}
      <div style={STYLES.walletBtn}>
        <ConnectButton />
      </div>

      <h1>🔐 Private Vault</h1>
      <p style={{ color: "#888" }}>Encrypted on-chain · Sepolia Testnet</p>

      {!isConnected && <p>Please connect a wallet to begin</p>}

      {isConnected && (
        <>
          <p>Connected: <strong>{shortAddr(address)}</strong></p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your private note…"
            disabled={isLoading}
            style={STYLES.textarea}
          />

          <br /><br />

          <button
            onClick={saveNote}
            disabled={!note || isLoading}
            style={{
              ...STYLES.button,
              ...STYLES.buttonPrimary,
              opacity: !note || isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? "Saving…" : "Encrypt & Save Note"}
          </button>

          <button
            onClick={toggleNotes}
            style={{ ...STYLES.button, ...STYLES.buttonSecondary }}
          >
            {showNotes ? "Hide My Notes" : `View My Notes (${notes.length})`}
          </button>

          {showNotes && notes.length > 0 && (
            <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
              {notes.map((n, i) => (
                <li key={`note-${i}`} style={STYLES.notesListItem}>
                  <span style={STYLES.noteText}>{n}</span>
                  <button
                    onClick={() => deleteNote(i)}
                    disabled={deletingIndex === i}
                    style={{
                      ...STYLES.buttonDanger,
                      opacity: deletingIndex === i ? 0.6 : 1,
                    }}
                  >
                    {deletingIndex === i ? "⏳" : "🗑️"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showNotes && notes.length === 0 && (
            <p style={{ marginTop: 20, color: "#888" }}>No notes yet. Create one to get started!</p>
          )}
        </>
      )}

      <div style={statusStyle}>{status}</div>
    </div>
  );
}
