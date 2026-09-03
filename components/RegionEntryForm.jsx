"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, X } from "lucide-react";
import { styles } from "@/lib/styles";

// 지역위원회 PIN 인증 후 해당 지역의 현수막 게첩 로스터를 직접 입력/수정하는 모달 폼
export default function RegionEntryForm({ region, committees, onClose, onUpdated }) {
  const [pin, setPin] = useState("");
  const [verifiedPin, setVerifiedPin] = useState(null); // PIN 확인되면 이후 요청 헤더로 재사용
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newInstalled, setNewInstalled] = useState(true);
  const [newDate, setNewDate] = useState("");

  async function verifyPin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/region-pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "PIN 확인에 실패했습니다.");
      setVerifiedPin(pin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitCommittee(payload, { id } = {}) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/committees", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-region-pin": verifiedPin },
        body: JSON.stringify({ region, id, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장에 실패했습니다.");
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCommittee(id) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/committees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-region-pin": verifiedPin },
        body: JSON.stringify({ region, id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "삭제에 실패했습니다.");
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    submitCommittee({
      name: newName.trim(),
      installed: newInstalled,
      installed_date: newInstalled ? newDate || undefined : undefined,
    });
    setNewName("");
    setNewInstalled(true);
    setNewDate("");
  }

  return (
    <div style={styles.formOverlay} onClick={onClose}>
      <div style={styles.formCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={styles.formTitle}>{region} 현수막 게첩 입력</div>
            <div style={styles.formSub}>
              {verifiedPin ? "위원회별 게첩 현황을 추가/수정하세요." : "지역 PIN을 입력하면 입력 화면으로 이동합니다."}
            </div>
          </div>
          <button style={{ ...styles.btnGhost, padding: 6 }} onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!verifiedPin ? (
          <form onSubmit={verifyPin}>
            <label style={styles.formLabel}>지역 PIN</label>
            <input
              style={styles.formInput}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="관리자에게 받은 PIN을 입력하세요"
              autoFocus
            />
            <div style={styles.formButtonRow}>
              <button type="button" style={styles.btnSecondary} onClick={onClose}>
                취소
              </button>
              <button type="submit" style={styles.btnPrimary} disabled={loading || !pin}>
                {loading ? "확인 중..." : "확인"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ ...styles.committeeList, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
              {committees.length === 0 && (
                <div style={styles.emptyState}>아직 등록된 위원회가 없습니다. 아래에서 추가하세요.</div>
              )}
              {committees.map((c) => (
                <div
                  key={c.id}
                  style={{
                    ...styles.committeeRow,
                    borderLeftColor: c.installed ? "#2F7C5C" : "#B8452C",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={styles.committeeName}>{c.name}</span>
                    {c.installed && c.installed_date && (
                      <span style={{ fontSize: 11, color: "#8A9099" }}>{c.installed_date} 완료</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      style={{
                        ...styles.toggleBtn,
                        flex: "none",
                        padding: "5px 10px",
                        fontSize: 11.5,
                        color: c.installed ? "#2F7C5C" : "#5B6472",
                        borderColor: c.installed ? "#2F7C5C" : "#DEE1DB",
                      }}
                      disabled={loading}
                      onClick={() =>
                        submitCommittee(
                          {
                            name: c.name,
                            installed: !c.installed,
                            installed_date: !c.installed ? new Date().toISOString().slice(0, 10) : undefined,
                          },
                          { id: c.id }
                        )
                      }
                    >
                      {c.installed ? <CheckCircle2 size={13} /> : "미집행"}
                    </button>
                    <button
                      style={{ ...styles.btnDanger, padding: 6 }}
                      disabled={loading}
                      onClick={() => deleteCommittee(c.id)}
                      aria-label="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAdd} style={{ borderTop: "1px solid #EDEEEA", paddingTop: 14 }}>
              <label style={styles.formLabel}>새 위원회 추가</label>
              <input
                style={styles.formInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 서울 제1지역위원회"
              />
              <div style={styles.toggleRow}>
                <button
                  type="button"
                  style={{
                    ...styles.toggleBtn,
                    background: newInstalled ? "#2F7C5C" : "#FFFFFF",
                    color: newInstalled ? "#FFFFFF" : "#5B6472",
                    borderColor: newInstalled ? "#2F7C5C" : "#DEE1DB",
                  }}
                  onClick={() => setNewInstalled(true)}
                >
                  게첩 완료
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.toggleBtn,
                    background: !newInstalled ? "#B8452C" : "#FFFFFF",
                    color: !newInstalled ? "#FFFFFF" : "#5B6472",
                    borderColor: !newInstalled ? "#B8452C" : "#DEE1DB",
                  }}
                  onClick={() => setNewInstalled(false)}
                >
                  미집행
                </button>
              </div>
              {newInstalled && (
                <>
                  <label style={styles.formLabel}>완료일 (선택, 비우면 오늘)</label>
                  <input
                    style={styles.formInput}
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </>
              )}
              <div style={styles.formButtonRow}>
                <button type="submit" style={styles.btnPrimary} disabled={loading || !newName.trim()}>
                  추가
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
