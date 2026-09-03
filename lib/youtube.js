const API_BASE = "https://www.googleapis.com/youtube/v3";

async function ytGet(path, params) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY가 설정되지 않았습니다.");
  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || `YouTube API 오류 (${res.status})`;
    throw new Error(message);
  }
  return json;
}

// 채널 통계 + 업로드 재생목록 ID 조회
export async function fetchChannelSummary(channelId) {
  const json = await ytGet("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId,
  });
  const item = json.items?.[0];
  if (!item) throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);

  return {
    channelId,
    title: item.snippet?.title,
    thumbnail: item.snippet?.thumbnails?.default?.url,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    viewCount: Number(item.statistics?.viewCount ?? 0),
    videoCount: Number(item.statistics?.videoCount ?? 0),
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

// 채널의 최근 업로드 영상 통계 (최대 maxResults개)
export async function fetchRecentVideos(uploadsPlaylistId, maxResults = 10) {
  if (!uploadsPlaylistId) return [];

  const playlistJson = await ytGet("playlistItems", {
    part: "contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  });

  const videoIds = (playlistJson.items ?? [])
    .map((i) => i.contentDetails?.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) return [];

  const videosJson = await ytGet("videos", {
    part: "snippet,statistics",
    id: videoIds.join(","),
  });

  return (videosJson.items ?? []).map((v) => ({
    videoId: v.id,
    title: v.snippet?.title,
    publishedAt: v.snippet?.publishedAt,
    thumbnail: v.snippet?.thumbnails?.medium?.url,
    views: Number(v.statistics?.viewCount ?? 0),
    likes: Number(v.statistics?.likeCount ?? 0),
    comments: Number(v.statistics?.commentCount ?? 0),
  }));
}

export async function fetchChannelStats(channelId) {
  const summary = await fetchChannelSummary(channelId);
  const videos = await fetchRecentVideos(summary.uploadsPlaylistId, 10);
  return { ...summary, videos };
}
