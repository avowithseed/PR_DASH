import { NextResponse } from "next/server";

// API 라우트 핸들러를 감싸서, 예상치 못한 예외(예: 배포 환경에 환경변수가
// 누락되어 getSupabaseAdmin()이 throw하는 경우)가 나도 항상 유효한 JSON을
// 응답하도록 보장합니다. 이게 없으면 서버리스 환경(Vercel)에서 함수가 그냥
// 크래시하면서 빈 응답 바디가 내려가고, 클라이언트의 res.json()이
// "Unexpected end of JSON input"으로 죽는 문제가 생깁니다.
export function withErrorHandling(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // Next.js는 redirect()/notFound()/동적 렌더링 감지 같은 내부 제어 흐름을
      // "digest"가 붙은 특수 에러를 throw하는 방식으로 구현합니다. 이런 에러는
      // 우리가 가로채면 안 되고 그대로 다시 던져서 Next.js가 처리하게 해야 합니다.
      if (typeof err?.digest === "string" && err.digest.startsWith("NEXT_")) {
        throw err;
      }
      if (err?.digest === "DYNAMIC_SERVER_USAGE") {
        throw err;
      }
      console.error("[api error]", err);
      return NextResponse.json(
        { error: err?.message || "서버에서 알 수 없는 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  };
}
