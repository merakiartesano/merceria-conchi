import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function main() {
  console.log('1. Buscando la suscripcion del Alumno Redsys...');
  
  // Vamos a poner su fecha de caducidad a AYER para forzar el cobro recurrente
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: subs, error: errGet } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .not('redsys_identifier', 'is', null)
    .limit(1);
    
  if (errGet || !subs || subs.length === 0) {
    console.log('No se encontraron suscripciones activas con Token COF.', errGet);
    return;
  }

  const sub = subs[0];
  console.log(`Encontrada suscripcion: ${sub.id}. Vencia: ${sub.current_period_end}`);
  console.log(`Token COF: ${sub.redsys_identifier}`);
  
  // Update a ayer
  console.log('2. Modificando current_period_end a ayer para simular que toca cobrar...');
  const { error: errUp } = await supabase
    .from('subscriptions')
    .update({ current_period_end: yesterday.toISOString() })
    .eq('id', sub.id);
    
  if (errUp) {
    console.error('Error al actualizar fecha:', errUp);
    return;
  }
  console.log('Fecha actualizada. Ejecutando la funcion redsys-recurring-payments...');

  // Invocamos la edge function local o remota
  const funcUrl = `${supabaseUrl}/functions/v1/redsys-recurring-payments`;
  try {
    const res = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      const resJson = await res.json();
      console.log('Respuesta de la funcion de cobro recurrente:');
      console.dir(resJson, { depth: null });
    } catch {
      const text = await res.text();
      console.log('Respuesta de la funcion:', res.status, text);
    }
  } catch (error) {
    console.error('Error llamando a la funcion:', error);
  }
}

main();
