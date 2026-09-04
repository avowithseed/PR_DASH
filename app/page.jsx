"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { styles } from "@/lib/styles";
import { fetchJson } from "@/lib/fetchJson";
import BannerTab from "@/components/BannerTab";
import ContentTab from "@/components/ContentTab";
import SpreadTab from "@/components/SpreadTab";

export default function PRDashboard() {
  const [tab, setTab] = useState("banner");

  const [regions, setRegions] = useState([]);
  const [national, setNational] = useState(null);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState("");

  const [directives, setDirectives] = useState([]);
  const [weeklyTheme, setWeeklyTheme] = useState(null);

  const [youtube, setYoutube] = useState(null);
  const [sns, setSns] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  const [contentLoaded, setContentLoaded] = useState(false);
  const [refreshingYoutube, setRefreshingYoutube] = useState(false);

  const loadRegions = useCallback(async () => {
    setRegionsError("");
    try {
      const json = await fetchJson("/api/region-settings");
      setRegions(json.regions ?? []);
      setNational(json.national ?? null);
    } catch (err) {
      setRegionsError(err.message);
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  const loadDirectives = useCallback(async () => {
    try {
      const json = await fetchJson("/api/directives");
      setDirectives(json.directives ?? []);
    } catch {
      // 캘린더는 부가 정보라 조용히 빈 상태로 둡니다 (지시일 강조 표시만 안 됨).
      setDirectives([]);
    }
  }, []);

  const loadWeeklyTheme = useCallback(async () => {
    try {
      const json = await fetchJson("/api/weekly-theme");
      setWeeklyTheme(json.theme ?? null);
    } catch {
      // 마이그레이션 전이면 조용히 배너를 숨깁니다.
      setWeeklyTheme(null);
    }
  }, []);

  const loadContent = useCallback(async (refresh = false) => {
    setContentError("");
    if (refresh) setRefreshingYoutube(true);
    try {
      const [ytJson, snsJson] = await Promise.all([
        fetchJson(`/api/youtube${refresh ? "?refresh=1" : ""}`),
        fetchJson("/api/sns"),
      ]);
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
    loadDirectives();
    loadWeeklyTheme();
  }, [loadRegions, loadDirectives, loadWeeklyTheme]);

  // 콘텐츠 탭에 처음 들어갈 때 한 번만 불러옵니다. youtube/sns 상태를 의존성에 넣으면
  // loadContent()가 매번 새 배열/객체 참조를 만들어 effect가 다시 실행되고,
  // 다시 loadContent()를 부르는 무한 루프가 생기므로 "이미 불러왔는지" 플래그로만 제어합니다.
  useEffect(() => {
    if (tab === "content" && !contentLoaded) {
      setContentLoaded(true);
      loadContent();
    }
  }, [tab, contentLoaded, loadContent]);

  const tabs = [
    { id: "banner", label: "현수막 게첩 현황" },
    { id: "content", label: "유튜브 현황" },
    { id: "spread", label: "컨텐츠 전파현황" },
  ];

  return (
    <div className="page-bg-wave" style={styles.page}>
      <header style={styles.dashboardHeaderRow}>
        <div style={styles.headerSpacer} aria-hidden />
        <div>
          <div style={styles.dashboardEyebrow}>더불어민주당 홍보위원회</div>
          <h1 style={styles.dashboardTitle}>
            홍보통합 <span style={styles.titleAccent}>대시보드</span>
          </h1>
        </div>
        <div style={styles.headerRightEnd}>
          <div style={styles.liveBadge}>
            <span className="live-dot" style={styles.liveBadgeDot} />
            실시간 연동 중
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
              color: tab === t.id ? "#0D47A1" : "#8A9099",
              borderBottomColor: tab === t.id ? "#0D47A1" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "banner" && (
        <BannerTab
          regions={regions}
          national={national}
          directives={directives}
          weeklyTheme={weeklyTheme}
          loading={regionsLoading}
          error={regionsError}
          onRefresh={loadRegions}
        />
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
