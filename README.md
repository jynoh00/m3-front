# My Music Moment - Frontend

---

**My Music Moment**는 음악을 좋아하는 사람들이 자신의 음악 취향과 순간을 글로 공유하는 음악 공유 커뮤니티 플랫폼입니다.

이 저장소는 My Music Moment의 **프론트엔드 React 프로젝트**입니다.

별도로 구현된 Spring Boot 백엔드 서버가 제공하는 REST API를 호출하여 서비스를 구성합니다.

---

## 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [주요 기능](#주요-기능)
- [라우팅](#라우팅)
- [인증 방식](#인증-방식)
- [실행 방법](#실행-방법)
- [백엔드 연동](#백엔드-연동)

---

## 기술 스택

- **Language**: JavaScript (JSX)
- **Library/Framework**: React 19, React Router 7
- **빌드 도구**: Vite 8 (`@vitejs/plugin-react`)
- **스타일링**: 페이지별 CSS (`src/styles`), 커스텀 PostCSS 플러그인(`vite.config.js`)으로 `@scope` 규칙을 페이지 단위로 격리
- **Lint/Test**: ESLint 9, Node.js `node:test`
- **런타임 요구사항**: Node.js ≥ 22.13.0

---

## 프로젝트 구조

```
src
├── main.jsx                    # 앱 엔트리 포인트 (BrowserRouter 마운트)
├── App.jsx                     # 라우트 정의, 페이지 전환/인증 만료 처리
├── components/
│   ├── GuestRoute.jsx           # 로그인 상태면 /posts 로 리다이렉트
│   ├── ProtectedRoute.jsx       # 미로그인 시 /login 으로 리다이렉트, AuthProvider 주입
│   ├── UserHeader.jsx           # 로그인 사용자 공통 헤더
│   ├── MusicPostEditor.jsx      # 게시글 작성/수정 공용 폼 (음악 검색 + 스토리 작성)
│   ├── editor/                  # 에디터 하위 섹션 (검색, 스토리 입력, 미리보기)
│   ├── posts/                   # 게시글 카드, 상세 모달, 댓글 아이템
│   └── profile/                 # 회원 탈퇴 모달 등 프로필 관련 컴포넌트
├── context/
│   └── AuthContext.jsx          # 로그인 사용자 정보 컨텍스트
├── lib/
│   ├── api.js                   # fetch 래퍼 (Authorization 헤더, 401 처리, 에러 포맷)
│   ├── auth.js                  # 토큰 저장/삭제, 인증 만료 이벤트
│   ├── posts.js                 # 게시글/댓글 응답 정규화
│   ├── format.js                # 게시글 본문 포맷 유틸
│   └── constants.js             # 공용 상수 (fallback 이미지 등)
├── pages/                       # 라우트에 대응하는 페이지 컴포넌트
└── styles/                      # 페이지별 CSS
```

## 주요 기능

- **인증**: 이메일/비밀번호 로그인, 회원가입, 로그아웃, 인증 만료 시 자동 로그인 페이지 이동
- **게시글(모멘트)**: 목록 조회, 작성, 상세 조회(모달), 수정, 삭제, 좋아요 토글
- **음악 검색**: 제목/아티스트로 외부 음악 API 검색 결과를 조회하여 게시글에 첨부
- **댓글**: 게시글 상세에서 댓글 조회/작성/수정/삭제
- **프로필**: 닉네임/이미지 수정, 비밀번호 변경, 회원 탈퇴
- **라우트 보호**: 비로그인 사용자의 서비스 페이지 접근 차단, 로그인 사용자의 로그인/회원가입 페이지 접근 차단

## 라우팅

| Path | 페이지 | 접근 조건 |
| --- | --- | --- |
| `/` | `/login` 으로 리다이렉트 | - |
| `/login` | `LoginPage` | 비로그인 (`GuestRoute`) |
| `/join` | `JoinPage` | 비로그인 (`GuestRoute`) |
| `/posts` | `PostsPage` | 로그인 필요 (`ProtectedRoute`) |
| `/posts/new` | `CreatePage` | 로그인 필요 |
| `/posts/:postId/edit` | `EditPage` | 로그인 필요 |
| `/me/profile` | `ProfilePage` | 로그인 필요 |
| `/me/password` | `PasswordPage` | 로그인 필요 |
| `*` | `/login` 으로 리다이렉트 | - |

모든 페이지는 `lazy()`로 코드 스플리팅되며, 현재 경로는 `document.body.dataset.page`에 반영되어 페이지별 CSS 스코프에 사용됩니다.

## 인증 방식

- 로그인 성공 시 백엔드에서 발급한 Access/Refresh Token을 `localStorage`(`accessToken`, `refreshToken`)에 저장합니다.
- 이후 모든 API 요청은 `lib/api.js`의 `apiRequest`를 통해 `Authorization: Bearer {accessToken}` 헤더를 자동으로 붙입니다.
- 응답이 `401`이면 저장된 토큰을 지우고 `auth:required` 커스텀 이벤트를 발생시켜 `/login`으로 이동시킵니다.
- `GuestRoute`/`ProtectedRoute`는 각각 `/me/profile` 호출로 로그인 상태를 확인한 뒤 접근을 제어합니다.

## 실행 방법

### 환경 변수

`.env` 파일에 API 서버 주소를 설정할 수 있습니다. 설정하지 않으면 `http://localhost:8080`을 기본값으로 사용합니다.

```
VITE_API_BASE_URL=http://localhost:8080
```

### 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

### 빌드 / 프리뷰

```bash
npm run build
npm run preview
```

### 린트 / 테스트

```bash
npm run lint
npm run test
```

## 백엔드 연동

- 이 프로젝트는 별도로 구현된 Spring Boot 백엔드(My Music Moment Backend)와 연동되는 SPA입니다.
- 기본적으로 `http://localhost:8080`의 REST API를 호출하며, 백엔드 CORS 설정에는 로컬 개발 환경(`http://localhost:5173` 등)이 허용되어 있어야 합니다.
- 백엔드 응답은 `{ "message": string, "data": object }` 공통 포맷을 사용하며, `lib/api.js`와 `lib/posts.js`가 이를 프론트엔드에서 사용하기 쉬운 형태로 정규화합니다.
