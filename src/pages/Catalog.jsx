// ============================================================
// src/pages/Catalog.jsx — Catálogo de productos con filtros y personalizador
// Incluye modal de "Diseño desde cero" con envío por WhatsApp
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS as CATEGORIAS_FALLBACK, WHATSAPP_NEGOCIO, FILAMENT_COLORS } from '../config'
import ProductCard from '../components/ProductCard'
import ProductCustomizer from '../components/ProductCustomizer'
import './Catalog.css'

// Productos de demo (se usan si Supabase no está configurado)
const DEMO_PRODUCTOS = [
    { id: '1', nombre: 'Organizador Modular', categoria: 'Porta objetos / Organizadores', descripcion: 'Perfecto para escritorios y mesas de trabajo', precio: 12.99, imagen_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', activo: true },
    { id: '2', nombre: 'Maceta Geométrica', categoria: 'Macetas / Decoración hogar', descripcion: 'Diseño minimalista para plantas pequeñas', precio: 9.99, imagen_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', activo: true },
    { id: '3', nombre: 'Llavero Personalizado', categoria: 'Llaveros / Accesorios', descripcion: 'Con tu nombre o iniciales', precio: 5.99, imagen_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&q=80', activo: true },
    { id: '4', nombre: 'Retrato en Relieve', categoria: 'Retratos personalizados', descripcion: 'Tu foto convertida en escultura 3D', precio: 24.99, imagen_url: 'https://images.unsplash.com/photo-1609770231080-e321deccc34c?w=400&q=80', activo: true },
    { id: '5', nombre: 'Porta Celular', categoria: 'Porta objetos / Organizadores', descripcion: 'Soporte elegante para tu escritorio', precio: 8.99, imagen_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80', activo: true },
    { id: '6', nombre: 'Maceta Colgante', categoria: 'Macetas / Decoración hogar', descripcion: 'Con sistema de colgado incluido', precio: 11.99, imagen_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&q=80', activo: true },
]

const EMPTY_CUSTOM = { nombre: '', descripcion: '', colores: '', referencia: '', cantidad: '1' }

function CustomOrderModal({ onClose }) {
    const [form, setForm] = useState(EMPTY_CUSTOM)
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSend = e => {
        e.preventDefault()
        const msg =
            `🎨 *PEDIDO A MEDIDA — Crealive 3D*\n\n` +
            `👤 *Nombre:* ${form.nombre}\n` +
            `📝 *Descripción de la pieza:*\n${form.descripcion}\n` +
            `🎨 *Colores preferidos:* ${form.colores || 'Sin preferencia'}\n` +
            `🔗 *Referencia / inspiración:* ${form.referencia || '—'}\n` +
            `🔢 *Cantidad:* ${form.cantidad}`
        window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msg)}`, '_blank')
        onClose()
    }

    return (
        <>
            <div className="overlay" onClick={onClose} style={{ zIndex: 400 }} />
            <div className="modal custom-order-modal" style={{ zIndex: 401 }}>
                <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
                <div className="custom-order-header">
                    <span className="custom-order-icon">✏️</span>
                    <h2>Diseño desde cero</h2>
                    <p>Contanos qué tenés en mente y te lo fabricamos</p>
                </div>
                <form className="custom-order-form" onSubmit={handleSend}>
                    <div className="form-group">
                        <label className="form-label">Tu nombre</label>
                        <input name="nombre" className="form-input" placeholder="Ej: María García" value={form.nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">¿Qué pieza querés? Describila en detalle</label>
                        <textarea name="descripcion" className="form-input" rows={4} placeholder="Ej: Un organizador con 3 compartimentos para mi escritorio, con ranura para el celular..." value={form.descripcion} onChange={handleChange} required style={{ resize: 'vertical' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Colores preferidos</label>
                        <input name="colores" className="form-input" placeholder="Ej: Azul pastel, blanco o rosado" value={form.colores} onChange={handleChange} />
                        <div className="color-hint-row">
                            {FILAMENT_COLORS.map(c => (
                                <span
                                    key={c.name}
                                    title={c.name}
                                    className="color-hint-dot"
                                    style={{ background: c.hex }}
                                />
                            ))}
                            <span className="color-hint-label">{FILAMENT_COLORS.length} colores disponibles</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Referencia o inspiración (opcional)</label>
                        <input name="referencia" className="form-input" placeholder="Ej: Link de Pinterest, imagen, descripción..." value={form.referencia} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cantidad</label>
                        <input name="cantidad" type="number" min="1" className="form-input" value={form.cantidad} onChange={handleChange} style={{ maxWidth: 100 }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, gap: 8 }}>
                        💬 Enviar por WhatsApp
                    </button>
                </form>
            </div>
        </>
    )
}

export default function Catalog() {
    const [productos, setProductos] = useState(DEMO_PRODUCTOS)
    const [categorias, setCategorias] = useState(CATEGORIAS_FALLBACK)
    const [categoria, setCategoria] = useState('Todos')
    const [selected, setSelected] = useState(null)
    const [customOpen, setCustomOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                // Cargar productos
                const { data: prods, error: prodsError } = await supabase
                    .from('productos')
                    .select('*')
                    .eq('activo', true)
                if (!prodsError && prods && prods.length > 0) setProductos(prods)

                // Cargar categorías dinámicas desde Supabase
                const { data: cats, error: catsError } = await supabase
                    .from('categorias')
                    .select('nombre')
                    .order('nombre', { ascending: true })
                if (!catsError && cats && cats.length > 0) {
                    setCategorias(['Todos', ...cats.map(c => c.nombre)])
                }
            } catch (_) {
                // Supabase no configurado — se usan los datos de demo/config
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filtrados = categoria === 'Todos'
        ? productos
        : productos.filter(p => p.categoria === categoria)

    return (
        <main>
            <div className="catalog-header">
                <div className="container">
                    <h1>Catálogo</h1>
                    <p>Elegí tu pieza y personalizála a tu gusto</p>
                </div>
            </div>

            <div className="container section">
                {/* Filtros de categoría */}
                <div className="category-filters">
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            className={'cat-btn' + (categoria === cat ? ' active' : '')}
                            onClick={() => setCategoria(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grilla */}
                {loading ? (
                    <div className="spinner" />
                ) : filtrados.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🔍</div>
                        <h3>No hay productos en esta categoría</h3>
                    </div>
                ) : (
                    <div className="products-grid">
                        {filtrados.map(producto => (
                            <ProductCard
                                key={producto.id}
                                producto={producto}
                                onPersonalizar={() => setSelected(producto)}
                            />
                        ))}
                    </div>
                )}

                {/* Banner diseño desde cero */}
                <div className="custom-order-banner">
                    <div className="custom-order-banner__text">
                        <span className="custom-order-banner__icon">✨</span>
                        <div>
                            <strong>¿No encontrás lo que buscás?</strong>
                            <p>Pedí tu diseño desde cero — lo fabricamos para vos</p>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCustomOpen(true)}>
                        Diseño a medida
                    </button>
                </div>
            </div>

            {/* Modal personalizador de producto existente */}
            {selected && (
                <ProductCustomizer
                    producto={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            {/* Modal pedido desde cero */}
            {customOpen && <CustomOrderModal onClose={() => setCustomOpen(false)} />}
        </main>
    )
}
