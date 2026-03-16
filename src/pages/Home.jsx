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
                    <div className="badge-premium">{t('hero.badge')}</div>
                    <h1 className="hero-title">{t('hero.title.1')}<span className="text-italic-accent">{t('hero.title.2')}</span>{t('hero.title.3')}</h1>
                    <p className="hero-description">
                        {t('hero.desc')}
                    </p>
                    <div className="hero-buttons">
                        <Link to="/tienda" className="btn btn-primary d-flex align-center gap-sm">
                            {t('hero.btn.shop')} <ArrowRight size={18} />
                        </Link>
                        <Link to="/clases" className="btn btn-secondary">
                            {t('hero.btn.classes')}
                        </Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-collage">
                        <div className="collage-img main-img" style={{ backgroundImage: 'url(/hero2.jpg)' }}></div>
                        <div className="collage-img sub-img-1" style={{ backgroundImage: 'url(/hero3.jpg)' }}></div>
                        <div className="collage-img sub-img-2" style={{ backgroundImage: 'url(/hero1.jpg)' }}></div>
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
                    <div className="club-meraki-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1605372333423-ed8e8095b369?q=80&w=1000&auto=format&fit=crop)' }}></div>
                    <div className="club-meraki-content">
                        <div className="club-meraki-badge">
                            {t('cta.badge') || "★ CLUB MERAKI ARTESANO"}
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

            {/* --- CONTACT SECTION --- */}
            <section className="contact-preview section-padding" style={{ backgroundColor: '#fdfaj7', borderTop: '1px solid rgba(139, 94, 131, 0.1)' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }}>{t('contact.title')}</h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', maxWidth: '700px', margin: '0 auto' }}>
                            {t('contact.subtitle')}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        
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
