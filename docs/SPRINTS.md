# Plan de sprints — MVP

Basado en [REQUIREMENTS.md](./REQUIREMENTS.md). Sprints de alcance funcional (no de tiempo fijo) — cada uno cierra con algo demostrable.

## Sprint 1 — Fundaciones
- Dependencias: `@supabase/supabase-js`, `@supabase/ssr`.
- Schema SQL inicial (migraciones): `propietario`, `lote`, `extra`, `medidor`, con RLS.
- Supabase Auth: login, invitación por email, roles (`admin` / `owner`).
- Middleware de protección de rutas por rol.
- Layout base: `app/(admin)/...` y `app/(owner)/...` con navegación mínima.
- **Entregable**: se puede loguear un admin y un propietario, cada uno cae en su layout, sin datos todavía.

## Sprint 2 — Panel Admin: Lotes, Propietarios, Medidores
- CRUD de propietarios (alta dispara invitación).
- CRUD de lotes (asignar propietario, estado, extras como pileta/jardín).
- CRUD de medidores (asociar a lote).
- **Entregable**: la admin carga el barrio completo (lotes + propietarios + medidores) desde el panel.

## Sprint 3 — Lecturas
- Tabla `lectura` + carga manual individual.
- Importación masiva por CSV/Excel con preview y validación (consumo negativo o anómalo respecto al histórico).
- Historial de lecturas por medidor.
- **Entregable**: se puede cargar un período completo de lecturas, manual o por archivo.

## Sprint 4 — Tarifas y Facturación
- Tabla `tarifa` con vigencia histórica (precio m³, cargo fijo, monto por tipo de extra).
- Generación de `factura` por período: cálculo automático + desglose visible.
- Vista admin de facturación del período (todas las facturas generadas, estado).
- **Entregable**: la admin cierra un período y se generan todas las facturas con el cálculo correcto.

## Sprint 5 — Pagos y Panel Propietario
- Registro manual de pagos contra una factura (monto, método, comprobante a Storage).
- Estados de factura (pendiente/parcial/pagada/vencida).
- Panel propietario: sus lotes, lecturas, facturas (con desglose) y pagos.
- **Entregable**: ciclo completo lectura → factura → pago, visible también desde el lado del propietario.

## Sprint 6 — Reportes, PDF y pulido
- Factura descargable en PDF.
- Reportes admin: consumo por lote/período, morosidad, recaudación (con export Excel/PDF).
- Trazabilidad (`created_by`/`created_at` visibles donde aplique).
- Responsive pass + QA end-to-end del flujo completo.
- **Entregable**: MVP completo, listo para uso real por la administradora.

## Fase 2 (post-MVP, ya confirmada)
- **Sprint 7**: integración Mercado Pago (checkout desde panel propietario + webhook de conciliación).
- **Sprint 8**: integración de medidores inteligentes (según proveedor que se defina).

## Fase 3 (a evaluar)
- Notificaciones (email / WhatsApp).
- Co-titularidad de lotes.
- Roles de administración adicionales.

---

## Estado Sprint 1

**Hecho** (compila y tipa limpio, `next build` verificado):
- Dependencias `@supabase/supabase-js` + `@supabase/ssr`.
- Migración SQL completa: `perfil`, `lote`, `extra`, `medidor` + RLS + trigger de alta de usuario + `is_admin()` — [supabase/migrations/0001_init.sql](../supabase/migrations/0001_init.sql).
- Clientes Supabase: browser, server, admin (service role) — [lib/supabase/](../lib/supabase/).
- `proxy.ts` (reemplaza `middleware.ts` en Next 16): protege rutas, redirige por rol.
- Login (`/login`), invitación por email (`/auth/confirm` + `/actualizar-password`), logout.
- `/admin` y `/propietario`: layouts con guard de rol + dashboards placeholder.

