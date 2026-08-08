create table if not exists public.shared_courses (
  id uuid primary key default gen_random_uuid(),
  course_type text not null check (course_type in ('SHORTEST', 'MOOD', 'PHOTO')),
  request_data jsonb not null check (jsonb_typeof(request_data) = 'object'),
  course_data jsonb not null check (jsonb_typeof(course_data) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  constraint shared_courses_expiry_after_creation check (expires_at is null or expires_at > created_at)
);

create index if not exists shared_courses_expires_at_idx on public.shared_courses (expires_at);

alter table public.shared_courses enable row level security;

drop policy if exists "Public can read active shared courses" on public.shared_courses;
create policy "Public can read active shared courses"
on public.shared_courses
for select
to anon, authenticated
using (expires_at is null or expires_at > now());

comment on table public.shared_courses is 'Anonymous immutable snapshots used by shareable course links.';
