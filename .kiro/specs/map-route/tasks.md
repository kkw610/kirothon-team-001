# 작업 목록: 경로 지도 (map-route)

데모에 필요한 순서대로 진행한다. 각 태스크는 30분 이내다. 전체 약 3시간.
태스크 4~5(택시 경로 API)와 6~8(지도 화면)은 서로 독립이라 나눠서 진행할 수 있다.

- [ ] 1. 카카오 콘솔과 키 (사람, 10분)
  - 웹 플랫폼에 `http://localhost:3000`과 Vercel 배포 주소 등록.
  - 카카오맵 사용 설정이 필요한지 확인하고 필요하면 켠다.
  - `.env.local`과 Vercel 환경변수에 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가. Vercel은 값을 넣은 뒤 재배포한다.
- [ ] 2. 키 이름 교체와 문서 정리 (15분)
  - `.env.example`: `KAKAO_JS_KEY`를 `NEXT_PUBLIC_KAKAO_JS_KEY`로 교체.
  - `src/shared/env.ts`: `EnvKey`에서 `KAKAO_JS_KEY` 제거.
  - `structure.md` 39행과 규칙 5, `tech.md` 환경 변수 표, `MapView.tsx` 주석 정리.
  - `grep -rn KAKAO_JS_KEY`로 남은 곳이 없는지 확인.
- [ ] 3. 카카오 지도 SDK 공식 문서 확인 (10분)
  - 스크립트 URL, `autoload=false`, `kakao.maps.load`, Polyline, Marker, LatLngBounds 사용법을 확인하고 design.md를 갱신한다.
- [ ] 4. 택시 경로 변환 순수 함수와 타입 (25분)
  - `shared/types.ts`에 `TaxiPath { path, fallback }` 추가.
  - `taxi/path.ts`: `vertexes`를 `Coordinate[]`로 바꾸는 함수, 500개 초과 시 간격 줄이기(첫 점과 마지막 점 보존).
  - `taxi/path.test.ts`.
- [ ] 5. `getTaxiPath`와 API 라우트 (30분)
  - `getTaxiPath`: 카카오모빌리티 길찾기 호출(`summary=false`, 5초 타임아웃), 실패 시 `[from, to]`와 `fallback: true`.
  - `MemoryCache`는 성공 결과만 저장.
  - `taxi/index.ts` export, `app/api/taxi-path/route.ts`(zod 검증, 실패해도 200).
- [ ] 6. `buildMapProps` (25분)
  - `map/buildMapProps.ts`와 테스트: 대상 옵션 선택(`best` 또는 가장 빠른 옵션), 경로를 환승역까지 자르기, 마커 3개 만들기, 옵션이 없으면 `null`.
- [ ] 7. SDK 로더와 타입 선언 (20분)
  - `loadKakaoSdk.ts`(autoload=false, 중복 로드 방지, 실패 시 reject), `kakao.d.ts`.
- [ ] 8. `KakaoMap` 컴포넌트 (30분)
  - 지하철 파랑 선, 택시 주황 선(fallback이면 점선), 마커 3개, `LatLngBounds`로 범위 맞춤, SDK 실패 시 안내 문구.
  - `map/index.ts`에 `KakaoMap`, `buildMapProps` export.
- [ ] 9. 메인 화면 연결 (20분)
  - `app/page.tsx`: 추천 결과가 오면 `buildMapProps` 호출, 대상 옵션의 `stopCoord`로 `/api/taxi-path` 호출, 결과 아래 `KakaoMap` 배치. 택시 경로를 기다리는 동안 지도 자리 로딩 표시.
- [ ] 10. 확인 (10분)
  - `npm run lint`, `npm test`, `npm run build` 통과.
  - 브라우저에서 선 두 개와 마커 3개가 보이는지 확인. 택시 API를 일부러 실패시켜 점선 대체도 확인.
  - `structure.md`에 `/api/taxi-path` 한 줄 추가.

## 범위 밖 (제안만)
- ODsay 노선 그래픽 데이터(loadLane)로 지하철 실제 선로 모양 그리기
- 노선별 색상, 환승역 후보 전체 표시, 마커 정보창
