import React from "react";
export interface PanelProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    actions?: React.ReactNode;
}
/**
 * Generic panel component with title bar
 */
export declare function Panel({ title, children, onClose, actions }: PanelProps): React.JSX.Element;
//# sourceMappingURL=Panel.d.ts.map