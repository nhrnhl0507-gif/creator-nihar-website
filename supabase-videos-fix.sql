-- ============================================================================
-- CREATOR NIHAR - SUPABASE VIDEOS PERMISSION & RLS MIGRATION FIX
-- ============================================================================
-- Purpose: Resolve "Permission Denied for table Videos" error by granting
-- necessary table-level privileges to 'authenticated' and 'anon' roles,
-- and reinforcing public.is_admin() and RLS policies on public.videos.
-- ============================================================================

-- Step 1: Ensure authenticated and anon roles have SQL schema & table privileges on public.videos
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on table public.videos to authenticated;
grant select on table public.videos to anon;

-- Step 2: Grant sequence privileges if any sequence is attached
grant usage, select on all sequences in schema public to authenticated, anon;

-- Step 3: Ensure public.is_admin() reliably recognizes owner email from JWT, metadata, profiles & auth.users
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Check 1: Owner email in auth token JWT (immediate, signed, bypasses profile sync issues)
  if lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'nhrnhl0507@gmail.com' then
    return true;
  end if;

  -- Check 2: Owner email in JWT user_metadata
  if lower(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'email', ''))) = 'nhrnhl0507@gmail.com' then
    return true;
  end if;

  -- Check 3: Admin role in profiles table
  if exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    return true;
  end if;

  -- Check 4: Owner ID directly in auth.users
  return exists (
    select 1
    from auth.users
    where id = auth.uid() and lower(trim(email)) = 'nhrnhl0507@gmail.com'
  );
end;
$$;

-- Grant execution permission on is_admin() function
grant execute on function public.is_admin() to authenticated, anon;

-- Step 4: Ensure owner's profile exists in public.profiles with role = 'admin'
insert into public.profiles (id, name, email, role, status)
select
  id,
  coalesce(raw_user_meta_data->>'name', 'Nihar Amrawat'),
  email,
  'admin',
  'active'
from auth.users
where lower(trim(email)) = 'nhrnhl0507@gmail.com'
on conflict (id) do update set
  role = 'admin',
  status = 'active';

-- Step 5: Re-verify & re-apply RLS policies on public.videos
alter table public.videos enable row level security;

-- Drop existing video policies to prevent duplicate policy errors
drop policy if exists "Authenticated users can view published videos" on public.videos;
drop policy if exists "Anyone can view published videos" on public.videos;
drop policy if exists "Admin can view all videos" on public.videos;
drop policy if exists "Only admin can insert videos" on public.videos;
drop policy if exists "Only admin can update videos" on public.videos;
drop policy if exists "Only admin can delete videos" on public.videos;

-- 1. Normal authenticated users and guests can view published videos
create policy "Anyone can view published videos"
  on public.videos for select
  using (is_published = true);

-- 2. Admin can view all videos (both published and drafts)
create policy "Admin can view all videos"
  on public.videos for select
  to authenticated
  using (public.is_admin());

-- 3. Only admin can insert videos (ONLY with check, NO using clause)
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

-- Step 6: Ensure Storage bucket for videos has file size limit configured
insert into storage.buckets (id, name, public, file_size_limit)
values ('videos', 'videos', false, 524288000)
on conflict (id) do update set
  file_size_limit = 524288000;

grant usage on schema storage to authenticated, anon;
grant all on all tables in schema storage to authenticated;
