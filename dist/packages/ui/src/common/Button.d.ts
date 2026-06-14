import React from "react";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
}
/**
 * Reusable button component with IDE-consistent styling
 */
export declare function Button({ variant, size, style, children, ...props }: ButtonProps): React.JSX.Element;
//# sourceMappingURL=Button.d.ts.map