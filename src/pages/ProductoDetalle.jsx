import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../lib/productService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, ShoppingCart, Plus, Minus, Tag, Truck } from 'lucide-react';

const ProductoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getProductById(id);
                if (data) {
                    setProduct(data);
                } else {
                    // Si no existe el producto, volvemos a la tienda
                    navigate('/tienda');
                }
            } catch (error) {
                console.error("Error loading product details:", error);
                navigate('/tienda');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, navigate]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
        }
    };

    if (loading) {
        return (
            <div className="product-detail-page section-padding" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '1.2rem' }}>{t('product.loading')}</p>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="product-detail-page section-padding">
            <div className="breadcrumb">
                <Link to="/tienda" className="back-link">
                    <ArrowLeft size={16} /> {t('product.back')}
                </Link>
            </div>

            <div className="product-detail-container">
                {/* Visual Section: Image */}
                <div className="product-detail-gallery">
                    <div
                        className="main-image"
                        style={{ backgroundImage: `url(${product.image_url})` }}
                    >
                        {product.is_new && <div className="product-tag tag-new">{t('store.tagNew')}</div>}
                    </div>
                </div>

                {/* Details & Actions Section */}
                <div className="product-detail-info">
                    <div className="product-header">
                        <span className="product-category"><Tag size={14} style={{ marginRight: '6px' }} />{product.category}</span>
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-price-large">€{Number(product.price).toFixed(2)}</p>
                    </div>

                    <div className="product-description-container">
                        <h3>{t('product.descTitle')}</h3>
                        <p className="product-description-text">
                            {product.description || t('product.descFallback')}
                        </p>
                    </div>

                    <div className="product-actions-box">
                        <div className="quantity-selector-large">
                            <span className="quantity-label">{t('product.quantity')}</span>
                            <div className="quantity-controls">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
                            </div>
                        </div>

                        <button className="btn btn-primary add-to-cart-large" onClick={handleAddToCart}>
                            <ShoppingCart size={20} />
                            {t('product.add')}
                        </button>
                    </div>

                    <div className="product-benefits">
                        <div className="benefit-item">
                            <Truck size={20} className="color-primary" />
                            <div>
                                <strong>{t('product.shipping')}</strong>
                                <span>{t('product.shippingDesc')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductoDetalle;
