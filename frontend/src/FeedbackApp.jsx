import { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { createInstance, SepoliaConfig, initSDK } from "@zama-fhe/relayer-sdk";
import ErrorBoundary from "./ErrorBoundary";
import { PageSkeleton } from "./Skeletons";
import "./FeedbackApp.css";

/* ================= CONFIG ================= */

const CONTRACT_ADDRESS = "0x71853FD9864c2C8d9a0CE9b468b3f11A46D44E93";
const SEPOLIA_CHAIN_ID = 11155111n;

const ABI = [
  "function createQuestion(string memory) external",
  "function submitFeedback(uint256, bytes32, bytes) external",
  "function getQuestion(uint256) view returns (tuple(string memory text, uint256 createdAt, bool active))",
  "function getMyFeedback(uint256) view returns (bytes32)",
  "function getEncryptedAggregate(uint256) view returns (bytes32)",
  "function getFeedbackCount(uint256) view returns (uint32)",
  "function hasSubmitted(uint256) view returns (bool)",
  "function questionCount() view returns (uint256)",
  "function deactivateQuestion(uint256) external",
  "function owner() public view returns (address)",
];

/* ================= STYLES ================= */

const STYLES = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    color: "#fff",
    padding: "40px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  walletBtn: {
    position: "fixed",
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #4f46e5",
    paddingBottom: 15,
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 0 5px 0",
    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#94a3b8",
    margin: 0,
    fontSize: "16px",
  },
  card: {
    background: "rgba(30, 27, 75, 0.5)",
    border: "1px solid #4f46e5",
    borderRadius: 12,
    padding: "24px",
    marginBottom: 24,
    backdropFilter: "blur(10px)",
    overflowX: "auto",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: 16,
    color: "#e0e7ff",
  },
  input: {
    width: "100%",
    padding: 12,
    background: "#0f172a",
    border: "1px solid #4f46e5",
    borderRadius: 8,
    color: "#fff",
    fontFamily: "inherit",
    marginBottom: 12,
    boxSizing: "border-box",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    padding: 12,
    background: "#0f172a",
    border: "1px solid #4f46e5",
    borderRadius: 8,
    color: "#fff",
    fontFamily: "inherit",
    minHeight: 80,
    marginBottom: 12,
    boxSizing: "border-box",
    resize: "vertical",
    fontSize: "14px",
  },
  button: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.3s ease",
    fontSize: "14px",
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "#fff",
  },
  buttonSecondary: {
    background: "rgba(79, 70, 229, 0.3)",
    color: "#a78bfa",
    border: "1px solid #4f46e5",
  },
  buttonDanger: {
    background: "rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    border: "1px solid #ef4444",
    padding: "6px 12px",
    fontSize: 14,
  },
  questionCard: {
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "16px",
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: 8,
    color: "#f1f5f9",
    wordBreak: "break-word",
  },
  questionMeta: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: 12,
  },
  sliderContainer: {
    marginBottom: 12,
  },
  slider: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    background: "#334155",
    outline: "none",
    WebkitAppearance: "none",
  },
  sliderValue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    fontSize: "14px",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  badgeSuccess: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#6ee7b7",
    border: "1px solid #10b981",
  },
  badgeInfo: {
    background: "rgba(59, 130, 246, 0.2)",
    color: "#93c5fd",
    border: "1px solid #3b82f6",
  },
  status: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    fontSize: "14px",
    borderLeft: "4px solid #3b82f6",
  },
  statusSuccess: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#6ee7b7",
    borderLeftColor: "#10b981",
  },
  statusError: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#fca5a5",
    borderLeftColor: "#ef4444",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  statBox: {
    background: "rgba(79, 70, 229, 0.1)",
    border: "1px solid #4f46e5",
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#60a5fa",
  },
  statLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: 4,
  },
};

/* ================= APP ================= */

