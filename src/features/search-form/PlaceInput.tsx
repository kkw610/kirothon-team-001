"use client";

import { useEffect, useId, useState } from "react";
import type { Place } from "@/shared/types";
import { matchPlace } from "./matchPlace";
import styles from "./searchForm.module.css";

interface Props {
  label: string;
  /** 검증 오류 문구. 있으면 입력에 aria-invalid로 연결된다. */
  error?: string | null;
  onChange: (place: Place | null) => void;
}

/**
 * 이름을 입력하면 /api/places로 후보를 찾고, 후보와 일치하면 장소가 선택된다.
 * 노선이 붙은 역 이름(예: "신촌역 2호선")도 "신촌역"만 입력해 선택할 수 있다(matchPlace).
 */
export function PlaceInput({ label, error, onChange }: Props) {
  const listId = useId();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [picked, setPicked] = useState<Place | null>(null);

  useEffect(() => {
    const q = text.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const places: Place[] = await res.json();
        setSuggestions(places);
        const match = matchPlace(places, q);
        setPicked(match);
        onChange(match);
      } catch {
        // 요청 취소나 일시 오류는 무시한다. 선택이 없으면 제출 시 안내한다.
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // onChange는 부모가 매 렌더 새로 만들 수 있어 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={styles.input}
        list={listId}
        value={text}
        placeholder="예: 신촌역"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setPicked(null);
          onChange(null);
        }}
      />
      <datalist id={listId}>
        {suggestions.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>
      {picked && picked.name !== text.trim() && !error && (
        <p className={styles.hint}>선택: {picked.name}</p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
