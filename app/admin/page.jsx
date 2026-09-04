"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, ShieldCheck, ArrowLeft } from "lucide-react";
import { styles } from "@/lib/styles";
import { REGIONS } from "@/lib/regions";
import { fetchJson } from "@/lib/fetchJson";

const STORAGE_KEY = "pr_dashboard_admin_password";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) verify(saved).finally(() => setChecking(false));
    else setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(pw) {
    try {
      await fetchJson("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      setPassword(pw);
      setAuthed(true);
      sessionStorage.setItem(STORAGE_KEY, pw);
      return true;
    } catch {
      return false;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const ok = await verify(loginInput);
    if (!ok) setLoginError("비밀번호가 올바르지 않습니다.");
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setPassword("");
    setLoginInput("");
  }

  if (checking) return <div className="page-bg-wave" style={styles.page}>확인 중...</div>;

  if (!authed) {
    return (
      <div className="page-bg-wave" style={styles.page}>
        <div style={{ maxWidth: 360, margin: "80px auto" }}>
          <div style={styles.formTitle}>관리자 로그인</div>
          <div style={styles.formSub}>.env.local의 ADMIN_PASSWORD로 로그인하세요.</div>
          {loginError && <div style={styles.errorBox}>{loginError}</div>}
          <form onSubmit={handleLogin}>
            <input
              style={styles.formInput}
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="관리자 비밀번호"
              autoFocus
            />
            <button type="submit" style={{ ...styles.btnPrimary, width: "100%" }}>
              로그인
            </button>
          </form>
          <div style={{ marginTop: 16 }}>
            <a href="/" style={{ fontSize: 12.5, color: "#5B6472" }}>
              ← 대시보드로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <AdminPanel password={password} onLogout={logout} />;
}

function AdminPanel({ password, onLogout }) {
  const authHeaders = { "Content-Type": "application/json", "x-admin-password": password };

  const [regions, setRegions] = useState([]);
  const [totalsDraft, setTotalsDraft] = useState({});
  const [pinDraft, setPinDraft] = useState({});
  const [savingRegion, setSavingRegion] = useState(null);
  const [regionMsg, setRegionMsg] = useState({});

  const [channels, setChannels] = useState([]);
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelLabel, setNewChannelLabel] = useState("");
  const [channelMsg, setChannelMsg] = useState("");

  const [snsPosts, setSnsPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", url: "", views: "", shares: "", engagement: "" });
  const [snsMsg, setSnsMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  const [directives, setDirectives] = useState([]);
  const [newDirective, setNewDirective] = useState({ date: "", memo: "" });
  const [directiveMsg, setDirectiveMsg] = useState("");

  const [weeklyThemeDraft, setWeeklyThemeDraft] = useState("");
  const [weeklyThemeSavedAt, setWeeklyThemeSavedAt] = useState(null);
  const [weeklyThemeMsg, setWeeklyThemeMsg] = useState("");
  const [savingTheme, setSavingTheme] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError("");
    try {
      const [rJson, cJson, sJson] = await Promise.all([
        fetchJson("/api/region-settings"),
        fetchJson("/api/youtube/channels"),
        fetchJson("/api/sns"),
      ]);
      setRegions(rJson.regions ?? []);
      setTotalsDraft(Object.fromEntries((rJson.regions ?? []).map((r) => [r.name, r.total])));
      setChannels(cJson.channels ?? []);
      setSnsPosts(sJson.posts ?? []);
    } catch (err) {
      setLoadError(err.message);
    }
    // directives는 별도 마이그레이션이 필요한 테이블이라, 아직 적용 전이어도
    // 위의 핵심 관리자 데이터 로딩이 막히지 않도록 따로 처리합니다.
    try {
      const dJson = await fetchJson("/api/directives");
      setDirectives(dJson.directives ?? []);
    } catch (err) {
      setDirectiveMsg(err.message);
    }
    // weekly_theme도 마찬가지로 별도 마이그레이션 대상이라 독립적으로 로딩합니다.
    try {
      const wJson = await fetchJson("/api/weekly-theme");
      setWeeklyThemeDraft(wJson.theme?.content ?? "");
      setWeeklyThemeSavedAt(wJson.theme?.updated_at ?? null);
    } catch (err) {
      setWeeklyThemeMsg(err.message);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveTotal(region) {
    setSavingRegion(region);
    setRegionMsg((m) => ({ ...m, [region]: "" }));
    try {
      await fetchJson("/api/region-settings", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ region, total_committees: Number(totalsDraft[region]) || 0 }),
      });
      setRegionMsg((m) => ({ ...m, [region]: "저장됨" }));
      loadAll();
    } catch (err) {
      setRegionMsg((m) => ({ ...m, [region]: err.message }));
    } finally {
      setSavingRegion(null);
    }
  }

  async function savePin(region) {
    const pin = pinDraft[region];
    if (!pin || pin.length < 4) {
      setRegionMsg((m) => ({ ...m, [region]: "PIN은 4자 이상이어야 합니다." }));
      return;
    }
    setSavingRegion(region);
    try {
      await fetchJson("/api/region-pin", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ region, pin }),
      });
      setRegionMsg((m) => ({ ...m, [region]: "PIN 설정됨" }));
      setPinDraft((d) => ({ ...d, [region]: "" }));
      loadAll();
    } catch (err) {
      setRegionMsg((m) => ({ ...m, [region]: err.message }));
    } finally {
      setSavingRegion(null);
    }
  }

  async function addChannel(e) {
    e.preventDefault();
    setChannelMsg("");
    try {
      await fetchJson("/api/youtube/channels", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ channel_id: newChannelId.trim(), label: newChannelLabel.trim() }),
      });
      setNewChannelId("");
      setNewChannelLabel("");
      loadAll();
    } catch (err) {
      setChannelMsg(err.message);
    }
  }

  async function deleteChannel(id) {
    setChannelMsg("");
    try {
      await fetchJson("/api/youtube/channels", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ id }),
      });
      loadAll();
    } catch (err) {
      setChannelMsg(err.message);
    }
  }

  async function addPost(e) {
    e.preventDefault();
    setSnsMsg("");
    try {
      await fetchJson("/api/sns", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(newPost),
      });
      setNewPost({ title: "", url: "", views: "", shares: "", engagement: "" });
      loadAll();
    } catch (err) {
      setSnsMsg(err.message);
    }
  }

  async function deletePost(id) {
    setSnsMsg("");
    try {
      await fetchJson("/api/sns", { method: "DELETE", headers: authHeaders, body: JSON.stringify({ id }) });
      loadAll();
    } catch (err) {
      setSnsMsg(err.message);
    }
  }

  async function addDirective(e) {
    e.preventDefault();
    setDirectiveMsg("");
    if (!newDirective.date) {
      setDirectiveMsg("날짜를 선택하세요.");
      return;
    }
    try {
      await fetchJson("/api/directives", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(newDirective),
      });
      setNewDirective({ date: "", memo: "" });
      loadAll();
    } catch (err) {
      setDirectiveMsg(err.message);
    }
  }

  async function deleteDirective(id) {
    setDirectiveMsg("");
    try {
      await fetchJson("/api/directives", { method: "DELETE", headers: authHeaders, body: JSON.stringify({ id }) });
      loadAll();
    } catch (err) {
      setDirectiveMsg(err.message);
    }
  }

  async function saveWeeklyTheme(e) {
    e.preventDefault();
    setWeeklyThemeMsg("");
    setSavingTheme(true);
    try {
      const json = await fetchJson("/api/weekly-theme", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ content: weeklyThemeDraft }),
      });
      setWeeklyThemeSavedAt(json.theme?.updated_at ?? null);
      setWeeklyThemeMsg("저장됨");
    } catch (err) {
      setWeeklyThemeMsg(err.message);
    } finally {
      setSavingTheme(false);
    }
  }

  return (
    <div className="page-bg-wave" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#5B6472" }}>
              <ArrowLeft size={12} /> 대시보드
            </a>
          </div>
          <h1 style={styles.title}>관리자 설정</h1>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.updatedAt}>
            <ShieldCheck size={14} color="#2F7C5C" /> 관리자 모드
          </div>
          <button style={styles.btnGhost} onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      {loadError && <div style={styles.errorBox}>{loadError}</div>}

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>이 주의 홍보기조</div>
        <div style={{ fontSize: 12, color: "#5B6472", marginBottom: 12 }}>
          메인 대시보드 상단에 강조 배너로 표시됩니다. (supabase/migration_003_weekly_theme.sql 실행이 선행되어야 합니다)
        </div>
        {weeklyThemeMsg && <div style={weeklyThemeMsg === "저장됨" ? { ...styles.errorBox, background: "#E4F6EA", borderColor: "#BFE6CC", color: "#1E7A46" } : styles.errorBox}>{weeklyThemeMsg}</div>}
        <form onSubmit={saveWeeklyTheme}>
          <textarea
            style={{ ...styles.formInput, minHeight: 64, resize: "vertical" }}
            value={weeklyThemeDraft}
            onChange={(e) => setWeeklyThemeDraft(e.target.value)}
            placeholder="예: 민티07 파일럿 홍보, 정부 민영화 저지 성과홍보 (KTX, SRT통합)"
          />
          <div style={styles.formButtonRow}>
            {weeklyThemeSavedAt && (
              <span style={{ fontSize: 11.5, color: "#8A9099", marginRight: "auto" }}>
                마지막 수정: {new Date(weeklyThemeSavedAt).toLocaleString("ko-KR")}
              </span>
            )}
            <button type="submit" style={styles.btnPrimary} disabled={savingTheme || !weeklyThemeDraft.trim()}>
              저장
            </button>
          </div>
        </form>
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>지역별 총 위원회 수 · PIN 설정</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {REGIONS.map((name) => {
            const r = regions.find((x) => x.name === name);
            return (
              <div
                key={name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr 90px",
                  gap: 8,
                  alignItems: "center",
                  borderBottom: "1px solid #F0F1ED",
                  paddingBottom: 8,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    style={{ ...styles.formInput, marginBottom: 0, width: 90 }}
                    type="number"
                    min={0}
                    value={totalsDraft[name] ?? ""}
                    onChange={(e) => setTotalsDraft((d) => ({ ...d, [name]: e.target.value }))}
                  />
                  <button style={styles.btnGhost} disabled={savingRegion === name} onClick={() => saveTotal(name)}>
                    저장
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    style={{ ...styles.formInput, marginBottom: 0, width: 110 }}
                    type="text"
                    placeholder={r?.hasPin ? "PIN 재설정" : "PIN 설정"}
                    value={pinDraft[name] ?? ""}
                    onChange={(e) => setPinDraft((d) => ({ ...d, [name]: e.target.value }))}
                  />
                  <button style={styles.btnGhost} disabled={savingRegion === name} onClick={() => savePin(name)}>
                    설정
                  </button>
                </div>
                <div style={{ fontSize: 11, color: r?.hasPin ? "#2F7C5C" : "#B8452C" }}>
                  {regionMsg[name] || (r?.hasPin ? "PIN 설정됨" : "PIN 미설정")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>YouTube 채널 관리</div>
        {channelMsg && <div style={styles.errorBox}>{channelMsg}</div>}
        <form onSubmit={addChannel} style={styles.formRow}>
          <input
            style={{ ...styles.formInput, marginBottom: 0 }}
            placeholder="채널 ID(UCxxxx...) 또는 @핸들(예: @minjoodang_tv)"
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
          />
          <input
            style={{ ...styles.formInput, marginBottom: 0 }}
            placeholder="표시 이름 (선택)"
            value={newChannelLabel}
            onChange={(e) => setNewChannelLabel(e.target.value)}
          />
          <button type="submit" style={styles.btnPrimary} disabled={!newChannelId.trim()}>
            추가
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {channels.map((ch) => (
            <div
              key={ch.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F0F1ED" }}
            >
              <span>
                {ch.label || "(이름 없음)"} <span style={{ color: "#8A9099" }}>· {ch.channel_id}</span>
              </span>
              <button style={{ ...styles.btnDanger, padding: 6 }} onClick={() => deleteChannel(ch.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>SNS 콘텐츠 성과 수동 입력</div>
        {snsMsg && <div style={styles.errorBox}>{snsMsg}</div>}
        <form onSubmit={addPost}>
          <div style={styles.formRow}>
            <input
              style={{ ...styles.formInput, marginBottom: 0 }}
              placeholder="제목"
              value={newPost.title}
              onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            />
            <input
              style={{ ...styles.formInput, marginBottom: 0 }}
              placeholder="URL (선택)"
              value={newPost.url}
              onChange={(e) => setNewPost((p) => ({ ...p, url: e.target.value }))}
            />
          </div>
          <div style={styles.formRow}>
            <input
              style={{ ...styles.formInput, marginBottom: 0 }}
              type="number"
              placeholder="조회수"
              value={newPost.views}
              onChange={(e) => setNewPost((p) => ({ ...p, views: e.target.value }))}
            />
            <input
              style={{ ...styles.formInput, marginBottom: 0 }}
              type="number"
              placeholder="공유수"
              value={newPost.shares}
              onChange={(e) => setNewPost((p) => ({ ...p, shares: e.target.value }))}
            />
            <input
              style={{ ...styles.formInput, marginBottom: 0 }}
              placeholder="참여율 (예: 6.2%)"
              value={newPost.engagement}
              onChange={(e) => setNewPost((p) => ({ ...p, engagement: e.target.value }))}
            />
          </div>
          <div style={styles.formButtonRow}>
            <button type="submit" style={styles.btnPrimary} disabled={!newPost.title.trim()}>
              추가
            </button>
          </div>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {snsPosts.map((p) => (
            <div
              key={p.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F0F1ED" }}
            >
              <span>
                {p.title} <span style={{ color: "#8A9099" }}>· 조회 {p.views} · 공유 {p.shares}</span>
              </span>
              <button style={{ ...styles.btnDanger, padding: 6 }} onClick={() => deletePost(p.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.panelBlock}>
        <div style={styles.panelTitle}>본부 현수막 게첩 지시일 관리</div>
        <div style={{ fontSize: 12, color: "#5B6472", marginBottom: 12 }}>
          여기서 추가한 날짜는 메인 대시보드 미니 캘린더에 굵게 강조 표시됩니다. (supabase/migration_002_calendar.sql 실행이 선행되어야 합니다)
        </div>
        {directiveMsg && <div style={styles.errorBox}>{directiveMsg}</div>}
        <form onSubmit={addDirective} style={styles.formRow}>
          <input
            style={{ ...styles.formInput, marginBottom: 0, maxWidth: 170 }}
            type="date"
            value={newDirective.date}
            onChange={(e) => setNewDirective((d) => ({ ...d, date: e.target.value }))}
          />
          <input
            style={{ ...styles.formInput, marginBottom: 0 }}
            placeholder="메모 (선택, 예: 전국 현수막 일괄 게첩 지시)"
            value={newDirective.memo}
            onChange={(e) => setNewDirective((d) => ({ ...d, memo: e.target.value }))}
          />
          <button type="submit" style={styles.btnPrimary} disabled={!newDirective.date}>
            추가
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {directives.length === 0 && <div style={styles.emptyState}>등록된 지시일이 없습니다.</div>}
          {directives.map((d) => (
            <div
              key={d.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F0F1ED" }}
            >
              <span>
                <strong>{d.date}</strong>
                {d.memo && <span style={{ color: "#8A9099" }}> · {d.memo}</span>}
              </span>
              <button style={{ ...styles.btnDanger, padding: 6 }} onClick={() => deleteDirective(d.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
