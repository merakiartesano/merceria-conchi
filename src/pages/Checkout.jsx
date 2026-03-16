import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { createCheckoutSession, createSubscriptionCheckoutSession, getStripe } from '../lib/stripeService';
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
        fetchZones();
    }, []);

    const subtotal = getCartTotal();

    // Dynamic Shipping Calculation
    let currentRegionCode = 'peninsula';
    if (formData.postal_code.length === 5 && formData.country === 'España') {
        const pCode = formData.postal_code.substring(0, 2);
        if (pCode === '07') currentRegionCode = 'baleares';
        else if (pCode === '35' || pCode === '38') currentRegionCode = 'canarias';
        else if (pCode === '51' || pCode === '52') currentRegionCode = 'ceuta_melilla';
    } else if (formData.country === 'Portugal') {
        currentRegionCode = 'portugal';
    }

    const activeZone = shippingZones.find(z => z.region_code === currentRegionCode);
    let isZoneBlocked = false;
    let computedShippingCost = 4.95; // default fallback
    let zoneName = 'Envío a Península';

    if (!shippingLoading) {
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

    const shippingCost = isSubscription ? 0 : computedShippingCost; // Subscription usually includes shipping or fixed price
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

        if (isZoneBlocked) {
            setValidationError('Lo sentimos, actualmente los envíos a esta zona de destino están desactivados o no damos servicio.');
            setLoading(false);
            return;
        }

        try {
            if (isSubscription) {
                // SUBSCRIPTION FLOW
                const shippingData = {
                    name: formData.name,
                    phone: formData.phone,
                    line1: formData.line1,
                    city: formData.city,
                    state: formData.state,
                    postal_code: formData.postal_code,
                    country: formData.country,
                };

                const { url } = await createSubscriptionCheckoutSession(user, shippingData, subscriptionPrice);
                
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error("No redirect URL received for subscription");
                }
            } else {
                // STANDARD ORDER FLOW
                // 1. Save order to Supabase
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert([{
                        customer_name: formData.name,
                        customer_email: formData.email,
                        customer_phone: formData.phone,
                        shipping_address: {
                            line1: formData.line1,
                            city: formData.city,
                            state: formData.state,
                            postal_code: formData.postal_code,
                            country: formData.country
                        },
                        status: 'Pendiente',
                        total_amount: total
                    }])
                    .select()
                    .single();

                if (orderError) throw orderError;

                // 2. Save order items
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

                // 3. Create Stripe Session (pass shipping so it shows in Stripe)
                const { sessionId, url } = await createCheckoutSession(cartItems, orderData.id, shippingCost, zoneName);

                // 4. Update order with Stripe session ID
                await supabase
                    .from('orders')
                    .update({ stripe_session_id: sessionId })
                    .eq('id', orderData.id);

                // 5. Redirect to Stripe
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error("No redirect URL received");
                }
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
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568' }}>País / Región</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="España">España</option>
                                    <option value="Portugal">Portugal</option>
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
                                        maxLength={formData.country === 'España' ? "5" : "8"}
                                        name="postal_code"
                                        required
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        placeholder={formData.country === 'España' ? "Ej: 28001" : "Ej: 1100-001"}
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
                                    onChange={formData.country === 'Portugal' ? handleChange : undefined}
                                    placeholder={formData.country === 'España' ? "Se rellena automáticamente..." : "Ej. Distrito de Lisboa"}
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

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px' }}>
                                {loading ? <><Loader2 className="animate-spin" /> {t('checkout.processing')}</> : t('checkout.proceed')}
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#718096', marginTop: '15px' }}>{t('checkout.stripeDesc')}</p>
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
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem' }}>Club Meraki ArteSano</h4>
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
