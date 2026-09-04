import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiHandler";

// GET /api/directives?month=YYYY-MM : 본부 현수막 게첩 지시일 목록 (공개, month로 필터 가능)
export const GET = withErrorHandling(async (req) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const supabase = getSupabaseAdmin();
  let query = supabase.from("directives").select("id, date, memo, created_at").order("date", { ascending: false });

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ directives: data });
});

// POST: 관리자가 게첩 지시일 추가. body { date: "YYYY-MM-DD", memo? }
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { date, memo } = body ?? {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date는 YYYY-MM-DD 형식이어야 합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("directives")
    .insert({ date, memo: memo || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ directive: data });
});

// DELETE: 관리자가 삭제. body { id }
export const DELETE = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { id } = body ?? {};
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("directives").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
