import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiHandler";

// GET: SNS 콘텐츠 성과 목록 (공개)
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sns_posts")
    .select("*")
    .order("views", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
});

// POST: 관리자가 SNS 콘텐츠 성과 입력. body { title, url?, views, shares, engagement? }
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { title, url, views, shares, engagement } = body ?? {};
  if (!title) return NextResponse.json({ error: "title이 필요합니다." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sns_posts")
    .insert({
      platform: "sns",
      title,
      url: url || null,
      views: Number(views) || 0,
      shares: Number(shares) || 0,
      engagement: engagement || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
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
  const { error } = await supabase.from("sns_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
