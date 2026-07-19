-- ============================================================
-- COPY EVERYTHING BELOW → Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- STEP A: Unblock signup immediately (removes the broken trigger)
drop trigger if exists on_auth_user_created on auth.users;

-- STEP B: Add the missing column that caused the failure
alter table public.profiles
  add column if not exists status text not null default 'active';

alter table public.profiles
  add column if not exists phone_number text;

alter table public.profiles
  add column if not exists department text not null default 'General';

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

update public.profiles set status = 'active' where status is null or status = 'pending';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending', 'active', 'rejected', 'disabled'));

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- STEP C: Safe trigger that never blocks auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, department, role, status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    coalesce(nullif(new.raw_user_meta_data->>'department', ''), 'General'),
    case
      when lower(coalesce(new.raw_user_meta_data->>'role', 'user')) = 'admin' then 'admin'
      else 'user'
    end,
    'active'
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
