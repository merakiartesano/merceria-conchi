import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingBag } from 'lucide-react';

const PagoKo = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order');

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--color-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 20px 80px',
        }}>
            <div style={{
                maxWidth: '580px',
                width: '100%',
                margin: '0 auto',
                textAlign: 'center',
            }}>
                {/* Error Icon */}
                <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    border: '3px solid #fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 30px',
                    animation: 'shakePop 0.5s ease',
                }}>
                    <XCircle size={48} color="#ef4444" strokeWidth={2} />
                </div>

                <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                    lineHeight: '1.2',
                }}>
                    El pago no se pudo completar
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--color-text-light)',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                }}>
                    No se ha realizado ningún cargo. Puedes intentarlo de nuevo o ponerte en contacto con nosotras si el problema persiste.
                </p>

                {orderId && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '12px',
                        padding: '16px 24px',
                        marginBottom: '32px',
                        color: '#991b1b',
                        fontSize: '0.9rem',
                    }}>
                        Referencia del pedido: <strong>#{orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}</strong>
                    </div>
                )}

                {/* Info Card */}
                <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '40px',
                    textAlign: 'left',
                }}>
                    <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#92400e', fontSize: '0.95rem' }}>
                        💡 ¿Qué puede haber ocurrido?
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '0.9rem', lineHeight: '1.8' }}>
                        <li>Los datos de la tarjeta no son correctos</li>
                        <li>La tarjeta no tiene fondos suficientes</li>
                        <li>El banco ha bloqueado la operación por seguridad</li>
                        <li>La sesión de pago ha caducado</li>
                    </ul>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    <Link to="/checkout" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        fontWeight: '600',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '1rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(139, 94, 131, 0.3)',
                    }}>
                        <RefreshCw size={18} />
                        Intentar de nuevo
                    </Link>
                    <Link to="/tienda" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: '500',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '1rem',
                        border: '1.5px solid #e2e8f0',
                        textDecoration: 'none',
                    }}>
                        <ShoppingBag size={18} />
                        Volver a la tienda
                    </Link>
                </div>

                <p style={{
                    marginTop: '40px',
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    lineHeight: '1.5',
                }}>
                    ¿Necesitas ayuda? Escríbenos a{' '}
                    <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>
                        hola@merakiartesano.es
                    </a>
                </p>
            </div>

            <style>{`
                @keyframes shakePop {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.1); }
                    80% { transform: translateX(-4px); }
                    90% { transform: translateX(4px); }
                    100% { transform: scale(1) translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default PagoKo;
