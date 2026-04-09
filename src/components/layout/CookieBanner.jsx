import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check } from 'lucide-react';

const COOKIE_KEY = 'meraki_cookie_consent';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState({ necesarias: true, funcionales: true });

    useEffect(() => {
        const stored = localStorage.getItem(COOKIE_KEY);
        if (!stored) setVisible(true);
    }, []);

    const accept = () => {
        localStorage.setItem(COOKIE_KEY, JSON.stringify({ necesarias: true, funcionales: true, ts: Date.now() }));
        setVisible(false);
    };

    const reject = () => {
        localStorage.setItem(COOKIE_KEY, JSON.stringify({ necesarias: true, funcionales: false, ts: Date.now() }));
        setVisible(false);
    };

    const savePrefs = () => {
        localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, ts: Date.now() }));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '0',
            animation: 'slideUp 0.4s ease',
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: '#e2e8f0',
                padding: showDetails ? '28px 32px' : '20px 32px',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                maxWidth: '100%',
            }}>
                {/* Main Banner */}
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {!showDetails ? (
                        /* Compact View */
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 400px' }}>
                                <Cookie size={22} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#cbd5e1' }}>
                                    Usamos cookies propias necesarias para el funcionamiento de la web (sesión de usuario).
                                    No usamos cookies de publicidad ni de seguimiento.{' '}
                                    <Link to="/politica-cookies" style={{ color: '#f59e0b', textDecoration: 'underline' }}>
                                        Más información
                                    </Link>
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowDetails(true)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#94a3b8',
                                        padding: '9px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <Settings size={14} /> Configurar
                                </button>
                                <button
                                    onClick={reject}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#cbd5e1',
                                        padding: '9px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Solo necesarias
                                </button>
                                <button
                                    onClick={accept}
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '9px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                                    }}
                                >
                                    <Check size={15} /> Aceptar todas
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Detailed View */
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Cookie size={20} color="#f59e0b" />
                                    Configuración de cookies
                                </h3>
                                <button onClick={() => setShowDetails(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                {/* Necesarias */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '0.9rem', color: '#f1f5f9' }}>🔒 Cookies necesarias</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                            Imprescindibles para el funcionamiento de la web (sesión de usuario, carrito). No se pueden desactivar.
                                        </p>
                                    </div>
                                    <div style={{
                                        background: '#22c55e',
                                        color: '#fff',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}>
                                        Siempre activas
                                    </div>
                                </div>

                                {/* Funcionales */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '0.9rem', color: '#f1f5f9' }}>⚙️ Cookies funcionales</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                            Recuerdan tus preferencias de idioma y otras opciones de personalización.
                                        </p>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={prefs.funcionales}
                                            onChange={e => setPrefs(p => ({ ...p, funcionales: e.target.checked }))}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: prefs.funcionales ? '#f59e0b' : '#475569',
                                            borderRadius: '24px',
                                            cursor: 'pointer',
                                            transition: '0.3s',
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: prefs.funcionales ? '22px' : '2px',
                                                top: '2px',
                                                width: '20px',
                                                height: '20px',
                                                background: '#fff',
                                                borderRadius: '50%',
                                                transition: '0.3s',
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                    onClick={reject}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#cbd5e1',
                                        padding: '9px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Solo necesarias
                                </button>
                                <button
                                    onClick={savePrefs}
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '9px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Guardar preferencias
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default CookieBanner;
