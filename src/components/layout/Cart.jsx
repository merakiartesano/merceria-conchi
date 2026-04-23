import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const Cart = () => {
    const {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateQuantity,
        getCartTotal
    } = useCart();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>{t('cart.title')}</h2>
                    <button className="btn-icon" onClick={() => setIsCartOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-content">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <ShoppingBag size={48} className="empty-icon" />
                            <p>{t('cart.empty')}</p>
                            <button className="btn btn-outline" onClick={() => { setIsCartOpen(false); navigate('/tienda') }}>{t('cart.viewCatalog')}</button>
                        </div>
                    ) : (
                        <ul className="cart-items-list">
                            {cartItems.map(item => (
                                <li key={item.id} className="cart-item">
                                    <div className="cart-item-image" style={{ backgroundImage: `url(${item.image_url})` }}></div>
                                    <div className="cart-item-details">
                                        <h4>{item.name}</h4>
                                        <div className="cart-item-pricing-row">
                                            <p className="cart-item-price">€{Number(item.price).toFixed(2)}</p>
                                            <p className="cart-item-subtotal">
                                                Subtotal: <strong>€{(Number(item.price) * item.quantity).toFixed(2)}</strong>
                                            </p>
                                        </div>

                                        <div className="cart-item-actions">
                                            <div className="quantity-controls">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                                            </div>
                                            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>{t('cart.total')}</span>
                            <span>€{getCartTotal().toFixed(2)}</span>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                            onClick={handleCheckout}
                        >
                            {t('cart.checkout')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
