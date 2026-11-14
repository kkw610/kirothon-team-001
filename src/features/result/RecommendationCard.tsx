import type { Option } from "@/shared/types";
import { Mascot } from "@/shared/ui";
import { cx } from "./cx";
import { RECOMMEND_CHIP, formatArrivalSummary, formatOptionHeadline } from "./format";
import styles from "./result.module.css";

interface Props {
  option: Option;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
}

export function RecommendationCard({ option, arrivalDeadline }: Props) {
  return (
    <section className={cx(styles.root, styles.recommendCard, styles.withMascot)}>
      <div className={styles.cardBody}>
        <p className={styles.chip}>{RECOMMEND_CHIP}</p>
        <h2 className={cx(styles.heading, styles.headline)}>{formatOptionHeadline(option)}</h2>
        <p className={styles.summary}>{formatArrivalSummary(option, arrivalDeadline)}</p>
      </div>
      <div className={styles.mascotSlot} aria-hidden="true">
        <Mascot size={120} mood="happy" />
      </div>
    </section>
  );
}
