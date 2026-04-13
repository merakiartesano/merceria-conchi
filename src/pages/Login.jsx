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
    
    // Si venimos de un botón de "Unirse", queremos mostrar registro directamente
    const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [message, setMessage] = useState(null);

    // Password visibility and confirmation
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const { t } = useLanguage();

    // From where the user came, so we can redirect them back
    const fromLocation = location.state?.from;
    const from = fromLocation
        ? (fromLocation.pathname + (fromLocation.search || ''))
        : '/academia';

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
                        {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
                    </h1>
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

                <form onSubmit={handleAuth}>
                    {!isLogin && (
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

                    <div style={{ marginBottom: isLogin ? '35px' : '18px', position: 'relative' }}>
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

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.2rem', padding: '16px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)', fontWeight: '600' }}>
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? t('auth.enter') : t('auth.register'))}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '1.05rem', color: '#718096' }}>
                    {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); setValidationError(''); setMessage(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', marginLeft: '8px' }}
                    >
                        {isLogin ? t('auth.registerHere') : t('auth.loginHere')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
