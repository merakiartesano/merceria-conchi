import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Star, Calendar, Users, Video, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getActiveSubscribersCount } from '../lib/productService';

const Clases = () => {
    const { user, hasActiveSubscription } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSpots, setActiveSpots] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('academy_settings')
                    .select('stripe_payment_link, subscription_price, subscription_features, welcome_text, max_subscribers')
                    .eq('id', 1)
                    .maybeSingle();
                setSettings(data);
                
                if (data && data.max_subscribers > 0) {
                    try {
                        const count = await getActiveSubscribersCount();
                        setActiveSpots(count);
                    } catch (err) {
                        console.error("Error fetching active spots", err);
                    }
                }
            } catch (e) {
                console.error('Error loading academy settings:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const features = settings?.subscription_features
        ? settings.subscription_features.split('\n').map(f => f.trim()).filter(Boolean)
        : [
            'Clases en directo semanales por Zoom',
            'Acceso a todos los materiales del proyecto',
            'Resolución de dudas en tiempo real',
            'Comunidad privada de alumnas',
            'Grabaciones disponibles 48h tras la clase',
        ];

    const price = settings?.subscription_price ?? 9.99;
    const paymentLink = settings?.stripe_payment_link;
    const maxSubscribers = settings?.max_subscribers || 0;
    const isFull = maxSubscribers > 0 && activeSpots >= maxSubscribers;

    const handleCTA = () => {
        if (!user) {
            navigate('/login');
        } else if (hasActiveSubscription) {
            navigate('/academia');
        } else if (paymentLink) {
            window.location.href = `${paymentLink}?client_reference_id=${user.id}`;
        } else {
            navigate('/login');
        }
    };

    const ctaLabel = !user
        ? 'Entrar y Suscribirse'
        : hasActiveSubscription
            ? 'Ir a mi Academia →'
            : 'Suscribirme Ahora';

    return (
        <div style={{ backgroundColor: '#faf8f5', minHeight: '100vh', paddingBottom: '5rem' }}>

            {/* HERO */}
            <section style={{
                background: 'linear-gradient(135deg, #fdf2f8 0%, #f0fdf4 100%)',
                padding: '6rem 2rem 3rem',
                textAlign: 'center',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: 'var(--color-primary)', color: 'white', padding: '6px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                        🧵 Academia Meraki ArteSano
                    </div>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: 'var(--color-text)', marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                        Aprende a Coser<br />desde Casa
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                        Clases semanales en directo por Zoom con Conchi. Sin desplazamientos, a tu ritmo, con la guía de una profesional.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={handleCTA} className="btn btn-primary" style={{ padding: '1rem 2.2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
                            {ctaLabel} <ArrowRight size={20} />
                        </button>
                    </div>
                    {!user && (
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#a0aec0' }}>
                            ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Inicia sesión</Link>
                        </p>
                    )}
                </div>
            </section>

            {/* FEATURES */}
            <section style={{ padding: '4rem 2rem 0' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { icon: <Calendar size={28} />, title: 'Cada semana', desc: 'Una clase nueva en directo cada semana con un proyecto diferente.' },
                        { icon: <Users size={28} />, title: 'Grupo pequeño', desc: 'Grupo reducido para que Conchi pueda atender a cada alumna.' },
                        { icon: <Video size={28} />, title: 'Grabaciones 48h', desc: 'Si no puedes asistir, tienes la grabación disponible durante 48 horas.' },
                        { icon: <Star size={28} />, title: 'Materiales incluidos', desc: 'Recibe el listado de materiales antes de cada clase para que llegues preparada.' },
                    ].map((f, i) => (
                        <div key={i} style={{ backgroundColor: 'white', padding: '1.8rem', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', padding: '0.9rem', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', marginBottom: '1rem' }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>{f.title}</h3>
                            <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* PRICING CARD */}
            <section style={{ padding: '4rem 2rem' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)' }} />
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                            border: '2px solid var(--color-primary)'
                        }}>
                            {/* Card header */}
                            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', padding: '2rem', textAlign: 'center', color: 'white' }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Suscripción mensual</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>€</span>
                                    <span style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 }}>{Number(price).toFixed(2).replace('.', ',')}</span>
                                    <span style={{ fontSize: '1rem', opacity: 0.85 }}>/mes</span>
                                </div>
                                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Cancela cuando quieras · Sin permanencia</p>
                            </div>

                            {/* Features list */}
                            <div style={{ padding: '1.8rem 2rem' }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.8rem' }}>
                                    {features.map((feat, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', color: '#334155', fontSize: '0.95rem' }}>
                                            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                {hasActiveSubscription ? (
                                    <Link to="/academia" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700' }}>
                                        ✅ Ya soy suscriptora — Ir a mi Academia
                                    </Link>
                                ) : isFull ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <button disabled style={{ display: 'block', width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#64748b', border: 'none', cursor: 'not-allowed', marginBottom: '8px' }}>
                                            🔒 Plazas Agotadas
                                        </button>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', fontWeight: '500' }}>Se ha alcanzado el límite máximo de alumnas ({maxSubscribers}).</p>
                                    </div>
                                ) : !user ? (
                                    <div>
                                        <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>
                                            <Lock size={16} style={{ marginRight: '8px' }} />
                                            Crear cuenta y suscribirme
                                        </Link>
                                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Necesitas una cuenta para suscribirte</p>
                                    </div>
                                ) : paymentLink ? (
                                    <a href={`${paymentLink}?client_reference_id=${user.id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700' }}>
                                        Empezar mi suscripción <ArrowRight size={18} style={{ marginLeft: '6px' }} />
                                    </a>
                                ) : (
                                    <button disabled className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', opacity: 0.6, cursor: 'not-allowed' }}>
                                        Próximamente disponible
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* TESTIMONIAL / CTA */}
            <section style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid var(--color-primary)' }}>
                    <p style={{ fontSize: '1.1rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 1rem' }}>
                        "{settings?.welcome_text || '¡Únete a nuestra comunidad y empieza a crear proyectos de costura increíbles desde casa!'}"
                    </p>
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-primary)', fontSize: '0.95rem' }}>— Conchi, Meraki ArteSano</p>
                </div>
            </section>
        </div>
    );
};

export default Clases;
