import React, { useState, useEffect } from "react";
import { connectWallet } from "./wallet";
import {
  submitEncryptedFeedback,
  createQuestion,
  listQuestions,
  deactivateQuestion,
} from "./feedbackFHE";
import "./FeedbackApp.css";

export default function FeedbackApp() {
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(0);
  const [score, setScore] = useState(50);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [status, setStatus] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const request = window.ethereum.request({ method: 'eth_accounts' });
      if (request && request.then) {
        request.then(accounts => {
          if (accounts && accounts.length > 0) {
            handleConnect();
          }
        }).catch(() => {
          // Silently handle - user may not be connected yet
        });
      }
    }
  }, []);

  useEffect(() => {
    if (wallet) {
      loadQuestions().catch(err => {
        console.error("Fatal error loading questions:", err);
      });
    }
  }, [wallet]);

  async function handleConnect() {
    try {
      setStatus(null);
      setWalletError(null);
      const { signer, address, provider, chainId } = await connectWallet();
      setWallet({ signer, address, provider, chainId });
      setStatus({ type: 'success', message: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` });
    } catch (err) {
      setWalletError(err.message);
      setStatus({ type: 'error', message: err.message });
    }
  }

  function handleDisconnect() {
    setWallet(null);
    setLastTxHash(null);
    setStatus({ type: 'info', message: 'Wallet disconnected.' });
  }

  async function submit() {
    if (!wallet) {
      setStatus({ type: 'error', message: 'Please connect wallet first' });
      return;
    }
    setStatus(null);
    try {
      setSubmitting(true);
      setStatus({ type: 'info', message: 'Encrypting and submitting feedback...' });
      const numericScore = Number(score); // Ensure score is a number
      const txHash = await submitEncryptedFeedback(selectedQuestionId, numericScore, wallet.signer, wallet.address);
      setLastTxHash(txHash);
      setStatus({ type: 'success', message: `Feedback submitted to question #${selectedQuestionId + 1}!` });
      setScore(50);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function createQ() {
    if (!wallet) {
      setStatus({ type: 'error', message: 'Please connect wallet first' });
      return;
    }
    if (!newQuestionText.trim()) {
      setStatus({ type: 'error', message: 'Question text cannot be empty' });
      return;
    }
    setStatus(null);
    try {
      setCreatingQuestion(true);
      setStatus({ type: 'info', message: 'Creating question...' });
      const txHash = await createQuestion(newQuestionText, wallet.signer);
      setLastTxHash(txHash);
      setStatus({ type: 'success', message: 'Question created!' });
      setNewQuestionText("");
      await loadQuestions();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setCreatingQuestion(false);
    }
  }


  async function loadQuestions() {
    try {
      setLoadingQuestions(true);
      const allQuestions = await listQuestions({ onlyActive: false, max: 50 });
      setQuestions(allQuestions);
    } catch (err) {
      console.error("Error loading questions:", err);
      setStatus({ type: 'error', message: `Error loading questions: ${err?.message || String(err)}` });
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleDeactivate(questionId) {
    if (!wallet) {
      setStatus({ type: 'error', message: 'Please connect wallet first' });
      return;
    }
    try {
      setDeactivatingId(questionId);
      setStatus({ type: 'info', message: 'Deactivating question...' });
      const txHash = await deactivateQuestion(questionId, wallet.signer);
      setLastTxHash(txHash);
      setStatus({ type: 'success', message: 'Question deactivated!' });
      await loadQuestions();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setDeactivatingId(null);
    }
  }

  const activeQuestions = questions.filter(q => q.active);

  const networkName = wallet?.chainId === 11155111
    ? 'Sepolia'
    : wallet?.chainId === 1
      ? 'Ethereum Mainnet'
      : wallet?.chainId
        ? `Chain ${wallet.chainId}`
        : 'Unknown';

  return (
    <div className="feedback-app">
      <header className="app-header">
        <h1>🔒 Encrypted Feedback System</h1>
        <p className="subtitle">Powered by Zama FHEVM on {networkName}</p>
      </header>
      <div className="card">
        <h2>Wallet Connection</h2>
        {!wallet ? (
          <div>
            <button onClick={handleConnect} className="btn-primary" disabled={!window.ethereum}>
              {window.ethereum ? '🦊 Connect MetaMask' : 'MetaMask Not Installed'}
            </button>
            {walletError && <p className="error-text">{walletError}</p>}
          </div>
        ) : (
          <div className="wallet-info">
            <p>✅ <strong>Connected:</strong> {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
            <p><strong>Network:</strong> {networkName}</p>
            <button onClick={handleDisconnect} className="btn-sm" style={{ marginLeft: 12 }}>
              🛑 Disconnect
            </button>
          </div>
        )}
      </div>
      {status && (
        <div className={`status-message status-${status.type}`}>
          <span>{status.message}</span>
          {lastTxHash && status.type === 'success' && (
            <span className="tx-link">
              {" "}| <a href={`https://sepolia.etherscan.io/tx/${lastTxHash}`} target="_blank" rel="noreferrer">View on Etherscan</a>
            </span>
          )}
        </div>
      )}
      {wallet && (
        <>
          <div className="card">
            <h2>📝 Submit Encrypted Feedback</h2>
            <div className="input-group">
              <label htmlFor="question-select">Select Question:</label>
              <select id="question-select" className="text-input" value={selectedQuestionId} onChange={(e) => setSelectedQuestionId(Number(e.target.value))} disabled={activeQuestions.length === 0}>
                {activeQuestions.length === 0 ? (
                  <option value="">No active questions available</option>
                ) : (
                  activeQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      #{q.id + 1}: {q.text}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="score-slider">
                Score: <span className="score-display">{score}</span>
              </label>
              <input id="score-slider" type="range" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} className="score-slider" />
              <div className="slider-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            <button onClick={submit} disabled={submitting || activeQuestions.length === 0} className="btn-primary">
              {submitting ? <><span className="spinner"></span> Submitting...</> : "🔐 Submit Encrypted Feedback"}
            </button>
          </div>
          <div className="card">
            <h2>➕ Create New Question</h2>
            <div className="input-group">
              <input type="text" placeholder="Enter your question..." value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="text-input" />
            </div>
            <button onClick={createQ} disabled={creatingQuestion || !newQuestionText.trim()} className="btn-secondary">
              {creatingQuestion ? <><span className="spinner"></span> Creating...</> : "Create Question"}
            </button>
          </div>
          {/* Decrypt functionality temporarily disabled */}
          <div className="card">
            <div className="card-header">
              <h2>📋 All Questions</h2>
              <button onClick={loadQuestions} disabled={loadingQuestions} className="btn-secondary btn-sm">
                {loadingQuestions ? '⟳' : '🔄'} Refresh
              </button>
            </div>
            {loadingQuestions && questions.length === 0 ? (
              <div className="loading-state">
                <span className="spinner"></span>
                <p>Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="empty-state">
                <p>No questions yet. Create the first one!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="questions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Question</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => {
                      const isCreator = wallet && q.creator?.toLowerCase() === wallet.address.toLowerCase();
                      return (
                        <tr key={q.id}>
                          <td>#{q.id + 1}</td>
                          <td>{q.text}</td>
                          <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${q.active ? 'badge-active' : 'badge-inactive'}`}>
                              {q.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {isCreator && q.active && (
                              <button
                                onClick={() => handleDeactivate(q.id)}
                                disabled={deactivatingId === q.id}
                                className="btn-deactivate btn-sm"
                              >
                                {deactivatingId === q.id ? <><span className="spinner"></span> Deactivating...</> : "Deactivate"}
                              </button>
                            )}
                            {isCreator && !q.active && (
                              <span className="text-muted">—</span>
                            )}
                            {!isCreator && (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
