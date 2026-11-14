import type { RecommendResponse } from "@/shared/types";
import { BreakdownCard } from "./BreakdownCard";
import { ComparisonTable } from "./ComparisonTable";
import { cx } from "./cx";
import { jua } from "./fonts";
import { LateCard } from "./LateCard";
import { RecommendationCard } from "./RecommendationCard";
import styles from "./result.module.css";
import { pickFastest } from "./select";
import { EmptyCard } from "./ResultStates";
import { resolveViewState } from "./viewState";

interface Props {
  result: RecommendResponse;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
}

export function ResultView({ result, arrivalDeadline }: Props) {
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

  return (
    <div className={cx(jua.variable, styles.root, styles.stack)}>
      {state === "recommended" ? (
        <RecommendationCard option={shown} arrivalDeadline={arrivalDeadline} />
      ) : (
        <LateCard option={shown} arrivalDeadline={arrivalDeadline} />
      )}
      <BreakdownCard option={shown} />
      <ComparisonTable options={options} best={best} arrivalDeadline={arrivalDeadline} />
    </div>
  );
}
