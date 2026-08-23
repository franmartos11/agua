-- Sprint 1: perfiles, lotes, extras, medidores + RLS

create extension if not exists "pgcrypto";

-- ─── perfil ──────────────────────────────────────────────────────────────
-- Un perfil por usuario de auth.users. rol = 'admin' | 'owner'.
create table perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('admin', 'owner')),
  nombre text not null,
  email text not null,
  telefono text,
  created_at timestamptz not null default now()
);

-- Se crea automáticamente cuando se invita/registra un usuario en auth.users.
-- rol y nombre vienen en las opciones de invitación (options.data en inviteUserByEmail).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfil (id, rol, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'rol', 'owner'),
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Chequea el rol sin recursión de RLS (security definer bypasea RLS de perfil).
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfil where id = auth.uid() and rol = 'admin'
  );
$$;

-- ─── lote ────────────────────────────────────────────────────────────────
create table lote (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  direccion text,
  propietario_id uuid references perfil (id) on delete set null,
  estado text not null default 'ocupado' check (estado in ('ocupado', 'vacio', 'construccion')),
  superficie_m2 numeric,
  created_at timestamptz not null default now()
);

-- ─── extra ───────────────────────────────────────────────────────────────
-- Catálogo abierto de características que afectan el cobro (pileta, jardín, etc.)
create table extra (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lote (id) on delete cascade,
  tipo text not null,
  vigente_desde date not null default current_date,
  vigente_hasta date,
  created_at timestamptz not null default now()
);

-- ─── medidor ─────────────────────────────────────────────────────────────
create table medidor (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lote (id) on delete cascade,
  numero_serie text not null unique,
  tipo text not null default 'principal' check (tipo in ('principal', 'riego')),
  fecha_instalacion date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table perfil enable row level security;
alter table lote enable row level security;
alter table extra enable row level security;
alter table medidor enable row level security;

create policy "admin full access perfil" on perfil
  for all using (public.is_admin()) with check (public.is_admin());
create policy "owner reads own perfil" on perfil
  for select using (id = auth.uid());

create policy "admin full access lote" on lote
  for all using (public.is_admin()) with check (public.is_admin());
create policy "owner reads own lotes" on lote
  for select using (propietario_id = auth.uid());

create policy "admin full access extra" on extra
  for all using (public.is_admin()) with check (public.is_admin());
create policy "owner reads own extras" on extra
  for select using (
    lote_id in (select id from lote where propietario_id = auth.uid())
  );

create policy "admin full access medidor" on medidor
  for all using (public.is_admin()) with check (public.is_admin());
create policy "owner reads own medidores" on medidor
  for select using (
    lote_id in (select id from lote where propietario_id = auth.uid())
  );

-- ─── Primer admin ────────────────────────────────────────────────────────
-- 1. Invitá a la administradora desde el Dashboard de Supabase (Authentication > Users > Invite user),
--    o hacé login una vez con su email para que se dispare el trigger y cree el perfil.
-- 2. Después corré esto una sola vez para promoverla a admin:
--    update perfil set rol = 'admin' where email = 'EMAIL_DE_LA_ADMINISTRADORA';
