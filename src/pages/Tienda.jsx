import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../lib/productService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Filter, ShoppingCart, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const Tienda = () => {
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [priceSort, setPriceSort] = useState('none'); // none, asc, desc
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['Todas']);
    const [loading, setLoading] = useState(true);
    // Tracks active image index per product: { [productId]: number }
    const [cardImageIndex, setCardImageIndex] = useState({});
    const { addToCart } = useCart();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);
                setProducts(productsData || []);
                const catNames = categoriesData ? categoriesData.map(c => c.name) : [];
                setCategories(['Todas', ...catNames]);
            } catch (error) {
                console.error("Error loading store data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, []);

    // Build the full images array for a product: [image_url, ...images]
    const getProductImages = (product) => {
        const extra = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
        return [product.image_url, ...extra].filter(Boolean);
    };

    // Navigate carousel for a specific product
    const goToImage = (e, productId, direction, totalImages) => {
        e.preventDefault();
        e.stopPropagation();
        setCardImageIndex(prev => {
            const current = prev[productId] || 0;
            const next = (current + direction + totalImages) % totalImages;
            return { ...prev, [productId]: next };
        });
    };

    // Filtering logic
    const filteredProducts = products.filter(p =>
        activeCategory === 'Todas' ? true : p.category === activeCategory
    ).sort((a, b) => {
        if (priceSort === 'asc') return a.price - b.price;
        if (priceSort === 'desc') return b.price - a.price;
        return 0;
    });

    return (
        <div className="store-page">
            <div className="store-header">
                <div className="store-title-area">
                    <h1>{t('shop.title')}</h1>
                    <p>{t('shop.desc')}</p>
                </div>

                <div className="store-controls-mobile">
                    <button className="btn btn-outline"><Filter size={18} /> {t('shop.filters')}</button>
                    <div className="sort-dropdown">
                        <span>{t('shop.sortBy')} <ChevronDown size={14} /></span>
                    </div>
                </div>
            </div>

            <div className="store-layout">
                {/* Sidebar Filters */}
                <aside className="store-sidebar">
                    <div className="filter-group">
                        <h3>{t('shop.categories')}</h3>
                        <ul className="category-list">
                            {categories.map(cat => (
                                <li key={cat}>
                                    <button
                                        className={activeCategory === cat ? 'active' : ''}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat === 'Todas' ? t('shop.allCategories') : cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="filter-group">
                        <h3>{t('shop.price')}</h3>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    checked={priceSort === 'none'}
                                    onChange={() => setPriceSort('none')}
                                />
                                {t('shop.sortRec')}
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    checked={priceSort === 'asc'}
                                    onChange={() => setPriceSort('asc')}
                                />
                                {t('shop.sortAsc')}
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    checked={priceSort === 'desc'}
                                    onChange={() => setPriceSort('desc')}
                                />
                                {t('shop.sortDesc')}
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Main Product Grid */}
                <main className="store-main">
                    <div className="store-controls-desktop">
                        <span className="results-count">{t('shop.showing')} {filteredProducts.length} {t('shop.products')}</span>
                    </div>

                    <div className="product-grid">
                        {loading ? (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <p>{t('shop.loading')}</p>
                            </div>
                        ) : filteredProducts.map((product) => {
                            const allImages = getProductImages(product);
                            const totalImages = allImages.length;
                            const currentIdx = cardImageIndex[product.id] || 0;
                            const activeImg = allImages[currentIdx] || product.image_url;

                            return (
                                <div key={product.id} className="product-card store-card" style={product.out_of_stock ? { opacity: 0.8 } : {}}>
                                    {/* Image area with carousel */}
                                    <div style={{ position: 'relative', display: 'block' }} className="product-image-link-wrapper">
                                        <Link to={`/producto/${product.id}`} className="product-image-link" style={{ display: 'block' }}>
                                            <div
                                                className="product-image-box"
                                                style={{
                                                    backgroundImage: `url(${activeImg})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    transition: 'background-image 0.3s ease'
                                                }}
                                            >
                                                {/* Badge */}
                                                {product.out_of_stock
                                                    ? <div className="product-tag" style={{ background: '#ef4444', color: '#fff' }}>Agotado</div>
                                                    : product.is_new && <div className="product-tag tag-new">{t('store.tagNew')}</div>
                                                }

                                                {/* Add to cart overlay (only if not out of stock) */}
                                                {!product.out_of_stock && (
                                                    <div className="card-overlay" onClick={(e) => e.preventDefault()}>
                                                        <button className="btn-icon circle-btn" onClick={(e) => { e.preventDefault(); addToCart(product); }}><ShoppingCart size={20} /></button>
                                                    </div>
                                                )}

                                                {/* Dot indicators (only if multiple images) */}
                                                {totalImages > 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '8px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        display: 'flex',
                                                        gap: '5px',
                                                        zIndex: 3
                                                    }}>
                                                        {allImages.map((_, idx) => (
                                                            <div key={idx} style={{
                                                                width: idx === currentIdx ? '18px' : '6px',
                                                                height: '6px',
                                                                borderRadius: '3px',
                                                                backgroundColor: idx === currentIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                            }} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Prev / Next arrows — only if multiple images */}
                                        {totalImages > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => goToImage(e, product.id, -1, totalImages)}
                                                    style={{
                                                        position: 'absolute',
                                                        left: '6px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 4,
                                                        background: 'rgba(255,255,255,0.85)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '28px',
                                                        height: '28px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        padding: 0,
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s ease'
                                                    }}
                                                    className="carousel-arrow carousel-arrow-left"
                                                    aria-label="Imagen anterior"
                                                >
                                                    <ChevronLeft size={16} color="#333" />
                                                </button>
                                                <button
                                                    onClick={(e) => goToImage(e, product.id, 1, totalImages)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '6px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 4,
                                                        background: 'rgba(255,255,255,0.85)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '28px',
                                                        height: '28px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        padding: 0,
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s ease'
                                                    }}
                                                    className="carousel-arrow carousel-arrow-right"
                                                    aria-label="Imagen siguiente"
                                                >
                                                    <ChevronRight size={16} color="#333" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="product-info">
                                        <p className="product-category">{product.category}</p>
                                        <Link to={`/producto/${product.id}`} style={{ textDecoration: 'none' }}>
                                            <h4 className="product-name" style={{ cursor: 'pointer' }}>{product.name}</h4>
                                        </Link>
                                        <div className="product-price-row">
                                            <span className="product-price">€{Number(product.price).toFixed(2)}</span>
                                            {product.out_of_stock
                                                ? <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '600', padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fef2f2' }}>Sin stock</span>
                                                : <button className="add-to-cart-btn btn-sm" onClick={() => addToCart(product)}>{t('store.btnAdd')}</button>
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!loading && filteredProducts.length === 0 && (
                        <div className="empty-state">
                            <p>{t('shop.empty')}</p>
                            <button className="btn btn-outline" onClick={() => setActiveCategory('Todas')}>{t('shop.viewAll')}</button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Tienda;
