// ============================================================
// src/components/ProductCustomizer.jsx — Modal de personalización
// Galería de imágenes con lightbox + carrito y pedido directo
// Colores configurables por producto + fix guardado de pedidos
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { FILAMENT_COLORS, WHATSAPP_NEGOCIO } from '../config'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import './ProductCustomizer.css'

export default function ProductCustomizer({ producto, onClose }) {
    const { user, profile } = useAuth()
    const { addItem } = useCart()
    const navigate = useNavigate()

    // Determinar colores disponibles para este producto
    const coloresDisponibles = (() => {
        const disponibles = producto.colores_disponibles
        const extra = Array.isArray(producto.colores_extra) ? producto.colores_extra : []

        let base
        if (Array.isArray(disponibles) && disponibles.length > 0) {
            // Solo los colores estándar seleccionados por el admin
            base = FILAMENT_COLORS.filter(c => disponibles.includes(c.hex))
        } else if (disponibles === null || disponibles === undefined) {
            // Todos los colores globales
            base = FILAMENT_COLORS
        } else {
            // Array vacío → sin colores (a menos que haya extras)
            base = []
        }

        // Mezclar con colores personalizados (evitar duplicados por hex)
        const baseHexes = new Set(base.map(c => c.hex.toLowerCase()))
        const extraFiltrados = extra.filter(c => !baseHexes.has(c.hex.toLowerCase()))
        return [...base, ...extraFiltrados]
    })()

    const sinColores = coloresDisponibles.length === 0

    // Construir array de imágenes (imagenes[] + imagen_url como fallback)
    const allImages = (() => {
        const imgs = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
            ? producto.imagenes
            : producto.imagen_url ? [producto.imagen_url] : []
        return imgs
    })()

    const [imgIndex, setImgIndex] = useState(0)
    const [lightbox, setLightbox] = useState(false)
    const [colorElegido, setColorElegido] = useState(coloresDisponibles[0] || null)
    const [mensaje, setMensaje] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState(false)

    const prevImg = (e) => { e?.stopPropagation(); setImgIndex(i => (i - 1 + allImages.length) % allImages.length) }
    const nextImg = (e) => { e?.stopPropagation(); setImgIndex(i => (i + 1) % allImages.length) }

    // ── AGREGAR AL CARRITO ──
    const handleAgregarCarrito = () => {
        if (sinColores) return
        addItem({ producto, color: colorElegido, cantidad, mensaje })
        setToast(true)
        setTimeout(() => { setToast(false); onClose() }, 1200)
    }

    // ── ENVIAR PEDIDO DIRECTO ──
    const handleEnviarDirecto = async () => {
        if (sinColores) return
        setError('')
        setEnviando(true)
        try {
            const clienteNombre = profile?.nombre ||
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                'Cliente'
            const clienteWA = profile?.whatsapp || user?.user_metadata?.whatsapp || '(no registrado)'

            // ── 1. Guardar en Supabase PRIMERO ──
            const pedidoData = {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                color_elegido: `${colorElegido.name} (${colorElegido.hex})`,
                mensaje: mensaje.trim(),
                cantidad,
                estado: 'pendiente',
                fecha: new Date().toISOString(),
            }
            if (user) pedidoData.cliente_id = user.id
            await supabase.from('pedidos').insert(pedidoData)

            // ── 2. Construir y abrir WhatsApp DESPUÉS ──
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

            onClose()
            navigate('/confirmacion')
            window.location.href = waUrl
        } catch (err) {
            console.error(err)
            setError('Error al enviar el pedido. Intentá de nuevo.')
            setEnviando(false)
        }
    }

    return (
        <>
            <div className="overlay" onClick={onClose} />

            {/* ── Lightbox ── */}
            {lightbox && allImages.length > 0 && (
                <div className="lightbox" onClick={() => setLightbox(false)}>
                    <button className="lightbox-close" onClick={() => setLightbox(false)}><HiX size={22} /></button>
                    {allImages.length > 1 && (
                        <>
                            <button className="lightbox-arrow lightbox-arrow--left" onClick={prevImg}><HiChevronLeft size={28} /></button>
                            <button className="lightbox-arrow lightbox-arrow--right" onClick={nextImg}><HiChevronRight size={28} /></button>
                        </>
                    )}
                    <img src={allImages[imgIndex]} alt={producto.nombre} className="lightbox-img" onClick={e => e.stopPropagation()} />
                    {allImages.length > 1 && (
                        <p className="lightbox-counter">{imgIndex + 1} / {allImages.length}</p>
                    )}
                </div>
            )}

            <div className="modal customizer-modal" role="dialog" aria-modal="true">
                {toast && <div className="customizer-toast">✅ ¡Agregado al carrito!</div>}

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

                {/* ── Galería de imágenes ── */}
                {allImages.length > 0 ? (
                    <div className="customizer-gallery">
                        {/* Imagen principal */}
                        <div className="customizer-gallery__main" onClick={() => setLightbox(true)} title="Clic para ampliar">
                            <img src={allImages[imgIndex]} alt={producto.nombre} className="customizer-img" />
                            {allImages.length > 1 && (
                                <>
                                    <button className="gallery-arrow gallery-arrow--left" onClick={prevImg}><HiChevronLeft size={20} /></button>
                                    <button className="gallery-arrow gallery-arrow--right" onClick={nextImg}><HiChevronRight size={20} /></button>
                                </>
                            )}
                            <div className="gallery-zoom-hint">🔍 Clic para ampliar</div>
                        </div>
                        {/* Miniaturas */}
                        {allImages.length > 1 && (
                            <div className="customizer-gallery__thumbs">
                                {allImages.map((url, i) => (
                                    <img key={url} src={url} alt={`thumb-${i}`}
                                        className={`gallery-thumb${i === imgIndex ? ' active' : ''}`}
                                        onClick={() => setImgIndex(i)} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="customizer-img-placeholder">📦</div>
                )}

                {/* Selector de color */}
                <div className="customizer-section">
                    <label className="form-label">Color de filamento</label>

                    {sinColores ? (
                        /* ── Sin colores disponibles ── */
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                        }}>
                            <span style={{ fontSize: 22 }}>🚫</span>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
                                    Sin colores disponibles
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    Este producto no tiene stock de filamento en este momento.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="color-grid">
                                {coloresDisponibles.map(color => (
                                    <button
                                        key={color.hex}
                                        className={'color-dot' + (colorElegido?.hex === color.hex ? ' selected' : '')}
                                        style={{ background: color.hex }}
                                        onClick={() => setColorElegido(color)}
                                        title={color.name}
                                        aria-label={color.name}
                                    />
                                ))}
                            </div>
                            <p className="color-label">
                                <span className="color-preview" style={{ background: colorElegido?.hex }} />
                                {colorElegido?.name}
                            </p>
                        </>
                    )}
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
                        disabled={sinColores}
                    />
                </div>

                {/* Cantidad */}
                <div className="customizer-section form-group">
                    <label className="form-label" htmlFor="custom-qty">Cantidad</label>
                    <div className="qty-control">
                        <button className="qty-btn" onClick={() => setCantidad(q => Math.max(1, q - 1))} disabled={sinColores}>−</button>
                        <input
                            id="custom-qty"
                            type="number"
                            className="form-input qty-input"
                            min={1} max={99}
                            value={cantidad}
                            onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={sinColores}
                        />
                        <button className="qty-btn" onClick={() => setCantidad(q => Math.min(99, q + 1))} disabled={sinColores}>+</button>
                    </div>
                </div>

                {/* Total */}
                {!sinColores && (
                    <div className="customizer-total">
                        <span>Total estimado</span>
                        <strong>${(Number(producto.precio) * cantidad).toFixed(2)}</strong>
                    </div>
                )}

                {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

                {/* BOTONES */}
                <div className="customizer-actions">
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleAgregarCarrito}
                        disabled={toast || sinColores}
                    >
                        🛒 Agregar al carrito
                    </button>
                    <button
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                        onClick={handleEnviarDirecto}
                        disabled={enviando || sinColores}
                    >
                        {enviando ? 'Enviando...' : '📲 Enviar directo'}
                    </button>
                </div>

                {!user && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
                        Podés <strong>iniciar sesión</strong> para guardar tu historial de pedidos
                    </p>
                )}
            </div>
        </>
    )
}
