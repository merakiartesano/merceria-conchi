import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fallback robusto: si Supabase no responde en 2.5s, forzamos la carga a falso
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2500);

        // Obtenemos la sesion inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchSubscription(session.user.id);
            } else {
                setLoading(false);
            }
        }).catch(err => {
            console.error("Error inicial:", err);
            setLoading(false);
        });

        // Escuchamos cambios de autenticacion (login, logout)
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchSubscription(session.user.id);
                } else {
                    setSubscription(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            clearTimeout(timer);
            authListener.unsubscribe();
        };
    }, []);

    const fetchSubscription = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'trialing'])
                .maybeSingle();

            if (error) {
                console.error("Error fetching subscription:", error);
            }

            setSubscription(data || null);
            return data;
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Error in Supabase signOut, clearing local state anyway:", err);
        } finally {
            setUser(null);
            setSubscription(null);
        }
    };

    const value = {
        user,
        subscription,
        loading,
        hasActiveSubscription: !!subscription,
        refreshSubscription: () => {
            if (user) return fetchSubscription(user.id);
            return Promise.resolve(null);
        },
        signOut: handleSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
