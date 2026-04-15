import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Video, Loader2, LogOut, Lock, Calendar as CalendarIcon, X, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Academy = () => {
    const { user, signOut, hasActiveSubscription, refreshSubscription } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('content'); // 'content' or 'profile'
    const [freshSubscription, setFreshSubscription] = useState(hasActiveSubscription);
    const [settings, setSettings] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugContext, setDebugContext] = useState('');
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        zip: '',
        city: '',
        state: '',
        country: 'España',
        pickup_pref: false
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

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
                // Force refresh subscription to ensure accurate status
                if (user) {
                    const latestSub = await refreshSubscription();
                    if (isMounted) setFreshSubscription(!!latestSub);

                    // Fetch Profile Data
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();
                    
                    if (profileData && isMounted) {
                        setProfile({
                            first_name: profileData.first_name || '',
                            last_name: profileData.last_name || '',
                            phone: profileData.phone || '',
                            address: profileData.address || '',
                            zip: profileData.zip || '',
                            city: profileData.city || '',
                            state: profileData.state || '',
                            country: profileData.country || 'España',
                            pickup_pref: profileData.pickup_pref || false
                        });
                    }
                }

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

    // Auto-subscripción trigger
    useEffect(() => {
        // Ejecutar sólo cuando ha terminado de cargar todo y no tiene suscripción
        if (!loading && user && !freshSubscription) {
            const searchParams = new URLSearchParams(location.search);
            if (searchParams.get('autoSuscripcion') === 'true' && !subscribing) {
                handleSubscribe();
                
                // Opcional: limpiar la URL para que si hace un refresh no vuelva a saltar
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({path: newUrl}, '', newUrl);
            }
        }
    }, [loading, freshSubscription, location.search, user]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg({ type: '', text: '' });
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    phone: profile.phone,
                    address: profile.address,
                    zip: profile.zip,
                    city: profile.city,
                    state: profile.state,
                    country: profile.country,
                    pickup_pref: profile.pickup_pref,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) throw error;
            setProfileMsg({ type: 'success', text: t('profile.success') });
        } catch (err) {
            console.error("Update profile error:", err);
            setProfileMsg({ type: 'error', text: t('profile.error') });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error("Logout Error:", e);
        } finally {
            navigate('/');
        }
    };

    const [managingSub, setManagingSub] = useState(false);
    const [portalError, setPortalError] = useState('');

    const handleManageSubscription = async () => {
        setIsManageModalOpen(true);
    };

    const [subscribing, setSubscribing] = useState(false);
    
    const handleSubscribe = async () => {
        setSubscribing(true);
        setPortalError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login', { state: { isRegister: true } });
                return;
            }

            const { data, error } = await supabase.functions.invoke('redsys-create-subscription', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: { 
                    userId: user.id, 
                    email: user.email, 
                    amount: settings?.subscription_price || 32 
                }
            });

            if (error) throw error;

            if (data?.redsysUrl) {
                // Crear y enviar formulario oculto a Redsys
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.redsysUrl;

                const params = {
                    Ds_SignatureVersion: data.Ds_SignatureVersion,
                    Ds_MerchantParameters: data.Ds_MerchantParameters,
                    Ds_Signature: data.Ds_Signature
                };

                for (const key in params) {
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = key;
                    hiddenField.value = params[key];
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error("Respuesta inválida al generar suscripción (no URL)");
            }
        } catch (error) {
            console.error("Subscription create error:", error);
            setPortalError('Error al procesar la suscripción: ' + (error.message || 'Inténtalo de nuevo.'));
        } finally {
            setSubscribing(false);
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
                        <p style={{ color: '#718096', fontSize: '1.1rem' }}>{t('academy.welcome')} <span style={{ color: '#4a5568', fontWeight: '500' }}>{user?.user_metadata?.first_name || user?.email}</span></p>
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

                {/* Tab Selector */}
                <div style={{ display: 'flex', gap: '2px', marginBottom: '40px', backgroundColor: '#edf2f7', padding: '5px', borderRadius: '15px', width: 'fit-content' }}>
                    <button 
                        onClick={() => setActiveTab('content')}
                        style={{ 
                            padding: '10px 30px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            backgroundColor: activeTab === 'content' ? '#fff' : 'transparent',
                            color: activeTab === 'content' ? 'var(--color-primary)' : '#718096',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'content' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('nav.classes')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        style={{ 
                            padding: '10px 30px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            backgroundColor: activeTab === 'profile' ? '#fff' : 'transparent',
                            color: activeTab === 'profile' ? 'var(--color-primary)' : '#718096',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('profile.title')}
                    </button>
                </div>

                {activeTab === 'content' ? (
                    <>
                        {/* Subscription Gateway (If Not Active) */}
                        {!freshSubscription ? (
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

                                {settings?.subscription_price ? (
                                    <button 
                                        onClick={handleSubscribe} 
                                        disabled={subscribing}
                                        className="btn btn-primary" 
                                        style={{ fontSize: '1.2rem', padding: '16px 50px', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)', display: 'inline-flex', gap: '10px', alignItems: 'center' }}
                                    >
                                        {subscribing ? <Loader2 size={24} className="animate-spin" /> : null}
                                        {subscribing ? "Redirigiendo al banco..." : t('academy.subscribeNow')}
                                    </button>
                                ) : (
                                    <button disabled className="btn btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '1.2rem', padding: '16px 50px', borderRadius: '30px' }}>
                                        {t('academy.subClosed')}
                                    </button>
                                )}
                                <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#a0aec0' }}>Serás redirigida de forma segura a nuestra pasarela de pago (Redsys).</p>
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

                                {/* Academy Calendar Section */}
                                <div style={{ backgroundColor: '#1a202c', color: '#fff', padding: '50px 40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', marginBottom: '60px', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
                                        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            <CalendarIcon size={32} color="#2d3748" />
                                        </div>
                                        <h2 style={{ color: '#63b3ed', fontSize: '2.5rem', margin: 0, fontFamily: 'var(--font-serif)', fontWeight: '700' }}>
                                            {t('academy.calendarTitle') || 'Calendario Mensual'}
                                        </h2>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                        {settings?.calendar_text ? settings.calendar_text.split('\n').map((line, idx) => {
                                            if (!line.trim()) return <div key={idx} style={{ height: '10px' }}></div>;
                                            
                                            // Special styling for headers if needed (simple check)
                                            const isHeader = line.includes('📅');
                                            if (isHeader) return null; // We already have the header

                                            const parts = line.split('→');
                                            return (
                                                <div key={idx} style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: '1.4' }}>
                                                    {parts.length > 1 ? (
                                                        <>
                                                            <span style={{ color: '#fff', fontWeight: '500', whiteSpace: 'nowrap' }}>{parts[0].trim()}</span>
                                                            <span style={{ color: '#63b3ed', fontWeight: 'bold' }}>→</span>
                                                            <span style={{ color: '#e2e8f0', fontWeight: '300' }}>{parts[1].trim()}</span>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#e2e8f0', fontWeight: '300' }}>{line}</span>
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>No hay eventos programados para este mes.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Video Library Section (Only shown if there are videos) */}
                                {videos.length > 0 && (
                                    <div style={{ marginBottom: '40px' }}>
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
                    </>
                ) : (
                    /* My Data / Profile Tab */
                    <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', maxWidth: '800px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '10px', fontFamily: 'var(--font-serif)' }}>{t('profile.title')}</h2>
                        <p style={{ color: '#718096', marginBottom: '30px' }}>{t('profile.subtitle')}</p>

                        {profileMsg.text && (
                            <div style={{ 
                                padding: '15px', 
                                borderRadius: '12px', 
                                marginBottom: '25px', 
                                backgroundColor: profileMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                                color: profileMsg.type === 'success' ? '#065f46' : '#991b1b',
                                border: `1px solid ${profileMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                            }}>
                                {profileMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile}>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('auth.firstName')}</label>
                                    <input type="text" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('auth.lastName')}</label>
                                    <input type="text" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('auth.phone')}</label>
                                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('auth.country')}</label>
                                    <select value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fff' }}>
                                        <option value="España">España</option>
                                        <option value="Portugal">Portugal</option>
                                        <option value="France">France</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('checkout.address')}</label>
                                <input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('checkout.zip')}</label>
                                    <input type="text" value={profile.zip} onChange={(e) => setProfile({...profile, zip: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('checkout.city')}</label>
                                    <input type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#4a5568' }}>{t('checkout.state')}</label>
                                <input type="text" value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                            </div>

                            <div style={{ marginBottom: '35px', padding: '15px', backgroundColor: '#fdf2f8', borderRadius: '12px', border: '1px solid #fce7f3', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input 
                                    type="checkbox" 
                                    id="pickup_pref"
                                    checked={profile.pickup_pref} 
                                    onChange={(e) => setProfile({...profile, pickup_pref: e.target.checked})}
                                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                />
                                <label htmlFor="pickup_pref" style={{ fontSize: '1rem', color: '#be185d', fontWeight: '500', cursor: 'pointer' }}>
                                    {t('checkout.pickupInStore')} (Preferencia para mis kits)
                                </label>
                            </div>

                            <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {savingProfile ? <Loader2 size={18} className="animate-spin" /> : null}
                                {savingProfile ? t('profile.saving') : t('profile.save')}
                            </button>
                        </form>
                    </div>
                )}

            </div>

            {/* --- MODAL GESTIÓN DE SUSCRIPCIÓN (REDSYS) --- */}
            {isManageModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        maxWidth: '500px',
                        width: '100%',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        position: 'relative',
                        textAlign: 'center'
                    }}>
                        <button 
                            onClick={() => setIsManageModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#a0aec0',
                                cursor: 'pointer',
                                padding: '5px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{
                            width: '70px',
                            height: '70px',
                            backgroundColor: '#fdf2f8',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: 'var(--color-primary)'
                        }}>
                            <Mail size={32} />
                        </div>

                        <h3 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '15px', fontFamily: 'var(--font-serif)' }}>Gestión de Suscripción</h3>
                        
                        <p style={{ color: '#4a5568', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>
                            Para administrar o cancelar tu suscripción al <strong>Club Creativo MERAKI</strong>, por favor envíanos un correo a <strong>hola@merakiartesano.es</strong> y lo gestionaremos lo antes posible.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={() => {
                                    window.location.href = "mailto:hola@merakiartesano.es?subject=Gestión de Subscripción Club Creativo MERAKI";
                                    setIsManageModalOpen(false);
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '14px', borderRadius: '30px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <Mail size={20} /> Enviar correo ahora
                            </button>
                            <button 
                                onClick={() => setIsManageModalOpen(false)}
                                style={{ width: '100%', padding: '12px', borderRadius: '30px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#718096', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Tal vez luego
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Academy;
