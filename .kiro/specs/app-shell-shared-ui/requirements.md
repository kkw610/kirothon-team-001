# Requirements Document

## Introduction

목업 5장(입력, 로딩, 결과-추천, 결과-제시간 도착 불가, 오류)을 구현하려면 화면마다 반복되는 요소(헤더, 버튼, 카드, 칩, 마스코트)와 화면 전환 구조가 먼저 있어야 한다. 이 spec은 그 **공통 기반**만 만든다. 이 기반이 커밋되면 입력, 로딩, 결과, 오류 화면을 서로 다른 담당자가 병렬로 작업한다.

이 spec이 하지 않는 것: 입력 폼 디자인, 로딩 화면 본문, 결과 2열 배치와 "경로 요약" 카드, 오류 화면 본문, 지도, 추천 로직, API. 이들은 후속 작업이며 이 spec이 만든 공통 컴포넌트를 가져다 쓴다.

기존 규칙(`structure.md`, `frontend-ui.md`, `design-system.md`)과 충돌하는 부분은 이 spec이 **의도적으로 바꾼다**. 바꾸는 항목은 Requirement 9에 모아 두고, 같은 PR에서 해당 steering 문서도 고친다.

## Glossary

- **Shared_UI**: `src/shared/ui/`에 두는 공통 컴포넌트와 스타일. 모든 기능 폴더와 `app/`이 import할 수 있다.
- **Design_Token**: 색, 글꼴, 모서리, 간격을 담은 CSS 변수(`--primary`, `--ink` 등). `design-system.md`의 표가 값의 기준이다.
- **App_Shell**: `app/page.tsx`가 맡는 화면 전환 구조. 헤더와 현재 단계의 화면을 그린다.
- **Phase**: App_Shell의 화면 단계. `input`, `loading`, `result`, `error` 네 가지다.
- **Header**: 화면 맨 위 흰색 막대. 로고와 서비스 이름, 선택적으로 조건 요약 칩과 "조건 바꾸기" 버튼을 담는다.
- **Condition_Summary**: Header의 칩에 표시하는 한 줄 요약. 예: `홍대입구역 → 삼성역 · 10:00까지 · 09:12 출발`
- **Button**: 주요(primary)와 보조(outline) 두 종류가 있는 버튼 컴포넌트.
- **Card**: 흰 바탕, 1px `--border` 테두리, 둥근 모서리의 컨테이너.
- **Chip**: 알약 모양의 작은 라벨. 조건 요약, "추천", "제시간 도착 불가" 같은 상태 표시에 쓴다.
- **Mascot**: 유령 캐릭터 "환승이". 흰 몸통, 보라색 윤곽선, 검은 눈, 땀방울 두 개, 속도선을 가진 일러스트.
- **Logo_Mark**: 보라색 둥근 사각형 안에 유령이 있는 앱 아이콘. Header 왼쪽에 쓴다.
- **Mascot_Asset**, **Logo_Asset**: 사용자가 제공하는 SVG 파일 두 개(각각 Mascot, Logo_Mark의 원본).
- **Search_Condition**: 사용자가 입력한 출발지, 목적지, 도착 시각, (있으면) 출발 시각. 타입은 `RecommendRequest`다.

## Requirements

### Requirement 1: 공용 디자인 토큰

**User Story:** As a 화면 담당 개발자, I want 색과 글꼴을 한 곳에서 가져다 쓰기를, so that 화면마다 같은 보라색과 제목 글꼴이 나온다.

#### Acceptance Criteria

1. THE App_Shell SHALL `design-system.md`의 색 토큰 표(`--primary`, `--on-primary`, `--primary-text`, `--primary-soft`, `--surface-tint`, `--ink`, `--text-sub`, `--border`, `--ok`, `--late`, `--late-row`, `--subway`, `--taxi`)를 `:root`에 선언해 모든 화면의 CSS에서 `var(--...)`로 참조할 수 있게 한다.
2. THE App_Shell SHALL 목업의 페이지 바탕색(연한 보라)과 Header 바탕색(흰색)에 해당하는 토큰을 추가한다.
3. THE App_Shell SHALL 제목용 글꼴 Jua(굵기 400)를 앱 전체에서 한 번만 불러오고, 모든 화면이 `var(--font-heading)`으로 사용할 수 있게 한다.
4. WHEN `src/features/result/`의 기존 컴포넌트가 `var(--font-heading)`과 기존 `.root` 안의 색 변수를 쓴다, THE App_Shell SHALL 이 컴포넌트의 화면 표시를 바꾸지 않는다(같은 이름의 변수는 같은 값을 갖는다).
5. THE Design_Token SHALL 모서리(카드 16px, 버튼 12px, 칩 알약)와 간격(4, 8, 12, 16, 20, 24px)도 변수로 제공한다.
6. THE App_Shell SHALL Design_Token 선언부 밖에서 hex, rgb, hsl 색 리터럴을 쓰지 않는다. 단, Logo_Asset과 Mascot_Asset SVG 내부의 색은 예외다.

