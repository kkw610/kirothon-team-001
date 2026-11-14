import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx(
        styles.button,
        variant === "outline" ? styles.outline : styles.primary,
        fullWidth && styles.fullWidth,
        className,
      )}
    />
  );
}
