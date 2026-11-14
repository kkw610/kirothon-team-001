# 작업 목록: 지하철·택시 외부 API 연동

각 작업은 30분 이내 단위다. 사람이 하는 작업은 `[사람]`으로 표시한다.

## 1차 (ODsay + 카카오) — 완료
- [x] 1. [사람] 카카오 REST API 키 발급, `.env.local` 작성 (R3.1)
- [x] 2. 택시 요금: 동시병산, 심야 할증, `boardingAt` 인자 (R2.4~R2.6)
- [x] 3. `taxi/limiter.ts`와 단위 테스트 (R2.3)
- [x] 4. `taxi/kakao.ts`, `taxi/errors.ts`, 단위 테스트 (R2.1, R2.2, R3.4, R3.5)
- [x] 5. `taxi/service.ts` 카카오 호출, 타임아웃, 캐시 (R2.1~R2.3, R3.2)
- [x] 6. 택시 탑승 시각 기준 교통 예측(`taxi/departure.ts`) (R2.7)
- [x] 7. 인계 문서 `handoff.md` 작성
- [x] 8. 실제 키로 카카오 호출 확인

## 2차 (TMAP 교체, 출발 시각·대체 경로·1~9호선) — 진행 중
- [x] 9-1. 출발 시각 지원 API 조사, D1~D3 결정 기록 (`design.md`)
- [x] 9-2. 요구사항 개정 2 (R1.1, R1.10~R1.13)
- [x] 9-3. `shared/time.ts`(`toKstStamp`)로 이동, taxi가 사용
- [x] 9-4. `transit/build-route.ts`(역별 시간·거리·요금)와 단위 테스트 (R1.3~R1.5, R1.8, R1.9)
- [x] 9-5. `transit/tmap.ts`(파싱, 경로 필터, 1~9호선)와 단위 테스트 (R1.2, R1.6, R1.12, R1.13)
- [x] 9-6. `transit/service.ts` TMAP 호출, `searchDttm`, 캐시 (R1.1, R1.7, R1.10, R3.2)
- [x] 9-7. ODsay 코드 삭제, `shared/types.ts` 필드 추가, `tech.md` 갱신
- [x] 9-8. `npm run lint`, `typecheck`, `test`, `build` 통과
- [x] 9-9. `handoff.md` 개정
- [x] 9-10. [사람] TMAP 대중교통 앱 키 발급, `.env.local`의 `TRANSIT_API_KEY` 교체
- [x] 9-11. 실제 키로 응답 저장, 파서 확정(`passStopList.stations` 보정, fixture 테스트)
- [x] 9-12. 같은 구간을 16:01과 01:30에 호출해 `searchDttm` 반영 범위 확인 → 운행 여부(`service`)만 반영. 미운행 경로 제외 구현
- [x] 9-12-1. 실제 키로 전체 흐름 확인(강남역 → 서울역: TMAP → recommend → 카카오). TMAP 3건 사용
- [ ] 9-12-2. [사람·팀] 대체 경로·시간표 대기 시간 필요 여부 결정(design.md D1 실측 결과 참고)
- [ ] 9-13. [사람] `npm run dev`로 `http://localhost:3000` 화면 확인, 시연 영상 촬영
- [ ] 9-14. [사람] 공통 파일 변경 요청(design.md 1, 2, 6, 7, 8)을 담당자에게 전달
