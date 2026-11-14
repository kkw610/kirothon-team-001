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
- 확정: TMAP 대중교통 API (SK Open API). `POST https://apis.openapi.sk.com/transit/routes`, 헤더 `appKey`.
  - 출발 시각(`searchDttm`, Asia/Seoul `yyyyMMddHHmm`)을 기준으로 경로를 찾는다.
  - ODsay는 출발 시각을 지원하지 않아 제외했다. 카카오모빌리티 대중교통은 제휴 전용이라 제외했다.
  - 결정 근거: `.kiro/specs/subway-taxi-api/design.md`의 D1.
- 수도권 1~9호선(급행 포함)과 도보로만 된 경로를 쓴다. 기본은 경로 1개다(`domain-rules.md` 참고). 대체 경로는 옵션으로 최대 3개까지 받는다.
- 필요한 응답 값: 역 이름, 역 좌표, 구간별 소요 시간과 거리, 노선, 지하철 요금.

### 카카오모빌리티 길찾기 API
- 자동차 길찾기: `GET https://apis-navi.kakaomobility.com/v1/directions`
- 인증: `Authorization: KakaoAK ${KAKAO_REST_API_KEY}` 헤더.
- 각 환승 후보 역에서 목적지까지의 자동차 경로로 거리(m)와 소요 시간(초)을 얻는다.
- 택시 요금은 응답의 요금 값을 쓰지 않고 거리와 시간으로 직접 계산한다.
- 후보 역이 많으므로 호출 수를 제한하고(동시 호출 수 제한, 같은 요청 내 중복 제거) 호출 한도를 넘지 않게 한다.

### 카카오 로컬 장소 검색 API
- 키워드 검색: `GET https://dapi.kakao.com/v2/local/search/keyword.json?query=...&size=10`
- 인증: `Authorization: KakaoAK ${KAKAO_REST_API_KEY}` 헤더. 카카오모빌리티와 같은 REST 키를 쓴다.
- 응답의 `place_name`, `x`(경도), `y`(위도)를 `Place`로 바꿔 입력창 자동완성 후보로 쓴다. 같은 검색어는 10분간 캐시한다.
- 카카오 콘솔에서 카카오맵(로컬) 사용 설정이 꺼져 있으면 403(`disabled OPEN_MAP_AND_LOCAL service`)이 나온다. 앱 설정에서 켠다.

## 환경 변수
| 이름 | 용도 |
|---|---|
| `TRANSIT_API_KEY` | 대중교통 경로 API 키 (TMAP `appKey`) |
| `KAKAO_REST_API_KEY` | 카카오모빌리티 REST API 키 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 지도 JavaScript 키. 브라우저에 노출되며 빌드 시점에 번들에 들어간다. 콘솔에서 사이트 도메인(localhost, 배포 주소)을 등록한다 |

- 키는 `.env.local`에만 두고 커밋하지 않는다. 저장소에는 `.env.example`만 둔다.
- 키와 사용자 입력 주소를 로그에 남기지 않는다.

## 오류 처리
- 외부 API 실패 시 사용자에게 원인(경로 없음, 일시 오류)을 구분해 안내한다. 추측 값으로 추천하지 않는다.
- 외부 호출에는 타임아웃을 둔다.
- `POST /api/recommend`의 오류 응답은 `{ error, code, source? }`(`ApiErrorBody`)다. `INVALID_REQUEST` 400, `NO_ROUTE` 404(조건에 맞는 경로 없음), `UPSTREAM_ERROR` 502(외부 API 호출 실패), `SERVER_ERROR` 500(설정 누락, 버그). `error`만 사용자에게 보여 주고, 외부 API의 상세 오류(키, HTTP 상태)는 서버 로그에만 남긴다.
