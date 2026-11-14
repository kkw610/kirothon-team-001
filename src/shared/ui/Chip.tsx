import type { ReactNode } from "react";
import { cx } from "./cx";
import styles from "./chip.module.css";

export interface ChipProps {
  tone?: "primary-soft" | "primary" | "late";
  children: ReactNode;
}

const TONE_CLASS = {
  "primary-soft": styles.primarySoft,
  primary: styles.primary,
  late: styles.late,
} as const;

export function Chip({ tone = "primary-soft", children }: ChipProps) {
  return <span className={cx(styles.chip, TONE_CLASS[tone])}>{children}</span>;
}
