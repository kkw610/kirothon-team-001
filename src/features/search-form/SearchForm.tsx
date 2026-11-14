"use client";

import { useId, useState, type FormEvent } from "react";
import type { Place, RecommendRequest } from "@/shared/types";
import { Button, Card, Mascot, SubwayScene } from "@/shared/ui";
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

/** time 입력용 문자열(로컬 시각 HH:mm) */
function toTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "HH:mm"을 오늘 날짜의 로컬 시각으로 바꾼다. 형식이 틀리면 Invalid Date */
function todayAt(time: string): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return new Date(NaN);
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

const QUICK_ARRIVALS = [
  { label: "30분 뒤", minutes: 30 },
  { label: "45분 뒤", minutes: 45 },
  { label: "1시간 뒤", minutes: 60 },
] as const;

export function SearchForm({ loading, onSubmit }: Props) {
  const arrivalId = useId();
  const departureId = useId();
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [arrival, setArrival] = useState(() =>
    toTimeInputValue(new Date(Date.now() + 60 * 60_000)),
  );
  const [departure, setDeparture] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [quick, setQuick] = useState<number | null>(60);
  const [editingDeparture, setEditingDeparture] = useState(false);
  const [nowLabel] = useState(() => toTimeInputValue(new Date()));

  function swapPlaces() {
    setOrigin(destination);
    setDestination(origin);
  }

  function pickQuick(minutes: number) {
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutes);
    setArrival(toTimeInputValue(target));
    setQuick(minutes);
  }

  function resetDeparture() {
    setDeparture("");
    setEditingDeparture(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next: Errors = {};
    if (!origin) next.origin = "출발역을 선택해 주세요.";
    if (!destination) next.destination = "도착역을 선택해 주세요.";
    const arrivalDate = todayAt(arrival);
    if (!arrival || Number.isNaN(arrivalDate.getTime())) {
      next.arrival = "도착해야 하는 시각을 입력해 주세요.";
    }
    let departureDate: Date | null = null;
    if (departure) {
      departureDate = todayAt(departure);
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
        <SubwayScene className={styles.scene} />
        <h2 className={styles.headline}>
          어느 역에서 내려
          <br />
          택시를 타야 할까요?
        </h2>
        <p className={styles.lead}>
          어디서 어디로, 몇 시까지 가야 하는지만 알려 주세요.
          <br />
          제시간에 도착하는 가장 싼 택시 환승역을 찾아 드릴게요.
        </p>
      </div>
      <Card as="div" padding="lg" className={styles.card}>
        <div className={styles.mascot}>
          <Mascot size={72} />
        </div>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.titleBlock}>
            <h3 className={styles.formTitle}>어디로 가세요?</h3>
            <p className={styles.formSub}>역 두 개와 도착 시각만 있으면 돼요.</p>
          </div>

          <div className={styles.placeGroup}>
            <PlaceInput
              label="출발역"
              marker="start"
              value={origin}
              error={errors.origin}
              onChange={setOrigin}
            />
            <hr className={styles.divider} />
            <PlaceInput
              label="도착역"
              marker="end"
              value={destination}
              error={errors.destination}
              onChange={setDestination}
            />
            <button
              type="button"
              className={styles.swap}
              onClick={swapPlaces}
              aria-label="출발역과 도착역 바꾸기"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4v16M4 16l4 4 4-4" />
                <path d="M16 20V4M12 8l4-4 4 4" />
              </svg>
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={arrivalId}>
              몇 시까지 도착해야 해요?
            </label>
            <div className={styles.timeBox}>
              <input
                id={arrivalId}
                className={styles.timeInput}
                type="time"
                suppressHydrationWarning // 기본값이 서버와 브라우저 시각에 따라 달라진다.
                value={arrival}
                aria-invalid={errors.arrival ? true : undefined}
                aria-describedby={errors.arrival ? `${arrivalId}-error` : undefined}
                onChange={(e) => {
                  setArrival(e.target.value);
                  setQuick(null);
                }}
              />
              <svg className={styles.timeIcon} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            {errors.arrival && (
              <p id={`${arrivalId}-error`} className={styles.error}>
                {errors.arrival}
              </p>
            )}
            <div className={styles.chips} role="group" aria-label="도착 시각 빠른 선택">
              {QUICK_ARRIVALS.map((q) => (
                <button
                  key={q.minutes}
                  type="button"
                  className={styles.quickChip}
                  aria-pressed={quick === q.minutes}
                  onClick={() => pickQuick(q.minutes)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.departure}>
            <div className={styles.departureRow}>
              <span id={departureId} className={styles.departureText}>
                출발{" "}
                {departure ? (
                  <strong>{departure}</strong>
                ) : (
                  <strong suppressHydrationWarning>
                    지금 ({nowLabel})
                  </strong>
                )}
              </span>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => (editingDeparture ? resetDeparture() : setEditingDeparture(true))}
                aria-expanded={editingDeparture}
                aria-controls={`${departureId}-panel`}
              >
                {editingDeparture ? "지금으로" : "바꾸기"}
              </button>
            </div>
            {editingDeparture && (
              <div id={`${departureId}-panel`} className={styles.departurePanel}>
                <input
                  className={styles.input}
                  type="time"
                  aria-labelledby={departureId}
                  value={departure}
                  aria-invalid={errors.departure ? true : undefined}
                  aria-describedby={errors.departure ? `${departureId}-error` : undefined}
                  onChange={(e) => setDeparture(e.target.value)}
                />
                {errors.departure && (
                  <p id={`${departureId}-error`} className={styles.error}>
                    {errors.departure}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button type="submit" fullWidth disabled={loading} aria-busy={loading} className={styles.submit}>
            {loading ? (
              "계산 중..."
            ) : (
              <>
                택시로 갈아탈 역 찾기
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </Button>

          <p className={styles.note}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            서울 지하철 한 노선 + 택시 한 번으로 계산해요.
          </p>
        </form>
      </Card>
    </section>
  );
}
