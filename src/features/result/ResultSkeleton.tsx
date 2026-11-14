"use client";
import { useEffect, useState } from "react";
import { Mascot } from "@/shared/ui";
import { cx } from "./cx";
import { jua } from "./fonts";
import { LOADING_STEPS, LOADING_STEP_MS, LOADING_TITLE, SLOW_NOTICE, SLOW_THRESHOLD_MS } from "./format";
import styles from "./result.module.css";

/** 단계별로 유령이 선로 위를 나아가는 위치(%). 마지막 단계는 도착 직전에 멈춘다. */
const GHOST_POSITIONS = [14, 50, 82];

/**
 * 결과를 기다리는 동안 보여 주는 카드.
 * 실제 진행률은 알 수 없으므로 단계는 시간이 지나면서 넘어가고, 마지막 단계는 응답이 올 때까지 머문다.
 */
export function ResultSkeleton() {
  const [slow, setSlow] = useState(false);
  const [step, setStep] = useState(0);
  const lastStep = LOADING_STEPS.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step >= lastStep) return;
    const timer = setTimeout(() => setStep((s) => s + 1), LOADING_STEP_MS);
    return () => clearTimeout(timer);
  }, [step, lastStep]);

  const position = GHOST_POSITIONS[Math.min(step, GHOST_POSITIONS.length - 1)];

  return (
    <section
      className={cx(jua.variable, styles.root, styles.loadingCard)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.loadingStage} aria-hidden="true">
        <div className={styles.loadingGhost} style={{ left: `${position}%` }}>
          <Mascot size={72} mood="loading" />
        </div>
        <div className={styles.loadingTrack}>
          <span className={styles.loadingTrackDone} style={{ width: `${position}%` }} />
          <span className={cx(styles.loadingNode, styles.loadingNodeA)} />
          <span className={cx(styles.loadingNode, styles.loadingNodeB)} />
          <span className={styles.loadingNodeCurrent} style={{ left: `${position}%` }} />
          <span className={styles.loadingGoal} />
        </div>
      </div>
      <h2 className={cx(styles.heading, styles.loadingTitle)}>{LOADING_TITLE}</h2>
      <ul className={styles.loadingSteps}>
        {LOADING_STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <li key={label} className={cx(styles.loadingStep, styles[`loadingStep_${state}`])}>
              <span className={styles.loadingStepMark} aria-hidden="true">
                {state === "done" && (
                  <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="M2.5 6.5l2.2 2.2 4.8-5" />
                  </svg>
                )}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
      {slow && <p className={styles.slowNotice}>{SLOW_NOTICE}</p>}
    </section>
  );
}
