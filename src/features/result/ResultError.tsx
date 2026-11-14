"use client";

import { cx } from "./cx";
import { jua } from "./fonts";
import { ERROR_TITLE, resolveErrorMessage } from "./format";
import { AlertIcon } from "./icons";
import styles from "./result.module.css";

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

export function ResultError({ message, onRetry }: ErrorProps) {
  return (
    <section
      className={cx(jua.variable, styles.root, styles.card, styles.errorCard, styles.withMascot)}
      role="alert"
    >
      <div className={styles.mascotSlot} aria-hidden="true" />
      <div className={styles.cardBody}>
        <span className={styles.iconCircle}>
          <AlertIcon className={cx(styles.icon, styles.iconLate)} />
        </span>
        <h2 className={cx(styles.heading, styles.errorTitle)}>{ERROR_TITLE}</h2>
        <p className={styles.errorText}>{resolveErrorMessage(message)}</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          다시 시도
        </button>
      </div>
    </section>
  );
}