**Pendiente para cerrar el sprint** (bloqueado por credenciales reales):
1. Crear el proyecto en supabase.com y pasar `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` → van en `.env.local` (copiar de `.env.local.example`).
2. Aplicar la migración: pegar [0001_init.sql](../supabase/migrations/0001_init.sql) en el SQL Editor de Supabase, o `npx supabase link --project-ref <ref>` + `npx supabase db push`.
3. Invitar a la administradora desde el Dashboard de Supabase (Authentication → Users → Invite) y correr el `update perfil set rol = 'admin' where email = '...'` que está al final de la migración.
4. `npm run dev` y probar el login real de punta a punta.
5. Generar tipos: `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts` y volver a tipar los clientes en `lib/supabase/*.ts`.

Node local es v20.16 — Next 16 y Supabase ya avisan que quieren 20.19+/22+. No rompe nada todavía, pero conviene actualizar Node antes de que sea bloqueante.

## Estado Sprint 2

**Hecho** (compila y tipa limpio, `next build` verificado):
- `/admin/propietarios`: listado + invitación por email (usa el admin client con service role → `auth.admin.inviteUserByEmail`, dispara el trigger que crea el `perfil`).
- `/admin/propietarios/[id]`: editar nombre/teléfono, ver lotes asociados, eliminar (borra el usuario de auth; sus lotes quedan sin propietario — `on delete set null` agregado a la FK en la migración).
- `/admin/lotes`: listado + alta (número, dirección, superficie, estado, propietario opcional).
- `/admin/lotes/[id]`: editar lote, gestionar extras (alta/baja lógica — se preserva el histórico con `vigente_hasta` en vez de borrar), gestionar medidores (alta, activar/desactivar), eliminar lote.

