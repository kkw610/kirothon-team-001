import { describe, expect, it, vi } from "vitest";

// server-only는 서버 번들 밖(Vitest)에서 import하면 던지므로 비운다.
vi.mock("server-only", () => ({}));

const { TaxiError } = await import("@/features/taxi");
const { TransitError } = await import("@/features/transit");
const { invalidRequest, toApiError } = await import("./errors");

describe("toApiError", () => {
  it("지하철 경로 없음은 404 NO_ROUTE이고 메시지를 그대로 보여 준다", () => {
    const r = toApiError(new TransitError("NO_ROUTE", "지하철 경로를 찾을 수 없습니다."));
    expect(r.status).toBe(404);
    expect(r.body).toEqual({
      error: "지하철 경로를 찾을 수 없습니다.",
      code: "NO_ROUTE",
      source: "transit",
    });
  });

  it("택시 경로 없음도 404 NO_ROUTE", () => {
    const r = toApiError(new TaxiError("NO_ROUTE", "택시 경로를 찾을 수 없습니다."));
    expect(r.status).toBe(404);
    expect(r.body.source).toBe("taxi");
  });

  it("지하철 API 호출 실패는 502이고 내부 메시지를 숨긴다", () => {
    const r = toApiError(new TransitError("UPSTREAM", "TMAP 대중교통 키 인증 실패(HTTP 401)"));
    expect(r.status).toBe(502);
    expect(r.body.code).toBe("UPSTREAM_ERROR");
    expect(r.body.source).toBe("transit");
    expect(r.body.error).not.toContain("TMAP");
    expect(r.body.error).not.toContain("401");
    expect(r.logMessage).toContain("401");
  });

  it("택시 API 호출 실패는 502 taxi", () => {
    const r = toApiError(new TaxiError("UPSTREAM", "카카오모빌리티 API 오류(HTTP 429)"));
    expect(r.status).toBe(502);
    expect(r.body.source).toBe("taxi");
    expect(r.body.error).not.toContain("429");
  });

  it("그 밖의 오류는 500이고 상세를 숨긴다", () => {
    const r = toApiError(new Error("환경변수 TRANSIT_API_KEY가 설정되지 않았습니다."));
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: expect.not.stringContaining("TRANSIT_API_KEY"), code: "SERVER_ERROR" });
    expect(r.logMessage).toContain("TRANSIT_API_KEY");
  });

  it("Error가 아닌 값도 500", () => {
    expect(toApiError("boom").status).toBe(500);
  });
});

describe("invalidRequest", () => {
  it("400 INVALID_REQUEST", () => {
    const r = invalidRequest("origin.x");
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("INVALID_REQUEST");
  });
});
