# Implementation Plan: 앱 셸과 공통 UI (app-shell-shared-ui)

## Overview

목업 5장을 구현하기 전의 공통 기반을 만든다. 구현 언어는 TypeScript(React, CSS Modules)다. 작업 하나는 30분 이내를 목표로 한다. 순서는 다음과 같다.

1. 토큰, 글꼴, 전역 CSS
2. 공통 컴포넌트(Button, Card, Chip, LogoMark, Mascot)와 조건 요약 함수
3. Header
4. `app/page.tsx` 앱 셸
5. 후속 병렬 작업을 위한 파일 정리와 steering 문서 수정
6. 전체 확인과 커밋(병렬 작업의 기준점)

제약:
- 수정하지 않는 파일: `src/shared/types.ts`, `package.json`, `eslint.config.mjs`, `app/api/`, `src/features/{recommender,places,taxi,transit}/`, `src/features/search-form/`, `result`와 `map`의 `*.module.css`, 기존 테스트 파일.
- `next/font/google`을 import하는 파일은 `src/shared/ui/fonts.ts` 한 곳이다.
- 색 값은 `app/globals.css`의 `:root` 선언부에만 쓴다. 컴포넌트 CSS는 `var(--...)`만 쓴다. SVG 파일 내부 색은 예외다.
- 설치, git, 빌드 명령은 사람이 직접 실행한다(`workflow.md`). 아래 작업의 "확인" 항목은 사람이 실행한다.
- 렌더링 테스트는 없다(vitest가 `.test.ts`만 포함). 화면 확인은 브라우저에서 한다.

## Tasks

- [x] 1. 토큰, 글꼴, 전역 CSS
  - [x] 1.1 `src/shared/ui/fonts.ts` 생성, `result/fonts.ts`를 re-export로 교체
    - `shared/ui/fonts.ts`: 기존 `result/fonts.ts`의 `Jua` 설정(`weight: "400"`, `subsets: ["latin"]`, `display: "swap"`, `variable: "--font-heading"`, `fallback`)을 그대로 옮긴다.
    - `result/fonts.ts`: `export { jua } from "@/shared/ui/fonts";` 한 줄만 남긴다. `result` 안의 기존 import는 고치지 않는다.
    - _Requirements: 1.3, 9.2_
  - [x] 1.2 `app/globals.css`에 `:root` 토큰 추가, `body` 수정, `main` 규칙 삭제
    - 추가: design.md "전역 CSS 처리"의 색(`--primary`부터 `--page-bg`까지), 모서리(`--radius-*`), 간격(`--space-1`~`--space-6`)
    - 수정: `body`의 `background`를 `var(--page-bg)`, `color`를 `var(--ink)`로
    - 삭제: `main { ... }` 규칙 한 개. 나머지 전역 규칙(`.card`, `.form`, `.field`, `input`, `button`, `button:disabled`, `.error`, `table` 등)은 `SearchForm`과 기존 화면이 쓰므로 **지우지 않는다**.
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 8.5, 9.1_
  - [x] 1.3 `app/layout.tsx`의 `<html>`에 `jua.variable` 적용
    - `import { jua } from "@/shared/ui/fonts"`, `<html lang="ko" className={jua.variable}>`. `metadata`는 바꾸지 않는다.
    - 확인: `npm run dev`로 열어 기존 결과 화면이 이전과 같은지 본다. 한글 제목이 Jua 글꼴인지도 본다. 시스템 글꼴로 보이면 design.md "위험 요소"의 Jua 항목을 따라 `subsets`를 조정한다.
    - _Requirements: 1.3, 1.4, 9.1_

