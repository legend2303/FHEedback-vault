import React, { useState, useEffect } from "react";
import { connectWallet } from "./wallet";
import {
  submitEncryptedFeedback,
  createQuestion,
  decryptMyFeedback,
  listQuestions,
} from "./feedbackFHE";
import "./FeedbackApp.css";

export default function FeedbackApp() {
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(0);
  const [score, setScore] = useState(50);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [decryptQuestionId, setDecryptQuestionId] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [status, setStatus] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [decryptedScore, setDecryptedScore] = useState(null);

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
      setStatus({ type: 'success', message: `Feedback submitted to question #${selectedQuestionId}! Tx: ${txHash.slice(0, 10)}...` });
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
      setStatus({ type: 'success', message: `Question created! Tx: ${txHash.slice(0, 10)}...` });
      setNewQuestionText("");
      await loadQuestions();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setCreatingQuestion(false);
    }
  }

  async function readMine() {
    if (!wallet) {
      setStatus({ type: 'error', message: 'Please connect wallet first' });
      return;
    }
    setStatus(null);
    try {
      setDecrypting(true);
      setDecryptedScore(null);
      setStatus({ type: 'info', message: 'Decrypting your feedback...' });
      const score = await decryptMyFeedback(decryptQuestionId, wallet.signer, wallet.address);
      setDecryptedScore(score);
      setStatus({ type: 'success', message: `Successfully decrypted your feedback: ${score}` });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setDecrypting(false);
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

  const activeQuestions = questions.filter(q => q.active);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🔒 Encrypted Feedback System</h1>
        <p className="subtitle">Powered by Zama FHEVM on Sepolia</p>
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
            <p><strong>Chain ID:</strong> {wallet.chainId}</p>
          </div>
        )}
      </div>
      {status && (
        <div className={`status-message status-${status.type}`}>
          {status.message}
        </div>
      )}
      {wallet && (
        <>
          <div className="card">
            <h2>📝 Submit Encrypted Feedback</h2>
            <div className="form-group">
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
            <div className="form-group">
              <label htmlFor="score-slider">
                Score: <span className="score-value">{score}</span>
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
            <div className="form-group">
              <input type="text" placeholder="Enter your question..." value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="text-input" />
            </div>
            <button onClick={createQ} disabled={creatingQuestion || !newQuestionText.trim()} className="btn-secondary">
              {creatingQuestion ? <><span className="spinner"></span> Creating...</> : "Create Question"}
            </button>
          </div>
          <div className="card">
            <h2>🔓 Decrypt My Feedback</h2>
            <div className="form-group">
              <label htmlFor="decrypt-question">Question ID:</label>
              <input id="decrypt-question" type="number" min="0" value={decryptQuestionId} onChange={(e) => setDecryptQuestionId(Number(e.target.value))} className="text-input" />
            </div>
            <button onClick={readMine} disabled={decrypting} className="btn-accent">
              {decrypting ? <><span className="spinner"></span> Decrypting...</> : "Decrypt My Score"}
            </button>
            {decryptedScore !== null && (
              <div className="decrypt-result">
                <strong>Your Score:</strong> {decryptedScore}/100
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-header">
              <h2>📋 All Questions</h2>
              <button onClick={loadQuestions} disabled={loadingQuestions} className="btn-secondary small">
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
              <div className="table-container">
                <table className="questions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Question</th>
                      <th>Created</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id}>
                        <td>#{q.id}</td>
                        <td>{q.text}</td>
                        <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${q.active ? 'badge-active' : 'badge-inactive'}`}>
                            {q.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
