import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiHandler";

// GET: 이 주의 홍보기조 조회 (공개)
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("weekly_theme")
    .select("content, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: data ?? { content: "", updated_at: null } });
});

// POST: 관리자가 이 주의 홍보기조 문구 수정. body { content }
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { content } = body ?? {};
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("weekly_theme")
    .upsert({ id: 1, content: content.trim() }, { onConflict: "id" })
    .select("content, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: data });
});
