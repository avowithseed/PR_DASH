import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword, verifyPin } from "@/lib/auth";

// 지역위원회 PIN 또는 관리자 비밀번호 중 하나로 해당 지역에 대한 쓰기 권한을 확인합니다.
// req 헤더의 x-admin-password 가 맞으면 통과, 아니면 body.pin 을 region_settings.pin_hash와 대조합니다.
export async function verifyRegionAccess(req, region) {
  const adminPassword = req.headers.get("x-admin-password");
  if (checkAdminPassword(adminPassword)) return { ok: true, isAdmin: true };

  const pin = req.headers.get("x-region-pin");
  if (!pin) return { ok: false, error: "PIN이 필요합니다." };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("region_settings")
    .select("pin_hash")
    .eq("region", region)
    .single();

  if (error || !data?.pin_hash) {
    return { ok: false, error: "이 지역은 아직 PIN이 설정되지 않았습니다." };
  }

  const valid = await verifyPin(pin, data.pin_hash);
  if (!valid) return { ok: false, error: "PIN이 일치하지 않습니다." };
  return { ok: true, isAdmin: false };
}
