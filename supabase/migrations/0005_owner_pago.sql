-- Sprint 6: permite al propietario registrar sus propios pagos con comprobante

-- ─── Política INSERT en tabla pago ──────────────────────────────────────────
-- El owner puede insertar pagos en facturas de sus propios lotes.
-- El pago entra como estado='pendiente' hasta que el admin confirme.
create policy "owner inserts own pagos" on pago
  for insert with check (
    factura_id in (
      select f.id from factura f
      join lote l on l.id = f.lote_id
      where l.propietario_id = auth.uid()
    )
  );

-- ─── Política INSERT en Storage (comprobantes) ───────────────────────────────
-- El owner puede subir archivos a la carpeta de sus propios lotes.
-- Convención de path: {lote_id}/{factura_id}/{archivo}
create policy "owner uploads own comprobantes" on storage.objects
  for insert with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1]::uuid in (
      select id from lote where propietario_id = auth.uid()
    )
  );