### Requirement 2: 공통 Button

**User Story:** As a 화면 담당 개발자, I want 버튼을 한 컴포넌트로 쓰기를, so that "택시로 갈아탈 역 찾기", "다시 시도", "조건 바꾸기"가 같은 모양과 동작을 갖는다.

#### Acceptance Criteria

1. THE Button SHALL `primary`(보라 배경, 흰 글자)와 `outline`(흰 바탕, 보라 테두리와 글자) 두 종류(`variant`)를 지원한다.
2. THE Button SHALL 높이를 44px 이상으로 하고, 모서리를 12px로 한다.
3. THE Button SHALL `fullWidth` 옵션으로 부모 폭 전체를 채울 수 있다.
4. THE Button SHALL 기본 `type`을 `button`으로 하고, 호출하는 쪽이 `submit`을 지정할 수 있다.
5. WHILE `disabled`가 참이다, THE Button SHALL 클릭을 막고 시각적으로 비활성임을 보인다.
6. THE Button SHALL 키보드 포커스 시 `--primary`와 구분되는 2px 이상의 포커스 표시를 보인다.
7. THE Button SHALL 네이티브 `<button>` 요소의 속성(`onClick`, `aria-*`, `form` 등)을 그대로 전달받는다.
8. THE Button SHALL `app/globals.css`의 요소 선택자 `button { ... }` 규칙의 영향을 받지 않고 자기 스타일로 모든 속성(배경, 패딩, 테두리, 글자 크기)을 지정한다.

### Requirement 3: 공통 Card와 Chip

**User Story:** As a 화면 담당 개발자, I want 흰 카드와 알약 라벨을 공통으로 쓰기를, so that 목업의 모든 카드가 같은 테두리와 모서리를 갖는다.

#### Acceptance Criteria

1. THE Card SHALL 흰 바탕, 1px `--border` 테두리, 16px 모서리를 갖고 그림자를 쓰지 않는다.
2. THE Card SHALL `tone` 옵션으로 기본(흰색), `tint`(`--surface-tint` 바탕, 로딩 자리표시용), `alert`(2px `--late` 테두리, 제시간 도착 불가용)을 지원한다.
3. THE Card SHALL 내부 여백을 `padding` 옵션으로 `md`(16px)와 `lg`(24px) 중에서 고를 수 있다.
4. THE Chip SHALL 알약 모양이며 `tone` 옵션으로 `primary-soft`(연보라 바탕, 조건 요약용), `primary`(보라 바탕, 흰 글자, "추천"용), `late`(연한 빨강 바탕, 빨간 글자, "제시간 도착 불가"용)를 지원한다.
5. THE Card와 Chip SHALL 호출하는 쪽이 `className`을 덧붙일 수 있게 하되, 기본 모양을 깨지 않는다.
6. THE Chip SHALL 색만으로 의미를 전달하지 않고 항상 텍스트 내용을 갖는다.

### Requirement 4: Logo_Mark와 Mascot

**User Story:** As a 화면 담당 개발자, I want 로고와 마스코트를 컴포넌트로 가져다 쓰기를, so that 같은 그림을 화면마다 복사하지 않는다.

#### Acceptance Criteria

