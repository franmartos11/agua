-- Sprint 10: recargo por mora configurable por tramos de días de atraso,
-- reemplaza el porcentaje fijo único de tarifa.recargo_mora_pct (columna que
-- queda en la tabla sin usarse, ya no rompe nada leerla ni dejarla en 0).
-- El recorrido de facturas vencidas para aplicar/actualizar el recargo ya no
-- lo dispara un botón manual: corre solo, ver app/api/cron/revisar-vencimientos.

create table regla_mora (
  id uuid primary key default gen_random_uuid(),
  dias_desde integer not null check (dias_desde >= 0),
  recargo_pct numeric not null check (recargo_pct >= 0),
  created_at timestamptz not null default now(),
  unique (dias_desde)
);

alter table regla_mora enable row level security;

create policy "admin full access regla_mora" on regla_mora
  for all using (public.is_admin()) with check (public.is_admin());
