"use client";

import { useEffect, useId, useState } from "react";
import type { Place } from "@/shared/types";

interface Props {
  label: string;
  onChange: (place: Place | null) => void;
}

/** 이름을 입력하면 /api/places로 후보를 찾고, 후보 중 하나와 일치할 때 장소가 선택된다. */
export function PlaceInput({ label, onChange }: Props) {
  const listId = useId();
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);

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
        onChange(places.find((p) => p.name === q) ?? null);
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
    <label className="field">
      <span>{label}</span>
      <input
        list={listId}
        value={text}
        placeholder="예: 신촌역"
        onChange={(e) => {
          setText(e.target.value);
          onChange(null);
        }}
      />
      <datalist id={listId}>
        {suggestions.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>
    </label>
  );
}
