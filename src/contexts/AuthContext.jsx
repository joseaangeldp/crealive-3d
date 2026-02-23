// ============================================================
// src/contexts/AuthContext.jsx — Contexto global de autenticación
// Crealive 3D — Usa Supabase Auth
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Escuchar cambios de sesión
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Registro: crea cuenta en Auth + fila en tabla clientes
    const register = async ({ nombre, email, whatsapp, password }) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
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

        return data
    }

    // Login
    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    // Logout
    const logout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, register, login, logout }}>
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
