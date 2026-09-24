-- ============================================================================
-- CREATOR NIHAR - SUPABASE DATABASE SCHEMA, RLS & STORAGE CONFIGURATION
-- ============================================================================
-- Execute this entire script in the Supabase SQL Editor:
-- Project Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  email text not null,
  phone text default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  last_login timestamptz default now()
);

-- Index on email & role for quick lookups
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================================================
-- 2. LOGIN ACTIVITY TABLE
-- ============================================================================
create table if not exists public.login_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  device_info text default 'Desktop / Web Browser',
  created_at timestamptz not null default now()
);

create index if not exists idx_login_activity_user on public.login_activity(user_id);
create index if not exists idx_login_activity_time on public.login_activity(created_at desc);

-- ============================================================================
-- 3. VIDEOS TABLE (AI VIDEO LEARNING)
-- ============================================================================
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  video_url text not null,
  thumbnail_url text default '',
  category text not null default 'AI Video Creation',
  lesson_number int not null default 1,
  duration text default '10:00',
  tags text[] default '{}'::text[],
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_published on public.videos(is_published, lesson_number);
create index if not exists idx_videos_category on public.videos(category);

-- ============================================================================
-- 4. BOOKINGS TABLE (INTEGRATION WITH SHIVA AI & CONSULTATION)
-- ============================================================================
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  booking_id text unique not null,
  name text not null,
  email text not null,
  phone text default '',
  service text not null,
  project text default '',
  details text default '',
  budget text default '',
  deadline text default '',
  additional text default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_email on public.bookings(email);
create index if not exists idx_bookings_created on public.bookings(created_at desc);

-- ============================================================================
-- 5. HELPER FUNCTION: IS_ADMIN()
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Check 1: Owner email in auth token JWT
  if lower(coalesce(auth.jwt() ->> 'email', '')) = 'nhrnhl0507@gmail.com' then
    return true;
  end if;

  -- Check 2: Admin role in profiles table
  return exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ============================================================================
-- 6. AUTH TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- Auto-assigns role = 'admin' to nhrnhl0507@gmail.com; ALL others get 'user'
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'user';
begin
  -- Automatically give owner Nihar the admin role securely
  if lower(trim(new.email)) = 'nhrnhl0507@gmail.com' then
    assigned_role := 'admin';
  else
    assigned_role := 'user';
  end if;

  insert into public.profiles (id, name, email, phone, role, status, created_at, last_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    assigned_role,
    'active',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = case when excluded.name <> '' then excluded.name else profiles.name end,
    phone = case when excluded.phone <> '' then excluded.phone else profiles.phone end,
    last_login = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to update updated_at on videos
create or replace function public.set_videos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_videos_updated on public.videos;
create trigger on_videos_updated
  before update on public.videos
  for each row execute function public.set_videos_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- --- A. PROFILES POLICIES ---
alter table public.profiles enable row level security;

-- 1. Users can view own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 2. Admin can view all profiles
create policy "Admin can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- 3. Users can update own profile (restricted: cannot self-elevate role or change status)
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select p.role from public.profiles p where p.id = auth.uid()) and
    status = (select p.status from public.profiles p where p.id = auth.uid())
  );

-- 4. Admin can update any profile (change status or role)
create policy "Admin can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

-- --- B. LOGIN ACTIVITY POLICIES ---
alter table public.login_activity enable row level security;

-- 1. Authenticated user can log their own activity
create policy "Users can log their own activity"
  on public.login_activity for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 2. Users can view their own login activity
create policy "Users can view own login activity"
  on public.login_activity for select
  to authenticated
  using (auth.uid() = user_id);

-- 3. Admin can view all login activity
create policy "Admin can view all login activity"
  on public.login_activity for select
  to authenticated
  using (public.is_admin());

-- --- C. VIDEOS POLICIES ---
alter table public.videos enable row level security;

-- 1. Authenticated users can view published videos
create policy "Authenticated users can view published videos"
  on public.videos for select
  to authenticated
  using (is_published = true);

-- 2. Admin can view all videos (both published and drafts)
create policy "Admin can view all videos"
  on public.videos for select
  to authenticated
  using (public.is_admin());

-- 3. Only admin can insert videos
create policy "Only admin can insert videos"
  on public.videos for insert
  to authenticated
  with check (public.is_admin());

-- 4. Only admin can update videos
create policy "Only admin can update videos"
  on public.videos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Only admin can delete videos
create policy "Only admin can delete videos"
  on public.videos for delete
  to authenticated
  using (public.is_admin());

-- Table privileges: authenticated role needs SQL permissions on public.videos (RLS enforces row-level policies)
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.videos to authenticated;

-- --- D. BOOKINGS POLICIES ---
alter table public.bookings enable row level security;

-- 1. Anyone (client from website or Shiva) can create a booking
create policy "Anyone can insert booking"
  on public.bookings for insert
  with check (true);

-- 2. Users can view their own bookings by matching email
create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (
    email = (select p.email from public.profiles p where p.id = auth.uid())
    or public.is_admin()
  );

-- 3. Admin can view all bookings
create policy "Admin can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

-- 4. Admin can update bookings (e.g. change status)
create policy "Admin can update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin());

-- 5. Admin can delete bookings
create policy "Admin can delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- 8. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

-- Create 'videos' and 'thumbnails' storage buckets if not already present
insert into storage.buckets (id, name, public)
values
  ('videos', 'videos', false),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do update set public = excluded.public;

-- Drop existing storage policies if re-running
drop policy if exists "Authenticated users can view videos" on storage.objects;
drop policy if exists "Public can view thumbnails" on storage.objects;
drop policy if exists "Admin can upload videos" on storage.objects;
drop policy if exists "Admin can update videos" on storage.objects;
drop policy if exists "Admin can delete videos" on storage.objects;
drop policy if exists "Admin can upload thumbnails" on storage.objects;
drop policy if exists "Admin can update thumbnails" on storage.objects;
drop policy if exists "Admin can delete thumbnails" on storage.objects;

-- Read policies:
create policy "Authenticated users can view videos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'videos');

create policy "Public can view thumbnails"
  on storage.objects for select
  to public
  using (bucket_id = 'thumbnails');

-- Admin write policies for videos:
create policy "Admin can upload videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos' and public.is_admin());

create policy "Admin can update videos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'videos' and public.is_admin());

create policy "Admin can delete videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'videos' and public.is_admin());

-- Admin write policies for thumbnails:
create policy "Admin can upload thumbnails"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admin can update thumbnails"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admin can delete thumbnails"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

-- ============================================================================
-- 9. SEED INITIAL SAMPLE LESSON (DRAFT FOR ADMIN TO REVIEW & PUBLISH)
-- ============================================================================
insert into public.videos (title, description, video_url, category, lesson_number, duration, tags, is_published)
values (
  'Mastering AI Video Prompts & High-Impact Visuals',
  'Comprehensive introduction to generating photorealistic AI video assets, cinematic camera prompts, and pacing for commercial client work.',
  'https://assets.mixkit.co/videos/preview/mixkit-futuristic-robotic-face-close-up-animation-43187-large.mp4',
  'AI Video Creation',
  1,
  '12:45',
  array['AI Video', 'Prompts', 'Cinematics', 'Creator Nihar'],
  true
) on conflict do nothing;
