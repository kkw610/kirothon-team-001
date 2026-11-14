"use client";

import { useEffect, useState } from "react";
import { cx } from "./cx";
import { jua } from "./fonts";
import {
  EMPTY_HINT,
  EMPTY_TITLE,
  ERROR_TITLE,
  LOADING_TITLE,
  SLOW_NOTICE,
  SLOW_THRESHOLD_MS,
  resolveErrorMessage,
} from "./format";
import { AlertIcon, PinIcon } from "./icons";
import styles from "./result.module.css";

export function ResultSkeleton() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={cx(jua.variable, styles.root, styles.card, styles.skeletonCard, styles.withMascot)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.mascotSlot} aria-hidden="true" />
      <div className={styles.cardBody}>
        <h2 className={cx(styles.heading, styles.errorTitle)}>{LOADING_TITLE}</h2>
        {slow && <p className={styles.slowNotice}>{SLOW_NOTICE}</p>}
        <div className={styles.skeletonGroup} aria-hidden="true">
          <div className={cx(styles.skeleton, styles.skeletonBlockLarge)} />
          <div className={cx(styles.skeleton, styles.skeletonBlock)} />
          <div className={cx(styles.skeleton, styles.skeletonBlock)} />
        </div>
      </div>
    </section>
  );
}

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

export function EmptyCard() {
  return (
    <section
      className={cx(jua.variable, styles.root, styles.card, styles.errorCard, styles.emptyCard)}
      role="status"
    >
      <span className={styles.iconCircle}>
        <PinIcon className={styles.icon} />
      </span>
      <h2 className={cx(styles.heading, styles.errorTitle)}>{EMPTY_TITLE}</h2>
      <p className={styles.errorText}>{EMPTY_HINT}</p>
    </section>
  );
}
