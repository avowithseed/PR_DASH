import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword, hashPin } from "@/lib/auth";
import { REGIONS } from "@/lib/regions";
import { withErrorHandling } from "@/lib/apiHandler";

// POST: 관리자가 특정 지역의 PIN을 설정/재설정 (x-admin-password 헤더 필요)
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { region, pin } = body ?? {};
  if (!REGIONS.includes(region)) {
    return NextResponse.json({ error: "알 수 없는 지역입니다." }, { status: 400 });
  }
  if (typeof pin !== "string" || pin.length < 4) {
    return NextResponse.json({ error: "PIN은 4자 이상 문자열이어야 합니다." }, { status: 400 });
  }

  const pin_hash = await hashPin(pin);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("region_settings")
    .upsert({ region, pin_hash }, { onConflict: "region" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
