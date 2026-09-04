"use client";

import { TrendingUp, Clock, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { styles } from "@/lib/styles";
import { SPREAD_BY_REGION, SPREAD_CONTENT } from "@/lib/sampleSpread";

// 컨텐츠 전파현황 탭: 아직 실데이터 연동 요청 범위 밖이라 샘플 데이터로 표시합니다.
export default function SpreadTab() {
  return (
    <section>
      <div style={{ ...styles.errorBox, background: "#FFF7E6", borderColor: "#E9CE9B", color: "#7A5B12" }}>
        이 탭은 샘플 데이터입니다. 실제 재확산 데이터를 연동하려면 위원회별 재게시 로그를 남기는 별도 입력/집계가 필요합니다.
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>시도별 재게시율 (샘플)</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={SPREAD_BY_REGION} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B6472" }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, "재게시율"]} />
              <Bar dataKey="rate" fill="#223A5E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>핵심 콘텐츠 확산 현황 (샘플)</div>
        <div style={styles.spreadList}>
          {SPREAD_CONTENT.map((c) => (
            <div key={c.title} style={styles.spreadRow}>
              <TrendingUp size={16} color="#2F7C5C" />
              <div style={styles.spreadInfo}>
                <div style={styles.contentTitle}>{c.title}</div>
                <div style={styles.spreadMeta}>
                  <Clock size={12} /> {c.speed} · {c.committees}개 위원회 재게시
                </div>
              </div>
              <ChevronRight size={16} color="#8A9099" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
