import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../lib/productService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Star, Scissors, Heart, BookOpen, ShoppingCart } from 'lucide-react';

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
                    <div className="polaroid-wrapper">
                        <div className="polaroid photo-1" style={{ backgroundImage: 'url(/hero1.jpg)' }}></div>
                        <div className="polaroid photo-2" style={{ backgroundImage: 'url(/hero2.jpg)' }}></div>
                        <div className="polaroid photo-3" style={{ backgroundImage: 'url(/hero3.jpg)' }}></div>
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

            {/* --- CLASSES BANNER (CALL TO ACTION) --- */}
            <section className="classes-cta">
                <div className="classes-cta-container">
                    <div className="classes-cta-content">
                        <h2>{t('cta.title')}</h2>
                        <p>{t('cta.desc')}</p>
                        <Link to="/clases" className="btn btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}>
                            {t('cta.btn')}
                        </Link>
                    </div>
                    <div className="classes-cta-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1628102491629-77858c630128?q=80&w=800&auto=format&fit=crop)' }}></div>
                </div>
            </section>
        </div>
    );
};

export default Home;
