"use client";

import { cx } from "./cx";
import { jua } from "./fonts";
import { EMPTY_HINT, EMPTY_TITLE } from "./format";
import { PinIcon } from "./icons";
import styles from "./result.module.css";

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
