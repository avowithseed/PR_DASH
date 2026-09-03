"use client";

import { Youtube, Share2, Eye, Users, MessageCircle, RefreshCw } from "lucide-react";
import { styles } from "@/lib/styles";
import StatCard from "./StatCard";

function fmt(n) {
  if (n == null) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ContentTab({ youtube, sns, loading, error, onRefreshYoutube, refreshing }) {
  if (loading) return <div style={styles.emptyState}>불러오는 중...</div>;
  if (error) return <div style={styles.errorBox}>{error}</div>;

  const totals = youtube?.totals ?? { subscriberCount: 0, viewCount: 0, videoCount: 0 };
  const videos = youtube?.videos ?? [];
  const channels = youtube?.channels ?? [];
  const snsPosts = sns ?? [];

  const avgEngagement = (() => {
    if (videos.length === 0) return null;
    const rates = videos
      .filter((v) => v.views > 0)
      .map((v) => (v.likes + v.comments) / v.views);
    if (rates.length === 0) return null;
    return ((rates.reduce((a, b) => a + b, 0) / rates.length) * 100).toFixed(1) + "%";
  })();

  const merged = [
    ...videos.map((v) => ({
      title: v.title,
      platform: "youtube",
      views: v.views,
      shares: null,
      engagement: v.views ? (((v.likes + v.comments) / v.views) * 100).toFixed(1) + "%" : "-",
    })),
    ...snsPosts.map((p) => ({
      title: p.title,
      platform: "sns",
      views: p.views,
      shares: p.shares,
      engagement: p.engagement || "-",
    })),
  ]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <section>
      {channels.length === 0 && (
        <div style={styles.errorBox}>
          등록된 YouTube 채널이 없습니다. <code>/admin</code> 페이지에서 채널을 등록하세요.
        </div>
      )}
      {(youtube?.errors ?? []).length > 0 && (
        <div style={styles.errorBox}>
          일부 채널의 YouTube 데이터를 불러오지 못했습니다: {youtube.errors.map((e) => e.label || e.channel_id).join(", ")}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button style={styles.btnGhost} onClick={onRefreshYoutube} disabled={refreshing}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={13} className={refreshing ? "spin" : undefined} />
            {refreshing ? "새로고침 중..." : "YouTube 데이터 새로고침"}
          </span>
        </button>
      </div>

      <div className="stat-row" style={styles.statRow}>
        <StatCard icon={<Youtube size={18} />} label="최근 업로드" value={`${videos.length}건`} sub={`등록 채널 ${channels.length}개`} />
        <StatCard icon={<Eye size={18} />} label="채널 누적 조회수" value={fmt(totals.viewCount)} sub="YouTube API 실시간" />
        <StatCard icon={<Users size={18} />} label="구독자 수" value={fmt(totals.subscriberCount)} sub="등록 채널 합산" />
        <StatCard
          icon={<MessageCircle size={18} />}
          label="평균 참여율"
          value={avgEngagement ?? "-"}
          sub="(좋아요+댓글)/조회수"
        />
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>주요 콘텐츠 TOP 5</div>
        <div style={styles.contentTable}>
          {merged.length === 0 && <div style={styles.emptyState}>표시할 콘텐츠가 없습니다.</div>}
          {merged.map((c, i) => (
            <div key={`${c.platform}-${c.title}-${i}`} style={styles.contentRow}>
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
                <div style={styles.metricValue}>{fmt(c.views)}</div>
                <div style={styles.metricLabel}>조회</div>
              </div>
              <div style={styles.contentMetric}>
                <div style={styles.metricValue}>{c.shares != null ? c.shares.toLocaleString() : "-"}</div>
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

      <div style={styles.panelBlock}>
        <div style={styles.panelHeadRow}>
          <div style={styles.panelTitle}>등록된 YouTube 채널</div>
        </div>
        <div style={styles.contentTable}>
          {channels.map((ch) => (
            <div key={ch.channelId} style={{ ...styles.contentRow, gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
              <div style={styles.contentInfo}>
                <div style={styles.contentTitle}>{ch.label || ch.title || ch.channelId}</div>
                <div style={{ fontSize: 11, color: "#8A9099" }}>
                  {ch.stale ? "⚠ 최신 데이터 조회 실패, 캐시 표시" : ch.cached ? "캐시된 데이터" : "방금 갱신"}
                </div>
              </div>
              <div style={styles.contentMetric}>
                <div style={styles.metricValue}>{fmt(ch.subscriberCount)}</div>
                <div style={styles.metricLabel}>구독자</div>
              </div>
              <div style={styles.contentMetric}>
                <div style={styles.metricValue}>{fmt(ch.viewCount)}</div>
                <div style={styles.metricLabel}>총 조회수</div>
              </div>
              <div style={styles.contentMetric}>
                <div style={styles.metricValue}>{fmt(ch.videoCount)}</div>
                <div style={styles.metricLabel}>영상 수</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
