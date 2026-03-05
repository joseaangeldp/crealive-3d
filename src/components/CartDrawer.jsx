// ============================================================
// src/components/CartDrawer.jsx — Panel lateral del carrito
// ============================================================
import { useNavigate } from 'react-router-dom'
import { HiX, HiTrash } from 'react-icons/hi'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { WHATSAPP_NEGOCIO } from '../config'
import { supabase } from '../lib/supabase'
import './CartDrawer.css'

export default function CartDrawer({ onClose }) {
    const { items, removeItem, updateQty, clearCart, itemCount } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    const total = items.reduce((sum, i) => sum + (Number(i.producto?.precio || 0) * i.cantidad), 0)

    const handleEnviarPedido = async () => {
        if (items.length === 0) return

        // ── 1. Construir mensaje de WhatsApp ──
        const clienteNombre = user?.user_metadata?.nombre || 'Cliente'
        const clienteWA = user?.user_metadata?.whatsapp || '(no registrado)'

        const lineasItems = items.map((item, idx) => {
            const lineas = [
                `*${idx + 1}. ${item.producto?.nombre}*`,
                `   🎨 Color: ${item.color?.name}`,
                `   🔢 Cantidad: ${item.cantidad}`,
            ]
            if (item.mensaje?.trim()) lineas.push(`   📝 Nota: ${item.mensaje.trim()}`)
            return lineas.join('\n')
        }).join('\n\n')

        const msg = [
            `🖨️ *Nuevo pedido — Crealive 3D*`,
            ``,
            `👤 *Cliente:* ${clienteNombre}`,
            `📱 *WhatsApp:* ${clienteWA}`,
            ``,
            `📦 *Productos:*`,
            lineasItems,
            ``,
            `💰 *Total: $${total.toFixed(2)}*`,
        ].join('\n')

        const waUrl = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msg)}`

        // ── 2. Abrir WhatsApp ANTES del await ──
        window.location.href = waUrl

        // ── 3. Guardar en Supabase ──
        try {
            // Crear pedido "agrupador"
            const pedidoData = {
                producto_id: items[0].producto?.id,
                producto_nombre: `Pedido múltiple (${items.length} items)`,
                color_elegido: '—',
                cantidad: itemCount,
                estado: 'pendiente',
                fecha: new Date().toISOString(),
            }
            if (user) pedidoData.cliente_id = user.id

            const { data: pedido } = await supabase
                .from('pedidos')
                .insert(pedidoData)
                .select()
                .single()

            // Insertar items individuales si la tabla existe
            if (pedido?.id) {
                const pedidoItems = items.map(item => ({
                    pedido_id: pedido.id,
                    producto_id: item.producto?.id,
                    producto_nombre: item.producto?.nombre,
                    color_elegido: `${item.color?.name} (${item.color?.hex})`,
                    cantidad: item.cantidad,
                    mensaje_especial: item.mensaje?.trim() || null,
                }))
                await supabase.from('pedido_items').insert(pedidoItems)
            }
        } catch (err) {
            console.error('Error guardando pedido:', err)
        }

        clearCart()
        onClose()
        navigate('/confirmacion')
    }

    return (
        <>
            <div className="overlay" onClick={onClose} />
            <aside className="cart-drawer">
                {/* Header */}
                <div className="cart-drawer__header">
                    <h2 className="cart-drawer__title">
                        🛒 Carrito
                        {itemCount > 0 && <span className="cart-drawer__count">{itemCount}</span>}
                    </h2>
                    <button className="cart-drawer__close" onClick={onClose} aria-label="Cerrar">
                        <HiX size={20} />
                    </button>
                </div>

                {/* Items */}
                <div className="cart-drawer__items">
                    {items.length === 0 ? (
                        <div className="cart-drawer__empty">
                            <span>🛍️</span>
                            <p>Tu carrito está vacío</p>
                            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={onClose}>
                                Ver catálogo
                            </button>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div className="cart-item" key={idx}>
                                {item.producto?.imagen_url && (
                                    <img
                                        src={item.producto.imagen_url}
                                        alt={item.producto.nombre}
                                        className="cart-item__img"
                                    />
                                )}
                                <div className="cart-item__info">
                                    <p className="cart-item__name">{item.producto?.nombre}</p>
                                    <div className="cart-item__color">
                                        <span
                                            className="cart-item__color-dot"
                                            style={{ background: item.color?.hex }}
                                        />
                                        <span>{item.color?.name}</span>
                                    </div>
                                    {item.mensaje?.trim() && (
                                        <p className="cart-item__nota">"{item.mensaje.trim()}"</p>
                                    )}
                                    <div className="cart-item__controls">
                                        {/* Cantidad +/- */}
                                        <div className="cart-item__qty">
                                            <button onClick={() => updateQty(idx, item.cantidad - 1)}>−</button>
                                            <span>{item.cantidad}</span>
                                            <button onClick={() => updateQty(idx, item.cantidad + 1)}>+</button>
                                        </div>
                                        {/* Subtotal */}
                                        <span className="cart-item__subtotal">
                                            ${(Number(item.producto?.precio || 0) * item.cantidad).toFixed(2)}
                                        </span>
                                        {/* Eliminar */}
                                        <button
                                            className="cart-item__remove"
                                            onClick={() => removeItem(idx)}
                                            aria-label="Eliminar"
                                        >
                                            <HiTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer con total y botón */}
                {items.length > 0 && (
                    <div className="cart-drawer__footer">
                        <div className="cart-drawer__total">
                            <span>Total estimado</span>
                            <strong>${total.toFixed(2)}</strong>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                            onClick={handleEnviarPedido}
                        >
                            📲 Enviar pedido completo
                        </button>
                        <button
                            className="cart-drawer__clear"
                            onClick={clearCart}
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </aside>
        </>
    )
}
