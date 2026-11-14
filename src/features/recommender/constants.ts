/** 하차 후 택시를 탈 때까지의 고정 대기 시간(분). 도메인 규칙: 3분 고정. */
export const TAXI_WAIT_BUFFER_MIN = 3;
/**
 * 목적지에서 이 거리(m) 안의 정류장은 택시 후보에서 뺀다.
 * 도착역에서 택시를 탈 이유가 없고, 카카오모빌리티는 출발·도착이 5m 이내면 경로를 주지 않는다(result_code 104).
 */
export const NEAR_DESTINATION_M = 50;
