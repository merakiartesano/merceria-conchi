import dotenv from 'dotenv';
dotenv.config();

async function invokeRenewalFunction() {
    const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/redsys-recurring-payments`;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('Invocando función de renovación en:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({})
        });

        const text = await response.text();
        console.log('Estado de respuesta:', response.status);
        console.log('Respuesta del servidor:', text);
    } catch (error) {
        console.error('Error al invocar la función:', error);
    }
}

invokeRenewalFunction();
