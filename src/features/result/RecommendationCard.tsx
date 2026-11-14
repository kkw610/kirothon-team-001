import type { Option } from "@/shared/types";
import { Mascot } from "@/shared/ui";
import { cx } from "./cx";
import { RECOMMEND_CHIP, formatArrivalStats, formatOptionHeadline } from "./format";
import styles from "./result.module.css";
interface Props {
  option: Option;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
}
export function RecommendationCard({ option, arrivalDeadline }: Props) {
  const stats = formatArrivalStats(option, arrivalDeadline);
  return (
    <section className={cx(styles.root, styles.recommendCard)}>
      <div className={styles.mascotPeek} aria-hidden="true">
        <Mascot size={96} mood="happy" />
      </div>
      <p className={styles.chip}>{RECOMMEND_CHIP}</p>
      <h2 className={cx(styles.heading, styles.headline)}>{formatOptionHeadline(option)}</h2>
      <dl className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <dt className={styles.statLabel}>{s.label}</dt>
            <dd className={styles.statValue}>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
