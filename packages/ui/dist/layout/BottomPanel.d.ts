import React from "react";
export interface BottomPanelProps {
    children: React.ReactNode;
    height?: number;
    tabs?: Array<{
        id: string;
        label: string;
        active?: boolean;
        onClick?: () => void;
    }>;
}
/**
 * Bottom panel component for terminal, problems, output, etc.
 */
export declare function BottomPanel({ children, height, tabs, }: BottomPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BottomPanel.d.ts.map