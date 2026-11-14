import { describe, expect, it } from "vitest";
import { futureDepartureStamp } from "./departure";

const kst = (s: string) => new Date(`${s}+09:00`);

describe("futureDepartureStamp", () => {
  const now = kst("2026-11-14T16:00:00");

  it("5분 이내나 과거면 실시간(null)", () => {
    expect(futureDepartureStamp(kst("2026-11-14T15:50:00"), now)).toBeNull();
    expect(futureDepartureStamp(kst("2026-11-14T16:05:00"), now)).toBeNull();
  });

  it("5분 넘게 뒤면 5분 단위로 올림", () => {
    expect(futureDepartureStamp(kst("2026-11-14T16:05:01"), now)).toBe("202611141610");
    expect(futureDepartureStamp(kst("2026-11-14T16:10:00"), now)).toBe("202611141610");
    expect(futureDepartureStamp(kst("2026-11-14T23:58:00"), now)).toBe("202611150000");
  });
});
