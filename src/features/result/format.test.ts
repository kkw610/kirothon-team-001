import { describe, expect, it } from "vitest";
import { diffMinutes, formatDuration, formatMargin, formatTaxiFare, formatWon } from "./format";

describe("formatDuration", () => {
  it("60분 미만은 분만 표기한다", () => {
    expect(formatDuration(0)).toBe("0분");
    expect(formatDuration(14)).toBe("14분");
    expect(formatDuration(59)).toBe("59분");
  });
  it("60분 이상은 시간과 분으로 표기한다", () => {
    expect(formatDuration(60)).toBe("1시간");
    expect(formatDuration(65)).toBe("1시간 5분");
  });
});

describe("diffMinutes / formatMargin", () => {
  const deadline = "2026-01-01T10:00:00.000Z";
  it("도착이 빠르면 여유", () => {
    const d = diffMinutes(deadline, "2026-01-01T09:56:00.000Z");
    expect(d).toBe(4);
    expect(formatMargin(d)).toBe("4분 여유");
  });
  it("도착이 늦으면 늦음", () => {
    const d = diffMinutes(deadline, "2026-01-01T10:03:00.000Z");
    expect(d).toBe(-3);
    expect(formatMargin(d)).toBe("3분 늦음");
  });
  it("같은 시각이면 딱 맞게 도착", () => {
    expect(formatMargin(diffMinutes(deadline, deadline))).toBe("딱 맞게 도착");
  });
  it("1분 미만 여유는 0으로 본다", () => {
    expect(diffMinutes(deadline, "2026-01-01T09:59:30.000Z")).toBe(0);
  });
});

describe("금액", () => {
  it("천 단위 쉼표와 원", () => {
    expect(formatWon(1550)).toBe("1,550원");
  });
  it("택시 요금에는 약을 붙인다", () => {
    expect(formatTaxiFare(9800)).toBe("약 9,800원");
  });
});
