// ============================================================
// src/pages/ProductDetail.jsx — Página de detalle de producto
// Galería + colores (desde Supabase) + tallas + pedir por WhatsApp
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { HiChevronLeft, HiChevronRight, HiArrowLeft } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { WHATSAPP_NEGOCIO } from '../config'
import './ProductDetail.css'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, profile } = useAuth()

    const [producto, setProducto] = useState(null)
    const [colores, setColores] = useState([])
    const [edicion, setEdicion] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    // Selecciones del usuario
    const [imgIndex, setImgIndex] = useState(0)
    const [colorElegido, setColorElegido] = useState(null)
    const [tallaElegida, setTallaElegida] = useState(null)
    const [cantidad, setCantidad] = useState(1)
    const [mensaje, setMensaje] = useState('')
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            // Cargar producto
            const { data: prod, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !prod) { setNotFound(true); setLoading(false); return }
            setProducto(prod)

            // Cargar colores disponibles
            const { data: globalColors } = await supabase
                .from('filament_colors')
                .select('*')
                .eq('disponible', true)
                .order('orden')

            let coloresBase = []
            const extra = Array.isArray(prod.colores_extra) ? prod.colores_extra : []
            if (prod.colores_disponibles === null || prod.colores_disponibles === undefined) {
                coloresBase = globalColors || []
            } else if (Array.isArray(prod.colores_disponibles) && prod.colores_disponibles.length > 0) {
                coloresBase = (globalColors || []).filter(c => prod.colores_disponibles.includes(c.hex))
            }
            const baseHexes = new Set(coloresBase.map(c => c.hex.toLowerCase()))
            const extraFiltrados = extra.filter(c => !baseHexes.has(c.hex.toLowerCase()))
            const todosColores = [...coloresBase, ...extraFiltrados]
            setColores(todosColores)
            if (todosColores.length > 0) setColorElegido(todosColores[0])

            // Talla inicial
            if (prod.tiene_tallas && Array.isArray(prod.tallas) && prod.tallas.length > 0) {
                setTallaElegida(prod.tallas[0])
            }

            // Buscar edición limitada activa
            try {
                const hoy = new Date().toISOString().split('T')[0]
                const { data: ed } = await supabase
                    .from('ediciones_limitadas')
                    .select('*')
                    .eq('producto_id', id)
                    .eq('activo', true)
                    .lte('fecha_inicio', hoy)
                    .gte('fecha_fin', hoy)
                    .maybeSingle()
                if (ed) setEdicion(ed)
            } catch (_) {}

            setLoading(false)
        }
        load()
    }, [id])

    const allImages = producto
        ? (Array.isArray(producto.imagenes) && producto.imagenes.length > 0
            ? producto.imagenes
            : producto.imagen_url ? [producto.imagen_url] : [])
        : []

    const prevImg = () => setImgIndex(i => (i - 1 + allImages.length) % allImages.length)
    const nextImg = () => setImgIndex(i => (i + 1) % allImages.length)

    const sinColores = colores.length === 0

    const handlePedir = async () => {
        if (sinColores || enviando) return
        setEnviando(true)

        const clienteNombre = profile?.nombre || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cliente'
        const clienteWA = profile?.whatsapp || '(no registrado)'

        // Guardar en Supabase
        try {
            if (user) {
                await supabase.from('clientes').upsert(
                    { id: user.id, nombre: clienteNombre, email: user.email || '', whatsapp: profile?.whatsapp || null, activo: true },
                    { onConflict: 'id', ignoreDuplicates: true }
                )
            }
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
        } catch (_) {}

        const msgLines = [
            `🖨️ *Nuevo pedido — Crealive 3D*`,
            ``,
            `👤 *Cliente:* ${clienteNombre}`,
            `📱 *WhatsApp:* ${clienteWA}`,
            ``,
            `📦 *Producto:* ${producto.nombre}`,
            edicion ? `✨ *Edición:* ${edicion.nombre}` : null,
            `🎨 *Color:* ${colorElegido.name}`,
            tallaElegida ? `👕 *Talla:* ${tallaElegida.nombre}${tallaElegida.medidas ? ` (${tallaElegida.medidas})` : ''}` : null,
            `🔢 *Cantidad:* ${cantidad}`,
            mensaje.trim() ? `📝 *Mensaje:* ${mensaje.trim()}` : null,
        ].filter(Boolean).join('\n')

        const waUrl = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msgLines)}`
        navigate('/confirmacion')
        window.location.href = waUrl
    }

    if (loading) return <div className="spinner" style={{ marginTop: 80 }} />
    if (notFound) return (
        <main className="product-detail-container">
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <p style={{ fontSize: 48 }}>🔍</p>
                <h2>Producto no encontrado</h2>
                <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 20 }}>Ver catálogo</Link>
            </div>
        </main>
    )

    const talaExtra = tallaElegida?.precio_extra || 0
    const precioTotal = ((Number(producto.precio) + talaExtra) * cantidad).toFixed(2)

    return (
        <main className="product-detail-container">
            {/* Breadcrumb */}
            <div className="product-detail-breadcrumb">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <HiArrowLeft size={16} /> Volver
                </button>
                <span className="breadcrumb-sep">›</span>
                <Link to="/catalogo">Catálogo</Link>
                <span className="breadcrumb-sep">›</span>
                <span>{producto.nombre}</span>
            </div>

            <div className="product-detail-grid">
                {/* ── GALERÍA ── */}
                <div className="product-detail-gallery">
                    <div className="gallery-main">
                        {allImages.length > 0 ? (
                            <>
                                <img
                                    src={allImages[imgIndex]}
                                    alt={producto.nombre}
                                    className="gallery-main-img"
                                />
                                {allImages.length > 1 && (
                                    <>
                                        <button className="gallery-nav gallery-nav--left" onClick={prevImg}>
                                            <HiChevronLeft size={22} />
                                        </button>
                                        <button className="gallery-nav gallery-nav--right" onClick={nextImg}>
                                            <HiChevronRight size={22} />
                                        </button>
                                        <span className="gallery-counter">{imgIndex + 1}/{allImages.length}</span>
                                    </>
                                )}
                                {edicion && (
                                    <div className="limited-badge">✨ Ed. Limitada</div>
                                )}
                            </>
                        ) : (
                            <div className="gallery-placeholder">📦</div>
                        )}
                    </div>
                    {allImages.length > 1 && (
                        <div className="gallery-thumbs">
                            {allImages.map((url, i) => (
                                <button
                                    key={url}
                                    onClick={() => setImgIndex(i)}
                                    className={`gallery-thumb-btn${i === imgIndex ? ' active' : ''}`}
                                >
                                    <img src={url} alt={`thumb-${i}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── INFO + COMPRA ── */}
                <div className="product-detail-info">
                    {edicion && (
                        <div className="edition-banner">
                            <span>✨</span>
                            <div>
                                <strong>{edicion.nombre}</strong>
                                {edicion.descripcion && <p>{edicion.descripcion}</p>}
                                {edicion.stock > 0 && <p className="edition-stock">Stock limitado: {edicion.stock} unidades</p>}
                            </div>
                        </div>
                    )}

                    {producto.categoria && (
                        <span className="product-category-badge">{producto.categoria}</span>
                    )}
                    <h1 className="product-detail-name">{producto.nombre}</h1>
                    <p className="product-detail-price">
                        ${Number(producto.precio).toFixed(2)}
                        {talaExtra > 0 && <span className="price-extra"> +${talaExtra} (talla)</span>}
                    </p>

                    {producto.descripcion && (
                        <p className="product-detail-desc">{producto.descripcion}</p>
                    )}

                    {/* ── SELECTOR DE COLOR ── */}
                    <div className="detail-section">
                        <label className="detail-label">Color de filamento</label>
                        {sinColores ? (
                            <div className="no-stock-banner">
                                🚫 Sin stock de filamento disponible
                            </div>
                        ) : (
                            <>
                                <div className="color-selector">
                                    {colores.map(color => (
                                        <button
                                            key={color.hex}
                                            title={color.name}
                                            onClick={() => setColorElegido(color)}
                                            className={`color-swatch${colorElegido?.hex === color.hex ? ' selected' : ''}`}
                                            style={{ background: color.hex }}
                                        />
                                    ))}
                                </div>
                                {colorElegido && (
                                    <p className="color-name-label">
                                        <span className="color-dot-preview" style={{ background: colorElegido.hex }} />
                                        {colorElegido.name}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Colores exclusivos de edición */}
                    {edicion && Array.isArray(edicion.colores_exclusivos) && edicion.colores_exclusivos.length > 0 && (
                        <div className="detail-section">
                            <label className="detail-label">✨ Colores exclusivos de esta edición</label>
                            <div className="color-selector">
                                {edicion.colores_exclusivos.map(c => (
                                    <button
                                        key={c.hex}
                                        title={c.name}
                                        onClick={() => setColorElegido(c)}
                                        className={`color-swatch edition-swatch${colorElegido?.hex === c.hex ? ' selected' : ''}`}
                                        style={{ background: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── SELECTOR DE TALLA ── */}
                    {producto.tiene_tallas && Array.isArray(producto.tallas) && producto.tallas.length > 0 && (
                        <div className="detail-section">
                            <label className="detail-label">Talla</label>
                            <div className="size-selector">
                                {producto.tallas.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setTallaElegida(t)}
                                        className={`size-btn${tallaElegida?.nombre === t.nombre ? ' selected' : ''}`}
                                    >
                                        <span className="size-name">{t.nombre}</span>
                                        {t.medidas && <span className="size-medidas">{t.medidas}</span>}
                                        {t.precio_extra > 0 && <span className="size-extra">+${t.precio_extra}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── CANTIDAD ── */}
                    <div className="detail-section">
                        <label className="detail-label">Cantidad</label>
                        <div className="qty-row">
                            <button className="qty-btn" onClick={() => setCantidad(q => Math.max(1, q - 1))}>−</button>
                            <input
                                type="number" min={1} max={99}
                                value={cantidad}
                                onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                className="qty-input"
                            />
                            <button className="qty-btn" onClick={() => setCantidad(q => Math.min(99, q + 1))}>+</button>
                        </div>
                    </div>

                    {/* ── MENSAJE ── */}
                    <div className="detail-section">
                        <label className="detail-label">Mensaje o instrucciones (opcional)</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Ej: Con el nombre 'Ana', en letras grandes..."
                            value={mensaje}
                            onChange={e => setMensaje(e.target.value)}
                            style={{ resize: 'vertical', fontSize: 14 }}
                            disabled={sinColores}
                        />
                    </div>

                    {/* Total */}
                    {!sinColores && (
                        <div className="detail-total">
                            <span>Total estimado</span>
                            <strong>${precioTotal}</strong>
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-pedir"
                        onClick={handlePedir}
                        disabled={sinColores || enviando}
                    >
                        {enviando ? 'Redirigiendo...' : '📲 Pedir por WhatsApp'}
                    </button>

                    {!user && (
                        <p className="login-hint">
                            <Link to="/login">Iniciá sesión</Link> para guardar tu historial de pedidos.
                        </p>
                    )}
                </div>
            </div>
        </main>
    )
}
