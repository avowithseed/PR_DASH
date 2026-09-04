import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPin } from "@/lib/auth";
import { REGIONS } from "@/lib/regions";
import { withErrorHandling } from "@/lib/apiHandler";

// POST: 지역위원회가 입력 폼에 들어가기 전에 PIN을 확인 (성공하면 이후 요청에서 같은 PIN을 헤더로 재사용)
export const POST = withErrorHandling(async (req) => {
  const body = await req.json().catch(() => null);
  const { region, pin } = body ?? {};
  if (!REGIONS.includes(region)) {
    return NextResponse.json({ error: "알 수 없는 지역입니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("region_settings")
    .select("pin_hash")
    .eq("region", region)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.pin_hash) {
    return NextResponse.json(
      { error: "이 지역은 아직 PIN이 설정되지 않았습니다. 관리자에게 문의하세요." },
      { status: 400 }
    );
  }

  const ok = await verifyPin(pin, data.pin_hash);
  if (!ok) return NextResponse.json({ error: "PIN이 일치하지 않습니다." }, { status: 401 });

  return NextResponse.json({ ok: true });
});
