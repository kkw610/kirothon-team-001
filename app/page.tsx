"use client";

import { useState } from "react";
import { MapView } from "@/features/map";
import { ResultView } from "@/features/result";
import { SearchForm } from "@/features/search-form";
import type { Place, RecommendRequest, RecommendResponse } from "@/shared/types";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: RecommendResponse; destination: Place } | null>(null);

  async function handleSubmit(request: RecommendRequest) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "추천을 불러오지 못했습니다.");
      setResult({ data: body, destination: request.destination });
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>택시 환승역 추천</h1>
      <SearchForm loading={loading} onSubmit={handleSubmit} />
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <ResultView result={result.data} />
          <MapView
            routes={result.data.routes}
            destination={result.destination}
            highlightStopName={result.data.best?.stopName}
          />
        </>
      )}
    </main>
  );
}