export default function FeedbackApp() {
  const { address, isConnected } = useAccount();

  const [contract, setContract] = useState(null);
  const [fhevmInstance, setFhevmInstance] = useState(null);
  const [status, setStatus] = useState("Connect wallet to begin");
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [feedbackScores, setFeedbackScores] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState({});
  const [feedbackCounts, setFeedbackCounts] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // ---- Helpers ----
  const extractRpcError = useCallback((err) => {
    // ethers v6 error shapes: shortMessage, reason, info.error.message, data.message
    return (
      err?.shortMessage ||
      err?.reason ||
      err?.message ||
      err?.info?.error?.message ||
      err?.data?.message ||
      "Unknown error"
    );
  }, []);

  const preflightSubmit = useCallback(
    async (submitCtr, questionId, scoreBytes, proofBytes) => {
      // Basic on-chain checks to avoid sending a tx that reverts
      try {
        const submitted = await contract.hasSubmitted(questionId);
        if (submitted) {
          throw new Error("Already submitted feedback for this question");
        }
      } catch (e) {
        // If hasSubmitted is missing or fails, continue but log
        console.warn("hasSubmitted preflight check failed:", e);
      }

      try {
        const q = await contract.getQuestion(questionId);
        const active = q.active !== undefined ? q.active : q[1];
        if (!active) {
          throw new Error("Question is not active");
        }
      } catch (e) {
        console.warn("getQuestion preflight check failed:", e);
      }

      // Try estimateGas to detect reverts
      try {
        const gas = await submitCtr.submitFeedback.estimateGas(
          questionId,
          scoreBytes,
          proofBytes
        );
        return { ok: true, gas: gas?.toString?.() };
      } catch {
        // Fall back to staticCall for clearer reason
        try {
          await submitCtr.submitFeedback.staticCall(
            questionId,
            scoreBytes,
            proofBytes
          );
          // If staticCall passes but estimateGas failed, still allow
          return { ok: true };
        } catch (scErr) {
          const msg = extractRpcError(scErr);
          return { ok: false, reason: msg };
        }
      }
    },
    [contract, extractRpcError]
  );

  /* ---------- Initialize FHE with Relayer SDK ---------- */
  useEffect(() => {
    if (!isConnected || !address) return;

    (async () => {
      try {
        setStatus("⏳ Initializing FHE with Relayer SDK...");

        // Initialize the SDK
        await initSDK();

        // Get provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Create FHE instance using Relayer SDK
        const instance = await createInstance({
          ...SepoliaConfig,
          signer,
        });

        setFhevmInstance(instance);
        setStatus("✅ FHE ready (Relayer SDK)");
      } catch (err) {
        console.error("Failed to init FHE:", err);
        setStatus(`❌ FHE init failed: ${err.message}`);
      }
    })();
  }, [isConnected, address]);

  const resolveSubmitContract = useCallback(
    async (questionId, scoreBytes, proofBytes) => {
      if (!contract) return { ctr: null, signature: null };
      const runner = contract.runner;
      const candidates = [
        "function submitFeedback(uint256, bytes32, bytes)",
        "function submitFeedback(uint256, bytes, bytes)",
        "function submitFeedback(uint256, bytes32, bytes32)",
      ];

      for (const sig of candidates) {
        try {
          const testCtr = new ethers.Contract(
            CONTRACT_ADDRESS,
            [sig],
            runner
          );
          // Try staticCall; any outcome except selector mismatch means signature is valid
          try {
            await testCtr.submitFeedback.staticCall(
              questionId,
              scoreBytes,
              proofBytes
            );
            // Success → signature matches
            console.debug("✓ Signature matched:", sig);
            return { ctr: testCtr, signature: sig };
          } catch (scErr) {
            const scMsg = extractRpcError(scErr) || "";
            // If it's a selector/ABI error, this signature is wrong
            if (
              scMsg.toLowerCase().includes("selector") ||
              scMsg.toLowerCase().includes("not found") ||
              scMsg.toLowerCase().includes("no matching")
            ) {
              console.debug("✗ Selector mismatch for:", sig, scMsg);
              continue; // Try next signature
            }
            // Otherwise, signature is valid but call would fail (e.g., already submitted, inactive)
            // This is OK—accept the signature
            console.debug("✓ Signature matched (reverts on logic):", sig, scMsg);
            return { ctr: testCtr, signature: sig };
          }
        } catch (e) {
          const msg = extractRpcError(e) || "";
          console.warn("Error testing signature", sig, ":", msg);
        }
      }
      
      console.error("No matching submitFeedback signature found. Tried:", candidates);
      return { ctr: null, signature: null };
    },
    [contract, extractRpcError]
  );

  /* ---------- Load questions ---------- */
  const loadQuestions = useCallback(async (ctr) => {
    try {
      setStatus("⏳ Loading questions...");
      const count = await ctr.questionCount();
      const qList = [];

      for (let i = 0; i < Number(count); i++) {
        try {
          const q = await ctr.getQuestion(i);
          
          // Handle tuple response from contract
          const question = {
            id: i,
            text: q.text || q[0],
            active: q.active !== undefined ? q.active : q[1],
            createdAt: q.createdAt || q[2],
          };
          
          qList.push(question);

          // Load feedback data
          try {
            const submitted = await ctr.hasSubmitted(i);
            setHasSubmitted((prev) => ({ ...prev, [i]: submitted }));

            const feedCount = await ctr.getFeedbackCount(i);
            setFeedbackCounts((prev) => ({ ...prev, [i]: Number(feedCount) }));
          } catch (e) {
            console.error(`Error loading feedback for question ${i}:`, e);
          }
        } catch (err) {
          console.error(`Error loading question ${i}:`, err);
        }
      }

      setQuestions(qList);
      setStatus(`✅ Loaded ${qList.length} questions`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to load questions");
    }
  }, []);

  /* ---------- Init contract ---------- */
  useEffect(() => {
    if (!isConnected) {
      setContract(null);
      setFhevmInstance(null);
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

        // Initialize FHEVM for encryption
        try {
          setStatus("⏳ Connecting to FHE gateway...");
          const gatewayUrl = await resolveGatewayUrl();

          await fhevmjs.initFhevm();
          const fheConfig = {
            gatewayUrl,
            aclContractAddress: ACL_CONTRACT_ADDRESS,
            kmsContractAddress: KMS_CONTRACT_ADDRESS,
            chainId: Number(SEPOLIA_CHAIN_ID),
            network: window.ethereum,
          };

          const instance = await fhevmjs.createInstance(fheConfig);
          setFhevmInstance(instance);
          console.debug("✓ FHEVM initialized and instance created", fheConfig);
          console.debug("Instance keys:", Object.keys(instance || {}).slice(0, 30));
          setStatus("✅ Connected to Sepolia (FHE ready)");
        } catch (fheErr) {
          console.warn("Failed to init FHEVM:", fheErr);
          setStatus("⚠️ FHE not available. Using mock encryption.");
        }

        const signer = await provider.getSigner();
        const ctr = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        // Check if user is owner
        try {
          const ownerAddress = await ctr.owner();
          const isOwnerCheck = ownerAddress?.toLowerCase() === address?.toLowerCase();
          setIsOwner(isOwnerCheck);
          console.log("Owner check:", { 
            contractOwner: ownerAddress, 
            userAddress: address, 
            isOwner: isOwnerCheck 
          });
        } catch (ownerErr) {
          console.error("Failed to check owner:", ownerErr.message);
          setIsOwner(false);
        }

        setContract(ctr);
        // If gateway resolution succeeded earlier, status is already set; otherwise keep generic
        if (!status.startsWith("✅ Connected to Sepolia")) {
          setStatus("✅ Connected to Sepolia");
        }
        await loadQuestions(ctr);
      } catch (err) {
        console.error("Initialization error:", err);
        setStatus("❌ Initialization failed");
      }
    })();
  }, [isConnected, address, loadQuestions]);

  /* ---------- Create question (owner only) ---------- */
  const createQuestion = useCallback(async () => {
    if (!contract || !newQuestion.trim()) return;

    setIsLoading(true);
    try {
      setStatus("⏳ Creating question...");
      const tx = await contract.createQuestion(newQuestion, { gasLimit: 500000 });
      await tx.wait();

      setNewQuestion("");
      setStatus("✅ Question created");
      await loadQuestions(contract);
    } catch (err) {
      console.error("Create question error:", err);
      
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('rejected')) {
        setStatus("⚠️ Transaction cancelled");
      } else if (err.message?.includes('revert')) {
        setStatus("❌ Not authorized. Only owner can create questions");
      } else if (err.message?.includes('insufficient')) {
        setStatus("❌ Insufficient gas or funds");
      } else {
        setStatus("❌ Failed to create question");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract, newQuestion, loadQuestions]);

  /* ---------- Submit feedback ---------- */
  const submitFeedback = useCallback(async (questionId) => {
    if (!contract) return;

    const score = feedbackScores[questionId];
    if (score === undefined || score < 0 || score > 100) {
      setStatus("❌ Please select a valid score (0-100)");
      return;
    }

    setIsLoading(true);
    try {
      setStatus("⏳ Submitting encrypted feedback...");

      // Create encrypted score using Relayer SDK
      let encryptedScoreBytes32, proofBytes;
      
      if (fhevmInstance) {
        try {
          // Use Relayer SDK's encrypt method
          const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
          input.add32(score); // Encrypt the score as uint32
          const encrypted = await input.encrypt();

          const handle = encrypted?.handles?.[0];
          const proof = encrypted?.inputProof;

          if (!handle || !proof) {
            throw new Error("FHE encryption returned empty handle or proof");
          }

          encryptedScoreBytes32 = ethers.hexlify(handle);
          proofBytes = ethers.hexlify(proof);
          console.debug("✓ FHE encryption successful (Relayer SDK)");
        } catch (fheErr) {
          console.error("FHE encryption failed:", fheErr);
          throw new Error(`Encryption failed: ${fheErr.message}`);
        }
      } else {
        throw new Error("FHE instance not initialized. Please wait for Relayer SDK to load.");
      }

      console.debug("Attempting submitFeedback with:", {
        questionId,
        encryptedScore: encryptedScoreBytes32,
        proof: proofBytes,
      });

      // Debug: log encoded calldata for visibility
      try {
        const data = contract.interface.encodeFunctionData(
          "submitFeedback",
          [questionId, encryptedScoreBytes32, proofBytes]
        );
        console.debug("submitFeedback calldata:", data);
      } catch (encErr) {
        console.warn("Failed to encode submitFeedback calldata:", encErr);
      }

      // Resolve correct signature variant for submitFeedback
      const { ctr: submitCtr, signature } = await resolveSubmitContract(
        questionId,
        encryptedScoreBytes32,
        proofBytes
      );

      if (!submitCtr) {
        console.error("Failed to resolve submitFeedback. Contract may not support expected signature.");
        setStatus(
          "❌ Unable to match submitFeedback ABI on deployed contract. Please verify the contract has submitFeedback(uint256, bytes32, bytes)."
        );
        return;
      }

      console.debug("Using signature:", signature);

      // Preflight to surface revert reasons before wallet warning
      const pre = await preflightSubmit(submitCtr, questionId, encryptedScoreBytes32, proofBytes);
      if (!pre.ok) {
        console.error("Preflight failed:", pre.reason);
        const hint = pre.reason?.includes("missing revert data")
          ? "Possible cause: invalid ciphertext/proof format or ABI mismatch."
          : "";
        setStatus(`❌ Transaction will revert: ${pre.reason}${hint ? " — " + hint : ""}`);
        return;
      }

      const tx = await submitCtr.submitFeedback(questionId, encryptedScoreBytes32, proofBytes, {
        gasLimit: 1000000,
      });

      await tx.wait();

      setFeedbackScores((prev) => ({ ...prev, [questionId]: undefined }));
      setHasSubmitted((prev) => ({ ...prev, [questionId]: true }));
      setStatus("✅ Feedback submitted securely (encrypted)");
      
      // Reload to get updated count
      await loadQuestions(contract);
    } catch (err) {
      console.error(err);
      
      // Check if user rejected the transaction
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('rejected')) {
        setStatus("⚠️ Transaction cancelled");
      } else {
        setStatus("❌ Failed to submit feedback");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract, feedbackScores, loadQuestions, preflightSubmit, resolveSubmitContract, fhevmInstance, address]);

  const statusStyle = useMemo(() => {
    if (status.includes("✅")) {
      return { ...STYLES.status, ...STYLES.statusSuccess };
    }
    if (status.includes("❌")) {
      return { ...STYLES.status, ...STYLES.statusError };
    }
    return STYLES.status;
  }, [status]);

  // Pagination logic
  const activeQuestions = useMemo(
    () => questions.filter((q) => q.active),
    [questions]
  );

  const totalPages = Math.ceil(activeQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = useMemo(
    () => {
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      return activeQuestions.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    },
    [activeQuestions, currentPage]
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const shortAddr = (addr) => addr?.slice(0, 6) + "..." + addr?.slice(-4);

  /* ================= UI ================= */

  return (
    <div style={STYLES.container}>
      <div style={STYLES.walletBtn}>
        <ConnectButton />
      </div>

      <div style={STYLES.header}>
        <h1 style={STYLES.title}>🔐 FHEedback Vault</h1>
        <p style={STYLES.subtitle}>
          Secure, private feedback system with FHE encryption
        </p>
      </div>

      {!isConnected && (
        <div style={STYLES.card}>
          <p>Connect your wallet to submit encrypted feedback</p>
        </div>
      )}

      {isConnected && (
        <>
          <div style={STYLES.card}>
            <p>
              Connected: <strong>{shortAddr(address)}</strong>
              {isOwner && (
                <span style={{ ...STYLES.badge, ...STYLES.badgeSuccess, marginLeft: 12 }}>
                  Owner
                </span>
              )}
            </p>
          </div>

          {isOwner && (
            <div style={STYLES.card}>
              <h3 style={STYLES.sectionTitle}>📝 Create New Question</h3>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter your feedback question..."
                style={STYLES.textarea}
                disabled={isLoading}
              />
              <button
                onClick={createQuestion}
                disabled={!newQuestion.trim() || isLoading}
                style={{
                  ...STYLES.button,
                  ...STYLES.buttonPrimary,
                  opacity: !newQuestion.trim() || isLoading ? 0.5 : 1,
                  width: "100%",
                }}
              >
                {isLoading ? "Creating..." : "Create Question"}
              </button>
            </div>
          )}

          <div style={STYLES.card}>
            <h3 style={STYLES.sectionTitle}>
              📊 Active Questions ({activeQuestions.length})
            </h3>

            {isLoading ? (
              <PageSkeleton />
            ) : activeQuestions.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No questions yet</p>
            ) : (
              <>
                {paginatedQuestions.map((question) => (
                  <div key={question.id} style={STYLES.questionCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={STYLES.questionTitle}>{question.text}</h4>
                        <div style={STYLES.questionMeta}>
                          <span>
                            👥 {feedbackCounts[question.id] || 0} responses
                          </span>
                          <span>
                            🔒 Data encrypted with FHE
                          </span>
                        </div>
                      </div>
                      {hasSubmitted[question.id] && (
                        <span
                          style={{ ...STYLES.badge, ...STYLES.badgeSuccess, marginLeft: 12 }}
                        >
                          ✓ Submitted
                        </span>
                      )}
                    </div>

                    {!hasSubmitted[question.id] && (
                      <>
                        <div style={STYLES.sliderContainer}>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={feedbackScores[question.id] || 50}
                            onChange={(e) =>
                              setFeedbackScores((prev) => ({
                                ...prev,
                                [question.id]: Number(e.target.value),
                              }))
                            }
                            style={{
                              ...STYLES.slider,
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                                feedbackScores[question.id] || 50
                              }%, #334155 ${
                                feedbackScores[question.id] || 50
                              }%, #334155 100%)`,
                            }}
                          />
                          <div style={STYLES.sliderValue}>
                            <span>Not Satisfied</span>
                            <strong style={{ color: "#60a5fa" }}>
                              {feedbackScores[question.id] || 50}/100
                            </strong>
                            <span>Very Satisfied</span>
                          </div>
                        </div>

                        <button
                          onClick={() => submitFeedback(question.id)}
                          disabled={isLoading}
                          style={{
                            ...STYLES.button,
                            ...STYLES.buttonPrimary,
                            width: "100%",
                            opacity: isLoading ? 0.5 : 1,
                          }}
                        >
                          {isLoading ? "⏳ Encrypting..." : "🔐 Submit Encrypted"}
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {totalPages > 1 && (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      style={{
                        ...STYLES.button,
                        ...STYLES.buttonSecondary,
                        opacity: currentPage === 1 ? 0.5 : 1,
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{ padding: "10px 16px", color: "#94a3b8" }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      style={{
                        ...STYLES.button,
                        ...STYLES.buttonSecondary,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {isOwner && questions.some((q) => q.active) && (
            <div style={STYLES.card}>
              <h3 style={STYLES.sectionTitle}>📈 Aggregate Results (Encrypted)</h3>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                ⚠️ Aggregate scores are stored encrypted on-chain and can only be
                decrypted offline by the owner. Individual responses remain private.
              </p>
              <div style={STYLES.statsGrid}>
                {questions
                  .filter((q) => q.active && feedbackCounts[q.id] > 0)
                  .map((q) => (
                    <div key={q.id} style={STYLES.statBox}>
                      <div style={STYLES.statValue}>
                        {feedbackCounts[q.id] || 0}
                      </div>
                      <div style={STYLES.statLabel}>
                        Encrypted Responses
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {status && status !== "Connect wallet to begin" && (
        <div style={statusStyle}>{status}</div>
      )}

      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: "rgba(79, 70, 229, 0.1)",
          borderRadius: 8,
          borderLeft: "4px solid #4f46e5",
          fontSize: 14,
          color: "#94a3b8",
        }}
      >
        <p>
          <strong>🔐 How it works:</strong> Your feedback scores are encrypted using
          FHE before being sent to the blockchain. The contract performs computations
          on encrypted data without ever decrypting it, ensuring complete privacy.
        </p>
      </div>
    </div>
  );
}
