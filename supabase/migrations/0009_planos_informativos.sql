-- Sprint 12: planos informativos del barrio (cloacas, red de agua). A
-- diferencia del plano del barrio (que tiene el polígono de cada lote y su
-- estado de pago, ver lote.poligono), estos son simples archivos de
-- referencia que el admin sube y reemplaza — no tienen lotes ni estados.

create table plano_informativo (
  tipo text primary key check (tipo in ('cloacas', 'red_agua')),
  storage_path text not null,
  nombre_archivo text not null,
  updated_at timestamptz not null default now()
);

alter table plano_informativo enable row level security;

create policy "admin full access plano_informativo" on plano_informativo
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Storage: planos informativos ──────────────────────────────────────────
-- Bucket público: son diagramas de referencia de la infraestructura del
-- barrio, no datos sensibles como los comprobantes de pago.
insert into storage.buckets (id, name, public)
values ('planos-informativos', 'planos-informativos', true)
on conflict (id) do nothing;

create policy "admin full access planos-informativos" on storage.objects
  for all using (bucket_id = 'planos-informativos' and public.is_admin())
  with check (bucket_id = 'planos-informativos' and public.is_admin());
