import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, Star, Users, Video, Gift, Loader2, Lock, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSpots, setActiveSpots] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('academy_settings')
                    .select('stripe_payment_link, subscription_price, max_subscribers')
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

    const paymentLink = settings?.stripe_payment_link;
    const maxSubscribers = settings?.max_subscribers || 0;
    const isFull = maxSubscribers > 0 && activeSpots >= maxSubscribers;

    const handleCTA = () => {
        if (!user) {
            // Redirect to login, but remember where to go after authentication
            navigate('/login', {
                state: { from: { pathname: '/checkout', search: '?type=subscription' } }
            });
        } else if (hasActiveSubscription) {
            navigate('/academia');
        } else {
            // User already has account, go straight to checkout
            navigate('/checkout?type=subscription');
        }
    };

    const ctaLabel = !user
        ? 'Quiero unirme al club'
        : hasActiveSubscription
            ? 'Ir a mi Academia →'
            : 'Quiero unirme al club';

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
                padding: '7rem 2rem 5rem',
                textAlign: 'center',
                borderBottom: '1px solid #f1f5f9'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        🧶 Club Meraki ArteSano
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--color-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1.1, textWrap: 'balance' }}>
                        Crea, aprende, y disfruta cada mes.
                    </h1>
                    <p style={{ fontSize: '1.3rem', color: '#475569', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: 1.6, textWrap: 'balance' }}>
                        Cada mes descubrirás proyectos creativos, ideas e inspiración para disfrutar de la creatividad a tu ritmo y dedicarte un momento solo para ti.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        {renderCTAButton()}
                        <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>Empieza hoy tu momento creativo.</p>
                    </div>

                    {!user && (
                        <p style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: '#94a3b8' }}>
                            ¿Ya formas parte del club? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}>Inicia sesión</Link>
                        </p>
                    )}
                </div>
            </section>

            {/* 2. ¿QUÉ ES EL CLUB CREATIVO? */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                        ¿Qué es el Club Creativo?
                    </h2>
                    <div style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <p style={{ margin: 0 }}>El Club Creativo de Meraki ArteSano es un espacio pensado para las personas que disfrutan creando con las manos, aprendiendo cosas nuevas y dedicándose un momento para desconectar del ritmo del día a día.</p>
                        <p style={{ margin: 0 }}>Al suscribirte al club, formarás parte de una comunidad creativa donde cada mes encontrarás proyectos exclusivos, ideas inspiradoras y propuestas de manualidades que te ayudarán a seguir desarrollando tu creatividad de una forma sencilla y agradable.</p>
                        <p style={{ margin: 0 }}>El objetivo del Club Creativo es acompañarte en tu camino creativo, ofreciéndote inspiración, aprendizaje y momentos de calma a través de las manualidades. No importa si estás empezando o si ya tienes experiencia: lo importante es tener ganas de crear y disfrutar del proceso.</p>
                        <div style={{ backgroundColor: '#fff5f8', padding: '1.8rem', borderRadius: '20px', borderLeft: '4px solid var(--color-accent)' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-accent)', fontStyle: 'italic' }}>Más que un simple contenido, el Club Creativo es un lugar para dedicarte tiempo a ti misma, experimentar con nuevas técnicas y volver a conectar con el placer de crear.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. BENEFICIOS */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#fdfbf7' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.8rem', color: 'var(--color-heading)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                            Beneficios de pertenecer al Club Creativo
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '700px', margin: '0 auto' }}>
                            Formar parte del Club Creativo de Meraki ArteSano te permitirá disfrutar de muchas ventajas pensadas para inspirarte, aprender y seguir desarrollando tu creatividad.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                        {[
                            { emoji: '✨', title: 'Proyectos exclusivos cada mes', desc: 'Accede a propuestas creativas diseñadas especialmente para los miembros del club, con ideas nuevas para seguir disfrutando de las manualidades.' },
                            { emoji: '🎨', title: 'Inspiración constante', desc: 'Descubre nuevas técnicas, combinaciones y propuestas que te ayudarán a ampliar tus conocimientos y mantener viva tu creatividad.' },
                            { emoji: '📚', title: 'Explicaciones claras y accesibles', desc: 'Los proyectos están pensados para que puedas realizarlos fácilmente, tanto si estás empezando como si ya tienes experiencia.' },
                            { emoji: '💛', title: 'Tiempo para ti', desc: 'La creatividad es también una forma de relajarse y desconectar. El club te invita a dedicarte un momento de calma mientras creas con tus manos.' },
                            { emoji: '👩‍🎨', title: 'Ventajas especiales para miembros', desc: 'Los miembros del club podrán disfrutar de beneficios especiales relacionados con algunas actividades, talleres o propuestas de Meraki ArteSano.' },
                            { emoji: '🌸', title: 'Formar parte de una comunidad', desc: 'Un espacio donde compartir la pasión por las manualidades, aprender juntos y disfrutar del proceso creativo.' },
                        ].map((b, i) => (
                            <div key={i} style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.3s' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>{b.emoji}</div>
                                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-heading)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{b.title}</h3>
                                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0, fontSize: '1.05rem' }}>{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                        <p style={{ fontSize: '1.6rem', color: 'var(--color-accent)', fontWeight: '700', marginBottom: '2rem', fontStyle: 'italic', fontFamily: 'var(--font-heading)' }}>
                            “Tu creatividad merece este espacio: cada mes, nuevas ideas y proyectos por solo 39€.”
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {renderCTAButton()}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. ¿ES PARA TI? */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
                            El Club Creativo de Meraki ArteSano está pensado para todas las personas que sienten que crear con las manos es una forma de disfrutar, relajarse y expresarse.
                        </p>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                            Este club es para ti si...
                        </h2>
                    </div>

                    <div style={{ backgroundColor: '#fdf2f8', padding: '3.5rem', borderRadius: '30px', border: '1px solid #fce7f3' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                "Te gustan las manualidades y quieres seguir aprendiendo nuevas ideas y técnicas.",
                                "Disfrutas creando y te gustaría dedicar más tiempo a tu creatividad.",
                                "Buscas una actividad que te ayude a relajarte y desconectar del día a día.",
                                "Te encanta descubrir proyectos nuevos y dejar volar tu imaginación.",
                                "Quieres formar parte de un espacio creativo donde inspirarte."
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', fontSize: '1.15rem', color: '#334155', lineHeight: 1.5 }}>
                                    <Sparkles size={24} style={{ color: '#ec4899', flexShrink: 0, marginTop: '3px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #fbcfe8', textAlign: 'center' }}>
                            <p style={{ fontWeight: '600', color: 'var(--color-accent)', fontSize: '1.2rem', margin: 0 }}>
                                No importa si estás empezando o si ya tienes experiencia: lo importante es tener ganas de crear y disfrutar del proceso.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. PRICING & QUÉ INCLUYE */}
            <section style={{ padding: '7rem 2rem', backgroundColor: '#0f172a', color: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 450px)', gap: '5rem', alignItems: 'center' }}>
                    
                    {/* Qué Inluye */}
                    <div>
                        <div style={{ display: 'inline-block', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Club Creativo Meraki ArteSano
                        </div>
                        <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                            ¿Qué incluye cada mes?
                        </h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} /> 
                                <span style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.5 }}><strong>Kit completo</strong> con todos los materiales. <br/><span style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Es muy importante para nosotros que lo que recibas sea de las <strong>mejores lanas españolas</strong>.</span></span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}><strong>Instrucciones impresas</strong> claras paso a paso.</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>Acceso a <strong>2h en directo</strong> a través de zoom o similar.</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>Acceso a <strong>grabación</strong>.</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>Grupo privado de <strong>Telegram</strong>.</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}><strong>Proyecto exclusivo</strong> (dirigido tanto a crochet como a tricot).</span></li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Gift size={22} color="#f59e0b" style={{ flexShrink: 0 }} /> <span style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>Entre todo lo que incluye cada mes, se incluirá <strong>alguna sorpresa</strong>!</span></li>
                        </ul>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📅 Calendario Mensual
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.8 }}>
                                    <li>Del 1 al 5 → Preparación de kits.</li>
                                    <li>Día 7 → Envío de cajas.</li>
                                    <li>Día 20 → Directo mensual.</li>
                                    <li>Día 21 al 30 → Grabación disponible.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🌟 Nuestra Diferencia
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.8 }}>
                                    <li>• Cercanía y acompañamiento real.</li>
                                    <li>• Resolución de dudas en directo.</li>
                                    <li>• Comunidad de tejedoras.</li>
                                    <li>• Recibirlo todo en casa cómodamente.</li>
                                    <li>• Descuentos en tienda física y kits.</li>
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
                                <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', padding: '16px', textAlign: 'center', color: 'white', fontWeight: 'bold', letterSpacing: '1px' }}>
                                    🚀 OFERTA DE LANZAMIENTO
                                </div>
                                <div style={{ padding: '3.5rem 2.5rem', textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1.6rem', margin: '0 0 15px', color: 'var(--color-heading)' }}>Suscripción Mensual</h3>
                                    
                                    <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1.2rem', marginBottom: '5px' }}>
                                        PRECIO OFICIAL 39€
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', color: 'var(--color-accent)' }}>
                                        <span style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1 }}>32</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>€/mes</span>
                                    </div>
                                    
                                    <div style={{ margin: '15px 0 25px' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', backgroundColor: '#fff5f8', display: 'inline-block', padding: '8px 16px', borderRadius: '30px', border: '1px solid #fce7f3' }}>
                                            🔥 PRECIO FUNDADORAS el primer mes
                                        </span>
                                    </div>
                                    
                                    <p style={{ margin: '0 0 2.5rem', fontSize: '1rem', color: '#475569', fontWeight: '500' }}>
                                        Limitado a {maxSubscribers || 30} plazas (<span style={{ color: activeSpots >= (maxSubscribers || 30) ? '#ef4444' : '#10b981' }}>solo quedan {maxSubscribers > 0 ? Math.max(0, maxSubscribers - activeSpots) : 'plazas'}</span>)
                                    </p>

                                    {hasActiveSubscription ? (
                                        <Link to="/academia" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700' }}>
                                            ✅ Ya soy miembro — Ir a mi Academia
                                        </Link>
                                    ) : isFull ? (
                                        <button disabled style={{ display: 'block', width: '100%', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#64748b', border: 'none', cursor: 'not-allowed' }}>
                                            🔒 Plazas Agotadas
                                        </button>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '12px', fontStyle: 'italic', fontWeight: '500' }}>
                                                💡 "Un pequeño precio para grandes momentos creativos."
                                            </p>
                                            <button 
                                                onClick={handleCTA}
                                                className="btn btn-primary" 
                                                style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700', boxShadow: '0 8px 20px rgba(245,158,11,0.25)' }}
                                            >
                                                {!user ? <Lock size={18} /> : null}
                                                Quiero unirme al club
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 6. FAQ */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#faf8f5' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', marginBottom: '3rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
                        Preguntas Frecuentes (FAQ)
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', padding: '2rem 3rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <FAQItem 
                            question="1️⃣ ¿Qué nivel de experiencia necesito?" 
                            answer="No necesitas experiencia previa. Cada proyecto sorpresa viene con guía paso a paso, fotos y consejos, para que puedas disfrutar creando desde el primer día." 
                        />
                        <FAQItem 
                            question="2️⃣ ¿Qué incluye exactamente el kit?" 
                            answer="Cada mes recibirás todos los materiales necesarios para el proyecto sorpresa, más la guía de instrucciones. Solo necesitas tus ganas de crear." 
                        />
                        <FAQItem 
                            question="3️⃣ ¿Puedo cancelar la suscripción en cualquier momento?" 
                            answer="Sí. La suscripción es mensual y flexible, puedes cancelarla en cualquier momento antes de que se envíe el siguiente kit." 
                        />
                        <FAQItem 
                            question="4️⃣ ¿Qué pasa si no me gustan los colores o materiales?" 
                            answer="Seleccionamos materiales de calidad y colores combinables para todos los gustos. Cada kit está diseñado para que sea versátil y divertido." 
                        />
                        <FAQItem 
                            question="5️⃣ ¿Cuándo recibo mi proyecto sorpresa?" 
                            answer="Los kits se envían al inicio de cada mes (día 7), para que puedas disfrutar de tu proyecto sorpresa lo antes posible." 
                        />
                        <FAQItem 
                            question="6️⃣ ¿Por qué es una buena inversión?" 
                            answer="Por menos de 1,30 € al día, recibes un proyecto sorpresa exclusivo, inspiración, materiales y guía paso a paso. Es un momento para ti, para desconectar y desarrollar tu creatividad." 
                        />
                        <FAQItem 
                            question="7️⃣ ¿Qué beneficios tiene tejer para mí?" 
                            answer="Tejer es mucho más que hacer manualidades: relaja y reduce el estrés, mejora la concentración, potencia tu creatividad, genera satisfacción y autoestima al ver un proyecto terminado hecho por ti, y te permite conectar con una comunidad creativa." 
                        />
                        <FAQItem 
                            question="8️⃣ ¿Es tejer solo para invierno?" 
                            answer="¡Para nada! Cada proyecto está pensado para todo el año, incluyendo accesorios, decoración, regalos y proyectos prácticos que puedes usar en cualquier temporada." 
                        />
                    </div>
                </div>
            </section>

            {/* 7. FINAL CTA */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'var(--color-accent)', color: 'white', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <Heart size={48} color="white" fill="white" opacity={0.2} />
                    </div>
                    <h2 style={{ fontSize: '2.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                        Empieza tu experiencia creativa
                    </h2>
                    <p style={{ fontSize: '1.3rem', margin: '0 auto 3.5rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '700px' }}>
                        Si sientes que la creatividad forma parte de ti y quieres seguir explorándola, el Club Creativo de Meraki ArteSano es tu lugar. Un espacio pensado para inspirarte, aprender y disfrutar de la creatividad cada mes.
                    </p>
                    <button 
                        onClick={handleCTA}
                        className="btn" 
                        style={{ backgroundColor: 'white', color: 'var(--color-accent)', padding: '1.3rem 3.5rem', fontSize: '1.25rem', fontWeight: '800', borderRadius: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                    >
                        ✨ Únete hoy al Club Creativo y empieza a crear
                    </button>
                    <p style={{ marginTop: '2rem', fontSize: '1.1rem', fontStyle: 'italic', opacity: 0.8 }}>
                        "Invierte en ti misma: inspiración, manualidades y bienestar creativo cada mes."
                    </p>
                </div>
            </section>

        </div>
    );
};

export default Clases;
