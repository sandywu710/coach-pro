-- 開啟 uuid extension
create extension if not exists "uuid-ossp";

-- 先刪除舊表（包含相依資料）
drop table if exists purchases cascade;
drop table if exists checkins cascade;
drop table if exists students cascade;

-- 學員資料表
create table students (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  sessions_remaining integer default 0,
  total_paid numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- 報到紀錄表
create table checkins (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  checked_in_at timestamptz default now()
);

-- 購買方案紀錄表
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  sessions_added integer not null,
  amount_paid numeric not null,
  purchased_at timestamptz default now(),
  note text
);

-- RLS 啟用
alter table students enable row level security;
alter table checkins enable row level security;
alter table purchases enable row level security;

-- RLS 政策
create policy "students: coach owns" on students for all using (coach_id = auth.uid());
create policy "checkins: coach owns" on checkins for all using (coach_id = auth.uid());
create policy "purchases: coach owns" on purchases for all using (coach_id = auth.uid());
