"use client";

import { styles } from "@/lib/styles";

// "이 주의 홍보기조" 강조 배너. theme은 { content, updated_at } 형태.
export default function WeeklyThemeBanner({ theme }) {
  if (!theme?.content) return null;

  return (
    <div style={styles.weeklyBanner}>
      <span style={styles.weeklyBannerLabel}>이 주의 홍보기조</span>
      <div style={styles.weeklyBannerContent}>{theme.content}</div>
    </div>
  );
}
