// ============================================================
// src/pages/admin/AdminOrders.jsx — Gestión de pedidos
// Ahora incluye modal de detalle con pedido_items
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ESTADOS_PEDIDO, RESEND_API_KEY } from '../../config'

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
    const [pedidoDetalle, setPedidoDetalle] = useState(null)
    const [itemsDetalle, setItemsDetalle] = useState([])
    const [loadingItems, setLoadingItems] = useState(false)

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

        // Enviar email al cliente si el estado avanzó
        if (nuevoEstado === 'en producción' || nuevoEstado === 'entregado') {
            try {
                const pedido = pedidos.find(p => p.id === id)
                const email = pedido?.clientes?.email
                const nombre = pedido?.clientes?.nombre || 'Cliente'
                if (!email || !RESEND_API_KEY || RESEND_API_KEY === 're_xxxxxxxxxx') return

                const statusLink = `${window.location.origin}/pedido/${id}`
                const emoji = nuevoEstado === 'entregado' ? '🎉' : '⚙️'
                const titulo = nuevoEstado === 'entregado'
                    ? '¡Tu pedido fue entregado!'
                    : 'Tu pedido está en producción'
                const desc = nuevoEstado === 'entregado'
                    ? 'Ya está listo y en camino. ¡Esperamos que lo disfrutes!'
                    : 'Estamos fabricando tu pieza con mucho amor. Pronto estará lista.'

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Crealive 3D <noreply@crealive3d.com>',
                        to: [email],
                        subject: `${emoji} ${titulo} — Crealive 3D`,
                        html: `
                            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAFAF8;border-radius:16px">
                                <h1 style="font-family:Georgia,serif;color:#C4768A;font-size:26px;margin-bottom:4px">Crealive 3D</h1>
                                <p style="color:#7a7a7a;font-size:13px;margin-bottom:28px">Impresión 3D personalizada</p>
                                <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #EDEDEA;text-align:center">
                                    <div style="font-size:48px;margin-bottom:16px">${emoji}</div>
                                    <h2 style="color:#2E2E2E;font-size:22px;margin-bottom:10px">${titulo}</h2>
                                    <p style="color:#555;line-height:1.6;margin-bottom:24px">Hola ${nombre}, ${desc}</p>
                                    <a href="${statusLink}" style="display:inline-block;background:#C4768A;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:700;font-size:15px">
                                        Ver estado de mi pedido
                                    </a>
                                </div>
                                <p style="font-size:12px;color:#aaa;margin-top:24px;text-align:center">
                                    Recibís este email porque realizaste un pedido en Crealive 3D.
                                </p>
                            </div>
                        `,
                    }),
                })
            } catch (_) { /* Si falla el email, no interrumpe el flujo */ }
        }
    }

    const abrirDetalle = async (pedido) => {
        setPedidoDetalle(pedido)
        setItemsDetalle([])
        setLoadingItems(true)
        const { data } = await supabase
            .from('pedido_items')
            .select('*')
            .eq('pedido_id', pedido.id)
        setItemsDetalle(data || [])
        setLoadingItems(false)
    }

    const eliminarPedido = async (pedido) => {
        const cliente = pedido.clientes?.nombre || 'este pedido'
        if (!window.confirm(`¿Eliminar ${cliente} — ${pedido.producto_nombre}? Esta acción no se puede deshacer.`)) return
        // Borrar items primero (FK constraint)
        await supabase.from('pedido_items').delete().eq('pedido_id', pedido.id)
        await supabase.from('pedidos').delete().eq('id', pedido.id)
        setPedidos(prev => prev.filter(p => p.id !== pedido.id))
    }

    const formatFecha = iso => new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric'
    })

    const copyLink = (id) => {
        const url = `${window.location.origin}/pedido/${id}`
        navigator.clipboard.writeText(url).then(() => {
            alert('\u00a1Link copiado! Mandáselo al cliente por WhatsApp.')
        })
    }

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
                                <th>Detalle</th>
                                <th>Eliminar</th>
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
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => abrirDetalle(p)}
                                                style={{
                                                    fontSize: '12px', color: 'var(--color-wine)',
                                                    fontWeight: 600, textDecoration: 'underline',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontFamily: 'var(--font-body)',
                                                }}
                                            >
                                                Ver items
                                            </button>
                                            <button
                                                onClick={() => copyLink(p.id)}
                                                title="Copiar link del pedido para el cliente"
                                                style={{
                                                    fontSize: '12px', color: '#0c5460',
                                                    fontWeight: 600,
                                                    background: '#d1ecf1', border: 'none', cursor: 'pointer',
                                                    fontFamily: 'var(--font-body)',
                                                    borderRadius: 6, padding: '4px 8px',
                                                }}
                                            >
                                                🔗 Link
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => eliminarPedido(p)}
                                            title="Eliminar pedido"
                                            style={{
                                                fontSize: '13px', color: '#EF4444',
                                                background: '#FEF2F2', border: '1px solid #FECACA',
                                                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                                                fontFamily: 'var(--font-body)', fontWeight: 600,
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de detalle del pedido */}
            {pedidoDetalle && (
                <>
                    <div
                        className="overlay"
                        onClick={() => setPedidoDetalle(null)}
                        style={{ zIndex: 500 }}
                    />
                    <div className="modal" style={{ zIndex: 501, maxWidth: 560 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Detalle del pedido
                                </p>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
                                    {pedidoDetalle.clientes?.nombre || 'Cliente invitado'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setPedidoDetalle(null)}
                                style={{ fontSize: 20, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >✕</button>
                        </div>

                        {loadingItems ? (
                            <div className="spinner" />
                        ) : itemsDetalle.length === 0 ? (
                            <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                                    Este pedido no tiene items detallados (fue enviado directamente).
                                </p>
                                <div style={{ marginTop: 16, padding: 16, background: 'var(--color-surface-2)', borderRadius: 12 }}>
                                    <p style={{ fontWeight: 600 }}>{pedidoDetalle.producto_nombre}</p>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                        Color: {pedidoDetalle.color_elegido} · Cant: {pedidoDetalle.cantidad}
                                    </p>
                                    {pedidoDetalle.mensaje && (
                                        <p style={{ fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>"{pedidoDetalle.mensaje}"</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {itemsDetalle.map((item, i) => (
                                    <div key={item.id} style={{
                                        padding: '14px 16px',
                                        background: 'var(--color-surface-2)',
                                        borderRadius: 12,
                                        border: '1px solid var(--color-border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 13 }}>
                                                #{i + 1}
                                            </span>
                                            <strong style={{ flex: 1 }}>{item.producto_nombre}</strong>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>×{item.cantidad}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                            <span style={{
                                                width: 14, height: 14, borderRadius: '50%',
                                                background: item.color_elegido?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#ccc',
                                                border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
                                            }} />
                                            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                {item.color_elegido?.split(' (')[0]}
                                            </span>
                                        </div>
                                        {item.mensaje_especial && (
                                            <p style={{ fontSize: 12, marginTop: 6, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                📝 "{item.mensaje_especial}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
