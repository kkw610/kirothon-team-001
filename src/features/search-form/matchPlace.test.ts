import { describe, expect, it } from "vitest";
import { matchPlace } from "./matchPlace";

const places = [
  { name: "신촌역 2호선", x: 1, y: 1 },
  { name: "신촌역 경의중앙선", x: 2, y: 2 },
  { name: "다이소 이대역점", x: 3, y: 3 },
];

describe("matchPlace", () => {
  it("이름이 같으면 그 후보", () => {
    expect(matchPlace(places, "신촌역 경의중앙선")?.x).toBe(2);
  });
  it("노선 없이 입력하면 입력으로 시작하는 첫 후보", () => {
    expect(matchPlace(places, "신촌역")?.name).toBe("신촌역 2호선");
  });
  it("앞뒤 공백은 무시한다", () => {
    expect(matchPlace(places, "  신촌역 ")?.name).toBe("신촌역 2호선");
  });
  it("일치하는 후보가 없으면 null", () => {
    expect(matchPlace(places, "강남역")).toBeNull();
  });
  it("중간에 들어간 글자는 일치로 보지 않는다", () => {
    expect(matchPlace(places, "이대역")).toBeNull();
  });
  it("빈 입력은 null", () => {
    expect(matchPlace(places, "  ")).toBeNull();
  });
});
