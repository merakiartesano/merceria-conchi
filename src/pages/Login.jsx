import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    // From where the user came, so we can redirect them back
    const fromLocation = location.state?.from;
    const from = fromLocation
        ? (fromLocation.pathname + (fromLocation.search || ''))
        : '/academia';

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

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
                            phone: phone
                        },
                        emailRedirectTo: window.location.origin + '/login',
                    }
                });
                if (error) throw error;
                
                // If there's a session returned, meaning no email confirmation is required:
                if (data?.session) {
                    navigate(from, { replace: true });
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
        <div style={{ padding: '120px 20px 60px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#fff', padding: '50px 40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--color-primary)', fontSize: '2.5rem', fontFamily: 'var(--font-serif)' }}>
                    {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
                </h1>

                {error && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '12px', marginBottom: '25px', fontSize: '0.95rem' }}>{error}</div>}
                {message && <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '20px', borderRadius: '12px', marginBottom: '25px', fontSize: '1.05rem', border: '1px solid #a7f3d0' }}>{message}</div>}

                <form onSubmit={handleAuth}>
                    {!isLogin && (
                        <>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', color: '#4a5568' }}>{t('auth.firstName')}</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', color: '#4a5568' }}>{t('auth.lastName')}</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', color: '#4a5568' }}>{t('auth.phone')}</label>
                                <input
                                    type="tel"
                                    required={!isLogin}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        </>
                    )}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', color: '#4a5568' }}>{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <div style={{ marginBottom: '35px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', color: '#4a5568' }}>{t('auth.password')}</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '14px 18px', border: '2px solid #1a202c', borderRadius: '12px', fontSize: '1.1rem', letterSpacing: '2px', outline: 'none' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.2rem', padding: '16px', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? t('auth.enter') : t('auth.register'))}
                    </button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '1.05rem', color: '#718096' }}>
                    {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem' }}
                    >
                        {isLogin ? t('auth.registerHere') : t('auth.loginHere')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
