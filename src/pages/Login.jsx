import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { spanishProvinces, validateSpanishPhone } from '../lib/validations';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [zip, setZip] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('España');
    
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode');
    
    // Si la URL dice 'register' o venimos de un botón de "Unirse", queremos mostrar registro directamente
    const [isLogin, setIsLogin] = useState(mode === 'register' || location.state?.isRegister ? false : true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [message, setMessage] = useState(null);

    // Password visibility and confirmation
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [subscriptionPrice, setSubscriptionPrice] = useState(null);
    const [shippingZones, setShippingZones] = useState([]);
    const [zonesLoaded, setZonesLoaded] = useState(false);

    // Fetch precio y zonas de envío activas para el modal y validación
    React.useEffect(() => {
        supabase
            .from('academy_settings')
            .select('subscription_price')
            .eq('id', 1)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.subscription_price) setSubscriptionPrice(data.subscription_price);
            });

        supabase
            .from('shipping_zones')
            .select('name, is_active')
            .eq('is_active', true)
            .order('name', { ascending: true })
            .then(({ data }) => {
                if (data) setShippingZones(data);
                setZonesLoaded(true);
            });
    }, []);

    const navigate = useNavigate();
    const { t } = useLanguage();

    // From where the user came, so we can redirect them back
    const fromLocation = location.state?.from;
    const from = fromLocation
        ? (fromLocation.pathname + (fromLocation.search || ''))
        : '/academia';

    // Determina la zona de envío según el país y el código postal del usuario
    const getUserZone = (userCountry, userZip) => {
        if (userCountry === 'Portugal') return 'Portugal';
        if (userCountry === 'France')   return 'Francia';
        if (userCountry === 'España') {
            const prefix = (userZip || '').substring(0, 2);
            if (prefix === '07') return 'Islas Baleares';
            if (prefix === '35' || prefix === '38') return 'Islas Canarias';
            return 'España - Península';
        }
        return null;
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setValidationError('');

        if (name === 'country') {
            setCountry(value);
            setZip('');
            setState('');
            return;
        }

        if (name === 'zip') {
            let newValue = value;
            if (country === 'España') {
                newValue = value.replace(/\D/g, '').slice(0, 5);
                if (newValue.length === 5) {
                    const provinceCode = newValue.substring(0, 2);
                    if (spanishProvinces[provinceCode]) {
                        setState(spanishProvinces[provinceCode]);
                    } else {
                        setValidationError(t('auth.errorZipInvalidSpain'));
                    }
                }
            } else if (country === 'Portugal') {
                newValue = value.replace(/[^\d-]/g, '').slice(0, 8);
            } else if (country === 'France') {
                newValue = value.replace(/\D/g, '').slice(0, 5);
            }
            setZip(newValue);
            return;
        }

        if (name === 'phone') {
            let newValue = value;
            if (country === 'España') {
                newValue = value.replace(/[^\d+ ]/g, '').slice(0, 14);
            } else {
                newValue = value.replace(/[^\d+ ]/g, '');
            }
            setPhone(newValue);
            return;
        }

        // Setters for other simple fields
        if (name === 'firstName') setFirstName(value);
        if (name === 'lastName') setLastName(value);
        if (name === 'address') setAddress(value);
        if (name === 'city') setCity(value);
        if (name === 'state') setState(value);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationError('');
        setMessage(null);

        // Validaciones previas al alta
        if (!isLogin) {
            if (password !== confirmPassword) {
                setValidationError(t('auth.errorPasswordMatch'));
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setValidationError(t('auth.errorPasswordLength'));
                setLoading(false);
                return;
            }
            if (country === 'España') {
                if (zip.length !== 5) {
                    setValidationError(t('auth.errorZipSpain'));
                    setLoading(false);
                    return;
                }
                if (!validateSpanishPhone(phone)) {
                    setValidationError(t('auth.errorPhoneSpain'));
                    setLoading(false);
                    return;
                }
            }

            // Validar que la zona de envío del usuario esté activa
            if (zonesLoaded) {
                const userZone = getUserZone(country, zip);
                if (userZone) {
                    const isActive = shippingZones.some(z => z.name === userZone);
                    if (!isActive) {
                        const activeNames = shippingZones
                            .filter(z => z.name !== 'Recogida en Tienda')
                            .map(z => z.name)
                            .join(', ');
                        setValidationError(
                            t('auth.errorZoneInactive') +
                            (activeNames ? ` (${activeNames})` : '')
                        );
                        setLoading(false);
                        return;
                    }
                }
            }
        }

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate(from, { replace: true });
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            phone: phone,
                            address: address,
                            zip: zip,
                            city: city,
                            state: state,
                            country: country
                        },
                        emailRedirectTo: window.location.origin + '/login',
                    }
                });
                if (error) throw error;
                
                // If there's a session returned, meaning no email confirmation is required:
                if (data?.session) {
                    // Preparamos la navegación a la academia con autoSuscripcion si aplica
                    if (from.includes('/academia')) {
                        navigate(from + (from.includes('?') ? '&' : '?') + 'autoSuscripcion=true', { replace: true });
                    } else {
                        navigate(from, { replace: true });
                    }
                } else {
                    setMessage(t('auth.confirm'));
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRecoveryEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationError('');
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/restablecer-contrasena',
            });
            if (error) throw error;
            setMessage(t('auth.recoverySuccess'));
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '120px 20px 80px', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd' }}>
            <div style={{ 
                width: '100%', 
                maxWidth: isLogin ? '440px' : '520px', 
                backgroundColor: '#fff', 
                padding: '50px 40px', 
                borderRadius: '30px', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                transition: 'max-width 0.3s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2.8rem', fontFamily: 'var(--font-serif)', marginBottom: '10px' }}>
                        {isRecovery ? t('auth.recoveryTitle') : (isLogin ? t('auth.loginTitle') : t('auth.signupTitle'))}
                    </h1>
                    {isRecovery && <p style={{ color: '#718096', marginTop: '10px' }}>{t('auth.recoveryDesc')}</p>}
                    <div style={{ height: '4px', width: '60px', backgroundColor: 'var(--color-accent)', margin: '0 auto', borderRadius: '2px' }}></div>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '14px', marginBottom: '25px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}
                
                {validationError && (
                    <div style={{ backgroundColor: '#fffbe8', color: '#b45309', padding: '15px', borderRadius: '14px', marginBottom: '25px', fontSize: '0.95rem', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={18} /> {validationError}
                    </div>
                )}

                {message && (
                    <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '20px', borderRadius: '14px', marginBottom: '25px', fontSize: '1.05rem', border: '1px solid #a7f3d0' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={isRecovery ? handleRecoveryEmail : handleAuth}>
                    {!isLogin && !isRecovery && (
                        <div className="registration-fields animate-fade-in">
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '18px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.firstName')}</label>
                                    <input type="text" name="firstName" required value={firstName} onChange={handleRegisterChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.lastName')}</label>
                                    <input type="text" name="lastName" required value={lastName} onChange={handleRegisterChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px', display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.phone')}</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        required 
                                        value={phone} 
                                        onChange={handleRegisterChange} 
                                        placeholder={country === 'España' ? "Ej: 600123456" : ""}
                                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} 
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.country')}</label>
                                    <select name="country" value={country} onChange={handleRegisterChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', fontSize: '1rem', cursor: 'pointer' }}>
                                        <option value="España">España</option>
                                        <option value="Portugal">Portugal</option>
                                        <option value="France">France</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('checkout.address')}</label>
                                <input type="text" name="address" required value={address} onChange={handleRegisterChange} placeholder="Calle, número, piso..." style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '18px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('checkout.zip')}</label>
                                    <input 
                                        type="text" 
                                        name="zip"
                                        required 
                                        value={zip} 
                                        onChange={handleRegisterChange} 
                                        placeholder={country === 'España' ? "28001" : ""}
                                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} 
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('checkout.city')}</label>
                                    <input type="text" name="city" required value={city} onChange={handleRegisterChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('checkout.state')}</label>
                                <input 
                                    type="text" 
                                    name="state"
                                    required 
                                    value={state} 
                                    readOnly={country === 'España'}
                                    onChange={country !== 'España' ? handleRegisterChange : undefined} 
                                    placeholder={country === 'España' ? "Se autocompleta con el CP..." : ""}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px 16px', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '12px', 
                                        fontSize: '1rem',
                                        backgroundColor: country === 'España' ? '#f8fafc' : '#fff',
                                        color: country === 'España' ? '#718096' : '#1a1a1a',
                                        cursor: country === 'España' ? 'not-allowed' : 'text'
                                    }} 
                                />
                            </div>
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    {!isRecovery && (
                        <>
                            <div style={{ marginBottom: isLogin ? '10px' : '18px', position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.password')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '14px 45px 14px 18px', 
                                            border: isLogin ? '2px solid #1a202c' : '1px solid #e2e8f0', 
                                            borderRadius: '12px', 
                                            fontSize: '1rem', 
                                            outline: 'none',
                                            fontFamily: showPassword ? 'inherit' : 'monospace',
                                            letterSpacing: showPassword ? 'normal' : '2px'
                                        }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            {isLogin && (
                                <div style={{ textAlign: 'right', marginBottom: '25px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsRecovery(true); setError(null); setValidationError(''); setMessage(null); }}
                                        style={{ background: 'none', border: 'none', color: '#718096', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        {t('auth.forgotPassword')}
                                    </button>
                                </div>
                            )}

                            {!isLogin && (
                                <div style={{ marginBottom: '35px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '500', color: '#4a5568' }}>{t('auth.confirmPassword')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px 45px 14px 18px', 
                                                border: '1px solid #e2e8f0', 
                                                borderRadius: '12px', 
                                                fontSize: '1rem', 
                                                outline: 'none',
                                                fontFamily: showConfirmPassword ? 'inherit' : 'monospace',
                                                letterSpacing: showConfirmPassword ? 'normal' : '2px'
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── Checkbox condiciones (solo en registro) ─── */}
                    {!isLogin && !isRecovery && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: 'var(--color-accent)', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <span style={{ fontSize: '0.88rem', color: '#4a5568', lineHeight: 1.5 }}>
                                    {t('auth.acceptTerms')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', textDecoration: 'underline', padding: 0 }}
                                    >
                                        {t('clases.rules.title')}
                                    </button>
                                </span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || (!isLogin && !isRecovery && !termsAccepted)}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.2rem', padding: '16px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)', fontWeight: '600', opacity: (!isLogin && !isRecovery && !termsAccepted) ? 0.5 : 1, transition: 'opacity 0.2s' }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isRecovery ? t('auth.sendInstructions') : (isLogin ? t('auth.enter') : t('auth.register')))}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '1.05rem', color: '#718096' }}>
                    {isRecovery ? (
                        <button
                            onClick={() => { setIsRecovery(false); setError(null); setValidationError(''); setMessage(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem' }}
                        >
                            {t('auth.backToLogin')}
                        </button>
                    ) : (
                        <>
                            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(null); setValidationError(''); setMessage(null); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', marginLeft: '8px' }}
                            >
                                {isLogin ? t('auth.registerHere') : t('auth.loginHere')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ─── Modal Condiciones de Suscripción ─── */}
            {showTermsModal && (
                <div
                    onClick={() => setShowTermsModal(false)}
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#0f172a', color: '#cbd5e1',
                            borderRadius: '24px', padding: '32px',
                            maxWidth: '540px', width: '100%',
                            maxHeight: '85vh', overflowY: 'auto',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                            border: '1px dashed rgba(56,189,248,0.3)',
                            position: 'relative'
                        }}
                    >
                        <h3 style={{ margin: '0 0 1.2rem', color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>
                            {t('clases.rules.title')}
                        </h3>

                        {/* Precio destacado */}
                        {subscriptionPrice && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
                                borderRadius: '14px', padding: '14px 20px', marginBottom: '1.2rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}
                                    >{t('clases.card.title')}</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', lineHeight: 1 }}>
                                            {Number(subscriptionPrice) % 1 === 0 ? Math.floor(subscriptionPrice) : subscriptionPrice}
                                        </span>
                                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fbbf24' }}>€/mes</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>🚚 {t('clases.card.shippingIncluded')}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{t('clases.card.noCommitment')}</div>
                                </div>
                            </div>
                        )}
                        {/* Zonas de envío activas */}
                        {shippingZones.length > 0 && (
                            <div style={{ marginBottom: '1.2rem' }}>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    📦 {t('auth.termsShippingZones')}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {shippingZones.map(zone => (
                                        <span key={zone.name} style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: 'rgba(56,189,248,0.12)',
                                            border: '1px solid rgba(56,189,248,0.3)',
                                            color: '#7dd3fc',
                                            fontSize: '0.82rem',
                                            fontWeight: '500'
                                        }}>
                                            ✓ {zone.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.93rem', lineHeight: 1.6 }}>
                            <p style={{ margin: 0 }}>{t('clases.rules.p2')}</p>
                            <p style={{ margin: 0 }}>{t('clases.rules.p3')}</p>
                            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '10px', borderLeft: '3px solid #38bdf8', fontStyle: 'italic', fontSize: '0.88rem' }}>
                                {t('clases.rules.example')}
                            </div>
                            <p style={{ margin: 0, color: '#7dd3fc', fontWeight: '600' }}>{t('clases.rules.billing')}</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75 }}>{t('clases.rules.cancel')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(false)}
                            style={{
                                marginTop: '24px', width: '100%',
                                padding: '12px', borderRadius: '12px',
                                backgroundColor: 'var(--color-accent)', color: 'white',
                                border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer'
                            }}
                        >
                            {t('auth.termsClose')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
