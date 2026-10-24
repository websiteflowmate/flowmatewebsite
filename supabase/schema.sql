-- =====================================================================
-- FLOWMATE - Skema database Supabase (Postgres)
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel semua -> Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------- 1. Tabel ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (username ~ '^[a-z0-9._]{3,20}$'),
  nama        text not null check (char_length(nama) between 1 and 60),
  phone       text check (phone is null or phone ~ '^[0-9+\-\s]{8,16}$'),
  role        text not null default 'pasien' check (role in ('pasien','admin','superadmin')),
  consent_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.screenings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  username      text not null,
  nama          text not null,
  created_at    timestamptz not null default now(),
  tipe          text not null default 'pre' check (tipe in ('pre','post')),   -- pre-test / post-test
  walidd_score  smallint not null check (walidd_score between 0 and 12),
  category      text not null,
  qol_total     smallint not null check (qol_total between 0 and 100),
  has_red_flag  boolean not null default false,
  data          jsonb not null            -- rekaman lengkap: jawaban, rincian skor, rekomendasi
);

create table if not exists public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  entry_date   date not null,
  pain         smallint not null check (pain between 0 and 10),
  flow         text not null check (flow in ('none','spotting','light','medium','heavy')),
  period_start boolean not null default false,
  mood         smallint not null check (mood between 1 and 5),
  sleep        numeric(3,1) not null check (sleep between 0 and 24),
  stress       smallint not null check (stress between 0 and 10),
  symptoms     text[] not null default '{}',
  actions      text[] not null default '{}',
  loc          smallint[] not null default '{0}',   -- lokasi nyeri (0 perut bawah, 1 pinggang/punggung, 2 paha)
  impaired     boolean not null default false,       -- aktivitas terganggu
  note         text check (note is null or char_length(note) <= 300),
  updated_at   timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.actions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  rec_id       text not null,
  title        text not null,
  duration     smallint,
  pain_before  smallint
);

-- Untuk proyek yang sudah terlanjur dibuat dengan versi lama schema ini:
alter table public.screenings add column if not exists tipe text not null default 'pre' check (tipe in ('pre','post'));
alter table public.journal_entries add column if not exists loc smallint[] not null default '{0}';
alter table public.journal_entries add column if not exists impaired boolean not null default false;

create index if not exists screenings_user_idx on public.screenings (user_id, created_at desc);
create index if not exists journal_user_idx    on public.journal_entries (user_id, entry_date desc);
create index if not exists actions_user_idx    on public.actions (user_id, created_at desc);

-- ---------- 2. Fungsi bantu ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','superadmin'));
$$;

create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin');
$$;

-- Dipanggil halaman daftar (tanpa login) untuk cek username
create or replace function public.username_available(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select lower(u) ~ '^[a-z0-9._]{3,20}$'
     and lower(u) not in ('admin','superadmin','root','flowmate')
     and not exists (select 1 from public.profiles where username = lower(u));
$$;

-- Dipanggil ping harian supaya proyek gratis tidak dijeda
create or replace function public.ping() returns text
language sql stable as $$ select 'ok ' || now()::text; $$;

-- ---------- 3. Profil dibuat otomatis saat pendaftaran ----------
-- Peran SELALU 'pasien' di sini. Peran lain hanya bisa diubah superadmin / Edge Function.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text := lower(coalesce(new.raw_user_meta_data->>'username',''));
begin
  if u !~ '^[a-z0-9._]{3,20}$' then raise exception 'Username tidak valid'; end if;
  if u in ('admin','superadmin','root','flowmate') then raise exception 'Username dicadangkan'; end if;
  insert into public.profiles (id, username, nama, role, consent_at)
  values (new.id, u, left(coalesce(nullif(trim(new.raw_user_meta_data->>'nama'),''), u), 60), 'pasien',
          case when (new.raw_user_meta_data->>'consent') = 'true' then now() end);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cegah pengguna mengubah peran / username / waktu persetujuan lewat API
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- SQL Editor / service role: bebas
  if new.id is distinct from old.id or new.username is distinct from old.username
     or new.consent_at is distinct from old.consent_at or new.created_at is distinct from old.created_at then
    raise exception 'Kolom ini tidak boleh diubah';
  end if;
  if new.role is distinct from old.role and not public.is_superadmin() then
    raise exception 'Hanya superadmin yang boleh mengubah peran';
  end if;
  if old.role = 'superadmin' and new.role <> 'superadmin' and old.id = auth.uid() then
    raise exception 'Superadmin tidak boleh menurunkan perannya sendiri';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_trg on public.profiles;
create trigger protect_profile_trg before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- 4. Row Level Security ----------
alter table public.profiles        enable row level security;
alter table public.screenings      enable row level security;
alter table public.journal_entries enable row level security;
alter table public.actions         enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_superadmin()) with check (id = auth.uid() or public.is_superadmin());

drop policy if exists screenings_select on public.screenings;
drop policy if exists screenings_insert on public.screenings;
create policy screenings_select on public.screenings for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy screenings_insert on public.screenings for insert to authenticated with check (user_id = auth.uid());

drop policy if exists journal_select on public.journal_entries;
drop policy if exists journal_insert on public.journal_entries;
drop policy if exists journal_update on public.journal_entries;
drop policy if exists journal_delete on public.journal_entries;
create policy journal_select on public.journal_entries for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy journal_insert on public.journal_entries for insert to authenticated with check (user_id = auth.uid());
create policy journal_update on public.journal_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journal_delete on public.journal_entries for delete to authenticated using (user_id = auth.uid());

drop policy if exists actions_select on public.actions;
drop policy if exists actions_insert on public.actions;
create policy actions_select on public.actions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy actions_insert on public.actions for insert to authenticated with check (user_id = auth.uid());

-- ---------- 5. Hak akses ----------
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.screenings to authenticated;
grant select, insert, update, delete on public.journal_entries to authenticated;
grant select, insert on public.actions to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.ping() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;

-- =====================================================================
-- LANGKAH SETELAH INI (sekali saja): jadikan akunmu superadmin.
-- 1) Buka web FLOWMATE, daftar akun biasa (misal username: owner).
-- 2) Jalankan di SQL Editor (ganti 'owner' dengan username-mu):
--      update public.profiles set role = 'superadmin' where username = 'owner';
-- =====================================================================
