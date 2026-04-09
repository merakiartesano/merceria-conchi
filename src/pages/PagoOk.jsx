import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

const PagoOk = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order');
    const { clearCart } = useCart();

    useEffect(() => {
        if (clearCart) clearCart();
    }, []);

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
                maxWidth: '620px',
                width: '100%',
                margin: '0 auto',
                textAlign: 'center',
            }}>
                {/* Success Icon */}
                <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    border: '3px solid #34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 30px',
                    animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}>
                    <CheckCircle size={48} color="#10b981" strokeWidth={2} />
                </div>

                <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                    lineHeight: '1.2',
                }}>
                    ¡Gracias por tu compra!
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--color-text-light)',
                    marginBottom: '40px',
                    lineHeight: '1.6',
                }}>
                    Tu pago se ha procesado correctamente. Recibirás un email de confirmación en breve.
                </p>

                {orderId && (
                    <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '16px 24px',
                        marginBottom: '32px',
                        color: '#166534',
                        fontSize: '0.9rem',
                    }}>
                        Nº de pedido: <strong>#{orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}</strong>
                    </div>
                )}

                {/* Info Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '16px',
                    marginBottom: '40px',
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px 16px',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid #e6f7f5',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Package size={22} color="var(--color-primary)" />
                        </div>
                        <p style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.95rem' }}>Pedido confirmado</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                            Estamos preparando tu pedido con cariño.
                        </p>
                    </div>

                    <div style={{
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px 16px',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid #e6f7f5',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Mail size={22} color="#d97706" />
                        </div>
                        <p style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.95rem' }}>Email de confirmación</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                            Recibirás todos los detalles por correo.
                        </p>
                    </div>
                </div>

                <div style={{
                    width: '60px',
                    height: '3px',
                    borderRadius: '2px',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    margin: '0 auto 36px',
                }} />

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    <Link to="/tienda" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--color-accent)',
                        color: '#fff',
                        fontWeight: '600',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '1rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(255, 153, 0, 0.3)',
                    }}>
                        Seguir comprando
                        <ArrowRight size={18} />
                    </Link>
                    <Link to="/" style={{
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
                        Ir a Inicio
                    </Link>
                </div>

                <p style={{
                    marginTop: '40px',
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    lineHeight: '1.5',
                }}>
                    ¿Tienes alguna pregunta sobre tu pedido? Escríbenos a{' '}
                    <a href="mailto:hola@merakiartesano.es" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>
                        hola@merakiartesano.es
                    </a>
                </p>
            </div>

            <style>{`
                @keyframes successPop {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default PagoOk;
