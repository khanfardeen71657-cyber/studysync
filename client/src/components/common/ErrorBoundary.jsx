// client/src/components/common/ErrorBoundary.jsx
import React from "react";

const COLORS = {
  midnightNavy: "#0A1128",
  midnightNavyLight: "#111936",
  midnightNavyBorder: "#232E52",
  marigold: "#E8A33D",
  skyBlue: "#0EA5E9",
  rose: "#F43F5E",
  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: COLORS.midnightNavy,
            color: COLORS.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: "100%",
              textAlign: "center",
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>😵</div>

            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
                color: COLORS.white,
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              style={{
                fontSize: 14,
                color: COLORS.whiteMuted,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              The app ran into an unexpected error. Please try reloading the page.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: `${COLORS.rose}15`,
                  border: `1px solid ${COLORS.rose}40`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  textAlign: "left",
                  fontSize: 12,
                  color: COLORS.rose,
                  fontFamily: "monospace",
                  overflowX: "auto",
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  background: COLORS.skyBlue,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                🔄 Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: COLORS.whiteMuted,
                  border: `1px solid ${COLORS.midnightNavyBorder}`,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details
                style={{
                  marginTop: 24,
                  textAlign: "left",
                  fontSize: 11,
                  color: COLORS.whiteDim,
                }}
              >
                <summary style={{ cursor: "pointer", marginBottom: 8 }}>
                  Show stack trace
                </summary>
                <pre
                  style={{
                    background: COLORS.midnightNavy,
                    padding: 12,
                    borderRadius: 8,
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}