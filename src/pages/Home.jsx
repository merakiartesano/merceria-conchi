import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../lib/productService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Star, Scissors, Heart, BookOpen, ShoppingCart, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const data = await getProducts();
                // Take only the first 4 products for the home page preview
                setFeaturedProducts((data || []).slice(0, 4));
            } catch (error) {
                console.error("Error loading featured products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    return (
        <div className="home-page">
            {/* --- HERO SECTION PREMIUM --- */}
            <section className="hero-premium">
                <div className="hero-premium-bg">
                    <div className="gradient-blob shape-1"></div>
                    <div className="gradient-blob shape-2"></div>
                </div>

                <div className="hero-content">

                    <h1 className="hero-title">{t('hero.title.1')}<span className="text-italic-accent">{t('hero.title.2')}</span>{t('hero.title.3')}</h1>
                    {t('hero.desc') && (
                        <p className="hero-description">
                            {t('hero.desc')}
                        </p>
                    )}
                    <div className="hero-buttons">
                        <Link to="/clases" className="btn btn-primary d-flex align-center gap-sm">
                            {t('hero.btn.shop')} <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-logo-container">
                        <img src="/logo.jpg" alt="Meraki ArteSano Logo" className="hero-main-logo" />
                    </div>
                </div>
            </section>

            {/* --- STATS / HIGHLIGHTS BAR --- */}
            <section className="stats-bar">
                <div className="stat-item">
                    <Scissors className="stat-icon" />
                    <div>
                        <h3>+500</h3>
                        <p>{t('stats.materials')}</p>
                    </div>
                </div>
                <div className="stat-separator"></div>
                <div className="stat-item">
                    <BookOpen className="stat-icon" />
                    <div>
                        <h3>Online</h3>
                        <p>{t('stats.classes')}</p>
                    </div>
                </div>
                <div className="stat-separator"></div>
                <div className="stat-item">
                    <Heart className="stat-icon" />
                    <div>
                        <h3>100%</h3>
                        <p>{t('stats.support')}</p>
                    </div>
                </div>
            </section>

            {/* --- CLUB MERAKI BANNER (CALL TO ACTION) --- */}
            <section className="club-meraki-cta">
                <div className="club-meraki-container">
                    <div className="club-meraki-image" style={{ backgroundImage: 'url(/club_meraki.png)' }}></div>
                    <div className="club-meraki-content">
                        <div className="club-meraki-badge">
                            {t('cta.badge') || "★ CLUB CREATIVO MERAKI"}
                        </div>
                        <h2 className="club-meraki-title">{t('cta.title')}</h2>
                        <p className="club-meraki-desc">{t('cta.desc')}</p>
                        <Link to="/clases" className="btn" style={{ 
                            backgroundColor: 'var(--color-accent)', 
                            color: 'white', 
                            padding: '16px 36px', 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            borderRadius: '50px', 
                            boxShadow: '0 8px 20px rgba(255, 153, 0, 0.3)', 
                            transition: 'all 0.3s', 
                            textDecoration: 'none' 
                        }} 
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(255, 153, 0, 0.4)'; }} 
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 153, 0, 0.3)'; }}>
                            {t('cta.btn')} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- STORE PREVIEW --- */}
            <section className="store-preview section-padding">
                <div className="section-header">
                    <div>
                        <span className="subtitle-sm">{t('store.subtitle')}</span>
                        <h2>{t('store.title')}</h2>
                    </div>
                    <Link to="/tienda" className="view-all">{t('store.viewAll')} <span>→</span></Link>
                </div>

                <div className="product-grid">
                    {loading ? (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>{t('store.loading')}</p>
                    ) : featuredProducts.map((product) => (
                        <div key={product.id} className="product-card store-card">
                            <Link to={`/producto/${product.id}`} className="product-image-link" style={{ display: 'block' }}>
                                <div className="product-image-box" style={{ backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    {product.is_new && <div className="product-tag tag-new">{t('store.tagNew')}</div>}
                                    <div className="card-overlay" onClick={(e) => e.preventDefault()}>
                                        <button className="btn-icon circle-btn" onClick={(e) => { e.preventDefault(); addToCart(product); }}><ShoppingCart size={20} /></button>
                                    </div>
                                </div>
                            </Link>
                            <div className="product-info">
                                <p className="product-category">{product.category}</p>
                                <Link to={`/producto/${product.id}`} style={{ textDecoration: 'none' }}>
                                    <h4 className="product-name" style={{ cursor: 'pointer' }}>{product.name}</h4>
                                </Link>
                                <div className="product-price-row">
                                    <span className="product-price">€{Number(product.price).toFixed(2)}</span>
                                    <button className="add-to-cart-btn btn-sm" onClick={() => addToCart(product)}>{t('store.btnAdd')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- ABOUT SECTION --- */}
            <section className="about-section">
                <div className="about-grid">
                    <div className="about-image">
                        <img src="/about.png" alt="Taller de Crochet de Meraki ArteSano" />
                        <div className="experience-badge">
                            <span className="years">{t('about.badge.years')}</span>
                            <span className="text" dangerouslySetInnerHTML={{ __html: t('about.badge.text').replace(' ', '<br />') }}></span>
                        </div>
                    </div>
                    <div className="about-content">
                        <h2>{t('about.title')}</h2>
                        <p className="lead-paragraph">{t('about.p1')}</p>
                        <p>{t('about.p2')}</p>
                        <p>{t('about.p3')}</p>
                        <p style={{ fontStyle: 'italic', marginTop: '1rem', color: 'var(--color-primary)' }}>{t('about.quote')}</p>
                    </div>
                </div>
            </section>

            {/* --- GOOGLE REVIEWS (Marquee infinito) --- */}
            <section style={{ padding: '5rem 0', backgroundColor: '#fdfbf7', overflow: 'hidden' }}>

                {/* Keyframes inyectados inline */}
                <style>{`
                    @keyframes marquee-reviews {
                        0%   { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .reviews-track {
                        display: flex;
                        gap: 1.5rem;
                        width: max-content;
                        animation: marquee-reviews 30s linear infinite;
                    }
                    .reviews-track:hover {
                        animation-play-state: paused;
                    }
                `}</style>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <svg width="28" height="28" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.5 39.5 16.3 44 24 44z"/>
                            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.2 5.2C40.9 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
                        </svg>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#5f6368', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Google Reviews</span>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--color-heading)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                        Lo que dicen nuestros clientes
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#f59e0b' }}>
                        {'★★★★★'.split('').map((s, i) => <span key={i} style={{ fontSize: '1.5rem' }}>{s}</span>)}
                        <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600', marginLeft: '6px' }}>5.0 en Google</span>
                    </div>
                </div>

                {/* Marquee wrapper con degradados laterales */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Degradado izquierda */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '120px', zIndex: 2,
                        background: 'linear-gradient(to right, #fdfbf7 0%, transparent 100%)',
                        pointerEvents: 'none'
                    }} />
                    {/* Degradado derecha */}
                    <div style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px', zIndex: 2,
                        background: 'linear-gradient(to left, #fdfbf7 0%, transparent 100%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Track con tarjetas duplicadas para loop infinito */}
                    <div className="reviews-track" style={{ padding: '1.5rem 0' }}>
                        {[
                            { name: 'BEA Lopez', initial: 'B', color: '#8b5cf6', date: 'Hace 5 meses', text: 'Meraki, es la tienda perfecta para comprar todo tipo de hilos y lanas con buen asesoramiento, también imparte clases de crochet y punto, con muy buena compañía.' },
                            { name: 'Isabel González Martínez', initial: 'I', color: '#0ea5e9', date: 'Hace 4 años', text: 'Material de primera. Tienes todo lo que busques y de buena calidad. Voy a clases de ganchillo varios meses y estoy súper contenta. Nunca habría imaginado que a mis 27 años descubriría que puedo hacer tanto desde la nada (un ovillo y una aguja).' },
                            { name: 'Maria Luisa Montero', initial: 'M', color: '#10b981', date: 'Hace 5 meses', text: 'Yo solo he comprado vía online estupendo me ha encantado todo lo que he comprado....' },
                            { name: 'Maria del Mar Mmar', initial: 'M', color: '#f59e0b', date: 'Hace 5 meses', text: 'Es una gran tienda de lanas y se nota en cuanto se abre la puerta y te encuentras con la gran variedad de colecciones y tipos de hilos, que siempre tiene Conchi.' },
                            { name: 'Marta MM', initial: 'M', color: '#ec4899', date: 'Hace 5 años', text: 'Una tienda muy acogedora que te hace sentir paz nada más entrar. Ofrecen cursos para aprender a hacer crochet que me parecen súper interesantes para las personas que queremos aprender a tejer desde 0! La recomiendo muchísimo 👏' },
                            // Duplicadas para el loop
                            { name: 'BEA Lopez', initial: 'B', color: '#8b5cf6', date: 'Hace 5 meses', text: 'Meraki, es la tienda perfecta para comprar todo tipo de hilos y lanas con buen asesoramiento, también imparte clases de crochet y punto, con muy buena compañía.' },
                            { name: 'Isabel González Martínez', initial: 'I', color: '#0ea5e9', date: 'Hace 4 años', text: 'Material de primera. Tienes todo lo que busques y de buena calidad. Voy a clases de ganchillo varios meses y estoy súper contenta. Nunca habría imaginado que a mis 27 años descubriría que puedo hacer tanto desde la nada (un ovillo y una aguja).' },
                            { name: 'Maria Luisa Montero', initial: 'M', color: '#10b981', date: 'Hace 5 meses', text: 'Yo solo he comprado vía online estupendo me ha encantado todo lo que he comprado....' },
                            { name: 'Maria del Mar Mmar', initial: 'M', color: '#f59e0b', date: 'Hace 5 meses', text: 'Es una gran tienda de lanas y se nota en cuanto se abre la puerta y te encuentras con la gran variedad de colecciones y tipos de hilos, que siempre tiene Conchi.' },
                            { name: 'Marta MM', initial: 'M', color: '#ec4899', date: 'Hace 5 años', text: 'Una tienda muy acogedora que te hace sentir paz nada más entrar. Ofrecen cursos para aprender a hacer crochet que me parecen súper interesantes para las personas que queremos aprender a tejer desde 0! La recomiendo muchísimo 👏' },
                        ].map((review, i) => (
                            <div key={i} style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '1.8rem',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                width: '320px',
                                flexShrink: 0,
                                cursor: 'default',
                            }}>
                                {/* Reviewer info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        backgroundColor: review.color, color: 'white',
                                        fontWeight: '700', fontSize: '1.1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {review.initial}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.name}</p>
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>{review.date}</p>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.5 39.5 16.3 44 24 44z"/>
                                        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.2 5.2C40.9 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
                                    </svg>
                                </div>

                                {/* Stars */}
                                <div style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '2px' }}>★★★★★</div>

                                {/* Text */}
                                <p style={{ color: '#475569', lineHeight: 1.65, margin: 0, fontSize: '0.9rem' }}>
                                    "{review.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Link a Google */}
                <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '0 2rem' }}>
                    <a
                        href="https://www.google.com/search?sa=X&sca_esv=aa402220b09531da&rlz=1C1UEAD_esES1082ES1083&hl=es-ES&sxsrf=ANbL-n4V4pQkIYIQk7H-bdJz8CbgVsX9pg:1775639103665&q=Meraki+ArteSano+Rese%C3%B1as&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxI2NjE2NzEztjQwMDSxMLUwMzUz38DI-IpRwje1KDE7U8GxqCQ1ODEvXyEotTj18MbE4kWsOKUA7ACtBlAAAAA&rldimm=3437463900148586567&tbm=lcl&ved=2ahUKEwjKzZeQ892TAxXcRaQEHec7Ac8Q9fQKegQIThAG&biw=1463&bih=788&dpr=1.75#lkt=LocalPoiReviews"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            color: '#5f6368', fontSize: '0.9rem', fontWeight: '600',
                            textDecoration: 'none', border: '1px solid #e2e8f0',
                            borderRadius: '50px', padding: '10px 24px',
                            backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'box-shadow 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                    >
                        Ver todas las reseñas en Google →
                    </a>
                </div>

            </section>

            <section className="contact-preview section-padding" style={{ backgroundColor: '#fdfaj7', borderTop: '1px solid rgba(139, 94, 131, 0.1)' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }}>{t('contact.title')}</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                        
                        <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', transition: 'transform 0.3s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                                <MapPin size={28} />
                            </div>
                            <h3 style={{ marginBottom: '10px', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>{t('contact.shop')}</h3>
                            <p style={{ color: 'var(--color-text-light)', lineHeight: '1.8' }}>
                                C/ San Antonio, 5<br />
                                Yecla, 30510<br />
                                Murcia
                            </p>
                        </div>

                        <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', transition: 'transform 0.3s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                                <Phone size={28} />
                            </div>
                            <h3 style={{ marginBottom: '10px', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>{t('contact.call')}</h3>
                            <p style={{ color: 'var(--color-text-light)', marginBottom: '15px' }}>{t('contact.callDesc')}</p>
                            <a href="tel:605889938" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-text)', textDecoration: 'none' }}>605 88 99 38</a>
                        </div>

                        <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', transition: 'transform 0.3s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                                <Mail size={28} />
                            </div>
                            <h3 style={{ marginBottom: '10px', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>{t('contact.write')}</h3>
                            <p style={{ color: 'var(--color-text-light)', marginBottom: '15px' }}>{t('contact.writeDesc')}</p>
                            <a href="mailto:hola@merakiartesano.es" style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none' }}>hola@merakiartesano.es</a>
                        </div>
                        
                    </div>

                    <div style={{ marginTop: '60px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '25px', fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>{t('contact.social')}</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <a href="https://www.instagram.com/merakiartesanoyecla/" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#E1306C', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold', textDecoration: 'none', transition: 'transform 0.3s', boxShadow: '0 4px 15px rgba(225, 48, 108, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <Instagram size={22} /> Instagram
                            </a>
                            <a href="https://www.facebook.com/merakiartesanoyecla" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#1877F2', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold', textDecoration: 'none', transition: 'transform 0.3s', boxShadow: '0 4px 15px rgba(24, 119, 242, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <Facebook size={22} /> Facebook
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
