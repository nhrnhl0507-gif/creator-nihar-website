-- ============================================================================
-- CREATOR NIHAR - SUPABASE VIDEO FEEDBACK & VOTING POLL MIGRATION
-- ============================================================================
-- Table: public.video_feedback
-- Enforces: 1 feedback per (video_id, user_id), RLS for users & admin,
-- ON DELETE CASCADE on videos, and optimized indexes.
-- ============================================================================

-- 1. Create table
create table if not exists public.video_feedback (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  poll_response text not null check (poll_response in ('100% — Loved it', '75% — Very Good', '50% — Average', '0% — Not Good')),
  feedback_text text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_video_feedback_video_user unique (video_id, user_id)
);

-- 2. Indexes for high-performance querying & analytics
create index if not exists idx_video_feedback_video on public.video_feedback(video_id);
create index if not exists idx_video_feedback_user on public.video_feedback(user_id);
create index if not exists idx_video_feedback_rating on public.video_feedback(rating);
create index if not exists idx_video_feedback_poll on public.video_feedback(poll_response);
create index if not exists idx_video_feedback_created on public.video_feedback(created_at desc);

-- 3. Schema & table grants
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on table public.video_feedback to authenticated;
grant select on table public.video_feedback to anon;
grant usage, select on all sequences in schema public to authenticated, anon;

-- 4. Enable Row Level Security (RLS)
alter table public.video_feedback enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can insert own feedback" on public.video_feedback;
drop policy if exists "Users can view own feedback or admin view all" on public.video_feedback;
drop policy if exists "Users can update own feedback or admin update" on public.video_feedback;
drop policy if exists "Users or admin can delete feedback" on public.video_feedback;

-- 5. RLS Policies
-- Users can only insert their own feedback (auth.uid() = user_id)
create policy "Users can insert own feedback"
  on public.video_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can view only their own feedback; Admin can view all feedback
create policy "Users can view own feedback or admin view all"
  on public.video_feedback for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- Users can update only their own feedback; Admin can update
create policy "Users can update own feedback or admin update"
  on public.video_feedback for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Users can delete their own feedback; Admin can delete any
create policy "Users or admin can delete feedback"
  on public.video_feedback for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());
