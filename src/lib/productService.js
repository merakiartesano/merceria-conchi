import { supabase } from './supabase';

// Helper function: get all products
export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Helper function: get a single product by ID
export const getProductById = async (id) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single(); // Use .single() since we expect only one record

    if (error) {
        if (error.code === 'PGRST116') {
            // Supabase error for 'no rows returned' when using .single()
            return null;
        }
        throw error;
    }
    return data;
};

// --- CATEGORIES HELPER FUNCTIONS ---

export const getCategories = async () => {
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const createCategory = async (name) => {
    const { data, error } = await supabase
        .from('product_categories')
        .insert([{ name }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCategory = async (id) => {
    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// Helper function: upload an image to Supabase Storage
export const uploadImage = async (file) => {
    try {
        // Create a unique file name to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to the 'product-images' bucket
        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded image
        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Helper function: create a new product
export const createProduct = async (productObj) => {
    const { data, error } = await supabase
        .from('products')
        .insert([productObj])
        .select();

    if (error) throw error;
    return data[0];
};

// Helper function: update an existing product
export const updateProduct = async (id, updates) => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data[0];
};

// Helper function: delete a product
export const deleteProduct = async (id) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// Helper function: get all orders with their items
export const getOrders = async () => {
    // Restaurado a petición de la clienta para que también pueda ver pagos pendientes.
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            status,
            total_amount,
            order_items (
                id,
                name,
                price,
                quantity
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Helper function: update order status
export const updateOrderStatus = async (id, status) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', id);

    if (error) throw error;
    return data;
};

// ACADEMY SETTINGS HELPER FUNCTIONS

export const getAcademySettings = async () => {
    // We assume there is only 1 row in academy_settings with id = 1
    const { data, error } = await supabase
        .from('academy_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data; // returns null if no rows exist
};

export const updateAcademySettings = async (settings) => {
    // Upsert the settings with id = 1
    const payload = {
        id: 1,
        live_title: settings.liveTitle,
        live_link: settings.liveLink,
        welcome_text: settings.welcomeText,
        stripe_payment_link: settings.stripePaymentLink,
        subscription_price: parseFloat(settings.subscriptionPrice?.toString().replace(',', '.')) || 9.99,
        subscription_features: settings.subscriptionFeatures || '',
        max_subscribers: parseInt(settings.maxSubscribers) || 0,
        calendar_text: settings.calendarText || '',
        updated_at: new Date()
    };

    const { data, error } = await supabase
        .from('academy_settings')
        .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return data;
};

// Get the count of active subscribers
export const getActiveSubscribersCount = async () => {
    const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    if (error) throw error;
    return count || 0;
};

// Trigger class reminder email
export const triggerClassReminder = async () => {
    // We get the session token to authenticate the edge function call
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) throw new Error('No estás autenticado');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-academy-reminder`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al enviar recordatorios');
    
    return result;
};

// VIDEO LIBRARY HELPER FUNCTIONS

export const getAcademyVideos = async () => {
    const { data, error } = await supabase
        .from('academy_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createAcademyVideo = async (video) => {
    const { data, error } = await supabase
        .from('academy_videos')
        .insert([{
            title: video.title,
            description: video.description || null,
            video_url: video.video_url,
            order_index: video.order_index || 0
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateAcademyVideo = async (id, video) => {
    const { data, error } = await supabase
        .from('academy_videos')
        .update({
            title: video.title,
            description: video.description || null,
            video_url: video.video_url,
            order_index: video.order_index
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteAcademyVideo = async (id) => {
    const { error } = await supabase
        .from('academy_videos')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// Helper function: get subscribers list
export const getSubscribers = async () => {
    // 1. Llamar a la función segura (RPC) en Supabase pasando el PIN
    const { data: result, error } = await supabase.rpc('get_admin_subscribers', {
        admin_pin: 'meraki2026'
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    }
    
    if (!result) return [];

    // 2. Mapear el resultado al formato de array 'subscriptions' que usa Admin.jsx
    return result.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        created_at: u.created_at,
        subscriptions: [
            {
                status: u.status || 'inactive',
                stripe_customer_id: u.stripe_customer_id || null,
                current_period_end: u.current_period_end || null,
                redsys_order_id: u.redsys_order_id || null,
                redsys_identifier: u.redsys_identifier || null,
                shipping_details: (u.address || u.pickup_pref) ? {
                    name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    phone: u.phone || '',
                    line1: u.address || '',
                    postal_code: u.zip || '',
                    city: u.city || '',
                    state: u.state || '',
                    country: u.country || '',
                    pickup_pref: u.pickup_pref || false
                } : null
            }
        ]
    }));
};

// --- SHIPPING ZONES HELPER FUNCTIONS ---

export const getShippingZones = async () => {
    const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const updateShippingZone = async (id, zoneData) => {
    const { data, error } = await supabase
        .from('shipping_zones')
        .update({
            is_active: zoneData.is_active,
            cost: parseFloat(zoneData.cost) || 0,
            free_shipping_threshold: parseFloat(zoneData.free_shipping_threshold) || null,
            updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};


// --- ACADEMY SUBSCRIPTIONS ADMIN HELPER ---

export const cancelSubscription = async (userId) => {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error("Error al obtener la sesión:", sessionError);
            throw new Error("No hay una sesión activa de administrador. Por favor, recarga la página.");
        }

        console.log("Iniciando baja Redsys para usuario:", userId, "con token activo.");

        console.log("Iniciando baja Redsys para usuario:", userId, "vía Invoke.");
        
        const { data: result, error: invokeError } = await supabase.functions.invoke('redsys-cancel-subscription', {
            body: { userId }
        });

        if (invokeError) {
            console.error("Error en Invoke:", invokeError);
            throw invokeError;
        }

        return result; // Contiene { success, message, redsysResponse }

        // Si la función de Redsys falla porque no hay identificador (o error 404), 
        // fallback al RPC para al menos quitar el acceso en local.
        console.warn("Redsys cancel failed, falling back to local RPC:", result.error);
        
        const { error: rpcError } = await supabase.rpc('cancel_admin_subscription', {
            admin_pin: 'meraki2026',
            target_user_id: userId
        });

        if (rpcError) throw rpcError;
        return true;
    } catch (error) {
        console.error("Error canceling subscription:", error);
        throw error;
    }
};
