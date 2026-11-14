# 기술 스택

> 아래 스택과 대중교통 API 선택은 초기 가정이다. 변경하면 이 문서를 함께 고친다.

## 스택
- 언어: TypeScript (strict)
- 프레임워크: Next.js (App Router). 화면과 API Route를 한 프로젝트에서 운영한다.
- 테스트: Vitest. 비용 계산과 후보 평가 로직은 단위 테스트를 반드시 둔다.
- 패키지 매니저: npm

## 구조 원칙
- 외부 API 호출은 서버(API Route)에서만 한다. 브라우저에 API 키를 노출하지 않는다.
- 폴더 구조와 기능 폴더 간 규칙은 `structure.md`를 따른다.
- 대중교통 API 클라이언트는 `src/features/transit`, 카카오모빌리티 API 클라이언트는 `src/features/taxi`에 둔다.
- 순수 계산은 외부 호출과 섞지 않는다. 택시 요금은 `src/features/taxi/fare.ts`, 후보 평가와 추천은 `src/features/recommender`에 둔다.

## 외부 API

### 대중교통 경로 API
- 후보: ODsay 대중교통 길찾기 API (가정). 서울 지하철 구간의 역 목록, 역별 좌표, 역까지 누적 소요 시간을 얻는 데 쓴다.
- 요청 시 지하철 단일 경로만 사용한다(`domain-rules.md` 참고).
- 필요한 응답 값: 역 이름, 역 좌표, 구간별 소요 시간, 지하철 요금.

### 카카오모빌리티 길찾기 API
- 자동차 길찾기: `GET https://apis-navi.kakaomobility.com/v1/directions`
- 인증: `Authorization: KakaoAK ${KAKAO_REST_API_KEY}` 헤더.
- 각 환승 후보 역에서 목적지까지의 자동차 경로로 거리(m)와 소요 시간(초)을 얻는다.
- 택시 요금은 응답의 요금 값을 쓰지 않고 거리와 시간으로 직접 계산한다.
- 후보 역이 많으므로 호출 수를 제한하고(동시 호출 수 제한, 같은 요청 내 중복 제거) 호출 한도를 넘지 않게 한다.

## 환경 변수
| 이름 | 용도 |
|---|---|
| `TRANSIT_API_KEY` | 대중교통 경로 API 키 |
| `KAKAO_REST_API_KEY` | 카카오모빌리티 REST API 키 |

- 키는 `.env.local`에만 두고 커밋하지 않는다. 저장소에는 `.env.example`만 둔다.
- 키와 사용자 입력 주소를 로그에 남기지 않는다.

## 오류 처리
- 외부 API 실패 시 사용자에게 원인(경로 없음, 일시 오류)을 구분해 안내한다. 추측 값으로 추천하지 않는다.
- 외부 호출에는 타임아웃을 둔다.
