"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, ShieldCheck, ArrowLeft } from "lucide-react";
import { styles } from "@/lib/styles";
import { REGIONS } from "@/lib/regions";

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
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      setPassword(pw);
      setAuthed(true);
      sessionStorage.setItem(STORAGE_KEY, pw);
      return true;
    }
    return false;
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

  if (checking) return <div style={styles.page}>확인 중...</div>;

  if (!authed) {
    return (
      <div style={styles.page}>
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

  const loadAll = useCallback(async () => {
    const [rRes, cRes, sRes] = await Promise.all([
      fetch("/api/region-settings"),
      fetch("/api/youtube/channels"),
      fetch("/api/sns"),
    ]);
    const rJson = await rRes.json();
    const cJson = await cRes.json();
    const sJson = await sRes.json();
    setRegions(rJson.regions ?? []);
    setTotalsDraft(Object.fromEntries((rJson.regions ?? []).map((r) => [r.name, r.total])));
    setChannels(cJson.channels ?? []);
    setSnsPosts(sJson.posts ?? []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveTotal(region) {
    setSavingRegion(region);
    setRegionMsg((m) => ({ ...m, [region]: "" }));
    try {
      const res = await fetch("/api/region-settings", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ region, total_committees: Number(totalsDraft[region]) || 0 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
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
      const res = await fetch("/api/region-pin", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ region, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
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
      const res = await fetch("/api/youtube/channels", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ channel_id: newChannelId.trim(), label: newChannelLabel.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewChannelId("");
      setNewChannelLabel("");
      loadAll();
    } catch (err) {
      setChannelMsg(err.message);
    }
  }

  async function deleteChannel(id) {
    await fetch("/api/youtube/channels", {
      method: "DELETE",
      headers: authHeaders,
      body: JSON.stringify({ id }),
    });
    loadAll();
  }

  async function addPost(e) {
    e.preventDefault();
    setSnsMsg("");
    try {
      const res = await fetch("/api/sns", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(newPost),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewPost({ title: "", url: "", views: "", shares: "", engagement: "" });
      loadAll();
    } catch (err) {
      setSnsMsg(err.message);
    }
  }

  async function deletePost(id) {
    await fetch("/api/sns", { method: "DELETE", headers: authHeaders, body: JSON.stringify({ id }) });
    loadAll();
  }

  return (
    <div style={styles.page}>
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
            placeholder="채널 ID (예: UCxxxxxxxxxxxxxx)"
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
    </div>
  );
}
