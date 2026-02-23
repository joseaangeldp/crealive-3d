// ============================================================
// src/pages/Profile.jsx — Perfil de cliente con historial de pedidos
// ============================================================
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './Profile.css'

const ESTADO_CLASS = {
    'pendiente': 'badge-pendiente',
    'en producción': 'badge-produccion',
    'entregado': 'badge-entregado',
    'cancelado': 'badge-cancelado',
}

export default function Profile() {
    const { user, logout } = useAuth()
    const [pedidos, setPedidos] = useState([])
    const [cliente, setCliente] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        Promise.all([
            supabase.from('clientes').select('*').eq('id', user.id).single(),
            supabase.from('pedidos').select('*').eq('cliente_id', user.id).order('fecha', { ascending: false }),
        ]).then(([{ data: c }, { data: p }]) => {
            setCliente(c)
            setPedidos(p || [])
            setLoading(false)
        })
    }, [user])

    if (loading) return <div className="spinner" style={{ marginTop: '80px' }} />

    return (
        <main className="container section">
            {/* Encabezado de perfil */}
            <div className="profile-header card">
                <div className="profile-avatar">{(cliente?.nombre || user.email)[0].toUpperCase()}</div>
                <div className="profile-info">
                    <h2>{cliente?.nombre || 'Usuario'}</h2>
                    <p>{user.email}</p>
                    {cliente?.whatsapp && <p>📱 {cliente.whatsapp}</p>}
                </div>
                <button className="btn btn-outline profile-logout" onClick={logout}>Cerrar sesión</button>
            </div>

            {/* Historial de pedidos */}
            <h2 className="profile-section-title">Mis pedidos</h2>

            {pedidos.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📦</div>
                    <h3>Aún no tenés pedidos</h3>
                    <p>Explorá el catálogo y hacé tu primer pedido</p>
                </div>
            ) : (
                <div className="pedidos-list">
                    {pedidos.map(p => (
                        <div key={p.id} className="pedido-card card">
                            <div className="pedido-top">
                                <div>
                                    <h3 className="pedido-nombre">{p.producto_nombre}</h3>
                                    <span className={`badge ${ESTADO_CLASS[p.estado] || 'badge-pendiente'}`}>{p.estado}</span>
                                </div>
                                <span className="pedido-fecha">
                                    {new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="pedido-details">
                                <span>🎨 {p.color_elegido}</span>
                                <span>🔢 Cantidad: {p.cantidad}</span>
                                {p.mensaje && <span>📝 {p.mensaje}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
