"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import type { Place } from "@/shared/types";
import styles from "./searchForm.module.css";

interface Props {
  label: string;
  /** 검증 오류 문구. 있으면 버튼에 aria-invalid로 연결된다. */
  error?: string | null;
  onChange: (place: Place | null) => void;
}

/**
 * 역 선택 드롭다운(WAI-ARIA select-only combobox). 글자 검색 없이 목록에서 고른다.
 * 역 목록은 처음 한 번 /api/places에서 전체를 받아 온다.
 */
export function PlaceInput({ label, error, onChange }: Props) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const buttonId = `${baseId}-button`;
  const listId = `${baseId}-list`;
  const errorId = `${baseId}-error`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const [places, setPlaces] = useState<Place[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/places?q=", { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setPlaces(await res.json());
      } catch {
        if (!controller.signal.aborted) setLoadFailed(true);
      }
    })();
    return () => controller.abort();
  }, []);

  // 키보드로 가리킨 항목이 목록 밖으로 나가지 않게 스크롤한다.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function openList() {
    const current = selected ? places.findIndex((p) => p.name === selected.name) : -1;
    setActiveIndex(current >= 0 ? current : 0);
    setOpen(true);
  }

  function choose(place: Place) {
    setSelected(place);
    onChange(place);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = places.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (places[activeIndex]) choose(places[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const describedBy = error ? errorId : undefined;

  return (
    <div className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.combo}>
        <button
          id={buttonId}
          type="button"
          role="combobox"
          className={[styles.input, styles.selectButton].join(" ")}
          aria-labelledby={`${labelId} ${buttonId}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onClick={() => (open ? setOpen(false) : openList())}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        >
          <span className={selected ? styles.selectValue : styles.selectPlaceholder}>
            {selected ? selected.name : "역을 선택하세요"}
          </span>
        </button>
        <span className={[styles.comboCaret, open ? styles.comboCaretOpen : ""].join(" ")} aria-hidden="true" />
        {open && (
          <ul id={listId} role="listbox" aria-labelledby={labelId} className={styles.listbox}>
            {places.length === 0 ? (
              <li className={styles.listEmpty} role="presentation">
                {loadFailed ? "역 목록을 불러오지 못했어요" : "역 목록을 불러오는 중이에요"}
              </li>
            ) : (
              places.map((p, i) => {
                const isSelected = selected?.name === p.name;
                return (
                  <li
                    key={p.name}
                    id={optionId(i)}
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      styles.option,
                      i === activeIndex ? styles.optionActive : "",
                      isSelected ? styles.optionSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    // 버튼의 blur보다 먼저 처리해 목록이 닫히기 전에 선택되게 한다.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(p);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {p.name}
                    {isSelected && (
                      <span className={styles.optionCheck} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
