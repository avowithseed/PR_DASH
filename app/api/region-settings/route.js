import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminPassword } from "@/lib/auth";
import { REGIONS } from "@/lib/regions";
import { withErrorHandling } from "@/lib/apiHandler";

// GET: 지역별 대시보드 데이터(총 위원회 수 + 게첩 로스터 + 완료 수치) 조합해서 반환
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseAdmin();

  const [{ data: settings, error: settingsErr }, { data: committees, error: committeesErr }] =
    await Promise.all([
      supabase.from("region_settings").select("region, total_committees, pin_hash, updated_at"),
      supabase
        .from("committees")
        .select("id, region, name, installed, installed_date, memo, updated_at")
        .order("updated_at", { ascending: false }),
    ]);

  if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });
  if (committeesErr) return NextResponse.json({ error: committeesErr.message }, { status: 500 });

  const byRegion = Object.fromEntries(REGIONS.map((r) => [r, []]));
  for (const c of committees ?? []) {
    if (!byRegion[c.region]) byRegion[c.region] = [];
    byRegion[c.region].push(c);
  }

  const settingsByRegion = Object.fromEntries((settings ?? []).map((s) => [s.region, s]));

  const data = REGIONS.map((name) => {
    const total = settingsByRegion[name]?.total_committees ?? 0;
    // 미집행(installed=false) 위원회가 항상 먼저 오도록 정렬
    const roster = [...(byRegion[name] ?? [])].sort(
      (a, b) => Number(a.installed) - Number(b.installed)
    );
    const installedCount = roster.filter((c) => c.installed).length;
    const pct = total > 0 ? Math.round((installedCount / total) * 100) : 0;
    return {
      name,
      total,
      installedCount,
      reportedCount: roster.length,
      pct: Math.min(pct, 100),
      committees: roster,
      hasPin: Boolean(settingsByRegion[name]?.pin_hash),
    };
  });

  const nationalInstalled = data.reduce((s, r) => s + r.installedCount, 0);
  const nationalTotal = data.reduce((s, r) => s + r.total, 0);
  const nationalPct = nationalTotal > 0 ? Math.round((nationalInstalled / nationalTotal) * 100) : 0;

  // 전일 대비 증감 표시용 스냅샷. stats_snapshots 테이블이 아직 없는 배포(마이그레이션 전)에서도
  // 이 부분 실패가 지역 데이터 전체 응답을 막지 않도록 별도로 감쌉니다.
  let trend = null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: prevSnap } = await supabase
      .from("stats_snapshots")
      .select("snapshot_date, installed_count, total_count")
      .lt("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 오늘 스냅샷이 없으면 지금 값을 오늘의 기준값으로 한 번만 저장(다음 날 비교용).
    await supabase
      .from("stats_snapshots")
      .upsert(
        { snapshot_date: today, installed_count: nationalInstalled, total_count: nationalTotal },
        { onConflict: "snapshot_date", ignoreDuplicates: true }
      );

    if (prevSnap) {
      const prevPct =
        prevSnap.total_count > 0 ? Math.round((prevSnap.installed_count / prevSnap.total_count) * 100) : 0;
      trend = { deltaPct: nationalPct - prevPct, sinceDate: prevSnap.snapshot_date };
    }
  } catch {
    trend = null;
  }

  return NextResponse.json({
    regions: data,
    national: {
      installedCount: nationalInstalled,
      total: nationalTotal,
      pct: nationalPct,
      trend,
    },
  });
});

// POST: 관리자가 특정 지역의 "총 지역위원회 수"를 설정 (x-admin-password 헤더 필요)
export const POST = withErrorHandling(async (req) => {
  const adminPassword = req.headers.get("x-admin-password");
  if (!checkAdminPassword(adminPassword)) {
    return NextResponse.json({ error: "관리자 인증 실패" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { region, total_committees } = body ?? {};
  if (!REGIONS.includes(region)) {
    return NextResponse.json({ error: "알 수 없는 지역입니다." }, { status: 400 });
  }
  const total = Number(total_committees);
  if (!Number.isFinite(total) || total < 0) {
    return NextResponse.json({ error: "총 위원회 수는 0 이상의 숫자여야 합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("region_settings")
    .upsert({ region, total_committees: total }, { onConflict: "region" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
