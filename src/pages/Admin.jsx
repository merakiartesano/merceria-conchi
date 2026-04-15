import React, { useState, useEffect } from 'react';
import { Package, Users, Settings, LogOut, Plus, Edit2, Trash2, Lock, X, Upload, Save, Loader, ShoppingBag, Truck, Search, Copy, Check, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { getProducts, createProduct, deleteProduct, updateProduct, uploadImage, getOrders, updateOrderStatus, getAcademySettings, updateAcademySettings, getSubscribers, cancelSubscription, getAcademyVideos, createAcademyVideo, updateAcademyVideo, deleteAcademyVideo, getShippingZones, updateShippingZone, triggerClassReminder, getCategories, createCategory, deleteCategory } from '../lib/productService';
import { supabase } from '../lib/supabase';

const Admin = () => {
    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Password Reset State
    const [isResetting, setIsResetting] = useState(false);
    const [resetEmail, setResetEmail] = useState('web.merakiartesano@gmail.com');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    
    // New Password State (after clicking recovery link)
    const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Dashboard State
    const [activeTab, setActiveTab] = useState('inventory');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('Pagado');
    const [searchQuery, setSearchQuery] = useState('');
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
        subscriptionPrice: '50.00',
        subscriptionFeatures: '',
        maxSubscribers: '0',
        calendarText: ''
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [isReminding, setIsReminding] = useState(false);
    const [remindMsg, setRemindMsg] = useState({ text: '', type: '' });

    // Categories State
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    // Substitution Cancellation Modal State
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [subToCancel, setSubToCancel] = useState({ id: null, name: '', redsysId: '', redsysIdentifier: null });
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Cancellation Success State
    const [isCancelSuccessModalOpen, setIsCancelSuccessModalOpen] = useState(false);
    const [cancellationResult, setCancellationResult] = useState(null);
    const [canForceCancel, setCanForceCancel] = useState(false);
    const [lastError, setLastError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [selectedSubShipping, setSelectedSubShipping] = useState(null);
    const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
    
    // History Modal State
    const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
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

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session?.user?.email === 'web.merakiartesano@gmail.com') {
                setIsAuthenticated(true);
                fetchProducts();
                fetchOrders();
                fetchAcademy();
                fetchSubscribersData();
                fetchVideosData();
                fetchShippingZonesData();
                fetchCategoriesData();
            }
        };
        checkExistingSession();

        // Escuchamos por si venimos de un enlace de recuperación de contraseña
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsSettingNewPassword(true);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

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
            fetchCategoriesData();
        } catch (error) {
            console.error("Login error:", error);
            setLoginError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : error.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Detectar retorno de baja de Redsys
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cancelStatus = params.get('cancel');
        const targetUser = params.get('user');

        if (cancelStatus === 'success') {
            // Limpiar la URL para evitar re-disparar el mensaje
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Mostrar modal de éxito (los datos se recargarán solos)
            setCancellationResult({
                name: "la alumna",
                authCode: 'Confirmado vía Redsys',
                isManual: false,
                isBankSuccess: true,
                rawResponse: "Operación de baja confirmada por redirección."
            });
            setIsCancelSuccessModalOpen(true);
            fetchSubscribersData();
        } else if (cancelStatus === 'error') {
            window.history.replaceState({}, document.title, window.location.pathname);
            alert("La operación de baja en Redsys no se completó o fue cancelada.");
        }
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setProducts([]);
        setIsModalOpen(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetMessage('');
        setResetError('');
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: window.location.origin + '/admin',
            });
            if (error) throw error;
            setResetMessage('Te hemos enviado un enlace de recuperación a tu correo.');
        } catch (error) {
            console.error("Reset password error:", error);
            setResetError('No se pudo enviar el correo de recuperación.');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setIsUpdatingPassword(true);
        setResetError('');
        
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            // Si funciona, contraseña actualizada y cerramos este modo
            alert("¡Contraseña actualizada con éxito!");
            setIsSettingNewPassword(false);
            setNewPassword('');
        } catch (error) {
            console.error("Update password error:", error);
            setResetError('Hubo un error al actualizar la contraseña.');
        } finally {
            setIsUpdatingPassword(false);
        }
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

    const handleCancelClick = (userId, firstName, redsysId, redsysIdentifier) => {
        setSubToCancel({ 
            id: userId, 
            name: firstName, 
            redsysId: redsysId || 'No disponible',
            redsysIdentifier: redsysIdentifier || null
        });
        setIsCancelModalOpen(true);
    };

    const confirmCancellation = async () => {
        setIsCancelling(true);
        setCanForceCancel(false);
        setLastError('');
        try {
            const result = await cancelSubscription(subToCancel.id);
            
            // Gestión de éxito automático (REST)
            if (result && typeof result === 'object' && result.success) {
                setCancellationResult({
                    name: subToCancel.name,
                    authCode: result.redsysResponse?.dsResponse || 'Confirmado',
                    isManual: false,
                    isBankSuccess: result.redsysResponse?.isBankSuccess,
                    rawResponse: result.message || "Operación completada con éxito."
                });
                setIsCancelModalOpen(false);
                setIsCancelSuccessModalOpen(true);
            } else {
                // Caso de denegación del banco: Permitimos forzar baja local
                const errorMsg = result?.error || "El banco denegó la baja automática.";
                setLastError(errorMsg);
                if (result?.canForce || errorMsg.includes('42') || errorMsg.includes('Firma')) {
                    setCanForceCancel(true);
                } else {
                    alert(`Error: ${errorMsg}`);
                    setIsCancelModalOpen(false);
                }
            }
            
            fetchSubscribersData();
        } catch (error) {
            console.error("Error en confirmCancellation:", error);
            setLastError(error.message);
            // Si hay error de red o timeout, también permitimos forzar para no bloquear
            setCanForceCancel(true);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleForceCancel = async () => {
        if (!window.confirm("¿Confirmas que ya has gestionado la baja en Redsys y quieres quitarle el acceso a la web ahora mismo?")) return;
        
        setIsCancelling(true);
        try {
            // Usamos la RPC segura con el PIN para saltar RLS
            const { error } = await supabase.rpc('cancel_admin_subscription', {
                admin_pin: 'meraki2026',
                target_user_id: subToCancel.id
            });

            if (error) throw error;

            setIsCancelModalOpen(false);
            setCanForceCancel(false); // Resetear estado de fuerza
            
            setCancellationResult({
                name: subToCancel.name,
                authCode: 'MANUAL',
                isManual: true,
                isBankSuccess: false,
                rawResponse: "Baja forzada manualmente por el administrador tras error bancario. Acceso revocado en la web."
            });
            setIsCancelSuccessModalOpen(true);
            fetchSubscribersData();
        } catch (error) {
            console.error("Error al forzar baja:", error);
            alert("No se pudo forzar la baja: " + error.message);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleCopyID = (id) => {
        navigator.clipboard.writeText(id);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
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

    const handleViewHistory = async (user) => {
        setSelectedHistoryUser(user);
        setIsHistoryModalOpen(true);
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_email', user.email)
                .order('created_at', { ascending: false });
            if (error) throw error;

            // Filtrar SOLO los pagos relacionados con la academia (renovaciones automáticas)
            let academyOrders = (data || []).filter(o => o.is_academy_renewal === true);
            
            // Añadir manualmente el registro de "Alta Academia" usando los datos de la suscripción
            const sub = user.subscriptions?.[0];
            // Para asegurar que el ALTA siempre aparezca, verificamos que tenga referencia de redsys
            if (sub && sub.redsys_order_id) {
                // Confirmar que no exista un "pedido" ya con esa referencia
                if (!academyOrders.find(o => o.redsys_order_id === sub.redsys_order_id)) {
                    academyOrders.push({
                        id: 'alta-' + sub.redsys_order_id,
                        created_at: user.created_at || new Date().toISOString(),
                        total_amount: 50, // Importe fijo del alta de la academia
                        is_academy_renewal: false, 
                        is_academy_alta: true, // Flag específico para renderizar
                        redsys_order_id: sub.redsys_order_id,
                        status: 'Pagado'
                    });
                }
            }
            
            // Ordenar de nuevo todo por fecha descendente
            academyOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setHistoryOrders(academyOrders);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
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

    const fetchCategoriesData = async () => {
        setCategoriesLoading(true);
        try {
            const data = await getCategories();
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setIsSavingCategory(true);
        try {
            await createCategory(newCategoryName.trim());
            setNewCategoryName('');
            fetchCategoriesData();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Error al añadir la categoría. Tal vez ya exista.");
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar esta categoría? Los productos que la usan podrían no filtrarse correctamente en la tienda.")) return;
        try {
            await deleteCategory(id);
            fetchCategoriesData();
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("No se pudo borrar la categoría.");
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
                    subscriptionPrice: data.subscription_price?.toString() || '50.00',
                    subscriptionFeatures: data.subscription_features || '',
                    maxSubscribers: data.max_subscribers?.toString() || '0',
                    calendarText: data.calendar_text || ''
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
                category: categories.length > 0 ? categories[0].name : '',
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

                    {isSettingNewPassword ? (
                        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Escribe tu nueva contraseña"
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
                            {resetError && <p style={{ color: '#e53e3e', fontSize: '0.9rem', margin: 0 }}>{resetError}</p>}
                            <button type="submit" disabled={isUpdatingPassword} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                                {isUpdatingPassword ? <Loader className="animate-spin" size={20} style={{ margin: '0 auto' }} /> : 'Guardar Nueva Contraseña'}
                            </button>
                        </form>
                    ) : isResetting ? (
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <p style={{ color: '#4a5568', fontSize: '0.95rem', margin: 0 }}>Introduce el correo administrador para enviarte un enlace de recuperación.</p>
                            <div style={{ textAlign: 'left' }}>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="web.merakiartesano@gmail.com"
                                    required
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
                            {resetError && <p style={{ color: '#e53e3e', fontSize: '0.9rem', margin: 0 }}>{resetError}</p>}
                            {resetMessage && <p style={{ color: '#065f46', fontSize: '0.9rem', margin: 0, padding: '10px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>{resetMessage}</p>}
                            
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '30px' }}>
                                Enviar Enlace
                            </button>
                            
                            <button type="button" onClick={() => { setIsResetting(false); setResetError(''); setResetMessage(''); }} style={{ background: 'none', border: 'none', color: '#718096', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Cancelar y volver
                            </button>
                        </form>
                    ) : (
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
                            
                            <div style={{ textAlign: 'right' }}>
                                <button type="button" onClick={() => setIsResetting(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {loginError && <p style={{ color: '#e53e3e', fontSize: '0.9rem', margin: 0 }}>{loginError}</p>}

                            <button type="submit" disabled={isLoggingIn} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                {isLoggingIn ? <Loader className="animate-spin" size={20} /> : <><Lock size={20} /> Entrar al Panel</>}
                            </button>
                        </form>
                    )}

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
                                <h1 className="admin-title">Gestión de Inventario y Categorías</h1>
                                <p className="admin-subtitle">Administra los productos y las categorías del escaparate online.</p>
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

                        <div style={{ marginBottom: '3rem', marginTop: '3rem' }}>
                            <h2 style={{ color: 'var(--color-primary)', fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Categorías de Productos</h2>
                            
                            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nueva categoría..."
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    required
                                />
                                <button type="submit" disabled={isSavingCategory} className="btn btn-primary d-flex align-center gap-sm" style={{ padding: '0 16px' }}>
                                    {isSavingCategory ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />} Añadir
                                </button>
                            </form>

                            {categoriesLoading ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <Loader size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                                </div>
                            ) : categories.length === 0 ? (
                                <p style={{ color: '#64748b' }}>No hay categorías. Crea una ahora.</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px' }}>
                                    {categories.map(cat => (
                                        <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: '500', color: '#1e293b' }}>{cat.name}</span>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="btn-icon-small" 
                                                style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}
                                                title="Eliminar Categoría"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
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

                        {/* PANEL DE FILTROS Y BÚSQUEDA */}
                        <div className="admin-card" style={{ padding: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Barra de búsqueda */}
                                <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                        <Search size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre, correo, teléfono o ID de pedido..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '14px 20px 14px 45px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem',
                                            backgroundColor: '#f8fafc',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.backgroundColor = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                                    />
                                </div>

                                {/* Filtros de Estado */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', marginRight: '5px' }}>Filtrar por estado:</span>
                                    {['Todos', 'Pendiente', 'Pagado', 'Enviado', 'Cancelado'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setOrderFilter(status)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '30px',
                                                border: '1px solid ' + (orderFilter === status ? 'var(--color-primary)' : '#e2e8f0'),
                                                backgroundColor: orderFilter === status ? 'var(--color-primary)' : '#fff',
                                                color: orderFilter === status ? '#fff' : '#64748b',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '0.85rem',
                                                boxShadow: orderFilter === status ? '0 4px 10px rgba(22, 163, 74, 0.2)' : 'none'
                                            }}
                                        >
                                            {status === 'Todos' ? 'Todos' :
                                             status === 'Pendiente' ? 'Pendientes' :
                                             status === 'Pagado' ? 'Para Enviar' :
                                             status === 'Enviado' ? 'Enviados' : 'Cancelados'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {ordersLoading ? (
                                    <div className="text-center" style={{ padding: '3rem' }}>
                                        <Loader className="animate-spin" size={32} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
                                    </div>
                                ) : (() => {
                                    // Local filter logic
                                    const filteredList = orders.filter(o => {
                                        const matchesStatus = orderFilter === 'Todos' || o.status === orderFilter;
                                        const searchLower = searchQuery.toLowerCase();
                                        const matchesSearch = !searchLower || (
                                            (o.id && o.id.toLowerCase().includes(searchLower)) ||
                                            (o.customer_name && o.customer_name.toLowerCase().includes(searchLower)) ||
                                            (o.customer_email && o.customer_email.toLowerCase().includes(searchLower)) ||
                                            (o.customer_phone && o.customer_phone.toLowerCase().includes(searchLower)) ||
                                            (o.shipping_address?.phone && o.shipping_address.phone.toLowerCase().includes(searchLower))
                                        );
                                        return matchesStatus && matchesSearch;
                                    });

                                    if (filteredList.length === 0) {
                                        return (
                                            <div className="text-center" style={{ padding: '3rem', color: '#718096' }}>
                                                <Search size={48} style={{ margin: '0 auto 15px', color: '#cbd5e1', opacity: 0.5 }} />
                                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>No se encontraron pedidos</p>
                                                <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>Prueba con otros filtros o términos de búsqueda.</p>
                                            </div>
                                        );
                                    }

                                    return filteredList.map((order) => {
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
                                                            {(order.customer_phone || order.shipping_address?.phone) && <div style={{ marginBottom: '8px' }}>Tel: {order.customer_phone || order.shipping_address?.phone}</div>}

                                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
                                                                <div>{order.shipping_address?.line1}</div>
                                                                {order.shipping_address?.line2 && <div>{order.shipping_address?.line2}</div>}
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
                                })()}
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
                                        <label>Precio Cuota Mensual (€)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            value={academySettings.subscriptionPrice}
                                            onChange={(e) => setAcademySettings({ ...academySettings, subscriptionPrice: e.target.value })}
                                            placeholder="50.00"
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Este es el importe que se cobrará automáticamente cada mes a las alumnas.</p>
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

                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    <div className="form-group grid-col-span-2">
                                        <label className="form-label">Características (una por línea)</label>
                                        <textarea
                                            className="form-input"
                                            rows="5"
                                            value={academySettings.subscriptionFeatures}
                                            onChange={(e) => setAcademySettings({ ...academySettings, subscriptionFeatures: e.target.value })}
                                        ></textarea>
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Cada línea será un ✓ en la página pública.</p>
                                    </div>

                                    <div className="form-group grid-col-span-2">
                                        <label className="form-label">Calendario Mensual (Editable)</label>
                                        <textarea
                                            className="form-input"
                                            rows="6"
                                            value={academySettings.calendarText}
                                            onChange={(e) => setAcademySettings({ ...academySettings, calendarText: e.target.value })}
                                            placeholder="Ej: Día 1 al 5 -> Preparación de kits..."
                                        ></textarea>
                                        <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '5px' }}>
                                            Usa este cuadro para actualizar la programación que ven las alumnas.
                                        </p>
                                    </div>
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
                                            <th>Referencia</th>
                                            <th>Último Pago</th>
                                            <th>Historial</th>
                                            <th>Envío</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscribersLoading ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                                                <Loader className="animate-spin" size={28} style={{ display: 'inline-block', color: 'var(--color-primary)' }} />
                                            </td></tr>
                                        ) : subscribers.length === 0 ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
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
                                                            {(() => {
                                                                const status = sub?.status;
                                                                let label = 'Sin suscripción';
                                                                let bgColor = '#f1f5f9';
                                                                let textColor = '#64748b';

                                                                const isExpired = sub?.current_period_end && new Date(typeof sub.current_period_end === 'number' ? sub.current_period_end * 1000 : sub.current_period_end) < new Date();
                                                                if (status === 'active') {
                                                                    label = '✅ Activa';
                                                                    bgColor = '#d1fae5';
                                                                    textColor = '#065f46';
                                                                } else if (status === 'cancelled' && !isExpired) {
                                                                    label = '🕒 Baja (Acceso)';
                                                                    bgColor = '#fef9c3';
                                                                    textColor = '#854d0e';
                                                                } else if (status === 'cancelled' && isExpired) {
                                                                    label = '⚪ Cancelada';
                                                                    bgColor = '#f8fafc';
                                                                    textColor = '#475569';
                                                                } else if (status === 'past_due') {
                                                                    label = '⚠️ Falta de pago';
                                                                    bgColor = '#fee2e2';
                                                                    textColor = '#991b1b';
                                                                }

                                                                return (
                                                                    <span style={{
                                                                        display: 'inline-block', padding: '4px 12px',
                                                                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                                                                        backgroundColor: bgColor,
                                                                        color: textColor
                                                                    }}>
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td style={{ color: '#94a3b8', fontSize: '0.9rem', position: 'relative' }}>
                                                            <span>
                                                                {sub?.current_period_end 
                                                                    ? new Date(typeof sub.current_period_end === 'number' ? sub.current_period_end * 1000 : sub.current_period_end).toLocaleDateString('es-ES') 
                                                                    : '—'}
                                                            </span>
                                                            {isActive && (
                                                                <button 
                                                                    onClick={() => handleCancelClick(user.id, user.first_name, sub.redsys_order_id, sub.redsys_identifier)}
                                                                    style={{ 
                                                                        display: 'block', 
                                                                        marginTop: '6px', 
                                                                        fontSize: '0.75rem', 
                                                                        color: '#ef4444', 
                                                                        background: 'none', 
                                                                        border: '1px solid #fee2e2', 
                                                                        padding: '2px 8px', 
                                                                        borderRadius: '12px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Quitar acceso a la alumna"
                                                                >
                                                                    🗑️ Dar de Baja
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                            {sub?.redsys_order_id ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span>{sub.redsys_order_id}</span>
                                                                    <button 
                                                                        onClick={() => handleCopyID(sub.redsys_order_id)}
                                                                        className="btn-icon-small"
                                                                        style={{ padding: '4px' }}
                                                                        title="Copiar referencia de Redsys"
                                                                    >
                                                                        <Copy size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : '—'}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>
                                                            {sub?.last_payment_date ? (
                                                                <div>
                                                                    <div style={{ color: '#475569', fontWeight: '500' }}>
                                                                        {new Date(sub.last_payment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                                    </div>
                                                                    {sub.last_payment_status === 'success' ? (
                                                                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '2px' }}>
                                                                            <Check size={12} /> Éxito
                                                                        </span>
                                                                    ) : sub.last_payment_status === 'failed' ? (
                                                                        <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '2px' }}>
                                                                            <AlertTriangle size={12} /> Fallido
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            ) : '—'}
                                                        </td>
                                                        <td>
                                                            <button 
                                                                onClick={() => handleViewHistory(user)}
                                                                className="btn-icon-small"
                                                                style={{ 
                                                                    padding: '4px 10px', 
                                                                    width: 'auto',
                                                                    fontSize: '0.8rem', 
                                                                    borderRadius: '20px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    gap: '5px',
                                                                    backgroundColor: '#f1f5f9',
                                                                    color: '#475569',
                                                                    border: '1px solid #e2e8f0'
                                                                }}
                                                                title="Ver historial de pagos"
                                                            >
                                                                <FileText size={14} /> Pagos
                                                            </button>
                                                        </td>
                                                        <td>
                                                            {sub?.shipping_details ? (
                                                                 <button 
                                                                    onClick={() => { setSelectedSubShipping(sub.shipping_details); setIsShippingModalOpen(true); }}
                                                                    className="btn-icon-small" 
                                                                    style={{ 
                                                                        color: sub.shipping_details.pickup_pref ? '#0284c7' : 'var(--color-primary)', 
                                                                        backgroundColor: sub.shipping_details.pickup_pref ? '#f0f9ff' : 'var(--color-primary-light)',
                                                                        width: 'auto',
                                                                        padding: '4px 12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        borderRadius: '20px',
                                                                        border: `1px solid ${sub.shipping_details.pickup_pref ? '#bae6fd' : 'rgba(235, 137, 31, 0.2)'}`
                                                                    }} 
                                                                    title="Ver detalles de entrega"
                                                                >
                                                                    {sub.shipping_details.pickup_pref ? (
                                                                        <>
                                                                            <ShoppingBag size={16} />
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Recogida en Tienda</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Truck size={16} />
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Envío a Domicilio</span>
                                                                        </>
                                                                    )}
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
                                        {categories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
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
            {/* --- MODAL HISTORIAL DE PAGOS SUSCRIPCION --- */}
            {isHistoryModalOpen && selectedHistoryUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h3>
                                <FileText size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-primary)' }} /> 
                                Historial de Pagos de {selectedHistoryUser.first_name || 'la alumna'}
                            </h3>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="btn-icon-small"><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                                A continuación se muestran todos los cobros (tienda y academia) asociados al email <strong>{selectedHistoryUser.email}</strong>.
                            </p>
                            
                            {loadingHistory ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                    <Loader size={30} className="animate-spin" color="var(--color-primary)" />
                                </div>
                            ) : historyOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <p>No se han encontrado pagos para esta alumna.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {historyOrders.map(order => (
                                        <div key={order.id} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            padding: '15px 20px', 
                                            border: '1px solid #e2e8f0', 
                                            borderRadius: '12px', 
                                            backgroundColor: '#fdf8fa' 
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 5px 0' }}>
                                                    {order.is_academy_alta ? '🎓 Alta Academia' : '🌺 Renovación Academia'}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                                                    {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} a las {new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    {order.redsys_order_id && <span style={{ marginLeft: '10px' }}>• Ref: <strong>{order.redsys_order_id}</strong></span>}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.2rem', margin: '0 0 5px 0' }}>{order.total_amount} €</p>
                                                <span style={{ 
                                                    fontSize: '0.8rem', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    backgroundColor: order.status === 'Pagado' ? '#ecfdf5' : '#fef2f2', 
                                                    color: order.status === 'Pagado' ? '#059669' : '#dc2626',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {order.status === 'Pagado' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DIRECCIÓN DE ENVÍO SUSCRIPCIÓN --- */}
            {isShippingModalOpen && selectedSubShipping && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>
                                {selectedSubShipping.pickup_pref ? (
                                    <><ShoppingBag size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Detalles de Recogida</>
                                ) : (
                                    <><Truck size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Datos de Envío (Kit Sorpresa)</>
                                )}
                            </h3>
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
                                {selectedSubShipping.pickup_pref ? (
                                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <div style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px' }}>🛍️ RECOGIDA EN TIENDA</div>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>La alumna vendrá a la tienda a por su Kit.</p>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Dirección de Entrega</label>
                                        <div style={{ fontSize: '1.1rem', color: '#1e293b', lineHeight: '1.5' }}>
                                            {selectedSubShipping.line1 || 'No especificada'}<br />
                                            {selectedSubShipping.postal_code} {selectedSubShipping.city}<br />
                                            {selectedSubShipping.state}, {selectedSubShipping.country}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button onClick={() => setIsShippingModalOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>Cerrar Detalles</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL CONFIRMACIÓN BAJA ACADEMIA --- */}
            {isCancelModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '450px', padding: '0' }}>
                        <div style={{ backgroundColor: '#ef4444', padding: '30px 20px', textAlign: 'center', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <AlertTriangle size={48} style={{ marginBottom: '15px' }} />
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>⚠️ AVISO MUY IMPORTANTE ⚠️</h3>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '25px' }}>
                            <p style={{ margin: '0 0 20px 0', fontSize: '1rem', lineHeight: '1.5', color: '#1e293b' }}>
                                ¿Estás segura de revocar el acceso a la academia para la alumna <strong>{subToCancel.name}</strong>?
                            </p>
                            
                            {subToCancel.redsysIdentifier ? (
                                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0369a1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Check size={18} /> BAJA AUTOMÁTICA DETECTADA
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#075985', lineHeight: '1.4' }}>
                                        Esta alumna tiene una suscripción gestionada por Redsys. Al confirmar, el sistema <strong>cancelará los próximos cobros automáticos</strong> y le enviará un email. La alumna mantendrá su acceso hasta el fin de su periodo pagado.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#9a3412', fontWeight: 'bold' }}>
                                        Recuerda: Esto NO cancela el cobro en el banco.
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#c2410c' }}>
                                        Esta es una alumna antigua o sin contrato automático. Debes entrar al Panel de Redsys y dar de baja la suscripción manualmente con este ID:
                                    </p>
                                    
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        marginTop: '10px', 
                                        backgroundColor: 'white', 
                                        padding: '8px 12px', 
                                        borderRadius: '6px', 
                                        border: '1px solid #fed7aa' 
                                    }}>
                                        <code style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '600' }}>{subToCancel.redsysId}</code>
                                        <button 
                                            onClick={() => handleCopyID(subToCancel.redsysId)}
                                            style={{ 
                                                background: copySuccess ? '#22c55e' : 'var(--color-primary)', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '4px 10px', 
                                                borderRadius: '4px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.75rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                                            {copySuccess ? '¡Copiado!' : 'Copiar ID'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <p style={{ margin: '0 0 25px 0', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                                Una vez confirmes aquí, la alumna dejará de tener acceso a los contenidos de la academia inmediatamente.
                            </p>


                            {canForceCancel && (
                                <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#be123c', fontWeight: 'bold' }}>
                                        ⚠️ EL BANCO NO PERMITE LA BAJA AUTOMÁTICA
                                    </p>
                                    <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#9f1239' }}>
                                        Redsys devolvió: <strong>{lastError}</strong>. Esto suele pasar si el banco requiere claves de gestión especiales.<br/><br/>
                                        Si ya has realizado la baja manualmente en el panel de Redsys, pulsa el botón de abajo para quitarle el acceso a la web inmediatamente.
                                    </p>
                                    <button 
                                        onClick={handleForceCancel}
                                        disabled={isCancelling}
                                        style={{ 
                                            width: '100%', 
                                            backgroundColor: '#be123c', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '12px', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px rgba(190, 18, 60, 0.2)'
                                        }}
                                    >
                                        He cancelado en Redsys. FORZAR BAJA WEB.
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button 
                                    onClick={() => { setIsCancelModalOpen(false); setCanForceCancel(false); setLastError(''); }} 
                                    className="btn btn-secondary"
                                    disabled={isCancelling}
                                    style={{ width: '100%', margin: 0 }}
                                >
                                    No, Volver
                                </button>
                                {!canForceCancel && (
                                    <button 
                                        onClick={confirmCancellation} 
                                        className="btn" 
                                        disabled={isCancelling}
                                        style={{ 
                                            width: '100%', 
                                            margin: 0, 
                                            backgroundColor: isCancelling ? '#ccc' : '#ef4444', 
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isCancelling ? (
                                            <><Loader className="animate-spin" size={16} /> Procesando...</>
                                        ) : (
                                            'Sí, Revocar Acceso'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL ÉXITO BAJA REDSYS --- */}
            {isCancelSuccessModalOpen && cancellationResult && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '450px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: cancellationResult.isBankSuccess ? '#10b981' : '#f59e0b', padding: '30px 20px', textAlign: 'center', color: 'white' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                {cancellationResult.isBankSuccess ? <Check size={40} /> : <AlertTriangle size={40} />}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>
                                {cancellationResult.isBankSuccess ? '¡Baja Confirmada!' : 'Baja Administrativa'}
                            </h3>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '30px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 20px 0', fontSize: '1.05rem', color: '#1e293b' }}>
                                El acceso de <strong>{cancellationResult.name}</strong> ha sido revocado en la web.
                            </p>
                            
                            <div style={{ 
                                backgroundColor: cancellationResult.isBankSuccess ? '#f0fdf4' : '#fffbeb', 
                                border: `1px solid ${cancellationResult.isBankSuccess ? '#dcfce7' : '#fef3c7'}`, 
                                padding: '20px', 
                                borderRadius: '12px', 
                                marginBottom: '25px' 
                            }}>
                                <p style={{ 
                                    margin: '0 0 8px 0', 
                                    fontSize: '0.85rem', 
                                    color: cancellationResult.isBankSuccess ? '#15803d' : '#b45309', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em', 
                                    fontWeight: '600' 
                                }}>
                                    {cancellationResult.isBankSuccess ? 'Confirmación Bancaria (Redsys)' : 'Estado del Cobro Automático'}
                                </p>
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: cancellationResult.isBankSuccess ? '1.5rem' : '1.1rem', 
                                    color: cancellationResult.isBankSuccess ? '#166534' : '#92400e', 
                                    fontWeight: 'bold' 
                                }}>
                                    {cancellationResult.isBankSuccess ? `Ref: ${cancellationResult.authCode}` : `Aviso: El banco devolvió el código ${cancellationResult.authCode}.`}
                                </p>
                                {!cancellationResult.isBankSuccess && (
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#92400e', lineHeight: '1.4' }}>
                                        El acceso web se ha quitado, pero <strong>debes verificar en el panel de Redsys</strong> que la suscripción esté cancelada allí también.
                                    </p>
                                )}

                                {!cancellationResult.isBankSuccess && (
                                    <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                        <details style={{ cursor: 'pointer' }}>
                                            <summary style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '5px' }}>Ver detalles técnicos</summary>
                                            <pre style={{ 
                                                fontSize: '0.7rem', 
                                                backgroundColor: 'rgba(0,0,0,0.05)', 
                                                padding: '10px', 
                                                borderRadius: '6px', 
                                                overflowX: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                color: '#444',
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }}>
                                                {cancellationResult.rawResponse}
                                            </pre>
                                        </details>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => {
                                    setIsCancelSuccessModalOpen(false);
                                    setCancellationResult(null);
                                }} 
                                className="btn btn-primary"
                                style={{ width: '100%', borderRadius: '30px', padding: '12px' }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
