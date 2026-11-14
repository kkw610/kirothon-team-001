"use client";

import { useRef, useState } from "react";
import { MapView } from "@/features/map";
import { ResultError, ResultSkeleton, ResultView } from "@/features/result";
import { SearchForm } from "@/features/search-form";
import type { RecommendRequest, RecommendResponse } from "@/shared/types";
import { buildConditionSummary, Header } from "@/shared/ui";
import styles from "./page.module.css";

type Phase = "input" | "loading" | "result" | "error";

type State =
  | { phase: "input" }
  | { phase: "loading"; request: RecommendRequest }
  | { phase: "result"; request: RecommendRequest; data: RecommendResponse }
  | { phase: "error"; request: RecommendRequest; message: string };

const DEFAULT_ERROR_MESSAGE = "추천을 불러오지 못했습니다.";

const PHASE_ANNOUNCEMENT: Record<Phase, string> = {
  input: "조건을 입력해 주세요",
  loading: "경로를 찾는 중이에요",
  result: "결과가 나왔어요",
  error: "경로를 불러오지 못했어요",
};

export default function HomePage() {
  const [state, setState] = useState<State>({ phase: "input" });
  const requestSeq = useRef(0);

  async function handleSubmit(request: RecommendRequest) {
    requestSeq.current += 1;
    const seq = requestSeq.current;
    setState({ phase: "loading", request });
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? DEFAULT_ERROR_MESSAGE);
      if (seq !== requestSeq.current) return;
      setState({ phase: "result", request, data: body });
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setState({
        phase: "error",
        request,
        message: e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE,
      });
    }
  }

  function handleChangeCondition() {
    requestSeq.current += 1;
    setState({ phase: "input" });
  }

  const summary =
    state.phase === "input"
      ? undefined
      : buildConditionSummary(
          state.request,
          state.phase === "result" ? state.data.options[0]?.departureTime : undefined,
        );

  return (
    <>
      <Header conditionSummary={summary} onChangeCondition={handleChangeCondition} />
      <main className={styles.main}>
        <div className={styles.srOnly} role="status" aria-live="polite">
          {PHASE_ANNOUNCEMENT[state.phase]}
        </div>
        <h1 className={styles.srOnly}>BBalligalge</h1>

        {/* 입력 슬롯: 입력값 유지를 위해 항상 마운트하고 숨긴다 */}
        <div hidden={state.phase !== "input"}>
          <SearchForm loading={state.phase === "loading"} onSubmit={handleSubmit} />
        </div>

        {/* 로딩 슬롯 */}
        {state.phase === "loading" && <ResultSkeleton />}

        {/* 결과 슬롯 */}
        {state.phase === "result" && (
          <ResultView
            result={state.data}
            arrivalDeadline={state.request.arrivalTime}
            originName={state.request.origin.name}
            destinationName={state.request.destination.name}
            aside={
              <MapView
                routes={state.data.routes}
                destination={state.request.destination}
                highlightStopName={state.data.best?.stopName}
              />
            }
          />
        )}

        {/* 오류 슬롯 */}
        {state.phase === "error" && (
          <ResultError message={state.message} onRetry={() => handleSubmit(state.request)} />
        )}
      </main>
    </>
  );
}
