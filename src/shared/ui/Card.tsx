import type { HTMLAttributes } from "react";
import { cx } from "./cx";
import styles from "./card.module.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  tone?: "default" | "tint" | "alert";
  padding?: "md" | "lg";
}

export function Card({
  as: Tag = "div",
  tone = "default",
  padding = "md",
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        styles.card,
        tone === "tint" && styles.tint,
        tone === "alert" && styles.alert,
        padding === "lg" ? styles.lg : styles.md,
        className,
      )}
    />
  );
}
