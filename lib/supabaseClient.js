"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 브라우저에서 쓰는 클라이언트: anon 키만 사용하며, RLS 정책상 조회(select)만 가능합니다.
// 실제 데이터 변경(입력/수정)은 반드시 /api/* 서버 라우트를 통해 service role 키로만 수행됩니다.
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;
