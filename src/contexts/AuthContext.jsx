// ============================================================
// src/contexts/AuthContext.jsx — Contexto global de autenticación
// Crealive 3D — Usa Supabase Auth + tabla clientes para perfil
// Soporta email/password Y Google OAuth
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // Cargar perfil desde la tabla clientes
    const fetchProfile = async (userId) => {
        if (!userId) { setProfile(null); return }
        const { data } = await supabase
            .from('clientes')
            .select('nombre, email, whatsapp')
            .eq('id', userId)
            .single()
        setProfile(data || null)
    }

    // Crear/actualizar fila en clientes si viene de Google o es usuario nuevo
    const upsertClienteGoogle = async (user) => {
        if (!user) return
        const provider = user.app_metadata?.provider
        if (provider !== 'google') return

        // Datos del perfil de Google
        const nombre = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const email = user.email || ''
        const avatarUrl = user.user_metadata?.avatar_url || null

        // Upsert: crea la fila si no existe, la actualiza si ya existe
        await supabase.from('clientes').upsert(
            {
                id: user.id,
                nombre,
                email,
                whatsapp: null,
                activo: true,
                fecha_registro: new Date().toISOString(),
                avatar_url: avatarUrl,
            },
            { onConflict: 'id', ignoreDuplicates: false }
        )
    }

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                try {
                    await upsertClienteGoogle(session.user)
                    await fetchProfile(session.user.id)
                } catch (e) {
                    console.warn('Error cargando perfil:', e)
                }
            }
            setLoading(false)
        }).catch(() => setLoading(false))

        // Escuchar cambios de sesión (incluye el redirect de Google)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                try {
                    if (_event === 'SIGNED_IN') {
                        await upsertClienteGoogle(session.user)
                    }
                    await fetchProfile(session.user.id)
                } catch (e) {
                    console.warn('Error en auth state change:', e)
                }
            } else {
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Registro con email/password
    const register = async ({ nombre, email, whatsapp, password }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, whatsapp },
            },
        })
        if (error) throw error

        // Insertar en tabla clientes
        await supabase.from('clientes').insert({
            id: data.user.id,
            nombre,
            email,
            whatsapp,
            activo: true,
            fecha_registro: new Date().toISOString(),
        })

        await fetchProfile(data.user.id)
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
    }

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, register, login, loginWithGoogle, logout }}>
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
