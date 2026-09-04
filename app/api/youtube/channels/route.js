import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiHandler";

// GET: 등록된 YouTube 채널 목록 (공개)
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("youtube_channels")
    .select("id, channel_id, label, created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channels: data });
});

// POST: 관리자가 채널 등록. body { channel_id, label }
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { channel_id, label } = body ?? {};
  if (!channel_id || typeof channel_id !== "string") {
    return NextResponse.json({ error: "channel_id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("youtube_channels")
    .insert({ channel_id: channel_id.trim(), label: label || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channel: data });
});

// DELETE: 관리자가 채널 삭제. body { id }
export const DELETE = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { id } = body ?? {};
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("youtube_channels").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
