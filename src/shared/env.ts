import "server-only";

/**
 * 서버 전용 환경변수 읽기. 클라이언트 번들에서 import하면 빌드가 실패한다.
 * 값이 없을 수 있으므로(가짜 데이터 단계) 필수 여부는 호출하는 쪽이 requireEnv로 정한다.
 */
export type EnvKey = "KAKAO_REST_API_KEY" | "TRANSIT_API_KEY";

export function getEnv(key: EnvKey): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export function requireEnv(key: EnvKey): string {
  const value = getEnv(key);
  if (!value) throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
  return value;
}
