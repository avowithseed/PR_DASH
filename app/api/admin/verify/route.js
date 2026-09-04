import { NextResponse } from "next/server";
import { checkAdminPassword } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiHandler";

// POST body { password } : 관리자 로그인 폼에서 비밀번호 확인용
export const POST = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => null);
  const ok = checkAdminPassword(body?.password);
  if (!ok) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  return NextResponse.json({ ok: true });
});
