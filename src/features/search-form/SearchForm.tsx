"use client";

import { useId, useState, type FormEvent } from "react";
import type { Place, RecommendRequest } from "@/shared/types";
import { Button, Card, Mascot } from "@/shared/ui";
import { PlaceInput } from "./PlaceInput";
import styles from "./searchForm.module.css";

interface Props {
  loading: boolean;
  onSubmit: (request: RecommendRequest) => void;
}

type Errors = {
  origin?: string;
  destination?: string;
  arrival?: string;
  departure?: string;
};

/** datetime-local 입력용 문자열(로컬 시각, 분 단위) */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SearchForm({ loading, onSubmit }: Props) {
  const arrivalId = useId();
  const departureId = useId();
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [arrival, setArrival] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 60 * 60_000)),
  );
  const [departure, setDeparture] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next: Errors = {};
    if (!origin) next.origin = "출발역을 검색 목록에서 선택해 주세요.";
    if (!destination) next.destination = "도착역을 검색 목록에서 선택해 주세요.";
    const arrivalDate = new Date(arrival);
    if (!arrival || Number.isNaN(arrivalDate.getTime())) {
      next.arrival = "도착해야 하는 시각을 입력해 주세요.";
    }
    let departureDate: Date | null = null;
    if (departure) {
      departureDate = new Date(departure);
      if (Number.isNaN(departureDate.getTime())) {
        next.departure = "출발 시각 형식이 올바르지 않아요.";
      } else if (!next.arrival && departureDate >= arrivalDate) {
        next.departure = "출발 시각은 도착 시각보다 빨라야 해요.";
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || !origin || !destination) return;
    onSubmit({
      origin,
      destination,
      arrivalTime: arrivalDate.toISOString(),
      ...(departureDate ? { departureTime: departureDate.toISOString() } : {}),
    });
  }

  return (
    <section className={styles.layout}>
      <div className={styles.hero}>
        <Mascot size={160} mood="idle" />
        <h2 className={styles.headline}>
          어느 역에서 내려
          <br />
          택시를 타야 할까요?
        </h2>
        <p className={styles.lead}>
          출발역, 도착역, 도착해야 하는 시각을 알려주면 빨리갈게가 제시간에
          도착하면서 가장 싼 환승역을 찾아요.
        </p>
      </div>
      <Card as="div" padding="lg" className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <PlaceInput label="출발역" error={errors.origin} onChange={setOrigin} />
          <PlaceInput label="도착역" error={errors.destination} onChange={setDestination} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor={arrivalId}>
              도착해야 하는 시각
            </label>
            <input
              id={arrivalId}
              className={styles.input}
              type="datetime-local"
              suppressHydrationWarning // 기본값이 서버와 브라우저 시각에 따라 달라진다.
              value={arrival}
              aria-invalid={errors.arrival ? true : undefined}
              aria-describedby={errors.arrival ? `${arrivalId}-error` : undefined}
              onChange={(e) => setArrival(e.target.value)}
            />
            {errors.arrival && (
              <p id={`${arrivalId}-error`} className={styles.error}>
                {errors.arrival}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={departureId}>
              출발 시각 <span className={styles.optional}>(선택)</span>
            </label>
            <input
              id={departureId}
              className={styles.input}
              type="datetime-local"
              value={departure}
              aria-invalid={errors.departure ? true : undefined}
              aria-describedby={`${departureId}-hint${errors.departure ? ` ${departureId}-error` : ""}`}
              onChange={(e) => setDeparture(e.target.value)}
            />
            <p id={`${departureId}-hint`} className={styles.hint}>
              비워 두면 지금 출발해요.
            </p>
            {errors.departure && (
              <p id={`${departureId}-error`} className={styles.error}>
                {errors.departure}
              </p>
            )}
          </div>
          <Button type="submit" fullWidth disabled={loading} aria-busy={loading}>
            {loading ? "계산 중..." : "택시로 갈아탈 역 찾기"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
