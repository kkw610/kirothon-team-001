import type { Option } from "@/shared/types";
import { diffMinutes, formatDuration, formatKm, formatMargin, formatTaxiFare, formatTime, formatWon } from "./format";
import styles from "./result.module.css";

interface Props {
  option: Option;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
  /** false이면 제시간 도착 불가 대안 카드로 표시한다. */
  recommended: boolean;
}

export function RecommendationCard({ option, arrivalDeadline, recommended }: Props) {
  const diff = diffMinutes(arrivalDeadline, option.arrivalTime);

  return (
    <section className={`${styles.card} ${recommended ? styles.recommended : styles.fallback}`}>
      {recommended ? (
        <h2 className={styles.headline}>
          <span className={styles.stop}>{option.stopName}역</span>에서 택시로 갈아타세요
        </h2>
      ) : (
        <>
          <h2 className={styles.headline}>제시간에 도착하는 방법이 없어요</h2>
          <p className={styles.sub}>
            가장 빠른 방법은 <strong>{option.stopName}역</strong>에서 택시로 갈아타는 것이에요.
          </p>
        </>
      )}

      <p className={styles.arrival}>
        <strong>{formatTime(option.arrivalTime)}</strong> 도착{" "}
        <span className={diff >= 0 ? styles.ok : styles.late}>
          {diff >= 0 ? "✓ " : "⚠ "}
          {formatMargin(diff)}
        </span>
      </p>

      <dl className={styles.breakdown}>
        <div>
          <dt>지하철</dt>
          <dd>
            {formatDuration(option.subwayMin)} · {formatWon(option.subwayFare)}
          </dd>
        </div>
        <div>
          <dt>택시 대기</dt>
          <dd>{formatDuration(option.taxiWaitMin)}</dd>
        </div>
        <div>
          <dt>택시</dt>
          <dd>
            {formatDuration(option.taxiMin)} · {formatKm(option.taxiDistanceM)} · {formatTaxiFare(option.taxiFare)}
          </dd>
        </div>
        <div className={styles.total}>
          <dt>총비용</dt>
          <dd>{formatWon(option.totalCost)}</dd>
        </div>
      </dl>
      <p className={styles.note}>택시 요금은 추정치이며 교통상황에 따라 변동될 수 있어요.</p>
    </section>
  );
}
