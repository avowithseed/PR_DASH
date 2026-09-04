import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyRegionAccess } from "@/lib/verifyRegionAccess";
import { REGIONS } from "@/lib/regions";
import { withErrorHandling } from "@/lib/apiHandler";

// GET /api/committees?region=서울 : 특정 지역의 위원회 게첩 로스터 조회 (공개)
export const GET = withErrorHandling(async (req) => {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("committees")
    .select("id, region, name, installed, installed_date, memo, updated_at")
    .order("name", { ascending: true });
  if (region) query = query.eq("region", region);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ committees: data });
});

// POST: 지역위원회(PIN, x-region-pin 헤더) 또는 관리자(x-admin-password 헤더)가 위원회 게첩 상태를 추가/수정
// body: { region, name, installed, installed_date?, memo?, id? }
// id가 있으면 해당 행을 업데이트, 없으면 (region, name) 기준으로 upsert
export const POST = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => null);
  const { region, name, installed, installed_date, memo, id } = body ?? {};

  if (!REGIONS.includes(region)) {
    return NextResponse.json({ error: "알 수 없는 지역입니다." }, { status: 400 });
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "위원회 이름이 필요합니다." }, { status: 400 });
  }

  const access = await verifyRegionAccess(req, region);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const payload = {
    region,
    name: name.trim(),
    installed: Boolean(installed),
    installed_date: installed ? installed_date || new Date().toISOString().slice(0, 10) : null,
    memo: memo || null,
  };

  const { data, error } = id
    ? await supabase.from("committees").update(payload).eq("id", id).select().single()
    : await supabase
        .from("committees")
        .upsert(payload, { onConflict: "region,name" })
        .select()
        .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ committee: data });
});

// DELETE: body { region, id }, x-region-pin 또는 x-admin-password 헤더 필요
export const DELETE = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => null);
  const { region, id } = body ?? {};
  if (!REGIONS.includes(region) || !id) {
    return NextResponse.json({ error: "region, id가 필요합니다." }, { status: 400 });
  }

  const access = await verifyRegionAccess(req, region);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("committees").delete().eq("id", id).eq("region", region);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
