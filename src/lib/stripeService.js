import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Reemplaza esto con tu CLAVE PÚBLICA de Stripe (Publishable Key)
// Normalmente empieza por 'pk_test_...' o 'pk_live_...'
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51T6Y7sFInnoLBomh7zcdNWCoItZOkEC4x5Uc9BHKE9E7L4WjNd43bXH023n78UNffO8jlof36wq0GOfqHz1tHLPN006KPMYkV0');

export const getStripe = () => {
    return stripePromise;
};

export const createCheckoutSession = async (cartItems, orderId = null, shippingCost = 0, shippingName = 'Gastos de envío') => {
    try {
        // Prepare the payload 
        const lineItems = cartItems.map(item => ({
            name: item.name,
            description: item.category,
            price: item.price,
            quantity: item.quantity,
            images: [item.image_url]
        }));

        // Call the Edge Function "create-checkout"
        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: { lineItems, orderId, shippingCost, shippingName }
        });

        if (error) {
            console.error("Supabase edge function error object:", error);

            // If it's a supabase-js FunctionsHttpError it might have a context
            if (error.context) {
                error.context.text().then(text => console.error("Raw Edge Function response:", text)).catch(() => { });
            }

            throw new Error("No se pudo iniciar la sesión de pago.");
        }

        // Return the sessionId and url so the frontend can redirect to Stripe
        return { sessionId: data.sessionId, url: data.url };
    } catch (err) {
        console.error("Checkout validation error:", err);
        throw err;
    }
};
