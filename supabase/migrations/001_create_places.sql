create table if not exists public.places (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('RESTAURANT', 'CAFE', 'ACTIVITY', 'PHOTO_SPOT', 'WALK')),
  latitude double precision not null check (latitude > 37.535 and latitude < 37.550),
  longitude double precision not null check (longitude > 127.040 and longitude < 127.070),
  address text not null check (length(trim(address)) > 0),
  avg_price integer not null check (avg_price >= 0),
  avg_stay_duration_min integer not null check (avg_stay_duration_min > 0),
  tags text[] not null default '{}',
  indoor boolean not null,
  opening_hours jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
  data_status text not null check (data_status in ('VERIFIED', 'PARTIAL', 'ESTIMATED')),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  price_source_type text not null check (price_source_type in ('OFFICIAL', 'THIRD_PARTY', 'EDITORIAL_ESTIMATE', 'NOT_APPLICABLE')),
  opening_hours_source_type text not null check (opening_hours_source_type in ('OFFICIAL', 'THIRD_PARTY', 'ESTIMATED', 'NOT_APPLICABLE')),
  last_verified_at date not null,
  valid_from date,
  valid_until date,
  score_source text not null check (score_source = 'EDITORIAL'),
  scores jsonb not null check (
    jsonb_typeof(scores) = 'object'
    and scores ?& array['romantic', 'instagram', 'quiet', 'activity', 'value', 'photo', 'rain']
    and (scores->>'romantic')::numeric between 0 and 5
    and (scores->>'instagram')::numeric between 0 and 5
    and (scores->>'quiet')::numeric between 0 and 5
    and (scores->>'activity')::numeric between 0 and 5
    and (scores->>'value')::numeric between 0 and 5
    and (scores->>'photo')::numeric between 0 and 5
    and (scores->>'rain')::numeric between 0 and 5
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_valid_date_range check (valid_from is null or valid_until is null or valid_from <= valid_until),
  constraint places_public_hours_consistency check (
    opening_hours_source_type <> 'NOT_APPLICABLE' or opening_hours = '[]'::jsonb
  )
);

create index if not exists places_category_idx on public.places (category);
create index if not exists places_valid_until_idx on public.places (valid_until);
create index if not exists places_coordinates_idx on public.places (latitude, longitude);

alter table public.places enable row level security;

drop policy if exists "Public can read active places" on public.places;
create policy "Public can read active places"
on public.places
for select
to anon, authenticated
using (
  (valid_from is null or valid_from <= current_date)
  and (valid_until is null or valid_until >= current_date)
);

comment on table public.places is 'Curated Seongsu place records used by the course recommendation engine.';
