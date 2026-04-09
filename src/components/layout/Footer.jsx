import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            backgroundColor: '#faf8f5',
            borderTop: '1px solid #e8e0d8',
            padding: '32px 24px',
            marginTop: 'auto',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
            }}>
                {/* Brand */}
                <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.1rem',
                    color: 'var(--color-primary)',
                    margin: 0,
                    fontWeight: '600',
                }}>
                    Meraki ArteSano
                </p>

                {/* Legal Links */}
                <nav style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                }}>
                    {[
                        { to: '/aviso-legal', label: 'Aviso Legal' },
                        { to: '/politica-privacidad', label: 'Política de Privacidad' },
                        { to: '/politica-cookies', label: 'Política de Cookies' },
                        { to: '/condiciones-compra', label: 'Condiciones de Compra' },
                    ].map((link, i, arr) => (
                        <React.Fragment key={link.to}>
                            <Link
                                to={link.to}
                                style={{
                                    color: '#64748b',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                            >
                                {link.label}
                            </Link>
                            {i < arr.length - 1 && (
                                <span style={{ color: '#cbd5e1' }}>·</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Copyright */}
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    © {currentYear} Meraki ArteSano · C. San Antonio, 5, bajo, 30510 Yecla (Murcia)
                </p>
            </div>
        </footer>
    );
};

export default Footer;
