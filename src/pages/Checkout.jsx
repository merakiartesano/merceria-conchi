import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
// Stripe removed - managed via Redsys
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles } from 'lucide-react';
import { spanishProvinces, validateSpanishPhone } from '../lib/validations';
import { getShippingZones } from '../lib/productService';

const Checkout = () => {
    const { cartItems, getCartTotal } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { user } = useAuth();

    const isSubscription = location.search.includes('type=subscription') || location.state?.isSubscription;
    const subscriptionPrice = location.state?.price || 32;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'España'
    });
    const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' or 'pickup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [shippingZones, setShippingZones] = useState([]);
    const [shippingLoading, setShippingLoading] = useState(true);

    useEffect(() => {
        const fetchZones = async () => {
            try {
                const zones = await getShippingZones();
                setShippingZones(zones);
            } catch (err) {
                console.error("Error fetching shipping zones:", err);
            } finally {
                setShippingLoading(false);
            }
        };

        const fetchUserProfile = async () => {
            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (profileData) {
                    setFormData({
                        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
                        email: user.email || '',
                        phone: profileData.phone || '',
                        line1: profileData.address || '',
                        city: profileData.city || '',
                        state: profileData.state || '',
                        postal_code: profileData.zip || '',
                        country: profileData.country || 'España'
                    });
                    if (profileData.pickup_pref) {
                        setDeliveryMethod('pickup');
                    }
                }
            }
        };

        fetchZones();
        fetchUserProfile();
    }, [user]);

    const subtotal = getCartTotal();

    // Dynamic Shipping Calculation
    let currentRegionCode = 'peninsula';
    if (deliveryMethod === 'pickup') {
        currentRegionCode = 'pickup';
    } else if (formData.postal_code.length === 5 && formData.country === 'España') {
        const pCode = formData.postal_code.substring(0, 2);
        if (pCode === '07') currentRegionCode = 'baleares';
        else if (pCode === '35' || pCode === '38') currentRegionCode = 'canarias';
        else if (pCode === '51' || pCode === '52') currentRegionCode = 'ceuta_melilla';
    } else if (formData.country === 'Portugal') {
        currentRegionCode = 'portugal';
    } else if (formData.country === 'France') {
        currentRegionCode = 'france';
    }

    const activeZone = shippingZones.find(z => z.region_code === currentRegionCode);
    let isZoneBlocked = false;
    let computedShippingCost = 4.95; // default fallback
    let zoneName = t('checkout.shipping');

    if (deliveryMethod === 'pickup') {
        computedShippingCost = 0;
        zoneName = t('checkout.pickupZone');
    } else if (!shippingLoading) {
        if (!activeZone || !activeZone.is_active) {
            isZoneBlocked = true;
            zoneName = 'Envío no disponible en tu zona';
        } else {
            zoneName = activeZone.name;
            if (activeZone.free_shipping_threshold !== null && subtotal >= activeZone.free_shipping_threshold) {
                computedShippingCost = 0;
            } else {
                computedShippingCost = Number(activeZone.cost);
            }
        }
    }

    const shippingCost = isSubscription ? 0 : computedShippingCost; // Subscription usually includes shipping 
    const total = isSubscription ? subscriptionPrice : (subtotal + (isZoneBlocked ? 0 : shippingCost));

    if (cartItems.length === 0 && !isSubscription) {
        return (
            <div className="checkout-page" style={{ padding: '120px 20px', textAlign: 'center' }}>
                <h2>{t('checkout.emptyTitle')}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/tienda')}>{t('checkout.backToShop')}</button>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        setValidationError(''); // Clear validation errors on type

        if (name === 'country') {
            // When country changes, reset state and postal code
            setFormData(prev => ({ ...prev, [name]: newValue, postal_code: '', state: '' }));
            return;
        }

        if (name === 'postal_code') {
            if (formData.country === 'España') {
                // Only allow digits and max length 5 for Spain
                newValue = value.replace(/\D/g, '').slice(0, 5);

                // Auto-fill province
                if (newValue.length === 5) {
                    const provinceCode = newValue.substring(0, 2);
                    if (spanishProvinces[provinceCode]) {
                        setFormData(prev => ({ ...prev, postal_code: newValue, state: spanishProvinces[provinceCode] }));
                        return;
                    } else {
                        setValidationError('Código postal inválido para España.');
                    }
                }
            } else if (formData.country === 'Portugal') {
                // Allow digits and hyphens for Portugal (max 8 characters: 1234-567)
                newValue = value.replace(/[^\d-]/g, '').slice(0, 8);
            } else if (formData.country === 'France') {
                // Allow digits, max 5 for France
                newValue = value.replace(/\D/g, '').slice(0, 5);
            } else {
                newValue = value;
            }
        }

        if (name === 'phone') {
            if (formData.country === 'España') {
                // Only digits and '+' for country code, max length 14
                newValue = value.replace(/[^\d+ ]/g, '').slice(0, 14);
            } else {
                newValue = value.replace(/[^\d+ ]/g, '');
            }
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationError('');

        // Pre-submit validations
        if (deliveryMethod === 'shipping') {
            if (formData.country === 'España') {
                if (formData.postal_code.length !== 5) {
                    setValidationError('El código postal de España debe tener exactamente 5 dígitos.');
                    setLoading(false);
                    return;
                }
                if (!validateSpanishPhone(formData.phone)) {
                    setValidationError('Por favor, introduce un número de teléfono válido para España (9 dígitos).');
                    setLoading(false);
                    return;
                }
            } else if (formData.country === 'Portugal') {
                // Basic check for Portugal postal code (e.g. 1000-001)
                if (formData.postal_code.length < 4) {
                    setValidationError('El código postal de Portugal no es válido.');
                    setLoading(false);
                    return;
                }
            }
        } else {
            // Optional: validate phone even for pickup if you want to ensure they can be contacted
            if (formData.phone && !validateSpanishPhone(formData.phone) && formData.phone.length > 0) {
               // We could validate here too, but let's keep it simple for now as requested
            }
        }

        if (isZoneBlocked) {
            setValidationError('Lo sentimos, actualmente los envíos a esta zona de destino están desactivados o no damos servicio.');
            setLoading(false);
            return;
        }

        try {
            if (isSubscription) {
                // FLUJO DE SUSCRIPCIÓN — Redsys
                const { data: redsysSession, error: redsysError } = await supabase.functions.invoke('redsys-create-subscription', {
                    body: {
                        userId: user.id,
                        email: user.email,
                        amount: subscriptionPrice
                    }
                });

                if (redsysError) throw new Error('No se pudo iniciar el pago de suscripción con Redsys.');

                if (redsysSession?.redsysUrl) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = redsysSession.redsysUrl;

                    const params = {
                        Ds_SignatureVersion: redsysSession.Ds_SignatureVersion,
                        Ds_MerchantParameters: redsysSession.Ds_MerchantParameters,
                        Ds_Signature: redsysSession.Ds_Signature
                    };

                    for (const key in params) {
                        const hiddenField = document.createElement('input');
                        hiddenField.type = 'hidden';
                        hiddenField.name = key;
                        hiddenField.value = params[key];
                        form.appendChild(hiddenField);
                    }

                    // Actualizar el perfil del usuario con la dirección de envío por si no la tenía
                    await supabase.from('profiles').update({
                        phone: formData.phone,
                        address: formData.line1,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.postal_code,
                        country: formData.country,
                        pickup_pref: deliveryMethod === 'pickup'
                    }).eq('id', user.id);

                    document.body.appendChild(form);
                    form.submit();
                } else {
                    throw new Error("Respuesta inválida al generar suscripción (no URL)");
                }
            } else {
                // FLUJO DE PEDIDO FÍSICO — Redsys
                // 1. Guardar pedido en Supabase
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert([{
                        customer_name: formData.name,
                        customer_email: formData.email,
                        customer_phone: formData.phone,
                        delivery_method: deliveryMethod, // Añadido para control del admin
                        shipping_address: {
                            line1: deliveryMethod === 'pickup' ? 'Recogida en Tienda (C/ San Antonio, 5)' : formData.line1,
                            city: deliveryMethod === 'pickup' ? 'Yecla' : formData.city,
                            state: deliveryMethod === 'pickup' ? 'Murcia' : formData.state,
                            postal_code: deliveryMethod === 'pickup' ? '30510' : formData.postal_code,
                            country: deliveryMethod === 'pickup' ? 'España' : formData.country
                        },
                        status: 'Pendiente',
                        total_amount: total
                    }])
                    .select()
                    .single();

                if (orderError) throw orderError;


                // 2. Guardar artículos del pedido
                const orderItemsData = cartItems.map(item => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItemsData);

                if (itemsError) throw itemsError;

                // 3. Crear sesión de pago Redsys
                const { data: redsysSession, error: redsysError } = await supabase.functions.invoke('redsys-create-payment', {
                    body: {
                        orderId: orderData.id,
                        amount: total,
                        description: 'Pedido Meraki ArteSano',
                    },
                });

                if (redsysError) throw new Error('No se pudo iniciar el pago con Redsys.');

                // === DEBUG TEMPORAL — borrar en producción ===
                console.log('[REDSYS DEBUG] Respuesta edge function:', JSON.stringify(redsysSession));
                const b64 = redsysSession?.Ds_MerchantParameters ?? '';
                console.log('[REDSYS DEBUG] Ds_MerchantParameters (longitud):', b64.length);
                console.log('[REDSYS DEBUG] Tiene padding =:', b64.endsWith('='));
                console.log('[REDSYS DEBUG] Tiene chars - o _:', b64.includes('-') || b64.includes('_'));
                try {
                    const decoded = atob(b64);
                    console.log('[REDSYS DEBUG] JSON decodificado:', decoded);
                } catch(e) {
                    console.error('[REDSYS DEBUG] ERROR decodificando Base64:', e.message);
                }
                // === FIN DEBUG ===

                // 4. Redirigir al TPV Redsys mediante formulario auto-submit
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = redsysSession.redsysUrl;

                const fields = {
                    Ds_SignatureVersion: redsysSession.Ds_SignatureVersion,
                    Ds_MerchantParameters: redsysSession.Ds_MerchantParameters,
                    Ds_Signature: redsysSession.Ds_Signature,
                };

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            }
        } catch (err) {
            console.error("Error in checkout:", err);
            setError(t('checkout.error'));
            setLoading(false);
        }
    };

    return (
        <div className="checkout-page" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
            <div className="container">
                <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>{t('checkout.title')}</h1>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {validationError && (
                    <div style={{ backgroundColor: '#fffbe8', color: '#b45309', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>Revisa los siguientes datos:</strong>
                        {validationError}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    {/* Form Section */}
                    <div style={{ flex: '1 1 500px', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', color: '#1a1a1a' }}>{t('checkout.step1')}</h2>
                        <form onSubmit={handleSubmit}>
                            {/* Delivery Method Selector */}
                            <div style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethod('shipping')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: deliveryMethod === 'shipping' ? 'var(--color-primary)' : '#e2e8e0',
                                        backgroundColor: deliveryMethod === 'shipping' ? '#fff5f8' : '#fff',
                                        color: deliveryMethod === 'shipping' ? 'var(--color-primary)' : '#4a5568',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🚚 {t('checkout.homeDelivery')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethod('pickup')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: deliveryMethod === 'pickup' ? 'var(--color-primary)' : '#e2e8e0',
                                        backgroundColor: deliveryMethod === 'pickup' ? '#fff5f8' : '#fff',
                                        color: deliveryMethod === 'pickup' ? 'var(--color-primary)' : '#4a5568',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🏪 {t('checkout.pickupInStore')}
                                </button>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.name')}</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            </div>
                            <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.email')}</label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.phone')}</label>
                                    <input type="tel" name="phone" maxLength={formData.country === 'España' ? "9" : "15"} required value={formData.phone} onChange={handleChange} placeholder={formData.country === 'España' ? "Ej: 600123456" : "Ej: +351 900 000 000"} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                            </div>

                            {deliveryMethod === 'pickup' ? (
                                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #cbd5e0' }}>
                                    <p style={{ margin: 0, color: '#4a5568', fontSize: '0.95rem' }}>
                                        📍 <strong>{t('checkout.pickupInStore')}:</strong> {t('checkout.pickupInfo')}
                                    </p>
                                    <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '0.85rem', color: '#718096' }}>
                                        C/ San Antonio, 5, 30510 Yecla, Murcia
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('auth.country')}</label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer' }}
                                        >
                                            <option value="España">España</option>
                                            <option value="Portugal">Portugal</option>
                                            <option value="France">France</option>
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.address')}</label>
                                        <input type="text" name="line1" required value={formData.line1} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.zip')}</label>
                                            <input
                                                type="text"
                                                maxLength={formData.country === 'España' || formData.country === 'France' ? "5" : "8"}
                                                name="postal_code"
                                                required
                                                value={formData.postal_code}
                                                onChange={handleChange}
                                                placeholder={formData.country === 'España' ? "Ej: 28001" : formData.country === 'France' ? "Ej: 75001" : "Ej: 1100-001"}
                                                style={{ width: '100%', padding: '12px', border: validationError && formData.postal_code.length === (formData.country === 'España' ? 5 : 8) ? '1px solid #e53e3e' : '1px solid #e2e8f0', borderRadius: '8px' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.city')}</label>
                                            <input type="text" name="city" required value={formData.city} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>{t('checkout.state')} / Región</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            value={formData.state}
                                            readOnly={formData.country === 'España'}
                                            onChange={formData.country !== 'España' ? handleChange : undefined}
                                            placeholder={formData.country === 'España' ? "Se rellena automáticamente..." : "Ej. Distrito de Lisboa / Île-de-France"}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                backgroundColor: formData.country === 'España' ? '#f8fafc' : '#fff',
                                                color: formData.country === 'España' ? '#718096' : '#1a1a1a',
                                                cursor: formData.country === 'España' ? 'not-allowed' : 'text'
                                            }}
                                        />
                                        {formData.country === 'España' && (
                                            <small style={{ color: '#a0aec0', marginTop: '4px', display: 'block' }}>La provincia se completa sola al introducir el código postal.</small>
                                        )}
                                    </div>
                                </>
                            )}


                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px' }}>
                                {loading ? <><Loader2 className="animate-spin" /> {t('checkout.processing')}</> : t('checkout.proceed')}
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#718096', marginTop: '15px' }}>🔒 Serás redirigido al TPV seguro de Redsys para completar el pago.</p>
                        </form>
                    </div>

                    {/* Summary Section */}
                    <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', padding: '30px', borderRadius: '15px', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', color: '#1a1a1a' }}>{t('checkout.step2')}</h2>

                        <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                            {isSubscription ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#fff5f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem' }}>Club Creativo MERAKI</h4>
                                            <p style={{ margin: '0', fontSize: '0.85rem', color: '#718096' }}>Suscripción Mensual</p>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '500' }}>
                                        €{subscriptionPrice.toFixed(2)}
                                    </div>
                                </div>
                            ) : (
                                cartItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem' }}>{item.name}</h4>
                                                <p style={{ margin: '0', fontSize: '0.85rem', color: '#718096' }}>{t('checkout.qty')} {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '500' }}>
                                            €{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!isSubscription && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#4a5568' }}>
                                    <span>{t('checkout.subtotal')}</span>
                                    <span>€{subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#4a5568' }}>
                                    <span>{zoneName}</span>
                                    <span>{isZoneBlocked ? <strong style={{ color: '#e53e3e' }}>No Disponible</strong> : shippingCost === 0 ? <strong style={{ color: 'var(--color-primary)' }}>{t('checkout.free')}</strong> : `€${shippingCost.toFixed(2)}`}</span>
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '2px solid #e2e8f0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>
                            <span>{t('checkout.total')}</span>
                            <span>€{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
