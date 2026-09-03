import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchChannelStats } from "@/lib/youtube";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15분: YouTube API 쿼터 절약용 캐시

// GET /api/youtube?refresh=1 : 등록된 모든 채널의 통계를 캐시에서(또는 강제 새로고침 시 API에서) 조회
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  const supabase = getSupabaseAdmin();
  const { data: channels, error: channelsErr } = await supabase
    .from("youtube_channels")
    .select("channel_id, label");
  if (channelsErr) return NextResponse.json({ error: channelsErr.message }, { status: 500 });

  if (!channels || channels.length === 0) {
    return NextResponse.json({ channels: [], videos: [], totals: null });
  }

  const { data: cacheRows } = await supabase
    .from("youtube_stats_cache")
    .select("channel_id, data, fetched_at");
  const cacheByChannel = Object.fromEntries((cacheRows ?? []).map((r) => [r.channel_id, r]));

  const results = [];
  const errors = [];

  for (const ch of channels) {
    const cached = cacheByChannel[ch.channel_id];
    const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;

    if (!forceRefresh && isFresh) {
      results.push({ ...cached.data, label: ch.label, cached: true, fetchedAt: cached.fetched_at });
      continue;
    }

    try {
      const stats = await fetchChannelStats(ch.channel_id);
      await supabase
        .from("youtube_stats_cache")
        .upsert({ channel_id: ch.channel_id, data: stats, fetched_at: new Date().toISOString() });
      results.push({ ...stats, label: ch.label, cached: false, fetchedAt: new Date().toISOString() });
    } catch (e) {
      errors.push({ channel_id: ch.channel_id, label: ch.label, error: e.message });
      if (cached) {
        results.push({ ...cached.data, label: ch.label, cached: true, stale: true, fetchedAt: cached.fetched_at });
      }
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      subscriberCount: acc.subscriberCount + (r.subscriberCount || 0),
      viewCount: acc.viewCount + (r.viewCount || 0),
      videoCount: acc.videoCount + (r.videoCount || 0),
    }),
    { subscriberCount: 0, viewCount: 0, videoCount: 0 }
  );

  const videos = results
    .flatMap((r) => (r.videos || []).map((v) => ({ ...v, channelTitle: r.title, channelLabel: r.label })))
    .sort((a, b) => b.views - a.views);

  return NextResponse.json({ channels: results, videos, totals, errors });
}