1. THE Shared_UI SHALL Logo_Asset을 그대로 그리는 `LogoMark` 컴포넌트를 제공하고, 크기(`size`, px)를 지정할 수 있게 한다.
2. THE Shared_UI SHALL Mascot_Asset을 그대로 그리는 `Mascot` 컴포넌트를 제공하고, 크기(`size`, px)를 지정할 수 있게 한다.
3. THE Mascot SHALL `mood` 속성(`idle`, `happy`, `loading`, `late`, `error`)을 받는다. WHEN 표정별 그림이 아직 없다, THE Mascot SHALL 모든 `mood`에 대해 Mascot_Asset 하나를 그린다.
4. THE Mascot SHALL 장식 요소로 취급해 `aria-hidden="true"`를 갖는다. 화면의 의미는 항상 인접한 텍스트가 전달한다.
5. THE LogoMark SHALL 서비스 이름 텍스트 "환승이"와 함께 쓰일 때 `aria-hidden="true"`를 갖고, 단독으로 쓰일 때는 `alt`에 해당하는 접근 가능한 이름 "환승이"를 갖는다.
6. THE Mascot와 LogoMark SHALL 지정한 `size`에서 가로세로 비율을 유지하며 찌그러지지 않는다.
7. IF 사용자가 SVG 파일을 제공하기 전이다, THEN THE Shared_UI SHALL 같은 컴포넌트 인터페이스를 유지한 임시 그림으로 대체해 다른 화면 작업이 막히지 않게 한다. 실제 파일이 들어오면 컴포넌트를 쓰는 쪽의 코드 변경 없이 교체된다.
8. WHEN `Mascot` 또는 `LogoMark`가 화면에 렌더링된다, THE Shared_UI SHALL 추가 네트워크 요청 없이 첫 화면과 함께 표시되거나, 요청이 필요하면 `next/image` 등으로 레이아웃 이동을 일으키지 않는다.

### Requirement 5: 공통 Header

**User Story:** As a 사용자, I want 모든 화면 위에 같은 헤더가 보이기를, so that 지금 어떤 조건으로 보고 있는지 알고 언제든 조건을 바꿀 수 있다.

#### Acceptance Criteria

1. THE Header SHALL 흰 바탕의 가로 막대로, 왼쪽에 LogoMark와 서비스 이름 "환승이"(제목 글꼴, 보라색)를 보인다.
2. WHILE Phase가 `input`이다, THE Header SHALL 로고와 서비스 이름만 보이고 Condition_Summary 칩과 "조건 바꾸기" 버튼을 보이지 않는다.
3. WHILE Phase가 `loading`, `result`, `error` 중 하나다, THE Header SHALL 로고 오른쪽에 Condition_Summary 칩을, 막대 오른쪽 끝에 `outline` Button "조건 바꾸기"를 보인다.
4. WHEN 사용자가 "조건 바꾸기"를 누른다, THE Header SHALL `onChangeCondition` 콜백을 호출한다. 화면 전환은 호출한 쪽(App_Shell)이 처리한다.
5. THE Header SHALL Condition_Summary를 문자열 prop으로 받는다. Header는 `src/features/`의 어떤 폴더도 import하지 않는다.
6. WHILE 화면 폭이 640px 미만이다, THE Header SHALL Condition_Summary 칩이 한 줄에서 말줄임(`…`)으로 잘리게 하고, "조건 바꾸기" 버튼과 로고가 줄바꿈 없이 보이게 한다.
7. THE Header SHALL `<header>` 요소로 렌더링하고, 로고 영역은 입력 단계로 돌아가는 링크나 버튼이 아닌 단순 표시로 둔다(목업에 동작이 없다).
8. THE Header SHALL 높이를 화면 폭에 관계없이 일정하게 유지하며(목업 기준 약 50px), 내용이 길어져도 Header의 높이가 커지지 않는다.

### Requirement 6: Condition_Summary 문구 생성

**User Story:** As a 사용자, I want 헤더 칩에서 내 검색 조건을 한눈에 보기를, so that 결과가 어떤 조건의 것인지 혼동하지 않는다.

#### Acceptance Criteria

1. THE App_Shell SHALL Search_Condition으로부터 `<출발지> → <목적지> · HH:mm까지 · HH:mm 출발` 형식의 Condition_Summary를 만드는 순수 함수를 제공한다.
2. THE 함수 SHALL 장소 이름이 이미 "역"으로 끝나면 "역"을 다시 붙이지 않고, 끝나지 않으면 붙이지 않고 그대로 쓴다(장소는 역이 아닐 수 있다).
3. THE 함수 SHALL 시각을 24시간제 `HH:mm`, 시간대 Asia/Seoul로 표시한다.
4. IF Search_Condition에 `departureTime`이 없다, THEN THE 함수 SHALL "· HH:mm 출발" 부분을 생략한다.
5. IF 도착 시각이 유효하지 않은 날짜다, THEN THE 함수 SHALL 예외를 던지지 않고 시각 부분을 "-"로 표시한다.
6. THE 함수 SHALL 단위 테스트(Vitest)로 위 1~5를 검증한다.

