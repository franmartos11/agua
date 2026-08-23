const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure to run with --env-file=.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = "password123";

  console.log(`Creating user ${email}...`);

  // 1. Create user using admin api
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre: "Usuario Test (Propietario)",
      rol: "owner"
    }
  });

  if (authError) {
    console.error("Error creating user:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);

  // Wait a moment for the trigger handle_new_user to create the perfil
  await new Promise(r => setTimeout(r, 1000));

  // 2. Create lote
  const loteNumero = `L-${Math.floor(Math.random() * 10000)}`;
  const { data: loteData, error: loteError } = await supabase
    .from('lote')
    .insert({
      numero: loteNumero,
      direccion: "Calle Falsa 123",
      propietario_id: userId,
      estado: "ocupado",
      superficie_m2: 500
    })
    .select()
    .single();

  if (loteError) {
    console.error("Error creating lote:", loteError.message);
    process.exit(1);
  }
  
  const loteId = loteData.id;
  console.log(`Lote created: ${loteNumero}`);

  // 3. Create medidor
  const numSerie = `MED-${Math.floor(Math.random() * 100000)}`;
  const { data: medidorData, error: medidorError } = await supabase
    .from('medidor')
    .insert({
      lote_id: loteId,
      numero_serie: numSerie,
      tipo: "principal",
      activo: true
    })
    .select()
    .single();

  if (medidorError) {
    console.error("Error creating medidor:", medidorError.message);
    process.exit(1);
  }

  const medidorId = medidorData.id;
  console.log(`Medidor created: ${numSerie}`);

  // 4. Create Periodo Facturacion (if not exists for current month)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  let periodoId;

  const { data: existingPeriodo } = await supabase
    .from('periodo_facturacion')
    .select()
    .eq('mes', currentMonth)
    .eq('anio', currentYear)
    .maybeSingle();

  if (existingPeriodo) {
    periodoId = existingPeriodo.id;
  } else {
    const { data: periodoData, error: periodoError } = await supabase
      .from('periodo_facturacion')
      .insert({
        mes: currentMonth,
        anio: currentYear,
        fecha_vencimiento: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
        estado: 'abierto'
      })
      .select()
      .single();
      
    if (periodoError) {
      console.error("Error creating periodo:", periodoError.message);
      process.exit(1);
    }
    periodoId = periodoData.id;
  }

  // 5. Create Factura (Bill)
  const { data: facturaData, error: facturaError } = await supabase
    .from('factura')
    .insert({
      lote_id: loteId,
      periodo_id: periodoId,
      mes: currentMonth,
      anio: currentYear,
      consumo_m3: 45, // Example consumption
      detalle_calculo: { cargo_fijo: 1500, cargo_variable: 4500, total: 6000 },
      monto_total: 6000,
      monto_pagado: 0,
      estado: 'pendiente',
      vencimiento: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0]
    })
    .select()
    .single();

  if (facturaError) {
    console.error("Error creating factura:", facturaError.message);
  } else {
    console.log(`Factura creada: ID ${facturaData.id} por $6000`);
  }
  
  console.log("\n=========================================");
  console.log("✅ SUCCESS! Test user created.");
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log("=========================================\n");
}

main();
