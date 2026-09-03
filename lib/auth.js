import bcrypt from "bcryptjs";

// 관리자 비밀번호는 .env.local의 ADMIN_PASSWORD와 평문 비교합니다.
// (단일 운영자가 로컬에서 쓰는 앱이라는 전제 - 별도 회원가입 없이 환경변수 한 줄로 관리)
export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return typeof password === "string" && password === expected;
}

export async function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin, hash) {
  if (!pin || !hash) return false;
  return bcrypt.compare(pin, hash);
}
