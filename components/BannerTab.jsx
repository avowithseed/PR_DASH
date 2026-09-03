"use client";

import { useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import { styles } from "@/lib/styles";
import { tierOf } from "@/lib/regions";
import RegionEntryForm from "./RegionEntryForm";

export default function BannerTab({ regions, loading, error, onRefresh }) {
  const [selectedRegion, setSelectedRegion] = useState(regions[0]?.name ?? null);
  const [formOpen, setFormOpen] = useState(false);

  if (loading) return <div style={styles.emptyState}>불러오는 중...</div>;
  if (error) return <div style={styles.errorBox}>{error}</div>;
  if (regions.length === 0) return <div style={styles.emptyState}>지역 데이터가 없습니다.</div>;

  const region = regions.find((r) => r.name === selectedRegion) ?? regions[0];
  const totalInstalled = regions.reduce((s, r) => s + r.installedCount, 0);
  const totalCommittees = regions.reduce((s, r) => s + r.total, 0);
  const totalPct = totalCommittees > 0 ? Math.round((totalInstalled / totalCommittees) * 100) : 0;

  return (
    <section>
      <div style={styles.heroRow}>
        <div style={styles.heroNumber}>{totalPct}%</div>
        <div>
          <div style={styles.heroLabel}>전국 게첩 완료율</div>
          <div style={styles.heroSub}>
            {totalInstalled}건 완료 / {totalCommittees}건 중 (총 위원회 수 기준)
          </div>
        </div>
      </div>

      <div className="split" style={styles.splitLayout}>
        <div className="banner-grid" style={styles.bannerGrid}>
          {regions.map((r) => {
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
                <div style={{ ...styles.regionPct, color: tier.color }}>{r.pct}%</div>
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
                  {r.installedCount}/{r.total || "-"}개 위원회
                </div>
              </button>
            );
          })}
        </div>

        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div>
              <div style={styles.detailTitle}>{region.name} 지역위원회</div>
              <div style={{ fontSize: 11.5, color: "#8A9099", marginTop: 2 }}>
                보고 {region.reportedCount}건 · 총 위원회 수 {region.total || "미설정"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.detailCount}>
                {region.installedCount}/{region.total || "-"} 완료
              </div>
              <button style={styles.btnGhost} onClick={() => setFormOpen(true)}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PenLine size={13} /> 입력
                </span>
              </button>
            </div>
          </div>
          <div style={styles.committeeList}>
            {region.committees.length === 0 && (
              <div style={styles.emptyState}>
                아직 입력된 위원회가 없습니다.
                <br />
                우측 상단 &quot;입력&quot; 버튼으로 지역위원회가 직접 등록할 수 있습니다.
              </div>
            )}
            {region.committees.map((c) => (
              <div
                key={c.id}
                style={{
                  ...styles.committeeRow,
                  borderLeftColor: c.installed ? "#2F7C5C" : "#B8452C",
                }}
              >
                <div style={styles.committeeName}>{c.name}</div>
                {c.installed ? (
                  <span style={styles.badgeDone}>
                    <CheckCircle2 size={13} /> {c.installed_date} 완료
                  </span>
                ) : (
                  <span style={styles.badgeTodo}>미집행</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {formOpen && (
        <RegionEntryForm
          region={region.name}
          committees={region.committees}
          onClose={() => setFormOpen(false)}
          onUpdated={onRefresh}
        />
      )}
    </section>
  );
}
