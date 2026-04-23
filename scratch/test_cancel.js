
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY 
);

async function testCancellation() {
  const userId = 'ef47e1fc-2074-4605-a2fb-ac264a2c9c6a'; // Raul Alumno2
  console.log(`🚀 Probando cancelación para el usuario: ${userId}...`);

  try {
    const { data, error } = await supabase.functions.invoke('redsys-cancel-subscription', {
      body: { userId }
    });

    if (error) throw error;

    console.log('✅ Resultado de la función:', JSON.stringify(data, null, 2));
    
    // Verificar en DB
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .single();
    
    console.log('📊 Estado final en DB:', sub);
  } catch (err) {
    console.error('❌ Error en la prueba:', err);
  }
}

testCancellation();
