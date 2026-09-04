"use client";

// 숫자 옆에 붙는 작은 증감 인디케이터. delta가 없으면(과거 데이터가 아직 없으면) 중립 표시.
export default function TrendIndicator({ delta, sinceDate }) {
  if (delta === null || delta === undefined) {
    return (
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A9099" }} title="비교할 이전 데이터가 아직 없습니다">
        – 신규
      </span>
    );
  }
  if (delta === 0) {
    return (
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A9099" }} title={sinceDate ? `${sinceDate} 대비 변동 없음` : undefined}>
        – 0%p
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 11.5,
        fontWeight: 700,
        color: up ? "#0D47A1" : "#5B6472",
      }}
      title={sinceDate ? `${sinceDate} 대비` : undefined}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}%p
    </span>
  );
}
