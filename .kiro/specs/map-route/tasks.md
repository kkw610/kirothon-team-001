# 작업 목록: 경로 지도 (map-route)

데모에 필요한 순서대로 진행한다. 각 태스크는 30분 이내다. 전체 약 3시간 + 노선 색상 약 1시간.
태스크 4~5(택시 경로 API)와 6~8(지도 화면)은 서로 독립이라 나눠서 진행할 수 있다.

- [ ] 1. 카카오 콘솔과 키 (사람, 10분)
  - 콘솔 [앱] > [앱 설정] > [앱] > [플랫폼 키]에서 JavaScript 키를 열고 JavaScript SDK 도메인에 `http://localhost:3000`과 Vercel 배포 주소 등록.
  - 카카오맵 사용 설정이 필요한지 확인하고 필요하면 켠다.
  - `.env.local`과 Vercel 환경변수에 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가. Vercel은 값을 넣은 뒤 재배포한다.
- [x] 2. 키 이름 교체와 문서 정리 (15분)
  - `.env.example`: `KAKAO_JS_KEY`를 `NEXT_PUBLIC_KAKAO_JS_KEY`로 교체.
  - `src/shared/env.ts`: `EnvKey`에서 `KAKAO_JS_KEY` 제거.
  - `structure.md` 39행과 규칙 5, `tech.md` 환경 변수 표, `MapView.tsx` 주석 정리.
  - `grep -rn KAKAO_JS_KEY`로 남은 곳이 없는지 확인.
- [x] 3. 카카오 지도 SDK 공식 문서 확인 (10분)
  - (확인함: `https://dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false`, `kakao.maps.load`, Polyline, CustomOverlay, `setBounds`, 도메인 등록 위치. 카카오맵 사용 설정 여부는 콘솔에서 확인 필요)
  - 스크립트 URL, `autoload=false`, `kakao.maps.load`, Polyline, Marker, LatLngBounds 사용법을 확인하고 design.md를 갱신한다.
- [x] 4. 택시 경로 변환 순수 함수와 타입 (25분)
  - `shared/types.ts`에 `TaxiPath { path, fallback }` 추가.
  - `taxi/path.ts`: `vertexes`를 `Coordinate[]`로 바꾸는 함수, 500개 초과 시 간격 줄이기(첫 점과 마지막 점 보존).
  - `taxi/path.test.ts`.
- [x] 5. `getTaxiPath`와 API 라우트 (30분)
  - `getTaxiPath`: 카카오모빌리티 길찾기 호출(`summary=false`, 5초 타임아웃), 실패 시 `[from, to]`와 `fallback: true`.
  - `MemoryCache`는 성공 결과만 저장.
  - `taxi/index.ts` export, `app/api/taxi-path/route.ts`(zod 검증, 실패해도 200).
- [x] 6. `buildMapProps` (25분)
  - `map/buildMapProps.ts`와 테스트: 대상 옵션 선택(`best` 또는 가장 빠른 옵션), 경로를 환승역까지 자르기, 마커 3개 만들기, 옵션이 없으면 `null`.
- [x] 7. SDK 로더와 타입 선언 (20분)
  - `loadKakaoSdk.ts`(autoload=false, 중복 로드 방지, 실패 시 reject), `kakao.d.ts`.
- [x] 8. `KakaoMap` 컴포넌트 (30분)
  - 지하철 파랑 선, 택시 주황 선(fallback이면 점선), 마커 3개, `LatLngBounds`로 범위 맞춤, SDK 실패 시 안내 문구.
  - `map/index.ts`에 `KakaoMap`, `buildMapProps` export.
- [x] 9. 메인 화면 연결 (20분)
  - `map/RouteMap.tsx`: `buildMapProps` 호출, 대상 옵션의 `stopCoord`로 `/api/taxi-path` 호출, 택시 경로를 기다리는 동안 지도 자리 로딩 표시.
  - `app/page.tsx`: `ResultView`의 `aside` 자리표시를 `RouteMap`으로 교체.
- [ ] 10. 확인 (10분) — lint, test, build, `/api/taxi-path` 실제 호출은 확인함. 브라우저 확인과 직선 대체 확인이 남음
  - `npm run lint`, `npm test`, `npm run build` 통과.
  - 브라우저에서 선 두 개와 마커 3개가 보이는지 확인. 택시 API를 일부러 실패시켜 점선 대체도 확인.
  - `structure.md`에 `/api/taxi-path` 한 줄 추가.

## 2단계: 노선 색상
- [ ] 11. 노선 색 매핑 (15분)
  - `map/lineColors.ts`: `lineColor(line)`. "수도권2호선", "수도권 9호선(급행)", "9호선", 없음, 해석 불가 값을 테스트한다.
- [ ] 12. 노선별 구간 나누기 (25분)
  - `buildMapProps`: `subwayPath`를 `subwaySegments`와 `legend`로 바꾼다. `line`이 바뀌는 지점에서 구간을 나누고 환승역을 두 구간이 공유한다. 테스트: 환승 1회, `line` 없음, 같은 노선 연속, 환승 후 첫 구간 색.
- [ ] 13. 지도에 노선 색과 범례 (25분)
  - `KakaoMap`: 구간마다 Polyline을 색별로 그리고 범례를 표시한다. 택시 선 색 또는 스타일을 3호선과 구분되게 조정한다.
  - 브라우저에서 환승 경로(예: 2호선에서 다른 호선으로 환승)로 색이 바뀌는지 확인한다.

## 범위 밖 (제안만)
- 대중교통 API의 노선 그래픽 데이터로 지하철 실제 선로 모양 그리기
- 환승역 후보 전체 표시, 마커 정보창
