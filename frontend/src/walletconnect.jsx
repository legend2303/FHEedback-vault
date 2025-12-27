import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Get MetaMask connector
  const metaMaskConnector = connectors[0];

  const shortAddr = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);

  const STYLES = {
    container: {
      padding: 20,
      background: "rgba(30, 27, 75, 0.5)",
      border: "1px solid #4f46e5",
      borderRadius: 12,
      backdropFilter: "blur(10px)",
    },
    title: {
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 16,
      color: "#e0e7ff",
    },
    buttonGroup: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 10,
      marginBottom: 16,
    },
    button: {
      padding: "12px 16px",
      borderRadius: 8,
      border: "1px solid #4f46e5",
      background: "rgba(79, 70, 229, 0.1)",
      color: "#a78bfa",
      cursor: "pointer",
      fontWeight: 500,
      transition: "all 0.3s ease",
      fontSize: 14,
    },
    buttonHover: {
      background: "rgba(79, 70, 229, 0.2)",
      borderColor: "#6366f1",
    },
    buttonActive: {
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      color: "#fff",
    },
    connectedBox: {
      padding: 16,
      background: "rgba(16, 185, 129, 0.1)",
      border: "1px solid #10b981",
      borderRadius: 8,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    connectedText: {
      color: "#6ee7b7",
      fontWeight: 600,
    },
    disconnectBtn: {
      padding: "8px 14px",
      borderRadius: 6,
      border: "none",
      background: "rgba(239, 68, 68, 0.2)",
      color: "#fca5a5",
      cursor: "pointer",
      fontWeight: 600,
      transition: "all 0.3s ease",
    },
    secondaryGroup: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid #334155",
    },
    secondaryTitle: {
      fontSize: 12,
      color: "#94a3b8",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
  };

  return (
    <div style={STYLES.container}>
      {!isConnected ? (
        <>
          <div style={STYLES.title}>🦊 Connect MetaMask</div>

          {metaMaskConnector && (
            <button
              onClick={() => connect({ connector: metaMaskConnector })}
              disabled={isPending}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, STYLES.buttonActive);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.target.style, STYLES.button);
              }}
              style={STYLES.button}
            >
              {isPending ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}
        </>
      ) : (
        <div style={STYLES.connectedBox}>
          <span style={STYLES.connectedText}>
            ✅ Connected: {shortAddr(address)}
          </span>
          <button
            onClick={() => disconnect()}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.3)";
              e.target.style.color = "#fecaca";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.2)";
              e.target.style.color = "#fca5a5";
            }}
            style={STYLES.disconnectBtn}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