### Requirement 7: App_Shell 화면 전환

**User Story:** As a 사용자, I want 입력, 로딩, 결과, 오류가 각각 한 화면씩 차례로 나오기를, so that 목업과 같은 흐름으로 쓸 수 있다.

#### Acceptance Criteria

1. THE App_Shell SHALL Phase `input`, `loading`, `result`, `error` 중 정확히 하나만 한 번에 화면 본문에 보인다.
2. THE App_Shell SHALL 모든 Phase에서 Header를 맨 위에 그린다.
3. WHEN 사용자가 입력 단계에서 검색을 제출한다, THE App_Shell SHALL Phase를 `loading`으로 바꾸고 `/api/recommend`를 호출한다.
4. WHEN `/api/recommend`가 성공한다, THE App_Shell SHALL Phase를 `result`로 바꾼다.
5. IF `/api/recommend`가 실패하거나 네트워크 오류가 난다, THEN THE App_Shell SHALL Phase를 `error`로 바꾸고 오류 문구를 보관한다.
6. WHEN 사용자가 `error` Phase에서 "다시 시도"를 누른다, THE App_Shell SHALL 마지막 Search_Condition으로 다시 요청하며 Phase를 `loading`으로 바꾼다.
7. WHEN 사용자가 Header의 "조건 바꾸기"를 누른다, THE App_Shell SHALL Phase를 `input`으로 바꾸고, 사용자가 마지막에 입력한 출발지, 목적지, 도착 시각이 입력 폼에 그대로 남아 있게 한다.
8. WHILE Phase가 `loading`이다, THE App_Shell SHALL 중복 요청을 보내지 않는다. 이전 요청이 끝나기 전에 새 요청이 시작되면 이전 응답은 화면에 반영하지 않는다.
9. THE App_Shell SHALL 각 Phase의 본문을 교체 가능한 슬롯으로 구성해, 입력, 로딩, 결과, 오류 화면 담당자가 `app/page.tsx`를 크게 고치지 않고 자기 컴포넌트만 바꿀 수 있게 한다.
10. THE App_Shell SHALL 이 spec의 범위에서 각 Phase 본문으로 **현재 존재하는 컴포넌트**(`SearchForm`, `ResultSkeleton`, `ResultView`, `ResultError`, `MapView`)를 그대로 배치하고 동작을 유지한다. 각 화면의 목업 구현은 후속 작업이다.
11. THE App_Shell SHALL 서버 컴포넌트가 아닌 클라이언트 컴포넌트(`"use client"`)로 상태를 관리하며, API 호출 경로와 요청 본문은 바꾸지 않는다.

### Requirement 8: 레이아웃 뼈대

**User Story:** As a 화면 담당 개발자, I want 본문 영역의 폭과 여백이 정해져 있기를, so that 내 화면을 만들 때 폭과 바탕색을 신경 쓰지 않는다.

#### Acceptance Criteria

1. THE App_Shell SHALL 페이지 바탕을 목업의 연보라(Requirement 1.2의 토큰)로 채우고, 화면 높이가 짧아도 바탕이 뷰포트 전체를 덮게 한다.
2. THE App_Shell SHALL Header 아래에 본문 컨테이너를 두고, 컨테이너의 최대 폭, 좌우 여백, 위아래 여백을 한 곳에서 정한다.
3. THE 본문 컨테이너 SHALL 모바일(767px 이하)에서 폭 100%에 좌우 여백 16px, 태블릿(768px~1023px)에서 최대 760px, 데스크톱(1024px~)에서 최대 1200px로 한다.
4. THE 본문 컨테이너 SHALL 가로 스크롤을 만들지 않는다.
5. THE App_Shell SHALL 기존 `main` 요소 선택자(`max-width: 640px`)와 `.card` 같은 전역 클래스가 새 Shared_UI 컴포넌트의 모양에 영향을 주지 않게 한다.

