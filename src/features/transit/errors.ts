export type TransitErrorCode = "NO_ROUTE" | "UPSTREAM";

/** 지하철 경로 조회 실패. code로 원인을 구분한다. */
export class TransitError extends Error {
  constructor(
    public readonly code: TransitErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TransitError";
  }
}
