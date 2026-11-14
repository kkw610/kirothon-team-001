export type TaxiErrorCode = "NO_ROUTE" | "UPSTREAM";

/** 택시 경로 조회 실패. code로 원인을 구분한다. */
export class TaxiError extends Error {
  constructor(
    public readonly code: TaxiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TaxiError";
  }
}
