import type { Option } from "@/shared/types";
import { cx } from "./cx";
import { LATE_CHIP, LATE_HEADLINE, diffMinutes, formatLateMinutes, formatStationName, safeTime } from "./format";
import { AlertIcon } from "./icons";
import styles from "./result.module.css";

interface Props {
  /** 도착이 가장 빠른 옵션 (pickFastest 결과) */
  option: Option;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
}

export function LateCard({ option, arrivalDeadline }: Props) {
  const lateText = formatLateMinutes(diffMinutes(arrivalDeadline, option.arrivalTime));

  return (
    <section className={cx(styles.root, styles.lateCard, styles.withMascot)}>
      <div className={styles.mascotSlot} aria-hidden="true" />
      <div className={styles.cardBody}>
        <p className={styles.chip}>
          <AlertIcon className={styles.icon} />
          <span>{LATE_CHIP}</span>
        </p>
        <h2 className={cx(styles.heading, styles.headline)}>{LATE_HEADLINE}</h2>
        <p className={styles.summary}>
          <span>{formatStationName(option.stopName)}</span> · <span>{safeTime(option.arrivalTime)}</span> ·{" "}
          <span className={styles.lateText}>{lateText ?? "-"}</span>
        </p>
      </div>
    </section>
  );
}
