"use client";

import { useMemo, useState } from "react";
import { styles } from "@/lib/styles";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dateKey(y, m, d) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

// 현수막 게첩 지시일을 표시하는 이번 달 미니 캘린더. directives는 [{date: "YYYY-MM-DD", memo}] 배열.
export default function MiniCalendar({ directives = [] }) {
  const [cursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-based
  const todayKey = dateKey(year, month, cursor.getDate());

  const directiveMap = useMemo(() => {
    const map = new Map();
    for (const d of directives) {
      if (!d?.date) continue;
      const key = d.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(d.memo || "게첩 지시");
      map.set(key, list);
    }
    return map;
  }, [directives]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    return list;
  }, [year, month]);

  return (
    <div style={styles.calendarCard}>
      <div style={styles.calendarHeader}>
        <div style={styles.calendarTitle}>
          {year}년 {month + 1}월
        </div>
        <div style={styles.calendarLegend}>
          <span style={styles.calendarLegendDot} /> 게첩 지시일
        </div>
      </div>

      <div style={styles.calendarWeekRow}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ ...styles.calendarWeekday, color: i === 0 ? "#B8452C" : i === 6 ? "#0D47A1" : "#8A9099" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={styles.calendarGrid}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`blank-${i}`} />;
          const key = dateKey(year, month, d);
          const memos = directiveMap.get(key);
          const isDirective = Boolean(memos);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              title={memos ? memos.join(", ") : undefined}
              style={{
                ...styles.calendarDay,
                ...(isDirective ? styles.calendarDayDirective : null),
                ...(isToday ? styles.calendarDayToday : null),
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
