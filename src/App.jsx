import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Cart from './components/layout/Cart';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Tienda from './pages/Tienda';
import ProductoDetalle from './pages/ProductoDetalle';
import Clases from './pages/Clases';
import Contacto from './pages/Contacto';
import Checkout from './pages/Checkout';
import PedidoConfirmado from './pages/PedidoConfirmado';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Academy from './pages/Academy';

const AppContent = () => {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <div className={isAdmin ? "admin-root" : "app-container"}>
            {!isAdmin && <Navbar />}
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tienda" element={<Tienda />} />
                    <Route path="/producto/:id" element={<ProductoDetalle />} />
                    <Route path="/clases" element={<Clases />} />
                    <Route path="/contacto" element={<Contacto />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/pedido-confirmado" element={<PedidoConfirmado />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/academia" element={
                        <ProtectedRoute>
                            <Academy />
                        </ProtectedRoute>
                    } />
                </Routes>
            </main>
            <Cart />
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
