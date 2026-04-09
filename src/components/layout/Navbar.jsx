import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingBag, Menu, X, User } from 'lucide-react';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const { getCartCount, setIsCartOpen } = useCart();
    const { user } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const cartCount = getCartCount();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img src="/logo.jpg" alt="Meraki ArteSano" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
            </Link>

            {/* Desktop Navigation */}
            <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <li><NavLink to="/" className="nav-link" end>{t('nav.home')}</NavLink></li>
                <li><NavLink to="/tienda" className="nav-link">{t('nav.shop')}</NavLink></li>
                 <li><NavLink to="/clases" className="nav-link">{t('nav.classes')}</NavLink></li>
                <li style={{ marginLeft: '10px' }}>
                    <NavLink to={user ? "/academia" : "/login"} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                        <User size={16} /> {user ? t('nav.academy') : "Entrar"}
                    </NavLink>
                </li>
            </ul>

            {/* Desktop Actions */}
            <div className="nav-actions">
                <div className={`lang-switcher ${isLangOpen ? 'open' : ''}`} onClick={() => setIsLangOpen(!isLangOpen)}>
                    <div className="active-lang">
                        <img src={`/flags/${language}.png`} alt={language.toUpperCase()} />
                    </div>
                    
                    <div className="lang-dropdown">
                        {['es', 'en', 'fr', 'pt'].map((lang) => (
                            <button 
                                key={lang}
                                onClick={(e) => { e.stopPropagation(); setLanguage(lang); setIsLangOpen(false); }} 
                                className={`lang-flag-btn ${language === lang ? 'active' : ''}`}
                                title={lang === 'es' ? 'Español' : lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Português'}
                            >
                                <img src={`/flags/${lang}.png`} alt={lang.toUpperCase()} />
                                <span className="lang-label">{lang.toUpperCase()}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button className="icon-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                    <ShoppingBag size={20} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>

                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
