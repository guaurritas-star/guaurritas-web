-- Real notes for each pet profile, plus optional public images.
create extension if not exists pgcrypto;

create table if not exists public.pet_notes (
  id uuid primary key default gen_random_uuid(),
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  image_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint pet_notes_message_length
    check (char_length(btrim(message)) between 1 and 220)
);

create index if not exists pet_notes_profile_created_at_idx
  on public.pet_notes (pet_profile_id, created_at desc);

alter table public.pet_notes enable row level security;

drop policy if exists "Signed in users can read pet notes"
  on public.pet_notes;
create policy "Signed in users can read pet notes"
  on public.pet_notes
  for select
  to authenticated
  using (true);

drop policy if exists "Owners can create notes for their pets"
  on public.pet_notes;
create policy "Owners can create notes for their pets"
  on public.pet_notes
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.pet_profiles
      where pet_profiles.id = pet_notes.pet_profile_id
        and pet_profiles.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can update their pet notes"
  on public.pet_notes;
create policy "Owners can update their pet notes"
  on public.pet_notes
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.pet_profiles
      where pet_profiles.id = pet_notes.pet_profile_id
        and pet_profiles.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can delete their pet notes"
  on public.pet_notes;
create policy "Owners can delete their pet notes"
  on public.pet_notes
  for delete
  to authenticated
  using (auth.uid() = owner_id);

grant select, insert, update, delete
  on public.pet_notes
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'pet-note-images',
  'pet-note-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Pet note images are readable"
  on storage.objects;
create policy "Pet note images are readable"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'pet-note-images');

drop policy if exists "Owners can upload pet note images"
  on storage.objects;
create policy "Owners can upload pet note images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pet-note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can delete pet note images"
  on storage.objects;
create policy "Owners can delete pet note images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'pet-note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

