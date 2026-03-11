import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireSubscription = false }) => {
    const { user, loading, hasActiveSubscription } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '20px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
                <p style={{ color: '#718096', fontSize: '1.1rem' }}>Verificando tus accesos...</p>
            </div>
        );
    }

    if (!user) {
        // Redirigir al login si no está autenticado, guardando la ruta intentada
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireSubscription && !hasActiveSubscription) {
        // Si requiere suscripción y no la tiene, enviarlo a la página de planes/clases
        return <Navigate to="/clases" replace />;
    }

    return children;
};

export default ProtectedRoute;
