-- ============================================================================
-- CREATOR NIHAR - SUPABASE VIDEOS PERMISSION & RLS MIGRATION FIX
-- ============================================================================
-- Purpose: Resolve "Permission Denied for table Videos" error by granting
-- necessary table-level privileges to 'authenticated' role and reinforcing
-- public.is_admin() and RLS policies on public.videos.
-- ============================================================================

-- Step 1: Ensure authenticated role has SQL table privileges on public.videos
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.videos to authenticated;

-- Step 2: Ensure public.is_admin() reliably recognizes owner email from JWT & profiles table
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Check 1: Owner email in auth token JWT (immediate, signed, bypasses profile sync issues)
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

-- Grant execution permission on is_admin() function
grant execute on function public.is_admin() to authenticated, anon;

-- Step 3: Ensure owner's profile exists in public.profiles with role = 'admin'
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

-- Step 4: Re-verify & re-apply RLS policies on public.videos
alter table public.videos enable row level security;

-- Drop existing video policies to prevent duplicate policy errors
drop policy if exists "Authenticated users can view published videos" on public.videos;
drop policy if exists "Admin can view all videos" on public.videos;
drop policy if exists "Only admin can insert videos" on public.videos;
drop policy if exists "Only admin can update videos" on public.videos;
drop policy if exists "Only admin can delete videos" on public.videos;

-- 1. Normal authenticated users can only view published videos
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
