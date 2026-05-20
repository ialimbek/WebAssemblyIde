import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
/**
 * React Error Boundary component for graceful error handling.
 * Can be used at application, panel, or editor level.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: "24px",
                    backgroundColor: "#1e1e1e",
                    color: "#cccccc",
                    fontFamily: "inherit",
                }, children: [_jsx("div", { style: {
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#f48771",
                            marginBottom: "8px",
                        }, children: "Something went wrong" }), _jsx("div", { style: {
                            fontSize: "12px",
                            color: "#999999",
                            marginBottom: "16px",
                            textAlign: "center",
                            maxWidth: "400px",
                        }, children: this.state.error?.message || "An unexpected error occurred" }), _jsx("button", { onClick: () => this.setState({ hasError: false, error: null }), style: {
                            backgroundColor: "#007acc",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "3px",
                            padding: "6px 16px",
                            cursor: "pointer",
                            fontSize: "12px",
                        }, children: "Try Again" })] }));
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map