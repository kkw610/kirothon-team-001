import { TaxiError } from "@/features/taxi";
import { TransitError } from "@/features/transit";
import type { ApiErrorBody } from "@/shared/types";

export interface ApiErrorResult {
  status: number;
  body: ApiErrorBody;
  /** 서버 로그용 상세. 사용자에게는 내려 주지 않는다 */
  logMessage: string;
}

const SOURCE_LABEL = { transit: "지하철 경로", taxi: "택시 경로" } as const;

export const INVALID_REQUEST_MESSAGE = "요청 형식이 올바르지 않습니다.";
const SERVER_ERROR_MESSAGE = "서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.";

export function invalidRequest(detail: string): ApiErrorResult {
  return {
    status: 400,
    body: { error: INVALID_REQUEST_MESSAGE, code: "INVALID_REQUEST" },
    logMessage: detail,
  };
}

/**
 * 추천 흐름에서 던져진 오류를 HTTP 상태와 응답 본문으로 바꾼다.
 * - NO_ROUTE(404): 외부 API는 정상이고 조건에 맞는 경로가 없다. 오류 문장은 그대로 보여 줘도 된다.
 * - UPSTREAM_ERROR(502): 외부 API 호출 자체가 실패했다. 키, 한도 같은 내부 정보가 담길 수 있어 일반 문장으로 바꾼다.
 * - SERVER_ERROR(500): 그 밖의 모든 오류(환경변수 누락, 버그). 상세는 로그에만 남긴다.
 */
export function toApiError(error: unknown): ApiErrorResult {
  const source = error instanceof TransitError ? "transit" : error instanceof TaxiError ? "taxi" : undefined;
  if (source && (error instanceof TransitError || error instanceof TaxiError)) {
    if (error.code === "NO_ROUTE") {
      return {
        status: 404,
        body: { error: error.message, code: "NO_ROUTE", source },
        logMessage: `${source} NO_ROUTE: ${error.message}`,
      };
    }
    return {
      status: 502,
      body: {
        error: `${SOURCE_LABEL[source]} 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
        code: "UPSTREAM_ERROR",
        source,
      },
      logMessage: `${source} UPSTREAM: ${error.message}`,
    };
  }
  return {
    status: 500,
    body: { error: SERVER_ERROR_MESSAGE, code: "SERVER_ERROR" },
    logMessage: error instanceof Error ? `${error.name}: ${error.message}` : "unknown error",
  };
}
