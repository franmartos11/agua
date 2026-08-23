-- Sprint 5: pagos (registro manual, listo para sumar Mercado Pago después) + Storage de comprobantes

create table pago (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references factura (id) on delete cascade,
  monto numeric not null check (monto > 0),
  fecha date not null default current_date,
  metodo text not null check (metodo in ('transferencia', 'efectivo', 'mercado_pago')),
  comprobante_url text,
  referencia_externa text, -- para conciliación automática cuando se sume Mercado Pago
  estado text not null default 'confirmado' check (estado in ('confirmado', 'pendiente')),
  registrado_por uuid references perfil (id),
  created_at timestamptz not null default now()
);

create index pago_factura_idx on pago (factura_id);

alter table pago enable row level security;

create policy "admin full access pago" on pago
  for all using (public.is_admin()) with check (public.is_admin());

create policy "owner reads own pagos" on pago
  for select using (
    factura_id in (
      select f.id from factura f
      join lote l on l.id = f.lote_id
      where l.propietario_id = auth.uid()
    )
  );

-- ─── Storage: comprobantes de pago ─────────────────────────────────────────
-- Convención de path: {lote_id}/{factura_id}/{archivo}
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "admin full access comprobantes" on storage.objects
  for all using (bucket_id = 'comprobantes' and public.is_admin())
  with check (bucket_id = 'comprobantes' and public.is_admin());

create policy "owner reads own comprobantes" on storage.objects
  for select using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1]::uuid in (
      select id from lote where propietario_id = auth.uid()
    )
  );
