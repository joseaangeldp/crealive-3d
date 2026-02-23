// ============================================================
// src/components/ProductCustomizer.jsx — Modal de personalización
// Incluye selector de colores, mensaje, cantidad, y envío de pedido
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiX } from 'react-icons/hi'
import { FILAMENT_COLORS, WHATSAPP_NEGOCIO } from '../config'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './ProductCustomizer.css'

export default function ProductCustomizer({ producto, onClose }) {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [colorElegido, setColorElegido] = useState(FILAMENT_COLORS[0])
    const [mensaje, setMensaje] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState('')

    const handleEnviar = async () => {
        setError('')
        setEnviando(true)

        try {
            // ── Paso 1: Guardar pedido en Supabase ──
            const pedidoData = {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                color_elegido: `${colorElegido.name} (${colorElegido.hex})`,
                mensaje: mensaje.trim(),
                cantidad,
                estado: 'pendiente',
                fecha: new Date().toISOString(),
            }

            // Solo incluir cliente_id si el usuario está logueado
            if (user) {
                pedidoData.cliente_id = user.id
            }

            await supabase.from('pedidos').insert(pedidoData)

            // ── Paso 2: Construir mensaje de WhatsApp ──
            const clienteNombre = user?.user_metadata?.nombre || 'Cliente'
            const clienteWA = user?.user_metadata?.whatsapp || '(no registrado)'
            const msgLines = [
                `🖨️ *Nuevo pedido — Crealive 3D*`,
                ``,
                `👤 *Cliente:* ${clienteNombre}`,
                `📱 *WhatsApp:* ${clienteWA}`,
                ``,
                `📦 *Producto:* ${producto.nombre}`,
                `🎨 *Color:* ${colorElegido.name}`,
                `🔢 *Cantidad:* ${cantidad}`,
                mensaje.trim() ? `📝 *Mensaje:* ${mensaje.trim()}` : null,
            ].filter(Boolean).join('\n')

            const waUrl = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msgLines)}`

            // ── Paso 3: Abrir WhatsApp y navegar a confirmación ──
            window.open(waUrl, '_blank', 'noopener,noreferrer')
            onClose()
            navigate('/confirmacion')
        } catch (err) {
            console.error(err)
            setError('Error al enviar el pedido. Intentá de nuevo.')
            setEnviando(false)
        }
    }

    return (
        <>
            <div className="overlay" onClick={onClose} />
            <div className="modal customizer-modal" role="dialog" aria-modal="true">
                {/* Encabezado */}
                <div className="customizer-header">
                    <div>
                        <span className="customizer-subtitle">Personalizar</span>
                        <h2 className="customizer-title">{producto.nombre}</h2>
                    </div>
                    <button className="customizer-close" onClick={onClose} aria-label="Cerrar">
                        <HiX size={20} />
                    </button>
                </div>

                <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="customizer-img"
                />

                {/* Selector de color */}
                <div className="customizer-section">
                    <label className="form-label">Color de filamento</label>
                    <div className="color-grid">
                        {FILAMENT_COLORS.map(color => (
                            <button
                                key={color.hex}
                                className={'color-dot' + (colorElegido.hex === color.hex ? ' selected' : '')}
                                style={{ background: color.hex }}
                                onClick={() => setColorElegido(color)}
                                title={color.name}
                                aria-label={color.name}
                            />
                        ))}
                    </div>
                    <p className="color-label">
                        <span className="color-preview" style={{ background: colorElegido.hex }} />
                        {colorElegido.name}
                    </p>
                </div>

                {/* Instrucciones */}
                <div className="customizer-section form-group">
                    <label className="form-label" htmlFor="custom-msg">Mensaje o instrucciones especiales</label>
                    <textarea
                        id="custom-msg"
                        className="form-input"
                        rows={3}
                        placeholder="Ej: Poner el nombre 'Ana' con letras grandes"
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {/* Cantidad */}
                <div className="customizer-section form-group">
                    <label className="form-label" htmlFor="custom-qty">Cantidad</label>
                    <div className="qty-control">
                        <button className="qty-btn" onClick={() => setCantidad(q => Math.max(1, q - 1))}>−</button>
                        <input
                            id="custom-qty"
                            type="number"
                            className="form-input qty-input"
                            min={1}
                            max={99}
                            value={cantidad}
                            onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <button className="qty-btn" onClick={() => setCantidad(q => Math.min(99, q + 1))}>+</button>
                    </div>
                </div>

                {/* Total */}
                <div className="customizer-total">
                    <span>Total estimado</span>
                    <strong>${(Number(producto.precio) * cantidad).toFixed(2)}</strong>
                </div>

                {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                    onClick={handleEnviar}
                    disabled={enviando}
                >
                    {enviando ? 'Enviando...' : '📲 Enviar pedido por WhatsApp'}
                </button>

                {!user && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
                        Podés <strong>iniciar sesión</strong> para guardar tu historial de pedidos
                    </p>
                )}
            </div>
        </>
    )
}
