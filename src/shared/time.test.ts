import { describe, expect, it } from "vitest";
import { toKstStamp } from "./time";

describe("toKstStamp", () => {
  it("Asia/Seoul 기준 yyyyMMddHHmm", () => {
    expect(toKstStamp(new Date("2026-11-14T09:05:00+09:00"))).toBe("202611140905");
    // UTC 15:30은 KST 다음 날 00:30
    expect(toKstStamp(new Date("2026-11-14T15:30:00Z"))).toBe("202611150030");
  });
});
