-- Sprint 3: lecturas de medidores + RLS

create table lectura (
  id uuid primary key default gen_random_uuid(),
  medidor_id uuid not null references medidor (id) on delete cascade,
  valor numeric not null check (valor >= 0),
  fecha date not null default current_date,
  fuente text not null default 'manual' check (fuente in ('manual', 'importado', 'api')),
  cargado_por uuid references perfil (id),
  foto_url text,
  created_at timestamptz not null default now()
);

create index lectura_medidor_fecha_idx on lectura (medidor_id, fecha desc);

alter table lectura enable row level security;

create policy "admin full access lectura" on lectura
  for all using (public.is_admin()) with check (public.is_admin());

create policy "owner reads own lecturas" on lectura
  for select using (
    medidor_id in (
      select m.id from medidor m
      join lote l on l.id = m.lote_id
      where l.propietario_id = auth.uid()
    )
  );
