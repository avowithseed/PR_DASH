import { useState, useMemo } from "react";
import {
  Youtube,
  Share2,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Radio,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------- 시드 기반 난수 (프로토타입 데이터를 매 렌더마다 흔들리지 않게 고정) ----------
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const REGIONS = [
  "서울", "경기", "인천", "대전", "충남", "충북", "전남광주",
  "전북", "대구", "경북", "경남", "부산", "제주", "강원", "울산", "세종",
];

function buildBannerData() {
  return REGIONS.map((name) => {
    const rand = hashSeed(name + "-banner");
    const total = 6 + Math.floor(rand() * 14); // 6~19개 지역위원회
    const committees = Array.from({ length: total }, (_, i) => {
      const installed = rand() > 0.38;
      return {
        name: `${name} 제${i + 1}지역위원회`,
        installed,
        updatedAt: installed
          ? `${8}.${(1 + Math.floor(rand() * 30)).toString().padStart(2, "0")}`
          : null,
      };
    }).sort((a, b) => Number(a.installed) - Number(b.installed)); // 미집행 우선
    const installedCount = committees.filter((c) => c.installed).length;
    return {
      name,
      total,
      installedCount,
      pct: Math.round((installedCount / total) * 100),
      committees,
    };
  });
}

function tierOf(pct) {
  if (pct < 50) return { color: "#B8452C", label: "지연" };
  if (pct < 80) return { color: "#B8752C", label: "진행중" };
  return { color: "#2F7C5C", label: "양호" };
}

const TOP_CONTENT = [
  { title: "정책 발표 현장 브리핑", platform: "youtube", views: "182,400", shares: 3120, engagement: "6.8%" },
  { title: "시민과의 대화 하이라이트", platform: "youtube", views: "97,850", shares: 1890, engagement: "5.1%" },
  { title: "공약 카드뉴스 #3", platform: "sns", views: "64,200", shares: 2410, engagement: "8.4%" },
  { title: "현장 유세 라이브 클립", platform: "sns", views: "51,700", shares: 1330, engagement: "4.9%" },
  { title: "정책 Q&A 숏폼", platform: "youtube", views: "43,900", shares: 980, engagement: "5.6%" },
];

const SPREAD_BY_REGION = REGIONS.map((name) => {
  const rand = hashSeed(name + "-spread");
  return { name, rate: Math.round(30 + rand() * 60) };
});

const SPREAD_CONTENT = [
  { title: "정책 발표 현장 브리핑", speed: "평균 2.1시간", committees: 41 },
  { title: "공약 카드뉴스 #3", speed: "평균 3.4시간", committees: 33 },
  { title: "현장 유세 라이브 클립", speed: "평균 5.0시간", committees: 22 },
];

export default function PRDashboard() {
  const [tab, setTab] = useState("banner");
  const bannerData = useMemo(() => buildBannerData(), []);
  const [selectedRegion, setSelectedRegion] = useState(bannerData[0].name);

  const totalPct = Math.round(
    (bannerData.reduce((s, r) => s + r.installedCount, 0) /
      bannerData.reduce((s, r) => s + r.total, 0)) *
      100
  );

  const region = bannerData.find((r) => r.name === selectedRegion);

  const tabs = [
    { id: "banner", label: "현수막 게첩 현황" },
    { id: "content", label: "콘텐츠 성과" },
    { id: "spread", label: "조직 재확산" },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        button:focus-visible, [tabindex]:focus-visible { outline: 2px solid #223A5E; outline-offset: 2px; }
        @media (max-width: 720px) {
          .banner-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-row { grid-template-columns: repeat(2, 1fr) !important; }
          .split { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>홍보통합 대시보드</div>
          <h1 style={styles.title}>캠페인 현장 운영 현황</h1>
        </div>
        <div style={styles.updatedAt}>
          <Radio size={14} color="#2F7C5C" />
          샘플 데이터 · 8.31 기준
        </div>
      </header>

      <nav style={styles.tabRow}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tabButton,
              color: tab === t.id ? "#1B2430" : "#8A9099",
              borderBottomColor: tab === t.id ? "#223A5E" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "banner" && (
        <section>
          <div style={styles.heroRow}>
            <div style={styles.heroNumber}>{totalPct}%</div>
            <div>
              <div style={styles.heroLabel}>전국 게첩 완료율</div>
              <div style={styles.heroSub}>
                {bannerData.reduce((s, r) => s + r.installedCount, 0)}건 완료 /{" "}
                {bannerData.reduce((s, r) => s + r.total, 0)}건 중
              </div>
            </div>
          </div>

          <div className="split" style={styles.splitLayout}>
            <div className="banner-grid" style={styles.bannerGrid}>
              {bannerData.map((r) => {
                const tier = tierOf(r.pct);
                const active = r.name === selectedRegion;
                return (
                  <button
                    key={r.name}
                    onClick={() => setSelectedRegion(r.name)}
                    style={{
                      ...styles.regionTile,
                      borderColor: active ? "#223A5E" : "#DEE1DB",
                      boxShadow: active ? "0 0 0 1px #223A5E inset" : "none",
                    }}
                  >
                    <div style={styles.regionName}>{r.name}</div>
                    <div style={{ ...styles.regionPct, color: tier.color }}>
                      {r.pct}%
                    </div>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${r.pct}%`,
                          background: tier.color,
                        }}
                      />
                    </div>
                    <div style={styles.regionMeta}>
                      {r.installedCount}/{r.total}개 위원회
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <div style={styles.detailTitle}>{region.name} 지역위원회</div>
                <div style={styles.detailCount}>
                  {region.installedCount}/{region.total} 완료
                </div>
              </div>
              <div style={styles.committeeList}>
                {region.committees.map((c) => (
                  <div
                    key={c.name}
                    style={{
                      ...styles.committeeRow,
                      borderLeftColor: c.installed ? "#2F7C5C" : "#B8452C",
                    }}
                  >
                    <div style={styles.committeeName}>{c.name}</div>
                    {c.installed ? (
                      <span style={styles.badgeDone}>
                        <CheckCircle2 size={13} /> {c.updatedAt} 완료
                      </span>
                    ) : (
                      <span style={styles.badgeTodo}>미집행</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "content" && (
        <section>
          <div className="stat-row" style={styles.statRow}>
            <StatCard icon={<Youtube size={18} />} label="총 게시량" value="47건" sub="이번 주 +6건" />
            <StatCard icon={<Eye size={18} />} label="누적 도달" value="1.24M" sub="전주 대비 +18%" />
            <StatCard icon={<Users size={18} />} label="구독자 증감" value="+2,310" sub="유튜브 기준" />
            <StatCard icon={<MessageCircle size={18} />} label="평균 참여율" value="6.2%" sub="좋아요·댓글·공유" />
          </div>

          <div style={styles.panelBlock}>
            <div style={styles.panelTitle}>주요 콘텐츠 TOP 5</div>
            <div style={styles.contentTable}>
              {TOP_CONTENT.map((c, i) => (
                <div key={c.title} style={styles.contentRow}>
                  <div style={styles.contentRank}>{i + 1}</div>
                  <div style={styles.contentInfo}>
                    <div style={styles.contentPlatform}>
                      {c.platform === "youtube" ? (
                        <Youtube size={14} color="#B8452C" />
                      ) : (
                        <Share2 size={14} color="#223A5E" />
                      )}
                      {c.platform === "youtube" ? "YouTube" : "SNS"}
                    </div>
                    <div style={styles.contentTitle}>{c.title}</div>
                  </div>
                  <div style={styles.contentMetric}>
                    <div style={styles.metricValue}>{c.views}</div>
                    <div style={styles.metricLabel}>조회</div>
                  </div>
                  <div style={styles.contentMetric}>
                    <div style={styles.metricValue}>{c.shares.toLocaleString()}</div>
                    <div style={styles.metricLabel}>공유</div>
                  </div>
                  <div style={styles.contentMetric}>
                    <div style={styles.metricValue}>{c.engagement}</div>
                    <div style={styles.metricLabel}>참여율</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "spread" && (
        <section>
          <div style={styles.panelBlock}>
            <div style={styles.panelTitle}>시도별 재게시율</div>
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
            <div style={styles.panelTitle}>핵심 콘텐츠 확산 현황</div>
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
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily:
      "'Apple SD Gothic Neo', 'Malgun Gothic', -apple-system, sans-serif",
    background: "#F3F4F1",
    color: "#1B2430",
    padding: "28px 24px 48px",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  eyebrow: { fontSize: 13, color: "#5B6472", marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" },
  updatedAt: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    color: "#5B6472",
  },
  tabRow: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #DEE1DB",
    marginBottom: 24,
  },
  tabButton: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 16px",
    fontSize: 14.5,
    fontWeight: 600,
    marginBottom: -1,
  },
  heroRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 20,
    background: "#FFFFFF",
    border: "1px solid #DEE1DB",
    borderRadius: 8,
    padding: "18px 22px",
  },
  heroNumber: { fontSize: 42, fontWeight: 700, color: "#223A5E", lineHeight: 1 },
  heroLabel: { fontSize: 14, fontWeight: 600 },
  heroSub: { fontSize: 12.5, color: "#5B6472", marginTop: 2 },
  splitLayout: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 18,
    alignItems: "start",
  },
  bannerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  regionTile: {
    background: "#FFFFFF",
    border: "1px solid #DEE1DB",
    borderRadius: 8,
    padding: "12px 12px 10px",
    textAlign: "left",
  },
  regionName: { fontSize: 13, fontWeight: 600, color: "#5B6472" },
  regionPct: { fontSize: 22, fontWeight: 700, margin: "2px 0 6px" },
  progressTrack: {
    height: 4,
    background: "#EDEEEA",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  regionMeta: { fontSize: 11, color: "#8A9099", marginTop: 6 },
  detailPanel: {
    background: "#FFFFFF",
    border: "1px solid #DEE1DB",
    borderRadius: 8,
    padding: 16,
    maxHeight: 560,
    overflowY: "auto",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #EDEEEA",
  },
  detailTitle: { fontSize: 15.5, fontWeight: 700 },
  detailCount: { fontSize: 12.5, color: "#5B6472" },
  committeeList: { display: "flex", flexDirection: "column", gap: 6 },
  committeeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeft: "3px solid",
    background: "#FAFAF8",
    padding: "8px 10px",
    borderRadius: 4,
    fontSize: 13,
  },
  committeeName: { color: "#1B2430" },
  badgeDone: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    color: "#2F7C5C",
    fontWeight: 600,
  },
  badgeTodo: {
    fontSize: 11.5,
    color: "#B8452C",
    fontWeight: 700,
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: "#FFFFFF",
    border: "1px solid #DEE1DB",
    borderRadius: 8,
    padding: 16,
  },
  statIcon: { color: "#223A5E", marginBottom: 8 },
  statLabel: { fontSize: 12.5, color: "#5B6472", marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 700 },
  statSub: { fontSize: 11.5, color: "#8A9099", marginTop: 4 },
  panelBlock: {
    background: "#FFFFFF",
    border: "1px solid #DEE1DB",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  panelTitle: { fontSize: 15, fontWeight: 700, marginBottom: 14 },
  contentTable: { display: "flex", flexDirection: "column", gap: 8 },
  contentRow: {
    display: "grid",
    gridTemplateColumns: "24px 2fr 1fr 1fr 1fr",
    alignItems: "center",
    gap: 12,
    padding: "10px 8px",
    borderBottom: "1px solid #F0F1ED",
  },
  contentRank: { fontSize: 14, fontWeight: 700, color: "#8A9099" },
  contentInfo: { display: "flex", flexDirection: "column", gap: 3 },
  contentPlatform: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#5B6472",
    fontWeight: 600,
  },
  contentTitle: { fontSize: 13.5, fontWeight: 600 },
  contentMetric: { textAlign: "right" },
  metricValue: { fontSize: 13.5, fontWeight: 700 },
  metricLabel: { fontSize: 10.5, color: "#8A9099" },
  spreadList: { display: "flex", flexDirection: "column", gap: 4 },
  spreadRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 6px",
    borderBottom: "1px solid #F0F1ED",
  },
  spreadInfo: { flex: 1 },
  spreadMeta: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    color: "#8A9099",
    marginTop: 3,
  },
};