- [x] 2. 공통 컴포넌트
  - [x] 2.1 `src/shared/ui/cx.ts`, `Button.tsx`, `button.module.css`
    - `cx`: falsy 값을 무시하고 클래스 이름을 합친다(`result/cx.ts`와 같은 동작, 복사).
    - `Button`: `variant`(`primary` 기본, `outline`), `fullWidth`, `type` 기본 `"button"`, 나머지 버튼 속성은 `...rest`로 전달, `className` 합치기
    - CSS: `min-height: 44px`, 모서리 `var(--radius-button)`, `padding`, `border`, `background`, `color`, `font`, `cursor`, `opacity`를 `.button`에서 모두 명시. `.button:disabled`(명시도 0,2,0)에서 `opacity`, `cursor`를 직접 지정해 전역 `button:disabled`를 덮는다. `:focus-visible` outline 3px.
    - _Requirements: 2.1~2.8, 10.1_
  - [x] 2.2 `Card.tsx`, `card.module.css`
    - props: `as`(`div`, `section`, `article`), `tone`(`default`, `tint`, `alert`), `padding`(`md`, `lg`)
    - `default`: `--surface` 바탕, 1px `--border`, 모서리 16px. `tint`: `--surface-tint` 바탕. `alert`: 2px `--late` 테두리, 모서리 20px. 그림자 없음.
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [x] 2.3 `Chip.tsx`, `chip.module.css`
    - props: `tone`(`primary-soft` 기본, `primary`, `late`), `children`
    - 알약 모양, `white-space: nowrap`, `min-width: 0`. 톤별 색은 `--primary-soft`/`--primary-text`, `--primary`/`--on-primary`, `--late-soft`/`--late`.
    - _Requirements: 3.4, 3.5, 3.6_
  - [x] 2.4 `LogoMark.tsx`, `Mascot.tsx`, `brand.module.css`
    - `LogoMark`: `size`(기본 32), `decorative`. `<img src="/brand/logo.svg" width height>`. `decorative`가 거짓이면 `alt="BBalligalge"`, 참이면 `alt=""`와 `aria-hidden`.
    - `Mascot`: `size`(기본 64), `mood`(`idle` 기본). `<img src="/brand/mascot.svg">`, `alt=""`, `aria-hidden="true"`, `data-mood`. 표정별 파일이 생길 때를 위해 `MOOD_SRC: Record<MascotMood, string>` 표를 한 곳에 둔다(지금은 모든 값이 같은 파일).
    - `@next/next/no-img-element` 경고 줄에 `eslint-disable-next-line`과 이유 주석(정적 SVG, 최적화 불필요).
    - 확인: 두 이미지가 브라우저에서 비율을 유지하며 보인다.
    - _Requirements: 4.1~4.8_
  - [x] 2.5 `src/shared/ui/index.ts` 생성
    - `Button`, `Card`, `Chip`, `LogoMark`, `Mascot`, `MascotMood`(타입), `Header`(3.2 이후 추가), `buildConditionSummary`(3.1 이후 추가)를 내보낸다. 이 작업에서는 2.1~2.4의 export만 만들고, 이후 작업에서 줄을 추가한다.
    - _Requirements: 4, 5_

- [x] 3. 조건 요약과 Header
  - [x] 3.1 `conditionSummary.ts` 생성
    - `buildConditionSummary(request: RecommendRequest, fallbackDepartureTime?: string): string`
    - 형식: `<출발지> → <목적지> · HH:mm까지` + 출발 시각이 있으면 ` · HH:mm 출발`. 출발 시각은 `request.departureTime ?? fallbackDepartureTime`. 장소 이름은 그대로 쓴다.
    - 시각: `Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })`. `Number.isNaN(date.getTime())`이면 `"-"`. 예외를 던지지 않는다.
    - _Requirements: 6.1~6.5_
  - [ ]* 3.2 `conditionSummary.test.ts` 작성 (속성 1, 2, 3)
    - **Property 1: 결과 문자열의 구조** (출발 시각 있음/없음, 이름 그대로)
    - **Property 2: 시각 형식** (UTC 15:00 → KST `00:00`, 자정 직전 `23:59`, `hourCycle: "h23"`로 `24:00`이 나오지 않음)
    - **Property 3: 유효하지 않은 날짜는 던지지 않는다** (`""`, `"invalid"`, 도착과 출발 모두)
    - `fast-check`가 없으므로 경계값 표 기반 예시 테스트로 작성한다. 각 테스트에 `Feature: app-shell-shared-ui, Property N: ...` 태그 주석을 단다.
    - **Validates: Requirements 6.1~6.6**
  - [x] 3.3 `Header.tsx`, `header.module.css` 생성
    - props: `conditionSummary?: string`, `onChangeCondition?: () => void`
    - 구조: `<header>` 안에 `LogoMark`(decorative)와 "BBalligalge"(제목 글꼴, `--primary-text`). `conditionSummary`가 있으면 `Chip`(말줄임)과 오른쪽 끝 `Button variant="outline"` "조건 바꾸기". 요약이 있고 `onChangeCondition`이 없으면 버튼은 그리지 않는다.
    - CSS: 높이 50px 고정, 흰 바탕(`--surface`), 아래 1px `--border`. 안쪽 컨테이너 폭은 본문과 같은 3구간(모바일 100%+좌우 16px, 768px~ 760px, 1024px~ 1200px). 칩 `flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis`, 로고와 버튼 `flex: none`. 버튼은 높이 44px가 헤더 안에 들어가게 맞춘다.
    - `index.ts`에 `Header`와 `buildConditionSummary`를 추가한다.
    - 확인: 폭 320px에서 칩이 줄어들며 한 줄을 유지한다.
    - _Requirements: 5.1~5.8, 10.1, 10.6_

