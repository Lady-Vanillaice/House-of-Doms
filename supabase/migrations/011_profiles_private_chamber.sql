-- Profiles and private chamber preparation
create table if not exists public.profile_details (
  user_id uuid primary key,
  display_name text,
  role text,
  bio text,
  location text,
  languages text[] default '{}',
  offers text[] default '{}',
  seeks text[] default '{}',
  boundaries text[] default '{}',
  contact_status text default 'open',
  studio_info text,
  is_verified boolean default false,
  visibility text default 'public',
  updated_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid not null,
  last_read_at timestamptz,
  is_blocked boolean default false,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text,
  attachment_type text,
  attachment_path text,
  linked_task_id uuid,
  linked_tribute_id uuid,
  created_at timestamptz default now(),
  edited_at timestamptz
);

alter table public.profile_details enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- RLS policies are added during the Supabase connection step when auth.uid() is wired to real profiles.
