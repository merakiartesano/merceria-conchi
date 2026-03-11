import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

const Contacto = () => {
    const { t } = useLanguage();

    return (
        <div className="contact-page" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '15px' }}>{t('contact.title')}</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)' }}>
                        {t('contact.subtitle')}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    {/* Contact Info Cards */}
                    <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                            <MapPin size={28} />
                        </div>
                        <h3 style={{ marginBottom: '10px' }}>{t('contact.shop')}</h3>
                        <p style={{ color: 'var(--color-text-light)', lineHeight: '1.8' }}>
                            C/ San Antonio, 5<br />
                            Yecla, 30510<br />
                            Murcia
                        </p>
                    </div>

                    <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                            <Phone size={28} />
                        </div>
                        <h3 style={{ marginBottom: '10px' }}>{t('contact.call')}</h3>
                        <p style={{ color: 'var(--color-text-light)', marginBottom: '5px' }}>{t('contact.callDesc')}</p>
                        <a href="tel:605889938" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text)', textDecoration: 'none' }}>605 88 99 38</a>
                    </div>

                    <div className="contact-card" style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-primary)' }}>
                            <Mail size={28} />
                        </div>
                        <h3 style={{ marginBottom: '10px' }}>{t('contact.write')}</h3>
                        <p style={{ color: 'var(--color-text-light)', marginBottom: '5px' }}>{t('contact.writeDesc')}</p>
                        <a href="mailto:hola@merakiartesano.es" style={{ fontWeight: '500', color: 'var(--color-text)', textDecoration: 'none' }}>hola@merakiartesano.es</a>
                    </div>
                </div>

                <div style={{ marginTop: '60px', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '20px' }}>{t('contact.social')}</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <a href="https://www.instagram.com/merakiartesanoyecla/" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#E1306C', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold', textDecoration: 'none' }}>
                            <Instagram size={20} /> Instagram
                        </a>
                        <a href="https://www.facebook.com/merakiartesanoyecla" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#1877F2', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 'bold', textDecoration: 'none' }}>
                            <Facebook size={20} /> Facebook
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacto;
