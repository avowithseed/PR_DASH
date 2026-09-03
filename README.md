# 홍보통합 대시보드

`pr-dashboard.jsx` 프로토타입을 실제로 동작하는 Next.js 웹앱으로 구현했습니다.

- **현수막 게첩 현황**: 지역위원회가 지역별 PIN으로 로그인해 자기 지역의 위원회별 게첩 상태를 직접 입력/수정합니다 (`/` → 현수막 게첩 현황 탭 → 지역 선택 → "입력").
- **지역별 지역위원회 수**: 게첩 완료율의 분모가 되는 "총 지역위원회 수"는 관리자가 `/admin`에서 지역별로 따로 입력합니다.
- **YouTube 연동**: 관리자가 `/admin`에서 채널 ID를 등록하면 YouTube Data API v3로 구독자 수·조회수·최근 영상 성과를 자동 수집합니다 (15분 캐시, 수동 새로고침 가능).
- **SNS 성과**: YouTube 외 SNS 콘텐츠는 관리자가 `/admin`에서 수동으로 입력합니다.
- **조직 재확산 탭**: 이번 요청 범위 밖이라 샘플 데이터로 남겨뒀습니다. 실데이터를 붙이려면 위원회별 재게시 로그 입력/집계가 추가로 필요합니다.

## 1. Supabase 프로젝트 준비

1. https://supabase.com 에서 무료 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor**를 열고 `supabase/schema.sql` 파일 내용 전체를 붙여넣어 실행합니다. (테이블 생성 + 16개 지역 시드 + RLS 정책까지 한 번에 적용됩니다.)
3. **Project Settings → API**에서 다음 값을 확인해둡니다.
   - `Project URL`
   - `anon public` 키
   - `service_role` 키 (절대 외부에 노출하면 안 됩니다 — 서버에서만 사용)

## 2. YouTube Data API 키 발급

1. https://console.cloud.google.com 에서 프로젝트를 만들고 **YouTube Data API v3**를 사용 설정합니다.
2. **API 및 서비스 → 사용자 인증 정보**에서 API 키를 발급합니다.
3. 통계를 보고 싶은 채널의 **채널 ID**(`UC`로 시작)를 확인해둡니다. (채널 정보 → 고급 설정, 또는 채널 URL에서 확인)

## 3. 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 위에서 발급받은 값을 채웁니다.

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=원하는 관리자 비밀번호
YOUTUBE_API_KEY=...
```

## 4. 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

- 대시보드: `/`
- 관리자 페이지: `/admin` (ADMIN_PASSWORD로 로그인 → 지역별 총 위원회 수 설정, 지역 PIN 발급, YouTube 채널 등록, SNS 성과 입력)

관리자 페이지에서 각 지역의 PIN을 먼저 설정해야, 해당 지역위원회가 대시보드에서 "입력" 버튼으로 게첩 현황을 등록할 수 있습니다.

## 폴더 구조

```
app/
  page.jsx              대시보드 메인 (탭: 게첩 현황 / 콘텐츠 성과 / 재확산)
  admin/page.jsx         관리자 페이지
  api/
    region-settings/     지역별 총 위원회 수 조회/설정
    region-pin/           지역 PIN 설정(관리자) / 확인(지역위원회)
    committees/           위원회별 게첩 현황 조회/입력/삭제 (PIN 필요)
    youtube/               YouTube 채널 통계 조회(캐시)
    youtube/channels/     YouTube 채널 등록/삭제 (관리자)
    sns/                   SNS 콘텐츠 성과 조회/입력/삭제 (관리자)
    admin/verify/          관리자 비밀번호 확인
components/               탭별 UI 컴포넌트
lib/                      Supabase 클라이언트, 인증 헬퍼, 스타일, YouTube API 래퍼
supabase/schema.sql        DB 스키마 (Supabase SQL Editor에서 실행)
```
