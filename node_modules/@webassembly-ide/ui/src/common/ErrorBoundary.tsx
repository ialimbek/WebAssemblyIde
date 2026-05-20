import React from "react";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component for graceful error handling.
 * Can be used at application, panel, or editor level.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "24px",
            backgroundColor: "#1e1e1e",
            color: "#cccccc",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#f48771",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999999",
              marginBottom: "16px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: "#007acc",
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
