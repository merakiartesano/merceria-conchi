import React, { useState, useEffect } from 'react';
import { Package, Users, Settings, LogOut, Plus, Edit2, Trash2, Lock, X, Upload, Save, Loader, ShoppingBag, Truck } from 'lucide-react';
import { getProducts, createProduct, deleteProduct, updateProduct, uploadImage, getOrders, updateOrderStatus, getAcademySettings, updateAcademySettings, getSubscribers, getAcademyVideos, createAcademyVideo, updateAcademyVideo, deleteAcademyVideo, getShippingZones, updateShippingZone, triggerClassReminder } from '../lib/productService';
import { supabase } from '../lib/supabase';

const Admin = () => {
    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Dashboard State
    const [activeTab, setActiveTab] = useState('inventory');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [subscribers, setSubscribers] = useState([]);
    const [subscribersLoading, setSubscribersLoading] = useState(true);
    const [videos, setVideos] = useState([]);
    const [videosLoading, setVideosLoading] = useState(true);
    const [shippingZones, setShippingZones] = useState([]);
    const [shippingZonesLoading, setShippingZonesLoading] = useState(true);
    const [academySettings, setAcademySettings] = useState({
        liveTitle: '',
        liveLink: '',
        welcomeText: '',
        stripePaymentLink: '',
        subscriptionPrice: '9.99',
        subscriptionFeatures: '',
        maxSubscribers: '0'
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [isReminding, setIsReminding] = useState(false);
    const [remindMsg, setRemindMsg] = useState({ text: '', type: '' });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [selectedSubShipping, setSelectedSubShipping] = useState(null);
    const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
    const [videoFormData, setVideoFormData] = useState({
        title: '',
        description: '',
        video_url: '',
        order_index: 0
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Lanas e Hilos',
        price: '',
        image_url: '',
        is_new: false,
        description: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError('');
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user?.email !== 'web.merakiartesano@gmail.com') {
                await supabase.auth.signOut();
                throw new Error('Acceso denegado: No tienes permisos de administrador.');
            }

            setIsAuthenticated(true);
            fetchProducts();
            fetchOrders();
            fetchAcademy();
            fetchSubscribersData();
            fetchVideosData();
            fetchShippingZonesData();
        } catch (error) {
            console.error("Login error:", error);
            setLoginError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : error.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setProducts([]);
        setIsModalOpen(false);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscribersData = async () => {
        setSubscribersLoading(true);
        try {
            const data = await getSubscribers();
            setSubscribers(data || []);
        } catch (error) {
            console.error("Error fetching subscribers:", error);
        } finally {
            setSubscribersLoading(false);
        }
    };

    const fetchVideosData = async () => {
        setVideosLoading(true);
        try {
            const data = await getAcademyVideos();
            setVideos(data || []);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setVideosLoading(false);
        }
    };

    const fetchShippingZonesData = async () => {
        setShippingZonesLoading(true);
        try {
            const data = await getShippingZones();
            setShippingZones(data || []);
        } catch (error) {
            console.error("Error fetching shipping zones:", error);
        } finally {
            setShippingZonesLoading(false);
        }
    };

    const handleSaveShippingZone = async (id, updatedData) => {
        try {
            const saved = await updateShippingZone(id, updatedData);
            setShippingZones(prev => prev.map(z => z.id === id ? saved : z));
        } catch (error) {
            console.error("Error updating shipping zone:", error);
            alert("No se pudo actualizar la zona de envío.");
            fetchShippingZonesData();
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getOrders();
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchAcademy = async () => {
        try {
            const data = await getAcademySettings();
            if (data) {
                setAcademySettings({
                    liveTitle: data.live_title || '',
                    liveLink: data.live_link || '',
                    welcomeText: data.welcome_text || '',
                    stripePaymentLink: data.stripe_payment_link || '',
                    subscriptionPrice: data.subscription_price?.toString() || '9.99',
                    subscriptionFeatures: data.subscription_features || '',
                    maxSubscribers: data.max_subscribers?.toString() || '0'
                });
            }
        } catch (error) {
            console.error("Error fetching academy settings:", error);
        }
    };

    const handleSaveAcademySettings = async (e) => {
        e.preventDefault();
        setSettingsSaving(true);
        setSettingsError('');
        setSettingsSaved(false);
        try {
            await updateAcademySettings(academySettings);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 3000);
        } catch (error) {
            console.error("Error saving academy settings:", error);
            setSettingsError("Error al guardar: " + (error.message || 'Inténtalo de nuevo.'));
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleSendReminder = async () => {
        if (!window.confirm("¿Seguro que quieres enviar el recordatorio de clase por correo a TODAS las suscriptoras activas?")) return;
        
        setIsReminding(true);
        setRemindMsg({ text: '', type: '' });
        try {
            const res = await triggerClassReminder();
            setRemindMsg({ text: res.message || 'Recordatorios enviados con éxito', type: 'success' });
        } catch (error) {
            setRemindMsg({ text: error.message || 'Error al enviar recordatorios', type: 'error' });
        } finally {
            setIsReminding(false);
            setTimeout(() => setRemindMsg({ text: '', type: '' }), 6000);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        // Optimistic UI update for instant feedback
        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        ));

        try {
            await updateOrderStatus(orderId, newStatus);
            // Optionally fetch again to ensure sync, though optimistic update handles the UI side
            fetchOrders();
        } catch (err) {
            console.error("Error updating order:", err);
            alert("No se pudo actualizar el estado del pedido.");
            // Revert on failure
            fetchOrders();
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                image_url: product.image_url || '',
                is_new: product.is_new || false,
                description: product.description || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: 'Lanas e Hilos',
                price: '',
                image_url: '',
                is_new: false,
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const publicUrl = await uploadImage(file);
            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error("Error al subir imagen:", error);
            alert("Hubo un error al subir la imagen a Supabase.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const payload = { ...formData, price: parseFloat(formData.price) };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
            } else {
                await createProduct(payload);
            }
            handleCloseModal();
            fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("No se pudo guardar el producto.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este producto de tu tienda?")) return;

        try {
            await deleteProduct(id);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("No se pudo borrar el producto.");
        }
    };

    // --- VIDEO HANDLERS ---
    const handleOpenVideoModal = (video = null) => {
        if (video) {
            setEditingVideo(video);
            setVideoFormData({
                title: video.title,
                description: video.description || '',
                video_url: video.video_url,
                order_index: video.order_index || 0
            });
        } else {
            setEditingVideo(null);
            setVideoFormData({
                title: '',
                description: '',
                video_url: '',
                order_index: videos.length
            });
        }
        setIsVideoModalOpen(true);
    };

    const handleCloseVideoModal = () => {
        setIsVideoModalOpen(false);
        setEditingVideo(null);
    };

    const handleSaveVideo = async (e) => {
        e.preventDefault();
        try {
            if (editingVideo) {
                await updateAcademyVideo(editingVideo.id, videoFormData);
            } else {
                await createAcademyVideo(videoFormData);
            }
            handleCloseVideoModal();
            fetchVideosData();
        } catch (error) {
            console.error("Error saving video:", error);
            alert("No se pudo guardar el vídeo.");
        }
    };

    const handleDeleteVideo = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este vídeo de la academia?")) return;
        try {
            await deleteAcademyVideo(id);
            fetchVideosData();
        } catch (error) {
            console.error("Error deleting video:", error);
            alert("No se pudo borrar el vídeo.");
        }
    };

    // --- PANTALLA DE LOGIN ---
    if (!isAuthenticated) {
        return (
            <div className="admin-login-wrapper" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                backgroundImage: 'radial-gradient(circle at top right, #fef3c7, transparent 30%), radial-gradient(circle at bottom left, #e0f2fe, transparent 30%)'
            }}>
                <div className="admin-login-card" style={{
                    backgroundColor: '#fff',
                    padding: '50px 40px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    width: '100%',
                    maxWidth: '420px',
                    textAlign: 'center',
                    borderTop: '6px solid var(--color-primary)'
                }}>
                    <div style={{ marginBottom: '30px' }}>
                        <img src="/logo.jpg" alt="Meraki ArteSano Logo" style={{ height: '70px', objectFit: 'contain', marginBottom: '15px', borderRadius: '8px' }} />
                        <h2 style={{ color: 'var(--color-primary)', fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: '0 0 10px 0' }}>Administración</h2>
                        <p style={{ color: '#718096', fontSize: '1rem', margin: 0 }}>Zona privada de gestión</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>Correo de Administrador</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                required
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontSize: '1.05rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tu contraseña"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontSize: '1.05rem',
                                    letterSpacing: '2px',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        {loginError && <p style={{ color: '#e53e3e', fontSize: '0.9rem', margin: 0 }}>{loginError}</p>}

                        <button type="submit" disabled={isLoggingIn} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            {isLoggingIn ? <Loader className="animate-spin" size={20} /> : <><Lock size={20} /> Entrar al Panel</>}
                        </button>
                    </form>

                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                        <a href="/" style={{ color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#718096'}
                        >
                            ⬅ Volver a la web de inicio
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // --- PANTALLA PRINCIPAL (DASHBOARD) ---
    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <h2>Panel Privado</h2>
                    <p>Meraki ArteSano</p>
                </div>

                <nav className="admin-nav">
                    <button className={`admin-nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                        <Package size={20} />
                        <span>Inventario</span>
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <ShoppingBag size={20} />
                        <span>Pedidos</span>
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => setActiveTab('academy')}>
                        <Settings size={20} />
                        <span>Ajustes Academia</span>
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'subscribers' ? 'active' : ''}`} onClick={() => setActiveTab('subscribers')}>
                        <Users size={20} />
                        <span>Suscriptores</span>
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>
                        <Truck size={20} />
                        <span>Envíos</span>
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button onClick={handleLogout} className="admin-nav-item text-danger">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'inventory' && (
                    <>
                        <header className="admin-header">
                            <div>
                                <h1 className="admin-title">Gestión de Inventario</h1>
                                <p className="admin-subtitle">Administra los productos del escaparate online.</p>
                            </div>
                            <button onClick={() => handleOpenModal()} className="btn btn-primary d-flex align-center gap-sm">
                                <Plus size={18} /> Nuevo Producto
                            </button>
                        </header>

                        <div className="admin-card">
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Imagen</th>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Precio</th>
                                            <th className="text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center" style={{ padding: '2rem' }}>Cargando catálogo...</td></tr>
                                        ) : products.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center" style={{ padding: '2rem' }}>No hay productos. Añade el primero.</td></tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <div className="table-img" style={{ backgroundImage: `url(${product.image_url || 'https://images.unsplash.com/photo-15ef2324ca353-ce2dcb9eb0fb?auto=format&fit=crop&q=80&w=200'})` }}></div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.is_new && <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Novedad</span>}
                                                    </td>
                                                    <td><span className="badge-gray">{product.category}</span></td>
                                                    <td className="font-medium">€{Number(product.price).toFixed(2)}</td>
                                                    <td className="action-cells">
                                                        <button onClick={() => handleOpenModal(product)} className="btn-icon-small" title="Editar"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(product.id)} className="btn-icon-small text-danger" title="Eliminar"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <>
                        <header className="admin-header">
                            <div>
                                <h1 className="admin-title">Gestión de Pedidos</h1>
                                <p className="admin-subtitle">Revisa y envía las compras de tus clientes.</p>
                            </div>
                        </header>

                        <div className="admin-card">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {ordersLoading ? (
                                    <div className="text-center" style={{ padding: '3rem' }}>
                                        <Loader className="animate-spin" size={32} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center" style={{ padding: '3rem', color: '#718096' }}>Todavía no hay pedidos registrados.</div>
                                ) : (
                                    orders.map((order) => {
                                        const d = new Date(order.created_at);
                                        const subtotal = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                                        const shippingCost = order.total_amount - subtotal;
                                        // Rounding guard for floating tech
                                        const safeShipping = Math.max(0, shippingCost).toFixed(2);

                                        return (
                                            <div key={order.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                                {/* Header Row */}
                                                <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>Pedido #{order.id.slice(0, 8).toUpperCase()}</strong>
                                                        <span style={{ marginLeft: '15px', fontSize: '0.85rem', color: '#64748b' }}>
                                                            {d.toLocaleDateString()} a las {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Estado:</span>
                                                        <select
                                                            style={{
                                                                padding: '6px 30px 6px 15px',
                                                                borderRadius: '20px',
                                                                border: '1px solid ' + (order.status === 'Pagado' ? '#34d399' : order.status === 'Enviado' ? '#60a5fa' : order.status === 'Cancelado' ? '#f87171' : '#fbbf24'),
                                                                backgroundColor: order.status === 'Pagado' ? '#ecfdf5' : order.status === 'Enviado' ? '#eff6ff' : order.status === 'Cancelado' ? '#fef2f2' : '#fffbeb',
                                                                color: order.status === 'Pagado' ? '#065f46' : order.status === 'Enviado' ? '#1e40af' : order.status === 'Cancelado' ? '#991b1b' : '#92400e',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                appearance: 'none',
                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 10px center',
                                                                backgroundSize: '16px 16px',
                                                                outline: 'none'
                                                            }}
                                                            value={order.status}
                                                            onChange={async (e) => {
                                                                const newStatus = e.target.value;
                                                                await handleUpdateOrderStatus(order.id, newStatus);
                                                            }}
                                                        >
                                                            <option value="Pendiente">Pendiente de Pago</option>
                                                            <option value="Pagado">Pagado - Por Enviar</option>
                                                            <option value="Enviado">Enviado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Body Row */}
                                                <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                                                    {/* Artículos */}
                                                    <div style={{ flex: '2 1 400px' }}>
                                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artículos Comprados</h4>
                                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                            {order.order_items?.map((item, idx) => (
                                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: idx !== order.order_items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                                        <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem' }}>{item.quantity}x</span>
                                                                        <span style={{ color: '#1e293b', fontWeight: '500' }}>{item.name}</span>
                                                                    </div>
                                                                    <span style={{ color: '#64748b' }}>€{(item.price * item.quantity).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Cliente & Entrega */}
                                                    <div style={{ flex: '1 1 250px' }}>
                                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos de Entrega</h4>
                                                        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                                                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '1rem', marginBottom: '4px' }}>{order.customer_name}</strong>
                                                            <div><a href={`mailto:${order.customer_email}`} style={{ color: 'var(--color-primary)' }}>{order.customer_email}</a></div>
                                                            {order.customer_phone && <div style={{ marginBottom: '8px' }}>Tel: {order.customer_phone}</div>}

                                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
                                                                <div>{order.shipping_address?.line1}</div>
                                                                <div>{order.shipping_address?.postal_code} - {order.shipping_address?.city}</div>
                                                                <div style={{ fontWeight: '600' }}>{order.shipping_address?.state || order.shipping_address?.country}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Resumen Final */}
                                                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                                                <span>Subtotal artículos:</span>
                                                                <span>€{subtotal.toFixed(2)}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b', fontSize: '0.9rem' }}>
                                                                <span>Gastos de envío:</span>
                                                                <span>€{safeShipping}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0f172a', fontSize: '1.2rem' }}>
                                                                <span>Total pagado:</span>
                                                                <span>€{Number(order.total_amount).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'academy' && (
                    <>
                        <header className="admin-header">
                            <div>
                                <h1 className="admin-title">Configuración de la Academia</h1>
                                <p className="admin-subtitle">Gestiona las clases, suscripciones y contenido exclusivo.</p>
                            </div>
                        </header>

                        <div className="admin-card" style={{ padding: '2rem' }}>
                            <form className="modal-body" onSubmit={handleSaveAcademySettings}>
                                <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)', borderBottom: '1px solid #e1e8f0', paddingBottom: '0.5rem' }}>Clase en Directo</h3>
                                <div className="input-group">
                                    <label>Título de la Clase (Ej: Clase de falda tipo A)</label>
                                    <input
                                        type="text"
                                        value={academySettings.liveTitle}
                                        onChange={(e) => setAcademySettings({ ...academySettings, liveTitle: e.target.value })}
                                        placeholder="Nombre del proyecto de esta semana..."
                                    />
                                </div>
                                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                                    <label>Enlace de Zoom / Google Meet de la Semana</label>
                                    <input
                                        type="url"
                                        value={academySettings.liveLink}
                                        onChange={(e) => setAcademySettings({ ...academySettings, liveLink: e.target.value })}
                                        placeholder="https://zoom.us/j/123456789"
                                    />
                                </div>

                                <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-primary)', borderBottom: '1px solid #e1e8f0', paddingBottom: '0.5rem' }}>Pagos y Suscripción</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>Precio Mensual (€)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            value={academySettings.subscriptionPrice}
                                            onChange={(e) => setAcademySettings({ ...academySettings, subscriptionPrice: e.target.value })}
                                            placeholder="9.99"
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Visible en la página pública de Clases de Costura.</p>
                                    </div>
                                    <div className="input-group">
                                        <label>Límite de Plazas</label>
                                        <input
                                            type="number" step="1" min="0"
                                            value={academySettings.maxSubscribers}
                                            onChange={(e) => setAcademySettings({ ...academySettings, maxSubscribers: e.target.value })}
                                            placeholder="0"
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>0 = Plazas Ilimitadas.</p>
                                    </div>
                                    <div className="input-group">
                                        <label>Enlace de Pago de Stripe</label>
                                        <input
                                            type="url"
                                            value={academySettings.stripePaymentLink}
                                            onChange={(e) => setAcademySettings({ ...academySettings, stripePaymentLink: e.target.value })}
                                            placeholder="https://buy.stripe.com/..."
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Enlace para suscribirse.</p>
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                                    <label>¿Qué incluye la suscripción? (una línea = un beneficio)</label>
                                    <textarea
                                        rows="6"
                                        value={academySettings.subscriptionFeatures}
                                        onChange={(e) => setAcademySettings({ ...academySettings, subscriptionFeatures: e.target.value })}
                                        placeholder={"Clases en directo semanales por Zoom\nAcceso a todos los materiales del proyecto\nResolución de dudas en tiempo real\nComunidad privada de alumnas"}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Cada línea será un ✓ en la página pública.</p>
                                </div>

                                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                                    <label>Mensaje de Bienvenida del Portal</label>
                                    <textarea
                                        rows="3"
                                        value={academySettings.welcomeText}
                                        onChange={(e) => setAcademySettings({ ...academySettings, welcomeText: e.target.value })}
                                        placeholder="¡Hola! Esta semana estaremos tejiendo..."
                                    />
                                </div>

                                <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-primary)', borderBottom: '1px solid #e1e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>Acciones de Academia</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                                    {remindMsg.text && (
                                        <p style={{ color: remindMsg.type === 'error' ? '#991b1b' : '#065f46', background: remindMsg.type === 'error' ? '#fee2e2' : '#d1fae5', padding: '10px 16px', borderRadius: '8px', margin: 0, fontWeight: '500' }}>
                                            {remindMsg.type === 'error' ? '❌' : '✅'} {remindMsg.text}
                                        </p>
                                    )}
                                    <button type="button" onClick={handleSendReminder} disabled={isReminding} className="btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: '600', width: 'fit-content' }}>
                                        {isReminding ? <Loader size={18} className="animate-spin" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> : '📢 '}
                                        {isReminding ? 'Enviando recordatorios...' : 'Enviar recordatorio de próxima clase por Email'}
                                    </button>
                                </div>

                                <div className="modal-footer" style={{ marginTop: '3rem', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
                                    {settingsSaved && <p style={{ color: '#065f46', background: '#d1fae5', padding: '10px 16px', borderRadius: '8px', margin: 0, fontWeight: '500', width: '100%' }}>✅ ¡Ajustes guardados correctamente!</p>}
                                    {settingsError && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '10px 16px', borderRadius: '8px', margin: 0, fontWeight: '500', width: '100%' }}>❌ {settingsError}</p>}
                                    <button type="submit" className="btn btn-primary d-flex align-center gap-sm" disabled={settingsSaving}>
                                        {settingsSaving ? <Loader size={20} className="animate-spin" /> : <><Save size={20} /> Guardar Ajustes de Academia</>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* --- VIDEOTECA (TABLA) --- */}
                        <div className="admin-card" style={{ padding: '2rem', marginTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e1e8f0', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '1.4rem' }}>Videoteca Grabada</h3>
                                    <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '0.5rem' }}>Añade clases antiguas para que las alumnas puedan verlas en cualquier momento.</p>
                                </div>
                                <button type="button" onClick={() => handleOpenVideoModal(null)} className="btn btn-primary d-flex align-center gap-sm" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                                    <Plus size={18} /> Añadir Vídeo
                                </button>
                            </div>

                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ORDEN</th>
                                            <th>VÍDEO</th>
                                            <th>ENLACE</th>
                                            <th style={{ textAlign: 'right' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {videosLoading ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}><Loader className="animate-spin" size={24} style={{ display: 'inline-block', color: 'var(--color-primary)' }} /></td></tr>
                                        ) : videos.length === 0 ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>No hay vídeos en la videoteca.</td></tr>
                                        ) : (
                                            videos.map((video) => (
                                                <tr key={video.id}>
                                                    <td className="font-medium text-center" style={{ width: '80px', color: '#718096' }}>#{video.order_index}</td>
                                                    <td>
                                                        <div className="font-medium">{video.title}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#718096' }}>{video.description?.substring(0, 60)}{video.description?.length > 60 ? '...' : ''}</div>
                                                    </td>
                                                    <td>
                                                        <a href={video.video_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.9rem' }}>Ver Enlace</a>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                            <button type="button" onClick={() => handleOpenVideoModal(video)} className="btn-icon text-primary" title="Editar Video"><Edit2 size={18} /></button>
                                                            <button type="button" onClick={() => handleDeleteVideo(video.id)} className="btn-icon text-danger" title="Eliminar Video"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'subscribers' && (
                    <>
                        <header className="admin-header">
                            <div>
                                <h1 className="admin-title">Suscriptoras de la Academia</h1>
                                <p className="admin-subtitle">Alumnas registradas y estado de su suscripción mensual.</p>
                            </div>
                        </header>

                        {!subscribersLoading && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                <div className="admin-card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #10b981' }}>
                                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#065f46' }}>{subscribers.filter(u => u.subscriptions?.[0]?.status === 'active').length}</p>
                                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Activas</p>
                                </div>
                                <div className="admin-card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#92400e' }}>{subscribers.filter(u => !u.subscriptions?.[0] || u.subscriptions[0].status !== 'active').length}</p>
                                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Sin suscripción</p>
                                </div>
                                <div className="admin-card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
                                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{subscribers.length}</p>
                                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Total registradas</p>
                                </div>
                            </div>
                        )}

                        <div className="admin-card">
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Alumna</th>
                                            <th>Correo</th>
                                            <th>Teléfono</th>
                                            <th>Estado</th>
                                            <th>Fin Periodo</th>
                                            <th>Envío</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscribersLoading ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                                                <Loader className="animate-spin" size={28} style={{ display: 'inline-block', color: 'var(--color-primary)' }} />
                                            </td></tr>
                                        ) : subscribers.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🧵</div>
                                                <p style={{ margin: 0 }}>Todavía no hay alumnas registradas.</p>
                                                <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>Cuando alguien se registre aparecerá aquí.</p>
                                            </td></tr>
                                        ) : (
                                            subscribers.map((user) => {
                                                const sub = user.subscriptions?.[0] ?? null;
                                                const isActive = sub?.status === 'active';
                                                return (
                                                    <tr key={user.id}>
                                                        <td><div className="font-medium">{user.first_name || '-'} {user.last_name || ''}</div></td>
                                                        <td><a href={`mailto:${user.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{user.email || '-'}</a></td>
                                                        <td style={{ color: '#64748b' }}>{user.phone || '—'}</td>
                                                        <td>
                                                            <span style={{
                                                                display: 'inline-block', padding: '4px 12px',
                                                                borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                                                                backgroundColor: isActive ? '#d1fae5' : '#f1f5f9',
                                                                color: isActive ? '#065f46' : '#64748b'
                                                            }}>
                                                                {isActive ? '✅ Activa' : (sub?.status ?? 'Sin suscripción')}
                                                            </span>
                                                        </td>
                                                        <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                                            {sub?.current_period_end ? new Date(sub.current_period_end * 1000).toLocaleDateString('es-ES') : '—'}
                                                        </td>
                                                        <td>
                                                            {sub?.shipping_details ? (
                                                                <button 
                                                                    onClick={() => { setSelectedSubShipping(sub.shipping_details); setIsShippingModalOpen(true); }}
                                                                    className="btn-icon-small" 
                                                                    style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }} 
                                                                    title="Ver Dirección de Envío"
                                                                >
                                                                    <Truck size={18} />
                                                                </button>
                                                            ) : (
                                                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>No disp.</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'shipping' && (
                    <>
                        <header className="admin-header">
                            <div>
                                <h1 className="admin-title">Zonas de Envío</h1>
                                <p className="admin-subtitle">Configura los destinos a los que envías tus pedidos y el coste del transporte.</p>
                            </div>
                        </header>

                        {shippingZonesLoading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <Loader className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {shippingZones.map(zone => (
                                    <div key={zone.id} className="admin-card" style={{ padding: '20px', borderTop: zone.is_active ? '4px solid #10b981' : '4px solid #cbd5e1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{zone.name}</h3>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={zone.is_active}
                                                    onChange={(e) => {
                                                        const updated = { ...zone, is_active: e.target.checked };
                                                        handleSaveShippingZone(zone.id, updated);
                                                    }}
                                                    style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                                                />
                                                <span style={{ marginLeft: '8px', fontSize: '0.95rem', color: zone.is_active ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
                                                    {zone.is_active ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '5px' }}>Coste de Envío Base (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                defaultValue={zone.cost}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val) && val !== parseFloat(zone.cost)) {
                                                        handleSaveShippingZone(zone.id, { ...zone, cost: val });
                                                    }
                                                }}
                                                disabled={!zone.is_active}
                                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', backgroundColor: zone.is_active ? '#fff' : '#f8fafc' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '5px' }}>Envío Gratis a partir de (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                defaultValue={zone.free_shipping_threshold || ''}
                                                onBlur={(e) => {
                                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                    if (val !== zone.free_shipping_threshold) {
                                                        handleSaveShippingZone(zone.id, { ...zone, free_shipping_threshold: val });
                                                    }
                                                }}
                                                disabled={!zone.is_active}
                                                placeholder="Sin cantidad definida..."
                                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', backgroundColor: zone.is_active ? '#fff' : '#f8fafc' }}
                                            />
                                            <p style={{ marginTop: '5px', fontSize: '0.8rem', color: '#94a3b8' }}>Dejar en blanco si el envío nunca es gratuito en esta zona.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* --- MODAL AÑADIR/EDITAR PRODUCTO --- */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
                            <button onClick={handleCloseModal} className="btn-icon-small"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="modal-body">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Nombre del Producto *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Ovillo Algodón Premium"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Precio (€) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="Ej: 5.95"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Categoría *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="admin-select"
                                    >
                                        <option value="Lanas e Hilos">Lanas e Hilos</option>
                                        <option value="Telas">Telas</option>
                                        <option value="Mercería">Mercería</option>
                                        <option value="Accesorios">Accesorios</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px', gap: '12px' }}>
                                    <input
                                        type="checkbox"
                                        id="isNew"
                                        checked={formData.is_new}
                                        onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                                    />
                                    <label htmlFor="isNew" style={{ marginBottom: 0, cursor: 'pointer' }}>Marcar como "Novedad"</label>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>URL de la Imagen</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="Sube una imagen o pega un enlace (https://...)"
                                        style={{ flexGrow: 1 }}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        id="fileUpload"
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary d-flex align-center gap-sm"
                                        style={{ padding: '0 16px', opacity: uploadingImage ? 0.7 : 1, cursor: uploadingImage ? 'not-allowed' : 'pointer' }}
                                        onClick={() => document.getElementById('fileUpload').click()}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? <Loader size={18} className="spin" /> : <Upload size={18} />}
                                        {uploadingImage ? 'Subiendo...' : 'Subir'}
                                    </button>
                                </div>
                                {formData.image_url && (
                                    <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', height: '120px', width: '120px', backgroundImage: `url(${formData.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}></div>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Descripción breve</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalles del producto..."
                                    className="admin-textarea"
                                ></textarea>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary d-flex align-center gap-sm">
                                    <Save size={18} /> {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL AÑADIR/EDITAR VÍDEO --- */}
            {isVideoModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h3>{editingVideo ? 'Editar Vídeo de la Academia' : 'Añadir Nuevo Vídeo'}</h3>
                            <button type="button" onClick={handleCloseVideoModal} className="btn-icon-small"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveVideo} className="modal-body">
                            <div className="input-group">
                                <label>Título del Vídeo *</label>
                                <input
                                    type="text"
                                    required
                                    value={videoFormData.title}
                                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                                    placeholder="Ej: Curso de Iniciación - Sesión 1"
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Enlace del Vídeo (Youtube, Vimeo, Drive, etc.) *</label>
                                <input
                                    type="url"
                                    required
                                    value={videoFormData.video_url}
                                    onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                                    placeholder="https://youtu.be/..."
                                />
                            </div>

                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <div className="input-group">
                                    <label>Orden de visualización (1, 2, 3...)</label>
                                    <input
                                        type="number"
                                        value={videoFormData.order_index}
                                        onChange={(e) => setVideoFormData({ ...videoFormData, order_index: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Descripción breve</label>
                                <textarea
                                    rows="3"
                                    value={videoFormData.description}
                                    onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                                    placeholder="En este vídeo aprenderemos a..."
                                    className="admin-textarea"
                                ></textarea>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '2rem' }}>
                                <button type="button" onClick={handleCloseVideoModal} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary d-flex align-center gap-sm">
                                    <Save size={18} /> {editingVideo ? 'Guardar Cambios' : 'Subir Vídeo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- MODAL DIRECCIÓN DE ENVÍO SUSCRIPCIÓN --- */}
            {isShippingModalOpen && selectedSubShipping && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3><Truck size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Datos de Envío (Kit Sorpresa)</h3>
                            <button onClick={() => setIsShippingModalOpen(false)} className="btn-icon-small"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Destinataria</label>
                                    <div style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: '500' }}>{selectedSubShipping.name}</div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Teléfono de Contacto</label>
                                    <div style={{ fontSize: '1.1rem', color: '#1e293b' }}>{selectedSubShipping.phone}</div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Dirección de Entrega</label>
                                    <div style={{ fontSize: '1.1rem', color: '#1e293b', lineHeight: '1.5' }}>
                                        {selectedSubShipping.line1}<br />
                                        {selectedSubShipping.postal_code} {selectedSubShipping.city}<br />
                                        {selectedSubShipping.state}, {selectedSubShipping.country}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button onClick={() => setIsShippingModalOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>Cerrar Detalles</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
