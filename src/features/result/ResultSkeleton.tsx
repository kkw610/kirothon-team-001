"use client";

import { useEffect, useState } from "react";
import { cx } from "./cx";
import { jua } from "./fonts";
import { LOADING_TITLE, SLOW_NOTICE, SLOW_THRESHOLD_MS } from "./format";
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
