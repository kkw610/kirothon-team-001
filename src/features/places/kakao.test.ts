import { describe, expect, it } from "vitest";
import { PlacesError } from "./errors";
import { parseKakaoPlaces } from "./kakao";

describe("parseKakaoPlaces", () => {
  it("place_name, x, y를 Place로 바꾼다(x, y는 문자열)", () => {
    const places = parseKakaoPlaces({
      documents: [{ place_name: "삼성역 2호선", x: "127.063", y: "37.508", address_name: "무시" }],
    });
    expect(places).toEqual([{ name: "삼성역 2호선", x: 127.063, y: 37.508 }]);
  });

  it("결과가 없으면 빈 배열", () => {
    expect(parseKakaoPlaces({ documents: [] })).toEqual([]);
  });

  it("좌표가 숫자가 아닌 항목은 건너뛴다", () => {
    const places = parseKakaoPlaces({
      documents: [
        { place_name: "나쁨", x: "abc", y: "37" },
        { place_name: "좋음", x: "127", y: "37" },
      ],
    });
    expect(places.map((p) => p.name)).toEqual(["좋음"]);
  });

  it("같은 이름은 먼저 나온 것만 남긴다", () => {
    const places = parseKakaoPlaces({
      documents: [
        { place_name: "스타벅스", x: "1", y: "2" },
        { place_name: "스타벅스", x: "3", y: "4" },
      ],
    });
    expect(places).toEqual([{ name: "스타벅스", x: 1, y: 2 }]);
  });

  it("documents가 없으면 PlacesError", () => {
    expect(() => parseKakaoPlaces({ foo: 1 })).toThrow(PlacesError);
  });
});
