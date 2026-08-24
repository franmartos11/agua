-- Plano del barrio: guarda el polígono de cada lote sobre la imagen del plano
-- (public/planos/los-nosotros.jpg), para dibujarlo coloreado según su estado
-- de pago y hacerlo clickeable en /admin/plano.

-- Array de puntos [{x, y}, ...] en porcentaje (0-100) del ancho/alto de la
-- imagen, en el orden en que se dibuja el contorno. null = todavía no se
-- delimitó ese lote en el plano.
alter table lote add column poligono jsonb;

comment on column lote.poligono is
  'Puntos del polígono del lote sobre la imagen del plano, en % de ancho/alto: [{"x": 12.5, "y": 40.2}, ...]. null si no está delimitado todavía.';

-- No hace falta política RLS nueva: "admin full access lote" (0001_init.sql)
-- ya cubre update sobre esta columna.
