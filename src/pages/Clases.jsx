import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, Star, Users, Video, Gift, Loader2, Lock, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getActiveSubscribersCount } from '../lib/productService';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '1.2rem 0' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)' }}
            >
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: isOpen ? 'var(--color-primary)' : 'inherit', transition: 'color 0.2s' }}>{question}</h4>
                {isOpen ? <ChevronUp size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <ChevronDown size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />}
            </button>
            <div style={{ maxHeight: isOpen ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' }}>
                <p style={{ margin: '1rem 0 0 0', color: 'var(--color-text-light)', lineHeight: 1.6 }}>{answer}</p>
            </div>
        </div>
    );
};

const Clases = () => {
    const { user, hasActiveSubscription } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSpots, setActiveSpots] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('academy_settings')
                    .select('subscription_price, max_subscribers')
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

    const maxSubscribers = settings?.max_subscribers || 0;
    const isFull = maxSubscribers > 0 && activeSpots >= maxSubscribers;

    const handleCTA = () => {
        if (!user) {
            navigate('/login?mode=register', {
                state: { 
                    from: { pathname: '/academia' },
                    isRegister: true
                }
            });
        } else if (hasActiveSubscription) {
            navigate('/academia');
        } else {
            navigate('/academia?autoSuscripcion=true');
        }
    };

    const ctaLabel = !user
        ? t('clases.hero.cta.unauth')
        : hasActiveSubscription
            ? t('clases.hero.cta.authSub')
            : t('clases.card.joinBtn');

    const renderCTAButton = (secondary = false) => (
        <button 
            onClick={handleCTA} 
            className={`btn ${secondary ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ 
                padding: '1.2rem 2.5rem', 
                fontSize: '1.15rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '10px', 
                borderRadius: '50px', 
                boxShadow: secondary ? 'none' : '0 10px 25px rgba(245,158,11,0.3)',
                fontWeight: '700',
                width: '100%',
                maxWidth: '400px',
                border: secondary ? '2px solid var(--color-accent)' : 'none',
                backgroundColor: secondary ? 'transparent' : 'var(--color-accent)',
                color: secondary ? 'var(--color-accent)' : 'white'
            }}
        >
            {ctaLabel} {secondary ? null : <ArrowRight size={20} />}
        </button>
    );

    return (
        <div style={{ backgroundColor: '#faf8f5', minHeight: '100vh', paddingBottom: '0', fontFamily: 'var(--font-body)' }}>

            {/* 1. HERO SECTION */}
            <section style={{
                background: 'linear-gradient(135deg, #fff5f8 0%, #fdfbf7 100%)',
                padding: 'clamp(4rem, 15vw, 7rem) clamp(1rem, 5vw, 2rem) 5rem',
                textAlign: 'center',
                borderBottom: '1px solid #f1f5f9',
                overflowX: 'hidden'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--color-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1.1, textWrap: 'balance' }}>
                        {t('clases.hero.title')}
                    </h1>
                    <p style={{ fontSize: '1.3rem', color: '#475569', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: 1.6, textWrap: 'balance' }}>
                        {t('clases.hero.desc')}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        {renderCTAButton()}
                        <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>{t('clases.hero.cta.subtext')}</p>
                    </div>

                    {!user && (
                        <p style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: '#94a3b8' }}>
                            {t('clases.hero.loginText')} <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}>{t('clases.hero.loginLink')}</Link>
                        </p>
                    )}
                </div>
            </section>

            {/* 2. ¿QUÉ ES EL CLUB CREATIVO? */}
            <section style={{ padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 2rem)', backgroundColor: 'white', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                        {t('clases.whatIs.title')}
                    </h2>
                    <div style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <p style={{ margin: 0 }}>{t('clases.whatIs.p1')}</p>
                        <p style={{ margin: 0 }}>{t('clases.whatIs.p2')}</p>
                        <p style={{ margin: 0 }}>{t('clases.whatIs.p3')}</p>
                        <div style={{ backgroundColor: '#fff5f8', padding: '1.8rem', borderRadius: '20px', borderLeft: '4px solid var(--color-accent)' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-accent)', fontStyle: 'italic' }}>{t('clases.whatIs.quote')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. BENEFICIOS */}
            <section style={{ padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 2rem)', backgroundColor: '#fdfbf7', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.8rem', color: 'var(--color-heading)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                            {t('clases.benefits.title')}
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
                            {t('clases.benefits.subtitle')}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {renderCTAButton()}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2rem' }}>
                        {[
                            { emoji: '✨', title: t('clases.benefits.b1.title'), desc: t('clases.benefits.b1.desc') },
                            { emoji: '🎨', title: t('clases.benefits.b2.title'), desc: t('clases.benefits.b2.desc') },
                            { emoji: '📚', title: t('clases.benefits.b3.title'), desc: t('clases.benefits.b3.desc') },
                            { emoji: '💛', title: t('clases.benefits.b4.title'), desc: t('clases.benefits.b4.desc') },
                            { emoji: '👩‍🎨', title: t('clases.benefits.b5.title'), desc: t('clases.benefits.b5.desc') },
                            { emoji: '🌸', title: t('clases.benefits.b6.title'), desc: t('clases.benefits.b6.desc') },
                        ].map((b, i) => (
                            <div key={i} style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.3s' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>{b.emoji}</div>
                                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-heading)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{b.title}</h3>
                                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0, fontSize: '1.05rem' }}>{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {renderCTAButton()}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. ¿ES PARA TI? */}
            <section style={{ padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 2rem)', backgroundColor: 'white', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
                            {t('clases.isForYou.subtitle')}
                        </p>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                            {t('clases.isForYou.title')}
                        </h2>
                    </div>

                    <div style={{ backgroundColor: '#fdf2f8', padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '30px', border: '1px solid #fce7f3' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                t('clases.isForYou.li1'),
                                t('clases.isForYou.li2'),
                                t('clases.isForYou.li3'),
                                t('clases.isForYou.li4'),
                                t('clases.isForYou.li5'),
                                t('clases.isForYou.li6')
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', fontSize: '1.15rem', color: '#334155', lineHeight: 1.5 }}>
                                    <Sparkles size={24} style={{ color: '#ec4899', flexShrink: 0, marginTop: '3px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #fbcfe8', textAlign: 'center' }}>
                            <p style={{ fontWeight: '600', color: 'var(--color-accent)', fontSize: '1.2rem', margin: '0 0 2rem 0' }}>
                                {t('clases.isForYou.bottomText')}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {renderCTAButton()}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. PRICING & QUÉ INCLUYE */}
            <section style={{ padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 5vw, 2rem)', backgroundColor: '#0f172a', color: 'white', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '4rem', alignItems: 'center' }}>
                    
                    {/* Qué Inluye */}
                    <div>
                        <div style={{ display: 'inline-block', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {t('clases.pricing.badge')}
                        </div>
                        <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                            {t('clases.pricing.title')}
                        </h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} /> 
                                <span style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.5 }}>{t('clases.pricing.inc1')} <br/><span style={{ fontSize: '0.95rem', color: '#94a3b8' }}>{t('clases.pricing.inc1.sub')}</span></span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc2')}</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc3')}</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc4')}</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc5')}</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc6')}</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Gift size={22} color="#f59e0b" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{t('clases.pricing.inc7')}</span></li>
                        </ul>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            {/* Visual Calendar Content */}
                            <div>
                                <h4 style={{ margin: '0 0 20px', color: '#38bdf8', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                                    <Video size={20} /> {t('clases.pricing.cal.title')}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                    {[
                                        { range: t('clases.pricing.cal.li1').split(' → ')[0], text: t('clases.pricing.cal.li1').split(' → ')[1], icon: '📦' },
                                        { range: t('clases.pricing.cal.li2').split(' → ')[0], text: t('clases.pricing.cal.li2').split(' → ')[1], icon: '🚚' },
                                        { range: t('clases.pricing.cal.li3').split(' → ')[0], text: t('clases.pricing.cal.li3').split(' → ')[1], icon: '🎥' },
                                        { range: t('clases.pricing.cal.li4').split(' → ')[0], text: t('clases.pricing.cal.li4').split(' → ')[1], icon: '📼' }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '15px', 
                                            backgroundColor: 'rgba(255,255,255,0.03)', 
                                            padding: '12px 20px', 
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.range}</div>
                                                <div style={{ fontSize: '1rem', color: '#e2e8f0' }}>{item.text}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subscription Rules / Cutoff Explanation */}
                            <div style={{ 
                                backgroundColor: 'rgba(56, 189, 248, 0.05)', 
                                padding: '2rem', 
                                borderRadius: '24px', 
                                border: '1px dashed rgba(56, 189, 248, 0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                    <Sparkles size={80} color="#38bdf8" />
                                </div>
                                <h4 style={{ margin: '0 0 1rem', color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>
                                    {t('clases.rules.title')}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                                    <p style={{ margin: 0 }}>{t('clases.rules.p2')}</p>
                                    <p style={{ margin: 0 }}>{t('clases.rules.p3')}</p>
                                    <div style={{ 
                                        marginTop: '0.5rem',
                                        padding: '12px 16px', 
                                        backgroundColor: 'rgba(0,0,0,0.2)', 
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        borderLeft: '3px solid #38bdf8',
                                        fontStyle: 'italic'
                                    }}>
                                        {t('clases.rules.example')}
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.8 }}>{t('clases.rules.cancel')}</p>
                                </div>
                            </div>

                            {/* Our Difference (Restored & Polished) */}
                            <div>
                                <h4 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                    <Star size={20} /> {t('clases.pricing.diff.title')}
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem 1.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <li key={i}>{t(`clases.pricing.diff.li${i}`)}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta de Suscripción */}
                    <div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)' }} />
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '30px',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                            }}>
                                <div style={{ height: '20px' }} />
                                <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1.6rem', margin: '0 0 15px', color: 'var(--color-heading)' }}>{t('clases.card.title')}</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precio habitual</span>
                                            <span style={{ color: '#94a3b8', fontSize: '1.3rem', textDecoration: 'line-through', fontWeight: '700' }}>45 €/mes</span>
                                        </div>
                                        <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ 
                                                backgroundColor: '#fee2e2', 
                                                color: '#dc2626', 
                                                padding: '4px 14px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: '800', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '1px', 
                                                marginBottom: '-10px', 
                                                zIndex: 1, 
                                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.15)',
                                                border: '1px solid #fca5a5'
                                            }}>
                                                ¡Ahora!
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', color: 'var(--color-accent)' }}>
                                                <span style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1 }}>
                                                    {settings?.subscription_price ? 
                                                        (Number(settings.subscription_price) % 1 === 0 ? 
                                                            Math.floor(settings.subscription_price) : 
                                                            settings.subscription_price.toString().replace('.', ',')) 
                                                        : t('clases.card.price')
                                                    }
                                                </span>
                                                <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{t('clases.card.currency')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ margin: '20px 0 30px' }}>
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            fontSize: '0.95rem', 
                                            fontWeight: '600', 
                                            color: '#059669', 
                                            backgroundColor: '#ecfdf5', 
                                            padding: '8px 20px', 
                                            borderRadius: '50px',
                                            border: '1px solid #d1fae5'
                                        }}>
                                            <span style={{ fontSize: '1.1rem' }}>🚚</span> {t('clases.card.shippingIncluded')}
                                        </div>
                                    </div>

                                    {hasActiveSubscription ? (
                                        <Link to="/academia" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700' }}>
                                            {t('clases.card.memberBtn')}
                                        </Link>
                                    ) : isFull ? (
                                        <button disabled style={{ display: 'block', width: '100%', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#64748b', border: 'none', cursor: 'not-allowed' }}>
                                            {t('clases.card.soldOut')}
                                        </button>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '12px', fontStyle: 'italic', fontWeight: '500' }}>
                                                {t('clases.card.quote')}
                                            </p>
                                            <button 
                                                onClick={handleCTA}
                                                className="btn btn-primary" 
                                                style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700', boxShadow: '0 8px 20px rgba(245,158,11,0.25)' }}
                                            >
                                                {!user ? <Lock size={18} /> : null}
                                                {t('clases.card.joinBtn')}
                                            </button>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>
                                                {t('clases.card.noCommitment')}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 6. FAQ */}
            <section style={{ padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 2rem)', backgroundColor: '#faf8f5', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', marginBottom: '3rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
                        {t('clases.faq.title')}
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', padding: 'clamp(1.5rem, 5vw, 2rem) clamp(1rem, 5vw, 3rem)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <FAQItem 
                            question={t('clases.faq.q1')} 
                            answer={t('clases.faq.a1')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q2')} 
                            answer={t('clases.faq.a2')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q3')} 
                            answer={t('clases.faq.a3')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q4')} 
                            answer={t('clases.faq.a4')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q5')} 
                            answer={t('clases.faq.a5')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q6')} 
                            answer={t('clases.faq.a6')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q7')} 
                            answer={t('clases.faq.a7')} 
                        />
                        <FAQItem 
                            question={t('clases.faq.q8')} 
                            answer={t('clases.faq.a8')} 
                        />
                    </div>
                </div>
            </section>

            {/* 7. FINAL CTA */}
            <section style={{ padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 2rem)', backgroundColor: 'var(--color-accent)', color: 'white', textAlign: 'center', overflowX: 'hidden' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <Heart size={48} color="white" fill="white" opacity={0.2} />
                    </div>
                    <h2 style={{ fontSize: '2.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                        {t('clases.final.title')}
                    </h2>
                    <p style={{ fontSize: '1.3rem', margin: '0 auto 3.5rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '700px' }}>
                        {t('clases.final.desc')}
                    </p>
                    <button 
                        onClick={handleCTA}
                        className="btn" 
                        style={{ backgroundColor: 'white', color: 'var(--color-accent)', padding: '1.3rem 3.5rem', fontSize: '1.25rem', fontWeight: '800', borderRadius: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                    >
                        {t('clases.final.btn')}
                    </button>
                    <p style={{ marginTop: '2rem', fontSize: '1.1rem', fontStyle: 'italic', opacity: 0.8 }}>
                        {t('clases.final.quote')}
                    </p>
                    <p style={{ marginTop: '1rem', fontSize: '0.95rem', fontWeight: '600', opacity: 0.9 }}>
                        {t('clases.final.noCommitment')}
                    </p>
                </div>
            </section>

        </div>
    );
};

export default Clases;
