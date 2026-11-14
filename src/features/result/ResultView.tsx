import type { RecommendResponse } from "@/shared/types";
import { ComparisonTable } from "./ComparisonTable";
import { RecommendationCard } from "./RecommendationCard";
import styles from "./result.module.css";

interface Props {
  result: RecommendResponse;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
}

export function ResultView({ result, arrivalDeadline }: Props) {
  const { best, options } = result;

  if (options.length === 0) {
    return (
      <section className={styles.card} role="status">
        <h2 className={styles.headline}>경로를 찾지 못했어요</h2>
        <p className={styles.sub}>출발지와 목적지를 확인하고 다시 시도해 주세요.</p>
      </section>
    );
  }

  // 제시간 도착이 불가능하면 도착이 가장 빠른 옵션을 대안으로 보여 준다.
  const fastest = [...options].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))[0];
  const shown = best ?? fastest;

  return (
    <div className={styles.stack}>
      <RecommendationCard option={shown} arrivalDeadline={arrivalDeadline} recommended={best !== null} />
      <ComparisonTable options={options} best={best} arrivalDeadline={arrivalDeadline} />
    </div>
  );
}
