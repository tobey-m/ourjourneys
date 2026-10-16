-- รันใน Supabase > SQL Editor (รันซ้ำได้ ถ้าเคยรันเวอร์ชันก่อนหน้าไปแล้วก็ปลอดภัย)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.trips
  add column if not exists name text,
  add column if not exists tags text,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists ip_hash text,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists trips_user_idx on public.trips (user_id, updated_at desc);
create index if not exists trips_ip_idx on public.trips (ip_hash, created_at);
-- เปิด RLS และไม่สร้าง policy: anon key เข้าตารางนี้ไม่ได้เลย
-- แอปอ่าน/เขียนผ่าน API route ฝั่ง server ด้วย service role key เท่านั้น
alter table public.trips enable row level security;
