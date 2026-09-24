-- ============================================================================
-- CREATOR NIHAR - REAL PRODUCTION USER MANAGEMENT & RLS MIGRATION (CORRECTED)
-- ============================================================================
-- Note on PostgreSQL RLS Syntax:
-- - FOR INSERT : ONLY "WITH CHECK" (PostgreSQL throws error if USING is present)
-- - FOR SELECT : ONLY "USING" (WITH CHECK not allowed)
-- - FOR UPDATE : "USING" (row qualification) and "WITH CHECK" (new row check)
-- - FOR DELETE : ONLY "USING" (WITH CHECK not allowed)
-- ============================================================================

-- 1. Ensure public schema usage for authenticated & anon roles
grant usage on schema public to authenticated, anon;

-- 2. Grant table privileges on all core tables for authenticated API role
grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.login_activity to authenticated;
grant select, insert, update, delete on table public.videos to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;
grant insert on table public.bookings to anon;

-- 3. Enhance public.is_admin() (tamper-proof JWT email check + profiles check)
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

grant execute on function public.is_admin() to authenticated, anon;

-- 4. Dynamic Auth Trigger: Auto-creates public.profiles on every new auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'user';
  user_name text;
  user_phone text;
begin
  -- Automatically give owner Nihar the admin role; all other users get 'user'
  if lower(trim(new.email)) = 'nhrnhl0507@gmail.com' then
    assigned_role := 'admin';
  else
    assigned_role := 'user';
  end if;

  user_name := coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1));
  user_phone := coalesce(new.raw_user_meta_data->>'phone', '');

  insert into public.profiles (
    id,
    name,
    email,
    phone,
    role,
    status,
    created_at,
    last_login
  )
  values (
    new.id,
    user_name,
    new.email,
    user_phone,
    assigned_role,
    'active',
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = case when excluded.name <> '' then excluded.name else public.profiles.name end,
    phone = case when excluded.phone <> '' then excluded.phone else public.profiles.phone end,
    role = case
      when lower(trim(excluded.email)) = 'nhrnhl0507@gmail.com' then 'admin'
      else public.profiles.role
    end,
    last_login = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Backfill existing auth.users into public.profiles (Owner, Brother, test accounts)
insert into public.profiles (id, name, email, phone, role, status, created_at, last_login)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
  u.email,
  coalesce(u.raw_user_meta_data->>'phone', ''),
  case when lower(trim(u.email)) = 'nhrnhl0507@gmail.com' then 'admin' else 'user' end,
  'active',
  coalesce(u.created_at, now()),
  coalesce(u.last_sign_in_at, u.created_at, now())
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  name = case when excluded.name <> '' and (public.profiles.name = '' or public.profiles.name is null) then excluded.name else public.profiles.name end,
  phone = case when excluded.phone <> '' and (public.profiles.phone = '' or public.profiles.phone is null) then excluded.phone else public.profiles.phone end,
  role = case when lower(trim(public.profiles.email)) = 'nhrnhl0507@gmail.com' then 'admin' else public.profiles.role end;

-- 6. Reinforce RLS on public.profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admin can insert profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admin can update all profiles" on public.profiles;

-- Normal users view only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Admin views ALL user profiles dynamically (no artificial limits)
create policy "Admin can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Users can insert own profile (ONLY WITH CHECK)
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Admin can insert any profile (ONLY WITH CHECK)
create policy "Admin can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

-- Users can update their own profile fields
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    (role is not distinct from (select p.role from public.profiles p where p.id = auth.uid()))
  );

-- Admin can update any profile (e.g. change status)
create policy "Admin can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Reinforce RLS on public.login_activity
alter table public.login_activity enable row level security;

drop policy if exists "Users can log their own activity" on public.login_activity;
drop policy if exists "Users can view own login activity" on public.login_activity;
drop policy if exists "Admin can view all login activity" on public.login_activity;

-- Authenticated user can log their own activity (ONLY WITH CHECK)
create policy "Users can log their own activity"
  on public.login_activity for insert
  to authenticated
  with check (auth.uid() = user_id or public.is_admin());

-- Users can view their own login activity
create policy "Users can view own login activity"
  on public.login_activity for select
  to authenticated
  using (auth.uid() = user_id);

-- Admin can view ALL historical login events dynamically (no artificial limits)
create policy "Admin can view all login activity"
  on public.login_activity for select
  to authenticated
  using (public.is_admin());

-- 8. Reinforce RLS on public.videos
alter table public.videos enable row level security;

drop policy if exists "Authenticated users can view published videos" on public.videos;
drop policy if exists "Admin can view all videos" on public.videos;
drop policy if exists "Only admin can insert videos" on public.videos;
drop policy if exists "Only admin can update videos" on public.videos;
drop policy if exists "Only admin can delete videos" on public.videos;

create policy "Authenticated users can view published videos"
  on public.videos for select
  to authenticated
  using (is_published = true);

create policy "Admin can view all videos"
  on public.videos for select
  to authenticated
  using (public.is_admin());

-- Only admin can insert videos (ONLY WITH CHECK)
create policy "Only admin can insert videos"
  on public.videos for insert
  to authenticated
  with check (public.is_admin());

create policy "Only admin can update videos"
  on public.videos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Only admin can delete videos"
  on public.videos for delete
  to authenticated
  using (public.is_admin());

-- 9. Reinforce RLS on public.bookings
alter table public.bookings enable row level security;

-- 1b. Clean up any dry-run/test records
delete from public.bookings where booking_id in ('TEST-DRYRUN-001', 'DRYRUN-CHECK-002');

drop policy if exists "Anyone can insert booking" on public.bookings;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Admin can view all bookings" on public.bookings;
drop policy if exists "Admin can update bookings" on public.bookings;
drop policy if exists "Admin can delete bookings" on public.bookings;

-- Anyone can insert booking (ONLY WITH CHECK)
create policy "Anyone can insert booking"
  on public.bookings for insert
  with check (true);

create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (
    lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    or lower(trim(email)) = lower(trim((select p.email from public.profiles p where p.id = auth.uid())))
    or public.is_admin()
  );

create policy "Admin can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "Admin can update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());
