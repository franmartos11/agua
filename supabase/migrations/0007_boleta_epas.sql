-- Boleta EPAS del complejo: en vez de tramos progresivos fijos, el admin puede
-- cargar los m³ y el monto de la factura del macromedidor de EPAS para el
-- período, y el consumo de cada lote se cobra a precio único (regla de tres
-- simple: precio_m3 = epas_monto / epas_m3). Si no se carga, se sigue usando
-- el sistema de tramos de la tarifa vigente (comportamiento actual).
alter table periodo_facturacion add column epas_m3 numeric;
alter table periodo_facturacion add column epas_monto numeric;

comment on column periodo_facturacion.epas_m3 is
  'm³ totales del macromedidor según la boleta de EPAS de este período. null = usar tramos de la tarifa vigente.';
comment on column periodo_facturacion.epas_monto is
  'Monto total de la boleta de EPAS de este período (lo que se pagó por esos m³).';
