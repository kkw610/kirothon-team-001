"use client";

import { useState } from "react";
import { MapView } from "@/features/map";
import { ResultError, ResultSkeleton, ResultView } from "@/features/result";
import { SearchForm } from "@/features/search-form";
import type { RecommendRequest, RecommendResponse } from "@/shared/types";
import styles from "./page.module.css";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: RecommendResponse; request: RecommendRequest };

export default function HomePage() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [lastRequest, setLastRequest] = useState<RecommendRequest | null>(null);

  async function handleSubmit(request: RecommendRequest) {
    setLastRequest(request);
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "추천을 불러오지 못했습니다.");
      setState({ status: "success", data: body, request });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "추천을 불러오지 못했습니다.",
      });
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>택시 환승역 추천</h1>
      <div className={styles.panel}>
        <SearchForm loading={state.status === "loading"} onSubmit={handleSubmit} />
        <div className={styles.resultArea}>
          {state.status === "loading" && <ResultSkeleton />}
          {state.status === "error" && (
            <ResultError
              message={state.message}
              onRetry={() => lastRequest && handleSubmit(lastRequest)}
            />
          )}
          {state.status === "success" && (
            <ResultView result={state.data} arrivalDeadline={state.request.arrivalTime} />
          )}
        </div>
      </div>
      {state.status === "success" && (
        <div className={styles.mapArea}>
          <MapView
            routes={state.data.routes}
            destination={state.request.destination}
            highlightStopName={state.data.best?.stopName}
          />
        </div>
      )}
    </main>
  );
}
