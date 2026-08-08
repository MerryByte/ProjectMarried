create table if not exists public.rsvps (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_name text not null check (char_length(family_name) between 1 and 100),
  contact_email text not null,
  attending boolean not null default true,
  adult_count integer not null default 1 check (adult_count between 0 and 20),
  child_count integer not null default 0 check (child_count between 0 and 20),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not attending or adult_count + child_count > 0)
);

alter table public.rsvps add column if not exists contact_email text;

update public.rsvps r
set contact_email = u.email
from auth.users u
where u.id = r.user_id
  and r.contact_email is null;

alter table public.rsvps alter column contact_email set not null;

create or replace function public.set_rsvp_contact_email()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.contact_email := auth.jwt() ->> 'email';
  return new;
end;
$$;

revoke all on function public.set_rsvp_contact_email() from public, anon, authenticated;

drop trigger if exists set_rsvp_contact_email on public.rsvps;
create trigger set_rsvp_contact_email
before insert or update on public.rsvps
for each row execute function public.set_rsvp_contact_email();

alter table public.rsvps enable row level security;
grant select, insert, update on public.rsvps to authenticated;
drop policy if exists "Families can view their RSVP" on public.rsvps;
create policy "Families can view their RSVP" on public.rsvps for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Families can create their RSVP" on public.rsvps;
create policy "Families can create their RSVP" on public.rsvps for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Families can update their RSVP" on public.rsvps;
create policy "Families can update their RSVP" on public.rsvps for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Gallery admin can view RSVPs" on public.rsvps;
create policy "Gallery admin can view RSVPs" on public.rsvps for select to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'gallery_admin')::boolean,false));
