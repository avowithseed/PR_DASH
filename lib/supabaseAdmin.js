import { createClient } from "@supabase/supabase-js";

// 서버(API 라우트) 전용 클라이언트. service role 키를 사용하므로
// 절대 클라이언트 컴포넌트나 "use client" 파일에서 import하면 안 됩니다.
let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase 서버 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return cached;
}
