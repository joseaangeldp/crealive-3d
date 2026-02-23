// ============================================================
// src/components/ProtectedRoute.jsx — Ruta protegida para clientes
// ============================================================
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return <div className="spinner" />
    if (!user) return <Navigate to="/login" replace />

    return children
}
