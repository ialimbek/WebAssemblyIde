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
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map