- [x] 4. 앱 셸
  - [x] 4.1 `app/page.module.css` 재작성
    - `.main`(폭 100%, `margin: 0 auto`, 모바일 좌우 16px, 768px~ 최대 760px, 1024px~ 최대 1200px, `display: grid`, `gap: var(--space-4)`, `min-width: 0`), `.srOnly`(시각적으로 숨김)
    - 기존 `.title`, `.panel`, `.resultArea`, `.mapArea`와 1024px 두 열 규칙은 삭제한다.
    - _Requirements: 8.1~8.5_
  - [x] 4.2 `app/page.tsx` 재작성
    - 상태: `State` 유니온(`input`, `loading`, `result`, `error`, design.md 참고). `useRef`로 요청 번호를 관리해 오래된 응답을 버리고, "조건 바꾸기"는 번호를 올려 진행 중 요청을 무효로 만든다.
    - 렌더: `<Header conditionSummary onChangeCondition />` 다음에 `<main className={styles.main}>`. `main` 안에 `role="status" aria-live="polite"` 안내 영역(상수 문구), 시각적으로 숨긴 `<h1>`, 슬롯 4개(각 슬롯은 서로 다른 줄).
    - 입력 슬롯은 `SearchForm`을 항상 마운트하고 `hidden={phase !== "input"}`으로 감춘다. 나머지 슬롯은 기존 `ResultSkeleton`, `ResultView`+`MapView`, `ResultError`를 그대로 쓴다.
    - 조건 요약은 `buildConditionSummary(request, phase === "result" ? data.options[0]?.departureTime : undefined)`. 입력 단계에서는 `undefined`를 넘겨 Header가 요약을 숨기게 한다.
    - `/api/recommend` 호출 경로, 메서드, 요청 본문은 바꾸지 않는다. 기존 `<h1>택시 환승역 추천</h1>`은 제거한다.
    - 확인: 입력 → 로딩 → 결과, 오류 → 다시 시도, 결과 → 조건 바꾸기(입력값 유지), 로딩 중 조건 바꾸기를 브라우저에서 모두 눌러 본다. 오류는 개발자 도구에서 네트워크를 끊어 만든다.
    - _Requirements: 5.2, 5.3, 5.4, 7.1~7.11, 10.3, 10.4_

- [x] 5. 병렬 작업 준비와 문서
  - [x] 5.1 `ResultSkeleton`과 `ResultError`를 파일로 분리
    - `result/ResultSkeleton.tsx`, `result/ResultError.tsx`를 만들고 `ResultStates.tsx`에는 `EmptyCard`만 남긴다. `result/index.ts`의 export 이름과 props는 그대로 유지한다.
    - 동작을 바꾸지 않는다. 화면이 이전과 같은지 확인한다.
    - 이유: 로딩 화면 작업과 오류 화면 작업이 같은 파일을 고치지 않게 한다.
    - _Requirements: 7.9, 9.4_
  - [x] 5.2 steering 문서 3개 수정
    - `frontend-ui.md`: "`globals.css`는 수정하지 않는다" 문구를 "토큰과 `body` 바탕만 `globals.css`에 둔다"로, 반응형 표를 "단계마다 한 화면, 본문 컨테이너 폭 3구간"으로 고친다.
    - `design-system.md`: "Jua는 결과 영역 안에서만 불러온다" 문구를 "`shared/ui/fonts.ts`에서 한 번 불러온다"로, "캐릭터 (나중)" 절을 "유령 마스코트 `public/brand/mascot.svg`, 로고 `logo.svg`, 컴포넌트 `Mascot`, `LogoMark`"로 고친다.
    - `structure.md`: 폴더 구조에 `src/shared/ui/`(공통 UI)를 추가하고, "기능 폴더끼리는 import하지 않는다" 규칙 아래에 "기능 폴더와 `app/`은 `@/shared/ui`를 import할 수 있다"를 적는다.
    - _Requirements: 9.6_

