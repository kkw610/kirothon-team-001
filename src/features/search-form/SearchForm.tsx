"use client";

import { useState, type FormEvent } from "react";
import type { Place, RecommendRequest } from "@/shared/types";
import { PlaceInput } from "./PlaceInput";

interface Props {
  loading: boolean;
  onSubmit: (request: RecommendRequest) => void;
}

/** datetime-local 입력용 문자열(로컬 시각, 분 단위) */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SearchForm({ loading, onSubmit }: Props) {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [arrival, setArrival] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 60 * 60_000)),
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!origin || !destination) {
      setError("출발지와 도착지는 검색 목록에 있는 장소를 선택해 주세요.");
      return;
    }
    const arrivalDate = new Date(arrival);
    if (Number.isNaN(arrivalDate.getTime())) {
      setError("도착 시각을 입력해 주세요.");
      return;
    }
    setError(null);
    onSubmit({ origin, destination, arrivalTime: arrivalDate.toISOString() });
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <PlaceInput label="출발지" onChange={setOrigin} />
      <PlaceInput label="목적지" onChange={setDestination} />
      <label className="field">
        <span>도착해야 하는 시각</span>
        <input
          type="datetime-local"
          suppressHydrationWarning // 기본값이 서버와 브라우저 시각에 따라 달라진다.
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "계산 중..." : "환승역 추천받기"}
      </button>
    </form>
  );
}
