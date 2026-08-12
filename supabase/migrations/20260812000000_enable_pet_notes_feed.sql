-- Authenticated community members can read public pet profiles in the notes feed.
grant select on public.pet_profiles to authenticated;

drop policy if exists "Authenticated users can read pet profiles"
  on public.pet_profiles;
create policy "Authenticated users can read pet profiles"
  on public.pet_profiles
  for select
  to authenticated
  using (true);

create index if not exists pet_notes_created_at_idx
  on public.pet_notes (created_at desc);
