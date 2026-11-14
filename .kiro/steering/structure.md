# 프로젝트 구조

Next.js(App Router, TypeScript) 프로젝트다. 4명이 기능 폴더별로 나눠 동시에 개발하므로, 기능 폴더끼리의 의존을 막는 것이 이 구조의 핵심이다.

## 폴더 구조
```
app/                      페이지와 API 라우트만 둔다. 로직을 쓰지 않는다.
  page.tsx                메인 화면 (입력 폼 + 결과 + 지도)
  api/places/route.ts     GET  /api/places?q=
  api/recommend/route.ts  POST /api/recommend
src/
  features/               기능별 폴더. 각 폴더는 index.ts로 공개 API만 내보낸다.
    places/               장소 검색 (searchPlaces)
    transit/              대중교통 경로 조회 (getTransitRoutes)
    taxi/                 택시 경로와 요금 계산 (estimateTaxi, calculateTaxiFare)
    recommender/          환승역 추천 알고리즘 (recommend)
    map/                  지도 표시 컴포넌트 (MapView)
    result/               추천 결과 화면 컴포넌트 (ResultView)
    search-form/          입력 폼 컴포넌트 (SearchForm)
  shared/                 여러 기능이 같이 쓰는 코드
    types.ts              공통 타입 (Place, Stop, Route, Option, RecommendResponse 등)
    cache.ts              메모리 TTL 캐시 (MemoryCache)
    env.ts                서버 전용 환경변수 읽기 (getEnv, requireEnv)
```

## 규칙
1. **기능 폴더끼리는 서로 import하지 않는다.** 데이터는 `src/shared/types.ts`의 타입으로만 주고받는다. ESLint(`no-restricted-imports`)가 이를 검사한다.
2. 기능을 연결하는 곳은 `app/` 아래 라우트와 페이지뿐이다. 예를 들어 `POST /api/recommend`가 `transit`으로 경로를 받아 `recommender`에 넘기고, `taxi`의 `estimateTaxi`를 `recommender`에 함수로 주입한다.
3. `app/`에서는 각 기능의 `index.ts`로만 import한다(`@/features/taxi`). 기능 폴더 안쪽 파일을 직접 import하지 않는다.
4. 두 기능이 같은 타입이 필요하면 그 타입을 `shared/types.ts`에 추가한다. 타입 변경은 팀 전체에 영향을 주므로 PR에서 알린다.
5. `shared/env.ts`는 `server-only`라 클라이언트 컴포넌트에서 import할 수 없다. API 키는 서버(서비스 함수, API 라우트)에서만 읽는다.
6. 외부 API 응답은 각 기능 폴더 안에서 `shared/types.ts`의 타입으로 변환해 내보낸다. 외부 API의 응답 형식이 폴더 밖으로 새지 않게 한다.
7. 순수 계산(요금, 추천)은 외부 호출과 섞지 않고 단위 테스트(`*.test.ts`, Vitest)를 같은 폴더에 둔다.

## 현재 상태
- `places`, `transit`, `taxi`는 가짜 데이터로 동작한다. 외부 API를 연동할 때 `service.ts` 내부만 바꾸고 함수 시그니처는 유지한다.
- `transit` 가짜 데이터는 어떤 입력에도 신촌 → 강남 2호선 내선순환 경로를 돌려준다.
- `taxi`의 요금 상수는 임시 값이다. `domain-rules.md`에 따라 서울시 고시로 확인해야 한다.
- `map`은 SVG 자리표시다. 카카오 지도를 붙일 때 `MapView`의 props를 유지한 채 교체한다. `KAKAO_JS_KEY`는 브라우저에 노출되는 키이므로 그 시점에 서버 전용 규칙과 별도로 다룬다.

## 명령어
- `npm run dev`: 개발 서버
- `npm test`: Vitest
- `npm run lint`, `npm run typecheck`
- 환경변수: `.env.example`을 `.env.local`로 복사해 채운다. `.env*`는 `.gitignore`에 포함되어 있다(`.env.example` 제외).
