// ============================================================
// src/contexts/AuthContext.jsx — Contexto global de autenticación
// Crealive 3D — Supabase Auth (email/password y Google OAuth)
//
// El perfil en la tabla clientes lo crea un trigger server-side
// (handle_new_user) al registrarse; el frontend solo lo lee.
// El rol admin vive en user_roles y se lee aquí una vez por sesión.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    // Cargar perfil (tabla clientes) y rol (tabla user_roles)
    const fetchProfile = async (userId) => {
        if (!userId) { setProfile(null); setIsAdmin(false); return }
        const [{ data: perfil }, { data: rol }] = await Promise.all([
            supabase.from('clientes').select('nombre, email, whatsapp').eq('id', userId).single(),
            supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        ])
        setProfile(perfil || null)
        setIsAdmin(rol?.role === 'admin')
    }

    useEffect(() => {
        // Sesión inicial
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                try {
                    await fetchProfile(session.user.id)
                } catch (e) {
                    console.warn('Error cargando perfil:', e)
                }
            }
            setLoading(false)
        }).catch(() => setLoading(false))

        // Cambios de sesión (incluye el redirect de Google)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                // Sin await: llamadas a supabase dentro del callback de
                // onAuthStateChange pueden bloquear el lock interno de auth.
                fetchProfile(session.user.id).catch(e => console.warn('Error en auth state change:', e))
            } else {
                setProfile(null)
                setIsAdmin(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Registro con email/password.
    // nombre y whatsapp viajan en metadata; el trigger handle_new_user
    // crea la fila en clientes (funciona aunque falte confirmar el email).
    const register = async ({ nombre, email, whatsapp, password }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, whatsapp },
            },
        })
        if (error) throw error
        if (data.session) await fetchProfile(data.user.id)
        return data
    }

    // Login con email/password
    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    // Login con Google (llama desde Login.jsx / Register.jsx)
    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
        if (error) throw error
    }

    // Logout
    const logout = async () => {
        await supabase.auth.signOut()
        setProfile(null)
        setIsAdmin(false)
    }

    return (
        <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, register, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook de acceso rápido
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
    return ctx
}
