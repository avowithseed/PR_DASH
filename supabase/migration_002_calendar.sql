-- 미니 캘린더(현수막 게첩 지시일) + 전국 완료율 증감 표시 기능 추가분입니다.
-- 이미 schema.sql을 실행하신 상태라면, 이 파일만 Supabase SQL Editor에서 추가로 실행하면 됩니다.
-- (schema.sql 전체를 다시 실행해도 안전합니다 - 이 내용이 그대로 포함되어 있습니다.)

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

-- 9월 2일 현수막 게첩 지시 (요청받은 초기 데이터). directives에 date용 유니크 제약이 없어서
-- 이 파일을 여러 번 실행해도 중복 삽입되지 않도록 존재 여부를 먼저 확인합니다.
insert into directives (date, memo)
select '2026-09-02', '현수막 게첩 지시'
where not exists (select 1 from directives where date = '2026-09-02');
