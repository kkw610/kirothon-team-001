"use client";

import { useEffect, useState } from "react";
import { SubwayScene } from "@/shared/ui";
import { cx } from "./cx";
import { jua } from "./fonts";
import { LOADING_TITLE, SLOW_NOTICE, SLOW_THRESHOLD_MS } from "./format";
import styles from "./result.module.css";

/** 결과를 기다리는 동안 화면 가운데에 달리는 지하철과 안내 문구를 보여 준다. */
export function ResultSkeleton() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={cx(jua.variable, styles.root, styles.loadingScreen)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <SubwayScene className={styles.loadingScene} />
      <h2 className={cx(styles.heading, styles.loadingTitle)}>
        {LOADING_TITLE}
        <span className={styles.loadingDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </h2>
      <p className={styles.loadingLead}>제시간에 도착하는 가장 싼 환승역을 찾고 있어요.</p>
      {slow && <p className={styles.slowNotice}>{SLOW_NOTICE}</p>}
    </section>
  );
}
