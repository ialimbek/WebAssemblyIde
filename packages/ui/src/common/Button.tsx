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
export function Button({
  variant = "secondary",
  size = "md",
  style,
  children,
  leftIcon,
  rightIcon,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    border: "1px solid transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 500,
    transition: "all 0.15s ease",
    outline: "none",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "12px", height: "28px" },
    md: { padding: "8px 16px", fontSize: "13px", height: "34px" },
    lg: { padding: "10px 20px", fontSize: "14px", height: "40px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--button-primary-background, #007acc)",
      color: "var(--button-primary-foreground, #ffffff)",
      borderColor: "var(--button-primary-border, #007acc)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    },
    secondary: {
      backgroundColor: "var(--button-secondary-background, #3c3c3c)",
      color: "var(--button-secondary-foreground, #e8e8e8)",
      borderColor: "var(--button-secondary-border, #555555)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--button-ghost-foreground, #cccccc)",
      borderColor: "transparent",
    },
    danger: {
      backgroundColor: "var(--button-danger-background, #c72e2e)",
      color: "var(--button-danger-foreground, #ffffff)",
      borderColor: "var(--button-danger-border, #c72e2e)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--button-outline-foreground, #cccccc)",
      borderColor: "var(--button-outline-border, #555555)",
    },
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;

    if (variant === "primary") {
      target.style.backgroundColor = "var(--button-primary-hover, #005a9e)";
      target.style.transform = "translateY(-1px)";
      target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    } else if (variant === "secondary") {
      target.style.backgroundColor = "var(--button-secondary-hover, #4a4a4a)";
    } else if (variant === "ghost") {
      target.style.backgroundColor = "var(--button-ghost-hover, rgba(255,255,255,0.08))";
    } else if (variant === "danger") {
      target.style.backgroundColor = "var(--button-danger-hover, #a82626)";
    } else if (variant === "outline") {
      target.style.backgroundColor = "var(--button-outline-hover, rgba(255,255,255,0.05))";
      target.style.borderColor = "var(--button-outline-hover-border, #777777)";
    }

    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;

    if (variant === "primary") {
      target.style.backgroundColor = "var(--button-primary-background, #007acc)";
      target.style.transform = "translateY(0)";
      target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
    } else if (variant === "secondary") {
      target.style.backgroundColor = "var(--button-secondary-background, #3c3c3c)";
    } else if (variant === "ghost") {
      target.style.backgroundColor = "transparent";
    } else if (variant === "danger") {
      target.style.backgroundColor = "var(--button-danger-background, #c72e2e)";
    } else if (variant === "outline") {
      target.style.backgroundColor = "transparent";
      target.style.borderColor = "var(--button-outline-border, #555555)";
    }

    onMouseLeave?.(e);
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {leftIcon && <span style={{ display: "flex", alignItems: "center" }}>{leftIcon}</span>}
      {children}
      {rightIcon && <span style={{ display: "flex", alignItems: "center" }}>{rightIcon}</span>}
    </button>
  );
}
