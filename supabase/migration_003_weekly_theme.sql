-- "이 주의 홍보기조" 배너 기능 추가분입니다.
-- Supabase SQL Editor에서 이 파일만 추가로 실행하면 됩니다.
-- (schema.sql 전체를 다시 실행해도 안전합니다 - 이 내용이 그대로 포함되어 있습니다.)

-- updated_at 자동 갱신 함수 (schema.sql에 이미 있다면 그대로 대체되어 안전합니다)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists weekly_theme (
  id integer primary key default 1,
  content text not null default '',
  updated_at timestamptz not null default now(),
  constraint weekly_theme_singleton check (id = 1)
);

drop trigger if exists trg_weekly_theme_updated on weekly_theme;
create trigger trg_weekly_theme_updated
  before update on weekly_theme
  for each row execute function set_updated_at();

insert into weekly_theme (id, content)
values (1, '민티07 파일럿 홍보, 정부 민영화 저지 성과홍보 (KTX, SRT통합)')
on conflict (id) do nothing;

alter table weekly_theme enable row level security;
drop policy if exists "public read weekly_theme" on weekly_theme;
create policy "public read weekly_theme" on weekly_theme for select using (true);
