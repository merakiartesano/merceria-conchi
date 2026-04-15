import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError(t('auth.errorPasswordMatch'));
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError(t('auth.errorPasswordLength'));
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage(t('auth.passwordUpdated'));
            setTimeout(() => {
                navigate('/login');
            }, 3000);
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
                maxWidth: '440px', 
                backgroundColor: '#fff', 
                padding: '50px 40px', 
                borderRadius: '30px', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2.8rem', fontFamily: 'var(--font-serif)', marginBottom: '10px' }}>
                        {t('auth.resetTitle')}
                    </h1>
                    <p style={{ color: '#718096', fontSize: '1.05rem' }}>{t('auth.resetDesc')}</p>
                    <div style={{ height: '4px', width: '60px', backgroundColor: 'var(--color-accent)', margin: '20px auto 0', borderRadius: '2px' }}></div>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '14px', marginBottom: '25px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {message && (
                    <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '20px', borderRadius: '14px', marginBottom: '25px', fontSize: '1.05rem', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={18} /> {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleResetPassword}>
                        <div style={{ marginBottom: '18px', position: 'relative' }}>
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
                                        border: '1px solid #e2e8f0', 
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

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.2rem', padding: '16px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)', fontWeight: '600' }}>
                            {loading ? <Loader2 className="animate-spin" /> : t('auth.updatePassword')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
