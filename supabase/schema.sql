-- PR 대시보드 스키마
-- Supabase 프로젝트의 SQL Editor에서 이 파일 전체를 실행하세요.

create extension if not exists "pgcrypto";

-- 지역별 설정: 지역위원회 총 수(관리자 입력), 게첩 입력용 PIN 해시
create table if not exists region_settings (
  region text primary key,
  total_committees integer not null default 0,
  pin_hash text,
  updated_at timestamptz not null default now()
);

-- 지역위원회별 현수막 게첩 현황 (지역 PIN으로 지역위원회가 직접 입력)
create table if not exists committees (
  id uuid primary key default gen_random_uuid(),
  region text not null references region_settings(region) on delete cascade,
  name text not null,
  installed boolean not null default false,
  installed_date date,
  memo text,
  updated_at timestamptz not null default now(),
  unique (region, name)
);

-- 등록된 YouTube 채널 (관리자가 등록)
create table if not exists youtube_channels (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null unique,
  label text,
  created_at timestamptz not null default now()
);

-- YouTube API 조회 결과 캐시 (쿼터 절약을 위해 일정 시간 캐싱)
create table if not exists youtube_stats_cache (
  channel_id text primary key references youtube_channels(channel_id) on delete cascade,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

-- SNS 콘텐츠 수동 입력 (YouTube 외 채널 성과, 관리자 입력)
create table if not exists sns_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'sns',
  title text not null,
  url text,
  views integer not null default 0,
  shares integer not null default 0,
  engagement text,
  created_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_region_settings_updated on region_settings;
create trigger trg_region_settings_updated
  before update on region_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_committees_updated on committees;
create trigger trg_committees_updated
  before update on committees
  for each row execute function set_updated_at();

-- 16개 지역 시드 (총 위원회 수/PIN은 이후 관리자 페이지에서 설정)
insert into region_settings (region, total_committees)
values
  ('서울', 0), ('경기', 0), ('인천', 0), ('대전', 0),
  ('충남', 0), ('충북', 0), ('전남광주', 0), ('전북', 0),
  ('대구', 0), ('경북', 0), ('경남', 0), ('부산', 0),
  ('제주', 0), ('강원', 0), ('울산', 0), ('세종', 0)
on conflict (region) do nothing;

-- RLS: 이 앱은 서버(API 라우트)에서 service role 키로만 쓰고 지우는 구조이므로
-- 브라우저에서 anon 키로는 읽기만 허용하고 쓰기는 막습니다.
alter table region_settings enable row level security;
alter table committees enable row level security;
alter table youtube_channels enable row level security;
alter table youtube_stats_cache enable row level security;
alter table sns_posts enable row level security;

drop policy if exists "public read region_settings" on region_settings;
create policy "public read region_settings" on region_settings for select using (true);

drop policy if exists "public read committees" on committees;
create policy "public read committees" on committees for select using (true);

drop policy if exists "public read youtube_channels" on youtube_channels;
create policy "public read youtube_channels" on youtube_channels for select using (true);

drop policy if exists "public read youtube_stats_cache" on youtube_stats_cache;
create policy "public read youtube_stats_cache" on youtube_stats_cache for select using (true);

drop policy if exists "public read sns_posts" on sns_posts;
create policy "public read sns_posts" on sns_posts for select using (true);

-- pin_hash는 공개 조회에서 절대 노출하면 안 되므로 뷰로 분리해서 프론트는 이 뷰만 사용합니다.
create or replace view region_settings_public as
  select region, total_committees, updated_at from region_settings;

-- 본부 현수막 게첩 지시일 (미니 캘린더에 강조 표시, 관리자가 /admin에서 추가/삭제)
create table if not exists directives (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  memo text,
  created_at timestamptz not null default now()
);

-- 전국 게첩 완료율의 일별 스냅샷 (증감 화살표 표시용 - 하루 첫 조회 시점 값을 그날의 기준값으로 저장)
create table if not exists stats_snapshots (
  snapshot_date date primary key,
  installed_count integer not null,
  total_count integer not null,
  created_at timestamptz not null default now()
);

alter table directives enable row level security;
alter table stats_snapshots enable row level security;

drop policy if exists "public read directives" on directives;
create policy "public read directives" on directives for select using (true);

drop policy if exists "public read stats_snapshots" on stats_snapshots;
create policy "public read stats_snapshots" on stats_snapshots for select using (true);
