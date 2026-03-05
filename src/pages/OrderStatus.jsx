// ============================================================
// src/pages/OrderStatus.jsx — Estado público del pedido (sin login)
// Accesible via /pedido/:id
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './OrderStatus.css'

const ESTADOS = ['pendiente', 'en producción', 'entregado']
const ESTADO_ICONS = { 'pendiente': '🕐', 'en producción': '⚙️', 'entregado': '✅' }
const ESTADO_DESC = {
    'pendiente': 'Recibimos tu pedido y lo estamos revisando',
    'en producción': '¡Estamos fabricando tu pieza! Ya va a estar lista pronto',
    'entregado': '¡Tu pedido fue entregado! Esperamos que lo disfrutes 🎉',
    'cancelado': 'Este pedido fue cancelado. Escribinos por WhatsApp si tenés dudas.',
}

export default function OrderStatus() {
    const { id } = useParams()
    const [pedido, setPedido] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*, clientes(nombre)')
                    .eq('id', id)
                    .single()

                if (error || !data) { setNotFound(true); setLoading(false); return }
                setPedido(data)

                const { data: itemsData } = await supabase
                    .from('pedido_items')
                    .select('*')
                    .eq('pedido_id', id)
                setItems(itemsData || [])
            } catch (_) {
                setNotFound(true)
            }
            setLoading(false)
        }
        load()
    }, [id])

    const formatFecha = iso => new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric'
    })

    const activeStep = pedido ? ESTADOS.indexOf(pedido.estado) : -1

    if (loading) return <div className="spinner" style={{ marginTop: 100 }} />

    if (notFound) return (
        <main className="order-status-page">
            <div className="container">
                <div className="order-not-found">
                    <span>🔍</span>
                    <h2>Pedido no encontrado</h2>
                    <p>El link que usaste no corresponde a ningún pedido. ¿Buscás algo más?</p>
                    <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
                </div>
            </div>
        </main>
    )

    return (
        <main className="order-status-page">
            <div className="container">
                <div className="order-status-card card">
                    {/* Header */}
                    <div className="order-status-header">
                        <span className="order-status-icon">{ESTADO_ICONS[pedido.estado] || '📦'}</span>
                        <div>
                            <p className="order-status-label">Estado de pedido</p>
                            <h1>{pedido.clientes?.nombre || 'Cliente'}</h1>
                            {pedido.fecha && (
                                <p className="order-status-date">Pedido el {formatFecha(pedido.fecha)}</p>
                            )}
                        </div>
                    </div>

                    {/* Descripción del estado actual */}
                    <div className={`order-status-message order-status-message--${pedido.estado?.replace(' ', '-')}`}>
                        {ESTADO_DESC[pedido.estado] || pedido.estado}
                    </div>

                    {/* Timeline */}
                    {pedido.estado !== 'cancelado' && (
                        <div className="order-timeline">
                            {ESTADOS.map((est, i) => (
                                <div key={est} className={`timeline-step ${i <= activeStep ? 'done' : ''} ${i === activeStep ? 'current' : ''}`}>
                                    <div className="timeline-dot">
                                        {i < activeStep ? '✓' : i === activeStep ? ESTADO_ICONS[est] : ''}
                                    </div>
                                    {i < ESTADOS.length - 1 && (
                                        <div className={`timeline-line ${i < activeStep ? 'done' : ''}`} />
                                    )}
                                    <span className="timeline-label">{est.charAt(0).toUpperCase() + est.slice(1)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Items del pedido */}
                    <div className="order-items-section">
                        <h3>Tu pedido</h3>
                        {items.length > 0 ? (
                            <div className="order-items-list">
                                {items.map((item, i) => (
                                    <div key={item.id || i} className="order-item-row">
                                        <div className="order-item-info">
                                            <strong>{item.producto_nombre}</strong>
                                            {item.mensaje_especial && (
                                                <p className="order-item-msg">📝 "{item.mensaje_especial}"</p>
                                            )}
                                        </div>
                                        <div className="order-item-meta">
                                            {item.color_elegido && (
                                                <span
                                                    className="order-item-color"
                                                    style={{ background: item.color_elegido?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#ccc' }}
                                                    title={item.color_elegido?.split(' (')[0]}
                                                />
                                            )}
                                            <span className="order-item-qty">×{item.cantidad}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="order-item-row">
                                <div className="order-item-info">
                                    <strong>{pedido.producto_nombre}</strong>
                                    {pedido.mensaje && <p className="order-item-msg">📝 "{pedido.mensaje}"</p>}
                                </div>
                                <div className="order-item-meta">
                                    {pedido.color_elegido && (
                                        <span
                                            className="order-item-color"
                                            style={{ background: pedido.color_elegido?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#ccc' }}
                                            title={pedido.color_elegido?.split(' (')[0]}
                                        />
                                    )}
                                    <span className="order-item-qty">×{pedido.cantidad}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="order-status-footer">
                        <p>¿Tenés alguna duda sobre tu pedido?</p>
                        <a
                            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NEGOCIO || '584246049228'}?text=${encodeURIComponent(`Hola! Quiero consultar sobre mi pedido #${id}`)}`}
                            className="btn btn-primary"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            💬 Escribinos por WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </main>
    )
}
