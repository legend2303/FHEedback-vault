import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "rgba(30, 27, 75, 0.5)",
              border: "2px solid #ef4444",
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <h1 style={{ fontSize: 28, marginBottom: 16 }}>⚠️ Oops!</h1>
            <p style={{ color: "#fca5a5", marginBottom: 16 }}>
              Something went wrong. Please refresh the page.
            </p>
            <details style={{ marginBottom: 16, textAlign: "left", color: "#94a3b8" }}>
              <summary style={{ cursor: "pointer", marginBottom: 8 }}>
                Error details
              </summary>
              <pre
                style={{
                  background: "#0f172a",
                  padding: 12,
                  borderRadius: 6,
                  overflow: "auto",
                  fontSize: 12,
                }}
              >
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
