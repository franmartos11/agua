# Requerimientos — Sistema de Medición y Cobro de Agua

Barrio privado / consorcio. Administración centralizada por una persona (administradora), con panel de consulta para los propietarios de lote.

## 1. Actores

| Actor | Descripción | Acceso |
|---|---|---|
| Administradora | Única responsable de gestionar lotes, tarifas, lecturas, facturación y pagos | Panel admin (todo) |
| Propietario | Dueño de uno o más lotes | Panel propietario (solo lo propio) |

Un propietario puede tener más de un lote. Un lote tiene un propietario (MVP simple; co-titularidad queda para fase futura).

## 2. Modelo de datos (entidades)

- **Propietario**: nombre, email, teléfono, `user_id` (Supabase Auth).
- **Lote**: identificador/número, dirección, propietario_id, estado (ocupado/vacío/en construcción), superficie (opcional).
- **Extra**: característica del lote que afecta el cobro (pileta, jardín, etc.) — lote_id, tipo, vigente_desde/hasta. Modelado como catálogo abierto, no hardcodeado, para poder agregar tipos nuevos sin migrar código.
- **Medidor**: lote_id, número de serie, tipo (principal/riego), fecha de instalación, activo.
- **Lectura**: medidor_id, valor, fecha, fuente (`manual` | `importado` | `api`), cargado_por, foto (opcional).
- **Tarifa**: vigente_desde/hasta, precio por m³ (posiblemente por tramos), cargo fijo base, monto por cada tipo de extra. Nunca se pisa una tarifa vieja — queda histórica para poder recalcular/auditar facturas pasadas.
- **PeriodoFacturacion**: mes/año, fecha de generación, estado (abierto/cerrado).
- **Factura**: lote_id, periodo_id, consumo_m³, detalle del cálculo (desglose: consumo + fijo + extras), monto total, estado (pendiente/pagada/parcial/vencida), vencimiento.
- **Pago**: factura_id, monto, fecha, método (`transferencia` | `efectivo` | `mercado_pago`, enum extensible), comprobante (Storage), referencia_externa (para conciliación futura con Mercado Pago), estado, registrado_por.

## 3. Decisiones de negocio ya definidas

- **Tarifación**: consumo medido (m³ × precio) + cargo fijo por cada extra que tenga el lote (pileta, etc.). Configurable, no hardcodeado.
- **Pagos**: registro manual en el MVP (la admin marca pagada una factura y sube comprobante). El modelo de datos ya contempla método y referencia externa para no migrar el esquema cuando se integre **Mercado Pago** (Fase 2).
- **Lecturas de medidores**: carga manual + importación masiva por archivo (CSV/Excel) desde el panel admin. Los medidores inteligentes todavía no están comprados — se deja la fuente de lectura (`manual`/`importado`/`api`) como campo abierto para no rediseñar cuando se elija el hardware.
- **Notificaciones**: ninguna en el MVP. Todo se consulta entrando al panel web.
- **Autenticación**: Supabase Auth, con invitación por email — la admin carga el lote y el email del propietario, el sistema manda la invitación para crear contraseña.
- **Escala**: 50–200 lotes. Sin implicancias de performance relevantes para el stack elegido.

## 4. Stack técnico

- **Frontend/Backend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind (ya scaffoldeado en `my-app`).
- **Base de datos**: Supabase (Postgres).
- **Auth**: Supabase Auth (email + password, invitación).
- **Storage**: Supabase Storage (comprobantes de pago, fotos de lecturas).
- **Hosting**: Vercel (a definir si no se confirma otra preferencia).
- **Seguridad de datos**: Row Level Security en Supabase — un propietario solo puede leer sus propios lotes/facturas/pagos; la admin tiene rol con acceso total.

## 5. Requerimientos funcionales

### Panel Admin
1. CRUD de lotes y propietarios; asignar/quitar extras a un lote.
2. CRUD de medidores, asociados a un lote.
3. Carga de lecturas: individual manual + importación masiva (CSV/Excel), con validación de consumos anómalos (saltos negativos o desproporcionados respecto al histórico).
4. Configuración de tarifas con vigencia (histórico preservado).
5. Generación de facturación por período: cálculo automático de consumo × tarifa + cargo fijo + extras, con desglose visible.
6. Gestión de pagos: registrar pago manual, subir comprobante, marcar factura pagada/parcial/vencida.
7. Reportes: consumo por lote/período, estado de morosidad, recaudación total, exportables (Excel/PDF).
8. Trazabilidad: quién cargó cada lectura/pago/tarifa y cuándo.

### Panel Propietario
1. Ver sus lotes, medidores y últimas lecturas.
2. Ver historial de facturas (pendientes/pagadas/vencidas) con el detalle del cálculo.
3. Descargar factura en PDF.
4. Ver histórico de pagos realizados y comprobantes.

## 6. Requerimientos no funcionales

- Interfaz responsive (uso esperado desde celular).
- Idioma español (Argentina), moneda ARS, formato numérico localizado.
- Auditoría mínima: `created_by` / `created_at` en lecturas, tarifas y pagos.
- El esquema de pagos y de lecturas debe soportar las integraciones de Fase 2 sin requerir migración estructural.

## 7. Alcance por fase

**Fase 1 — MVP**
- Todo lo listado en la sección 5.
- Auth con invitación por email.

**Fase 2 — confirmado a futuro**
- Integración de pago online con Mercado Pago (checkout + webhook de conciliación automática).
- Integración de medidores inteligentes (API o importación automática) cuando se defina el proveedor.

**Fase 3 — no confirmado, a evaluar**
- Notificaciones por email (factura generada, vencimiento próximo) y eventualmente WhatsApp.
- Co-titularidad de lotes (más de un propietario por lote).
- Roles adicionales de administración.

## 8. Preguntas abiertas / a validar con la administradora antes de fase 2

- Estructura exacta de tramos de tarifa (¿precio único por m³ o escalonado por consumo?).
- Política de mora: ¿se cobran intereses/recargos por atraso? ¿Cuánto y desde cuándo?
- ¿Qué pasa con un lote vacío/en construcción? ¿Paga cargo fijo igual?
- Formato exacto del archivo de importación de lecturas cuando se defina el proveedor de medidores.
