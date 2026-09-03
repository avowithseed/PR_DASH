// 16개 지역 마스터 목록. Supabase의 region_settings 테이블 시드와 반드시 일치해야 합니다.
export const REGIONS = [
  "서울", "경기", "인천", "대전", "충남", "충북", "전남광주",
  "전북", "대구", "경북", "경남", "부산", "제주", "강원", "울산", "세종",
];

export function tierOf(pct) {
  if (pct <= 50) return { color: "#FF9100", label: "지연" };
  if (pct <= 80) return { color: "#2196F3", label: "진행중" };
  return { color: "#0D47A1", label: "양호" };
}
