import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../lib/productService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Filter, ShoppingCart, ChevronDown } from 'lucide-react';

const Tienda = () => {
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [priceSort, setPriceSort] = useState('none'); // none, asc, desc
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['Todas']);
    const [loading, setLoading] = useState(true);
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

    // Filtering logic (super simple for UI purposes)
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
                        ) : filteredProducts.map((product) => (
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
