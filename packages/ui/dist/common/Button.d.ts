import React from "react";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
/**
 * Modern button component with IDE-consistent styling and smooth transitions
 */
export declare function Button({ variant, size, style, children, leftIcon, rightIcon, onMouseEnter, onMouseLeave, ...props }: ButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Button.d.ts.map