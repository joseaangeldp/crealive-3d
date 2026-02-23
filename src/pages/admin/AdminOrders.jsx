// ============================================================
// src/pages/admin/AdminOrders.jsx — Gestión de pedidos
// Tabla con filtro por estado y dropdown para cambiar estado
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ESTADOS_PEDIDO } from '../../config'

const BADGE = {
    'pendiente': 'badge-pendiente',
    'en producción': 'badge-produccion',
    'entregado': 'badge-entregado',
    'cancelado': 'badge-cancelado',
}

export default function AdminOrders() {
    const [pedidos, setPedidos] = useState([])
    const [filtro, setFiltro] = useState('todos')
    const [loading, setLoading] = useState(true)

    const fetchPedidos = async () => {
        setLoading(true)
        const q = supabase
            .from('pedidos')
            .select(`*, clientes(nombre, email, whatsapp)`)
            .order('fecha', { ascending: false })
        const { data } = filtro === 'todos' ? await q : await q.eq('estado', filtro)
        setPedidos(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchPedidos() }, [filtro])

    const cambiarEstado = async (id, nuevoEstado) => {
        await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p))
    }

    const formatFecha = iso => new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric'
    })

    return (
        <div>
            <h1 className="admin-page-title">Pedidos</h1>

            {/* Filtros */}
            <div className="filter-tabs">
                {['todos', ...ESTADOS_PEDIDO].map(e => (
                    <button key={e} className={'filter-tab' + (filtro === e ? ' active' : '')}
                        onClick={() => setFiltro(e)}>
                        {e.charAt(0).toUpperCase() + e.slice(1)}
                    </button>
                ))}
            </div>

            <div className="table-wrap">
                {loading ? (
                    <div className="spinner" />
                ) : pedidos.length === 0 ? (
                    <div className="empty-state"><div className="icon">📋</div><h3>Sin pedidos</h3></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>WhatsApp</th>
                                <th>Producto</th>
                                <th>Color</th>
                                <th>Cant.</th>
                                <th>Mensaje</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(p => (
                                <tr key={p.id}>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{formatFecha(p.fecha)}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.clientes?.nombre || '—'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.clientes?.email}</div>
                                    </td>
                                    <td style={{ fontSize: '12px' }}>{p.clientes?.whatsapp || '—'}</td>
                                    <td style={{ fontWeight: 500 }}>{p.producto_nombre}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                width: 12, height: 12, borderRadius: '50%',
                                                background: p.color_elegido?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#ccc',
                                                display: 'inline-block', flexShrink: 0,
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }} />
                                            <span style={{ fontSize: '12px' }}>{p.color_elegido?.split(' (')[0]}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{p.cantidad}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: 160 }}>
                                        {p.mensaje || '—'}
                                    </td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={p.estado}
                                            onChange={e => cambiarEstado(p.id, e.target.value)}
                                        >
                                            {ESTADOS_PEDIDO.map(est => (
                                                <option key={est} value={est}>{est}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