### Requirement 9: 기존 규칙과 파일에 대한 변경

**User Story:** As a 팀원, I want 이 spec이 어떤 기존 규칙과 파일을 바꾸는지 미리 알기를, so that 병렬 작업 중 충돌하지 않는다.

#### Acceptance Criteria

1. THE 이 spec SHALL 다음 파일을 수정할 수 있다: `app/globals.css`(Design_Token 추가, 바탕색), `app/layout.tsx`(Jua 변수 적용), `app/page.tsx`, `app/page.module.css`.
2. THE 이 spec SHALL `src/features/result/fonts.ts`에서 Jua를 불러오는 위치를 공용 위치로 옮기고, 기존 `import { jua } from "./fonts"`가 동작하도록 같은 이름을 다시 내보낸다. "프로젝트에서 `next/font/google`을 import하는 유일한 파일" 규칙은 새 위치 파일 하나로 유지한다.
3. THE 이 spec SHALL `src/features/result/result.module.css`와 `src/features/map/map.module.css`의 `.root` 변수 선언부에서 공용 토큰과 같은 값을 중복 선언한 줄이 있어도 **그대로 둔다**(기존 정적 검사 테스트 보호). 정리는 후속 작업으로 미룬다.
4. THE 이 spec SHALL `src/shared/types.ts`, `package.json`, `src/features/{recommender,places,taxi,transit}/`, `app/api/`를 수정하지 않는다.
5. THE 이 spec SHALL ESLint의 `FEATURES` 목록을 바꾸지 않는다. Shared_UI는 `src/shared/ui/`에 두어 기능 폴더 규칙을 지킨다.
6. THE 이 spec SHALL 같은 PR에서 `.kiro/steering/`의 다음 내용을 새 규칙에 맞게 고친다: `frontend-ui.md`(`globals.css` 수정 금지 문구, 한 열 배치 표), `design-system.md`(Jua를 결과 영역 안에서만 불러온다는 문구, "캐릭터 (나중)" 절의 마스코트 설명을 유령으로), `structure.md`(`src/shared/ui/` 추가).
7. THE 이 spec SHALL 기존 테스트(`format.test.ts`, `recommend.test.ts`, `fare.test.ts`와 result spec의 테스트)를 수정하지 않는다.
8. WHEN 이 spec의 작업이 끝난다, THE 팀 SHALL `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`가 모두 통과하는 상태에서 커밋하고, 그 커밋을 병렬 작업의 기준점으로 삼는다.

### Requirement 10: 접근성과 반응형

**User Story:** As a 사용자, I want 키보드와 스크린 리더로도 같은 흐름을 쓰기를, so that 누구나 사용할 수 있다.

#### Acceptance Criteria

1. THE Shared_UI SHALL 모든 상호작용 요소(버튼)의 높이를 44px 이상으로 한다.
2. THE Shared_UI SHALL 흰 바탕 위 글자 대비를 4.5:1 이상으로 하고, `--primary` 바탕 위 `--on-primary` 글자 대비도 4.5:1 이상으로 한다.
3. WHEN Phase가 바뀐다, THE App_Shell SHALL 화면 본문 영역에 `aria-live="polite"` 영역 또는 포커스 이동으로 변경을 보조 기술에 알린다.
4. THE Header SHALL 랜드마크 `<header>`를, 본문 컨테이너는 `<main>`을 사용하고 `<main>`은 페이지에 하나만 둔다.
5. THE Shared_UI SHALL `prefers-reduced-motion: reduce`일 때 자체 애니메이션(있는 경우)을 멈춘다.
6. THE Shared_UI SHALL 320px 폭에서 가로 스크롤 없이 모든 컴포넌트가 보인다.

## Open Questions

요구사항 확정 전에 결정이 필요하다. 답이 없으면 괄호 안의 기본값으로 진행한다.

1. SVG 파일 두 개의 경로(없으면 임시 그림으로 시작, Requirement 4.7).
2. Header 로고 영역을 눌러 입력 화면으로 돌아가게 할지(기본: 동작 없음, 5.7).
3. `app/page.tsx`가 App_Shell을 직접 담을지, `src/shared/ui/` 또는 별도 폴더의 컴포넌트로 뽑을지는 design.md에서 결정한다(기본: `page.tsx`에 상태, 화면은 컴포넌트).
