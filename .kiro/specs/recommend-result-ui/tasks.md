# 작업 목록: 추천 결과 화면 (recommend-result-ui)

각 작업은 30분 이내. 먼저 동작하는 틀, 그다음 디자인.

- [ ] 1. `format.ts`에 `formatDuration`, `diffMinutes`, `formatMargin`, `formatTaxiFare` 추가, `format.test.ts` 작성
- [ ] 2. `RecommendationCard` 작성 (추천 문장, 도착 시각·여유, 시간·비용 내역, 택시 요금 안내 문구)
- [ ] 3. `ComparisonTable` 작성 (추천 행 강조, 지각 행 회색 + "N분 늦음")
- [ ] 4. `ResultStates` 작성 (`ResultSkeleton`, `ResultError`)
- [ ] 5. `ResultView` 재작성 (추천 있음 / 제시간 도착 불가 / 후보 없음 분기), `index.ts` 갱신
- [ ] 6. `MapView`에 출발지 마커와 `aria-label` 보강
- [ ] 7. `app/page.tsx`에서 상태 분기(idle, loading, error, success), `arrivalDeadline` 전달, 재시도 연결
- [ ] 8. `result.module.css`로 디자인 적용 (`frontend-ui.md`의 색상, 44px 터치 영역)
- [ ] 9. `npm run build`, `lint`, `typecheck`, `test` 통과 확인
