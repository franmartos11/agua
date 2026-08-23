// Todavía no generado. Una vez creado el proyecto de Supabase y aplicada la
// migración inicial, corré esto y los clientes en client.ts/server.ts/admin.ts
// van a tipar automáticamente `.from('tabla')` con las columnas reales:
//   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
export type Database = Record<string, unknown>;
