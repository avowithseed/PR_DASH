"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio, Settings } from "lucide-react";
import { styles } from "@/lib/styles";
import BannerTab from "@/components/BannerTab";
import ContentTab from "@/components/ContentTab";
import SpreadTab from "@/components/SpreadTab";

export default function PRDashboard() {
  const [tab, setTab] = useState("banner");

  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState("");

  const [youtube, setYoutube] = useState(null);
  const [sns, setSns] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  const [refreshingYoutube, setRefreshingYoutube] = useState(false);

  const loadRegions = useCallback(async () => {
    setRegionsError("");
    try {
      const res = await fetch("/api/region-settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "지역 데이터를 불러오지 못했습니다.");
      setRegions(json.regions);
    } catch (err) {
      setRegionsError(err.message);
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  const loadContent = useCallback(async (refresh = false) => {
    setContentError("");
    if (refresh) setRefreshingYoutube(true);
    try {
      const [ytRes, snsRes] = await Promise.all([
        fetch(`/api/youtube${refresh ? "?refresh=1" : ""}`),
        fetch("/api/sns"),
      ]);
      const ytJson = await ytRes.json();
      const snsJson = await snsRes.json();
      if (!ytRes.ok) throw new Error(ytJson.error || "YouTube 데이터를 불러오지 못했습니다.");
      if (!snsRes.ok) throw new Error(snsJson.error || "SNS 데이터를 불러오지 못했습니다.");
      setYoutube(ytJson);
      setSns(snsJson.posts ?? []);
    } catch (err) {
      setContentError(err.message);
    } finally {
      setContentLoading(false);
      setRefreshingYoutube(false);
    }
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    if (tab === "content" && (youtube === null || sns.length === 0)) {
      loadContent();
    }
  }, [tab, youtube, sns, loadContent]);

  const tabs = [
    { id: "banner", label: "현수막 게첩 현황" },
    { id: "content", label: "콘텐츠 성과" },
    { id: "spread", label: "조직 재확산" },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>홍보통합 대시보드</div>
          <h1 style={styles.title}>캠페인 현장 운영 현황</h1>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.updatedAt}>
            <Radio size={14} color="#2F7C5C" />
            실시간 연동
          </div>
          <a href="/admin" style={styles.adminLink}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Settings size={13} /> 관리자
            </span>
          </a>
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
        <BannerTab regions={regions} loading={regionsLoading} error={regionsError} onRefresh={loadRegions} />
      )}

      {tab === "content" && (
        <ContentTab
          youtube={youtube}
          sns={sns}
          loading={contentLoading}
          error={contentError}
          onRefreshYoutube={() => loadContent(true)}
          refreshing={refreshingYoutube}
        />
      )}

      {tab === "spread" && <SpreadTab />}
    </div>
  );
}
