/** 장소 검색 외부 API(카카오 로컬) 호출 실패. 검색 결과가 없는 것은 오류가 아니라 빈 배열이다. */
export class PlacesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlacesError";
  }
}
