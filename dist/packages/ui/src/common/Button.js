import React from "react";
/**
 * Reusable button component with IDE-consistent styling
 */
export function Button({ variant = "secondary", size = "md", style, children, ...props }) {
    const baseStyle = {
        border: "1px solid transparent",
        borderRadius: "3px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
    };
    const sizeStyles = {
        sm: { padding: "2px 8px", fontSize: "11px" },
        md: { padding: "4px 12px", fontSize: "13px" },
    };
    const variantStyles = {
        primary: {
            backgroundColor: "#007acc",
            color: "#ffffff",
            borderColor: "#007acc",
        },
        secondary: {
            backgroundColor: "#333333",
            color: "#cccccc",
            borderColor: "#555555",
        },
        ghost: {
            backgroundColor: "transparent",
            color: "#cccccc",
            borderColor: "transparent",
        },
        danger: {
            backgroundColor: "#c72e2e",
            color: "#ffffff",
            borderColor: "#c72e2e",
        },
    };
    return (<button style={{
            ...baseStyle,
            ...sizeStyles[size],
            ...variantStyles[variant],
            ...style,
        }} {...props}>
      {children}
    </button>);
}
//# sourceMappingURL=Button.js.map