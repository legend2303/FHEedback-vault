import React, { useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Group connectors for better UX
  const groupedConnectors = useMemo(() => {
    const primary = [];
    const secondary = [];

    connectors.forEach((connector) => {
      const primaryNames = ["metaMask", "coinbaseWallet", "rainbow"];
      if (primaryNames.some((name) => connector.id.includes(name))) {
        primary.push(connector);
      } else {
        secondary.push(connector);
      }
    });

    return { primary, secondary };
  }, [connectors]);

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
          <div style={STYLES.title}>🔗 Connect Your Wallet</div>

          {/* Primary Wallets */}
          {groupedConnectors.primary.length > 0 && (
            <div style={STYLES.buttonGroup}>
              {groupedConnectors.primary.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  onMouseEnter={(e) => {
                    Object.assign(e.target.style, STYLES.buttonHover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.target.style, STYLES.button);
                  }}
                  style={STYLES.button}
                >
                  {connector.name}
                  {isPending && "..."}
                </button>
              ))}
            </div>
          )}

          {/* Secondary Wallets (WalletConnect, etc) */}
          {groupedConnectors.secondary.length > 0 && (
            <div style={STYLES.secondaryGroup}>
              <div style={STYLES.secondaryTitle}>Other Wallets</div>
              <div style={STYLES.buttonGroup}>
                {groupedConnectors.secondary.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                    onMouseEnter={(e) => {
                      Object.assign(e.target.style, STYLES.buttonHover);
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.target.style, STYLES.button);
                    }}
                    style={STYLES.button}
                  >
                    {connector.name === "WalletConnect"
                      ? "📱 " + connector.name
                      : connector.name}
                    {isPending && "..."}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
                💡 Can't see your wallet? Select "WalletConnect" to scan QR code
                with your mobile wallet
              </p>
            </div>
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

