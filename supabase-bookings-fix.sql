-- ============================================================================
-- CREATOR NIHAR - SUPABASE BOOKINGS PERMISSION & RLS MIGRATION FIX
-- ============================================================================
-- 1. Remove any dry-run/test records
delete from public.bookings where booking_id in ('TEST-DRYRUN-001', 'DRYRUN-CHECK-002');

-- 2. Ensure schema permissions
grant usage on schema public to authenticated, anon;

-- 3. Table permissions: Authenticated can select, insert, update, delete; Anon can insert
grant select, insert, update, delete on table public.bookings to authenticated;
grant insert on table public.bookings to anon;

-- 4. Enable & reinforce RLS on public.bookings
alter table public.bookings enable row level security;

drop policy if exists "Anyone can insert booking" on public.bookings;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Admin can view all bookings" on public.bookings;
drop policy if exists "Admin can update bookings" on public.bookings;
drop policy if exists "Admin can delete bookings" on public.bookings;

-- Anyone can insert booking (ONLY WITH CHECK)
create policy "Anyone can insert booking"
  on public.bookings for insert
  with check (true);

-- Authenticated users can view their own bookings by email, or admin can view
create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (
    lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    or lower(trim(email)) = lower(trim((select p.email from public.profiles p where p.id = auth.uid())))
    or public.is_admin()
  );

-- Admin can view all bookings dynamically
create policy "Admin can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

-- Admin can update bookings (e.g. change status)
create policy "Admin can update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can delete bookings
create policy "Admin can delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());
