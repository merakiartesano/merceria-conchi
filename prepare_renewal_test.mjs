import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function prepareTest() {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
    
    console.log('Actualizando suscripciones a fecha pasada:', expiredDate.toISOString());

    const { data, error } = await supabase
        .from('subscriptions')
        .update({ current_period_end: expiredDate.toISOString() })
        .in('user_id', [
            'fe82d6b4-5517-45c6-8646-a208c0d523bf', // Leti Alumna 2
            'ef47e1fc-2074-4605-a2fb-ac264a2c9c6a'  // Raul Alumno2
        ]);

    if (error) {
        console.error('Error actualizando:', error);
    } else {
        console.log('Suscripciones actualizadas correctamente.');
    }
}

prepareTest();
