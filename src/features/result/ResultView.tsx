import type { ReactNode } from "react";
import type { RecommendResponse } from "@/shared/types";
import { BreakdownCard } from "./BreakdownCard";
import { ComparisonTable } from "./ComparisonTable";
import { cx } from "./cx";
import { jua } from "./fonts";
import { LateCard } from "./LateCard";
import { RecommendationCard } from "./RecommendationCard";
import styles from "./result.module.css";
import { RouteSummaryCard } from "./RouteSummaryCard";
import { pickFastest } from "./select";
import { SubwayOnlyCard } from "./SubwayOnlyCard";
import { EmptyCard } from "./ResultStates";
import { resolveViewState } from "./viewState";

interface Props {
  result: RecommendResponse;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
  /** 출발지·도착지 이름. 있으면 경로 요약과 내역 제목에 쓴다. */
  originName?: string;
  destinationName?: string;
  /** 내역과 경로 요약 아래, 비교표 위에 한 칸을 차지하는 요소. 보통 지도 */
  aside?: ReactNode;
}

export function ResultView({ result, arrivalDeadline, originName, destinationName, aside }: Props) {
  const { best, options } = result;
  const state = resolveViewState({ loading: false, hasError: false, best, options });

  if (state === "empty") {
    return <EmptyCard />;
  }

  // 제시간 도착이 불가능하면 도착이 가장 빠른 옵션을 대안으로 보여 준다.
  const shown = state === "recommended" ? best : pickFastest(options);
  if (!shown) {
    return <EmptyCard />;
  }

  const names = { origin: originName, destination: destinationName };
  return (
    <div className={cx(jua.variable, styles.root, styles.layout)}>
      <div className={styles.areaHero}>
        {state === "recommended" ? (
          <RecommendationCard option={shown} arrivalDeadline={arrivalDeadline} />
        ) : (
          <LateCard option={shown} arrivalDeadline={arrivalDeadline} />
        )}
      </div>
      <div className={styles.areaBreakdown}>
        <BreakdownCard option={shown} names={names} />
      </div>
      <div className={styles.areaRoute}>
        {originName && destinationName && (
          <RouteSummaryCard option={shown} originName={originName} destinationName={destinationName} />
        )}
      </div>
      {aside && <div className={styles.areaMap}>{aside}</div>}
      <div className={styles.areaSubway}>
        <SubwayOnlyCard
          route={result.routes[0]}
          departureTime={shown.departureTime}
          arrivalDeadline={arrivalDeadline}
          originName={originName}
          destinationName={destinationName}
        />
      </div>
      <div className={styles.areaTable}>
        <ComparisonTable options={options} best={best} arrivalDeadline={arrivalDeadline} />
      </div>
    </div>
  );
}