- [ ] 6. Final checkpoint와 기준점 커밋
  - [~] 6.1 전체 확인 (사람이 직접 실행)
    - `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`가 모두 통과한다.
    - 변경된 파일이 design.md "생성/수정할 파일 목록" 안에 있는지 `git status`로 확인한다. 기존 테스트 파일에 변경이 없는지 확인한다.
    - `grep -rn "<main" app src`가 `app/page.tsx` 한 곳만 보여 준다.
    - 폭 320px, 375px, 768px, 1280px에서 가로 스크롤이 없고, Header가 한 줄을 유지한다. Tab 키로 "조건 바꾸기" 버튼 포커스가 보인다.
    - _Requirements: 9.7, 9.8, 10.1~10.6_
  - [~] 6.2 커밋
    - 병렬 작업의 기준점이 되는 커밋을 만든다. 이 커밋이 있어야 후속 작업(입력, 로딩, 결과, 비교표, 오류 화면)을 서로 다른 세션에서 시작할 수 있다.

## Notes

- `*`가 붙은 하위 작업은 선택이며 건너뛸 수 있다.
- 2.5의 `index.ts`는 2.4까지 만든 export로 먼저 만들고, 3.1과 3.3에서 줄을 추가한다. 이 파일 하나는 순서대로 고친다.
- 후속 화면 작업(입력, 로딩, 결과 2열, 비교표, 오류)은 이 spec에 넣지 않았다. 이 spec의 커밋 뒤에 화면별로 작은 spec이나 Vibe로 진행한다. 목업은 `.kiro/specs/result-ui-design/screens/`에 있다.
- 마스코트 표정별 그림, `result`와 `map`의 중복 토큰 정리, 쓰지 않는 전역 CSS 규칙 삭제, 카카오 지도는 범위 밖이다.

## 동시 진행 가이드 (1인, 세션 최대 3개)

혼자 병렬로 진행하므로 동시에 여는 세션을 3개 이하로 잡았다. 같은 파일을 두 세션이 건드리지 않게 줄을 나눴다.

| 줄 | 세션 | 작업 순서 | 건드리는 파일 |
|---|---|---|---|
| X | 토큰과 셸 | 1.1 → 1.2 → 1.3 → (Y 줄의 3.3이 끝나면) 4.1 → 4.2 | `shared/ui/fonts.ts`, `result/fonts.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/page.module.css` |
| Y | 컴포넌트 | 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 3.3 | `shared/ui/` 안의 컴포넌트와 CSS, `index.ts` |
| Z | 함수와 정리 | 3.1 → 3.2 → 5.1 → 5.2 | `shared/ui/conditionSummary*`, `result/` 분리, `.kiro/steering/` |

- X와 Y는 3.3(Header)이 끝날 때까지 서로 기다릴 일이 없다. X의 4.2는 Y의 3.3과 Z의 3.1이 끝나야 시작한다.
- Z의 3.1은 `index.ts`에 줄을 추가하므로 Y의 2.5가 끝난 뒤에 한다. 먼저 끝나면 `index.ts` 수정은 Y에 맡기고 Z는 `conditionSummary.ts`만 만든다.
- 5.1의 `ResultStates.tsx` 분리는 X의 4.2가 `result` 컴포넌트를 import만 하므로 병행해도 안전하다. 단 4.2에서 import 경로를 `@/features/result`(index)로만 쓰는 것을 지킨다.
- 세션이 3개가 부담스러우면 X를 먼저 1.1~1.3만 하고, Y와 합쳐 두 줄로 진행해도 된다.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.4", "3.2"] },
    { "id": 2, "tasks": ["1.3", "2.5", "5.1", "5.2"] },
    { "id": 3, "tasks": ["3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2"] }
  ]
}
```
