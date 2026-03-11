import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Video, Loader2, LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Academy = () => {
    const { user, signOut, hasActiveSubscription } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [settings, setSettings] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugContext, setDebugContext] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fallbackTimer = setTimeout(() => {
            if (isMounted && loading) {
                setDebugContext(t('academy.timeout'));
                setLoading(false);
            }
        }, 5000);

        const fetchAcademyData = async () => {
            try {
                // Fetch settings for live class
                const { data: settingsData, error: settingsError } = await supabase
                    .from('academy_settings')
                    .select('*')
                    .maybeSingle();

                if (settingsError) {
                    setDebugContext(prev => prev + ' | Settings Err: ' + JSON.stringify(settingsError));
                }
                if (settingsData && isMounted) setSettings(settingsData);

                // Fetch video library
                const { data: videosData, error: videosError } = await supabase
                    .from('academy_videos')
                    .select('*')
                    .order('order_index', { ascending: true });

                if (videosError) {
                    setDebugContext(prev => prev + ' | Videos Err: ' + JSON.stringify(videosError));
                }
                if (videosData && isMounted) setVideos(videosData);
            } catch (error) {
                setDebugContext(prev => prev + ' | Catch Err: ' + error.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAcademyData();

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimer);
        };
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            // Allow the AuthContext listener to trigger the redirect naturally
        } catch (e) {
            console.error("Logout Error:", e);
            navigate('/');
        }
    };

    const [managingSub, setManagingSub] = useState(false);
    const [portalError, setPortalError] = useState('');

    const handleManageSubscription = async () => {
        setManagingSub(true);
        setPortalError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { return_url: window.location.href },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) {
                console.error("Invoke error explicit:", error);
                throw error;
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                setPortalError('No se pudo abrir el portal de Stripe. Prueba de nuevo o contacta con nosotros.');
            }
        } catch (error) {
            console.error("Portal error catch:", error);
            setPortalError('Error al gestionar la suscripción: ' + (error.message || 'Inténtalo de nuevo.'));
        } finally {
            setManagingSub(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '20px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
                <p style={{ color: '#718096', fontSize: '1.1rem' }}>{t('academy.loading')}</p>
                {debugContext && <p style={{ color: 'red', marginTop: '10px' }}>Debug: {debugContext}</p>}
            </div>
        );
    }

    return (
        <div style={{ padding: '120px 20px 60px', backgroundColor: '#fafafa', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>

                {/* Header / Dashboard Menu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ color: 'var(--color-primary)', fontSize: '2.8rem', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>{t('academy.title')}</h1>
                        <p style={{ color: '#718096', fontSize: '1.1rem' }}>{t('academy.welcome')} <span style={{ color: '#4a5568', fontWeight: '500' }}>{user?.email}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={handleManageSubscription} disabled={managingSub} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2e8f0', color: '#4a5568', borderRadius: '30px', padding: '10px 25px', fontWeight: '600' }}>
                            {managingSub ? <Loader2 size={18} className="animate-spin" /> : null}
                            {managingSub ? t('academy.btnLoading') : t('academy.manageSub')}
                        </button>
                        <button onClick={handleSignOut} className="btn" style={{ backgroundColor: '#fff', color: '#e53e3e', border: '1px solid #fc8181', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '30px', padding: '10px 25px', fontWeight: '600', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff5f5'; e.currentTarget.style.borderColor = '#e53e3e'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#fc8181'; }}
                        >
                            <LogOut size={18} /> {t('academy.logout')}
                        </button>
                    </div>
                </div>

                {portalError && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 20px', borderRadius: '10px', marginBottom: '24px', fontSize: '0.95rem', fontWeight: '500' }}>
                        ❌ {portalError}
                    </div>
                )}

                {/* Subscription Gateway (If Not Active) */}
                {!hasActiveSubscription ? (
                    <div style={{ backgroundColor: '#fff', padding: '60px 40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#fff5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#fc8181' }}>
                            <Lock size={40} />
                        </div>
                        <h2 style={{ fontSize: '2.2rem', marginBottom: '20px', color: '#2d3748', fontFamily: 'var(--font-serif)' }}>{t('academy.inactiveSub')}</h2>

                        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '40px', borderLeft: '4px solid var(--color-primary)' }}>
                            <p style={{ color: '#4a5568', fontSize: '1.15rem', fontStyle: 'italic', margin: 0 }}>
                                "{settings?.welcome_text || t('academy.promoText')}"
                            </p>
                        </div>

                        <p style={{ color: '#718096', marginBottom: '30px', fontSize: '1.05rem' }}>
                            {t('academy.unlockSub')}
                        </p>

                        {settings?.stripe_payment_link ? (
                            <a href={`${settings.stripe_payment_link}?client_reference_id=${user?.id}`} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '16px 50px', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)', display: 'inline-block' }}>
                                {t('academy.subscribeNow')}
                            </a>
                        ) : (
                            <button disabled className="btn btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '1.2rem', padding: '16px 50px', borderRadius: '30px' }}>
                                {t('academy.subClosed')}
                            </button>
                        )}
                        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#a0aec0' }}>{t('academy.stripeRedirect')}</p>
                    </div>
                ) : (
                    <>
                        {/* Live Class Section */}
                        <div style={{ backgroundColor: '#fff', padding: '60px 40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', marginBottom: '60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, var(--color-primary), #63b3ed)' }}></div>
                            <h2 style={{ color: '#2d3748', fontSize: '2.2rem', marginBottom: '15px', fontFamily: 'var(--font-serif)' }}>
                                {settings?.live_title || t('academy.liveClass')}
                            </h2>
                            <p style={{ color: '#718096', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                                {settings?.welcome_text || t('academy.preparing')}
                            </p>
                            {settings?.live_link ? (
                                <a href={settings.live_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '16px 45px', display: 'inline-flex', alignItems: 'center', gap: '12px', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                                    <Video size={24} /> {t('academy.joinNow')}
                                </a>
                            ) : (
                                <div style={{ padding: '25px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#a0aec0', fontSize: '1.05rem', border: '1px dashed #cbd5e0' }}>
                                    {t('academy.noClass')}
                                </div>
                            )}
                        </div>

                        {/* Video Library Section (Only shown if there are videos) */}
                        {videos.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2d3748' }}>{t('academy.library')}</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                                    {videos.map(video => (
                                        <div key={video.id} style={{ backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                            <div style={{ width: '100%', paddingTop: '56.25%', backgroundColor: '#edf2f7', position: 'relative' }}>
                                                {video.video_url.includes('youtube') || video.video_url.includes('vimeo') ? (
                                                    <iframe
                                                        src={video.video_url}
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                                        allowFullScreen
                                                        title={video.title}
                                                    />
                                                ) : (
                                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{t('academy.watchVideo')}</a>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '20px' }}>
                                                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#2d3748' }}>{video.title}</h3>
                                                {video.description && <p style={{ color: '#718096', fontSize: '0.9rem' }}>{video.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Academy;
