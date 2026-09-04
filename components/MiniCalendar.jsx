"use client";

import { useMemo } from "react";
import { styles } from "@/lib/styles";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// 현수막 게첩 지시일을 표시하는 2주(이번 주 + 다음 주) 캘린더. directives는 [{date: "YYYY-MM-DD", memo}] 배열.
export default function MiniCalendar({ directives = [] }) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  // 이번 주 일요일부터 14일치(2주)를 보여줍니다.
  const days = useMemo(() => {
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [today]);

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

  const first = days[0];
  const last = days[days.length - 1];
  const rangeLabel = `${first.getMonth() + 1}.${first.getDate()} ~ ${last.getMonth() + 1}.${last.getDate()}`;

  return (
    <div style={styles.calendarCard}>
      <div style={styles.calendarHeader}>
        <div style={styles.calendarTitle}>{rangeLabel} · 2주</div>
        <div style={styles.calendarLegend}>
          <span aria-hidden>💙</span> 게첩 지시일
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
        {days.map((d) => {
          const key = dateKey(d);
          const memos = directiveMap.get(key);
          const isDirective = Boolean(memos);
          const isToday = key === todayKey;
          const isCurrentMonth = d.getMonth() === today.getMonth();
          return (
            <div
              key={key}
              title={memos ? `💙 ${memos.join(", ")}` : undefined}
              style={styles.calendarDay}
            >
              <span
                style={{
                  ...styles.calendarDayBadge,
                  ...(isCurrentMonth ? null : { color: "#B7BFCF" }),
                  ...(isToday ? styles.calendarDayTodayBadge : null),
                  ...(isDirective ? styles.calendarDayDirectiveBadge : null),
                }}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