**Pendiente para cerrar el sprint** (además de lo que ya bloqueaba el Sprint 1):
- En el Dashboard de Supabase, **Authentication → Email Templates → Invite user**: el link de confirmación por defecto no apunta a `/auth/confirm`. Hay que editar el template para que el botón use:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/actualizar-password`
  Sin este paso, el link del mail de invitación no va a completar el login.
- Probar el flujo completo con datos reales: invitar un propietario, crear un lote, asignarlo, agregar pileta y un medidor.

## Estado Sprint 3

**Hecho** (compila y tipa limpio, `next build` verificado):
- Tabla `lectura` + RLS — [supabase/migrations/0002_lecturas.sql](../supabase/migrations/0002_lecturas.sql).
- `/admin/medidores/[id]`: carga manual de lectura (valida que no sea menor a la última) + historial.
- `/admin/lecturas`: importación masiva por CSV (`numero_serie,valor,fecha`) — matchea medidor por serie, rechaza consumo negativo, marca como advertencia (pero igual importa) consumo mayor a 500 m³ contra la lectura anterior.
- Parser CSV propio en [lib/csv.ts](../lib/csv.ts) (sin dependencias nuevas).

**Pendiente**: correrlo contra datos reales una vez conectado Supabase — el umbral de 500 m³ para advertencias es un valor arbitrario de arranque, hay que ajustarlo con consumos reales del barrio.

## Estado Sprint 4

Decisiones de negocio confirmadas: tramos progresivos de consumo, recargo por mora como % único (no acumulativo, se aplica una vez sobre el saldo cuando la factura queda vencida — implementado en `lib/facturacion.ts` pero **todavía no disparado automáticamente**, ver pendientes), cargo fijo para lotes vacíos/en construcción configurable por tarifa (puede ser igual, menor, o "no cobra").

**Hecho** (compila y tipa limpio, `next build` verificado):
- Tablas `tarifa`, `tarifa_tramo`, `tarifa_extra`, `periodo_facturacion`, `factura` + RLS — [supabase/migrations/0003_facturacion.sql](../supabase/migrations/0003_facturacion.sql).
- Cálculo puro y testeable en [lib/facturacion.ts](../lib/facturacion.ts): reparte consumo entre tramos progresivos, aplica cargo fijo según estado del lote, suma extras vigentes por tipo.
- `/admin/tarifas`: alta de tarifas con builder de tramos y extras (nunca se edita una tarifa vieja, cada cambio crea una nueva vigente desde una fecha).
- `/admin/periodos`: alta de períodos (mes/año/vencimiento).
- `/admin/periodos/[id]`: **Generar/regenerar facturación** — recorre todos los lotes, calcula consumo (última lectura ≤ vencimiento del período, menos la anterior a esa, sumado entre medidores activos del lote), aplica la tarifa vigente a esa fecha, guarda el desglose completo en `factura.detalle_calculo`. **Cerrar período** bloquea la regeneración.

**Pendiente / simplificaciones a revisar con datos reales**:
- El recargo por mora está calculado en `lib/facturacion.ts` (`calcularRecargoMora`) pero nada lo dispara todavía — falta un cron/acción que revise facturas vencidas y aplique el recargo. Lo dejo para cuando exista un flujo de "marcar vencidas" (probablemente junto con Sprint 5, al ver pagos).
- Si un lote no tiene lectura anterior a la del período (primera lectura), el consumo de ese medidor se toma como 0 y se marca `sin_lectura_base: true` en el detalle — hay que revisarlo a mano antes de mandar esa factura.
- La tarifa "vigente" para un período es la de mayor `vigente_desde` ≤ la fecha de vencimiento del período — asumido así porque no hay UI para cerrar vigencia de tarifas viejas; si preferís otra regla (ej. la fecha de generación en vez de vencimiento) es un cambio de una línea.

## Estado Sprint 5

**Hecho** (compila y tipa limpio, `next build` verificado): ciclo completo lectura → factura → pago cerrado, en ambos paneles.
- Tabla `pago` + bucket de Storage `comprobantes` (privado, con RLS por lote) — [supabase/migrations/0004_pagos.sql](../supabase/migrations/0004_pagos.sql).
- `/admin/facturas/[id]`: desglose completo de la factura (reutilizable, ver `components/factura-detalle.tsx`), registrar pago (con comprobante opcional a Storage), historial de pagos con link firmado de 1h para ver el comprobante.
- `/admin/pagos` ("Cobranzas"): todas las facturas pendientes/parciales/vencidas del sistema + botón **Revisar vencimientos**, que aplica el recargo por mora (pendiente desde Sprint 4) de forma idempotente.
- `/propietario` y `/propietario/facturas[/[id]]`: el propietario ve sus lotes, saldo total, historial de facturas y el mismo desglose que ve la admin (sin el formulario de pago). Todo protegido por RLS, no por lógica de la app.

**Pendiente / a decidir**:
- Sigue sin probarse contra una base real — recién ahí se va a notar si algo del cálculo o las políticas de RLS necesita ajuste.

## Estado Sprint 6 — MVP completo

Para el PDF no sumé ninguna librería: hay un botón "Descargar / imprimir PDF" que usa el motor de impresión del navegador (`window.print()`) sobre una vista con el nav/header ocultos vía CSS (`print:hidden`) y el tema forzado a claro al imprimir. Cubre el caso de uso (mandar/guardar la factura en PDF) sin agregar peso ni dependencias nuevas — si más adelante hace falta un PDF con diseño más prolijo o generado en el servidor (para adjuntar en un mail automático, por ejemplo), ahí sí conviene sumar `@react-pdf/renderer` o similar.

**Hecho** (compila y tipa limpio, `next build` verificado) — con esto el MVP completo de REQUIREMENTS.md está construido:
- `/admin/reportes`: recaudación total y por período, morosidad por propietario (facturas sin pagar + saldo), consumo y facturación por lote/período con **exportación a CSV** (se abre bien en Excel) — [components/export-csv-button.tsx](../components/export-csv-button.tsx).
- Botón "Descargar / imprimir PDF" en factura (admin y propietario) y en reportes — [components/print-button.tsx](../components/print-button.tsx).
- Trazabilidad visible: "cargado por" en el historial de lecturas, "registrado por" en el historial de pagos (ambos ya se guardaban desde los Sprints 3 y 5, faltaba mostrarlos).
- Pasada responsive: tablas con scroll horizontal en pantallas chicas en vez de romper el layout, nav del admin con scroll horizontal (CSS global, sin tocar cada página).

**Pendiente antes de decir "listo para la administradora"**:
1. Conectar Supabase de verdad y correr las 4 migraciones.
2. Probar el flujo completo end-to-end con datos reales de un par de lotes.
3. Revisar con la administradora los supuestos marcados como "a ajustar" en los estados anteriores (umbral de consumo anómalo, regla de tarifa vigente, qué pasa sin lectura base).
4. Deploy (Vercel es lo natural dado el stack).
