-- Sprint 4: tarifas (con tramos y extras) + períodos + facturación + RLS

-- ─── tarifa ──────────────────────────────────────────────────────────────
-- Cada cambio de precio crea una tarifa nueva; nunca se edita una vieja.
-- La vigente para una fecha es la de mayor vigente_desde <= esa fecha.
create table tarifa (
  id uuid primary key default gen_random_uuid(),
  vigente_desde date not null,
  cargo_fijo numeric not null default 0,
  cargo_fijo_vacio numeric, -- null = no se cobra fijo a lotes vacíos/en construcción
  recargo_mora_pct numeric not null default 0,
  created_at timestamptz not null default now()
);

create table tarifa_tramo (
  id uuid primary key default gen_random_uuid(),
  tarifa_id uuid not null references tarifa (id) on delete cascade,
  orden int not null,
  desde_m3 numeric not null,
  hasta_m3 numeric, -- null = sin tope (último tramo)
  precio_m3 numeric not null,
  unique (tarifa_id, orden)
);

create table tarifa_extra (
  id uuid primary key default gen_random_uuid(),
  tarifa_id uuid not null references tarifa (id) on delete cascade,
  tipo text not null, -- normalizado en minúsculas, debe matchear extra.tipo
  monto numeric not null,
  unique (tarifa_id, tipo)
);

-- ─── periodo_facturacion ─────────────────────────────────────────────────
create table periodo_facturacion (
  id uuid primary key default gen_random_uuid(),
  mes int not null check (mes between 1 and 12),
  anio int not null,
  fecha_vencimiento date not null,
  estado text not null default 'abierto' check (estado in ('abierto', 'cerrado')),
  created_at timestamptz not null default now(),
  unique (mes, anio)
);

-- ─── factura ─────────────────────────────────────────────────────────────
create table factura (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lote (id),
  periodo_id uuid not null references periodo_facturacion (id) on delete cascade,
  mes int not null,
  anio int not null,
  consumo_m3 numeric not null default 0,
  detalle_calculo jsonb not null,
  monto_total numeric not null,
  monto_pagado numeric not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'parcial', 'pagada', 'vencida')),
  vencimiento date not null,
  created_at timestamptz not null default now(),
  unique (lote_id, periodo_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table tarifa enable row level security;
alter table tarifa_tramo enable row level security;
alter table tarifa_extra enable row level security;
alter table periodo_facturacion enable row level security;
alter table factura enable row level security;

create policy "admin full access tarifa" on tarifa
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin full access tarifa_tramo" on tarifa_tramo
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin full access tarifa_extra" on tarifa_extra
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin full access periodo" on periodo_facturacion
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin full access factura" on factura
  for all using (public.is_admin()) with check (public.is_admin());
create policy "owner reads own facturas" on factura
  for select using (
    lote_id in (select id from lote where propietario_id = auth.uid())
  );
