-- Create users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  age int not null,
  gender text not null check (gender in ('male', 'female', 'non-binary')),
  target_gender text not null check (target_gender in ('male', 'female', 'non-binary', 'everyone')),
  instagram_id text not null,
  status text not null default 'online' check (status in ('online', 'matching', 'matched', 'offline')),
  partner_id uuid references public.users(id),
  last_seen timestamp with time zone default timezone('utc'::text, now())
);

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_id uuid references public.users(id) not null,
  receiver_id uuid references public.users(id) not null,
  content text not null,
  is_system boolean default false
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.messages enable row level security;

-- Policies (Simplified for prototype: allow public access for now as auth is handled via custom logic not Supabase Auth)
create policy "Allow all access to users" on public.users for all using (true) with check (true);
create policy "Allow all access to messages" on public.messages for all using (true) with check (true);

-- Function to find a match
create or replace function find_match(user_id uuid)
returns table (matched_user_id uuid, success boolean)
language plpgsql
as $$
declare
  u_gender text;
  u_target text;
  u_age int;
  potential_partner_id uuid;
begin
  -- Get current user details
  select gender, target_gender, age into u_gender, u_target, u_age from users where id = user_id;
  
  -- Update status to matching
  update users set status = 'matching', last_seen = now() where id = user_id;

  -- Find a potential partner who is 'matching', matches gender preference, and is not the same user
  -- Basic logic: 
  -- 1. Their target_gender matches my gender (or is everyone)
  -- 2. My target_gender matches their gender (or is everyone)
  -- 3. Age gap is reasonable? (Optional, let's keep it simple for now)
  
  select id into potential_partner_id
  from users
  where status = 'matching'
    and id != user_id
    and (target_gender = 'everyone' or target_gender = u_gender)
    and (u_target = 'everyone' or gender = u_target)
    and last_seen > now() - interval '1 minute' -- Only active users
  limit 1
  for update skip locked; -- prevent race conditions

  if potential_partner_id is not null then
    -- Update both users to 'matched' and set partner_id
    update users set status = 'matched', partner_id = potential_partner_id where id = user_id;
    update users set status = 'matched', partner_id = user_id where id = potential_partner_id;
    
    return query select potential_partner_id, true;
  else
    return query select null::uuid, false;
  end if;
end;
$$;

-- Enable Realtime for these tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.messages, public.users;
commit;
