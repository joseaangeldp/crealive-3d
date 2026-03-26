// ============================================================
// src/pages/CollectionDetail.jsx — Productos de una colección
// Se abre al hacer clic en una slide del carrusel de Home
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import ProductCustomizer from '../components/ProductCustomizer'

export default function CollectionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [coleccion, setColeccion] = useState(null)
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            // Cargar colección
            const { data: col, error } = await supabase
                .from('colecciones')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !col) { setNotFound(true); setLoading(false); return }
            setColeccion(col)

            // Cargar productos vinculados
            const ids = Array.isArray(col.productos_ids) ? col.productos_ids : []
            if (ids.length > 0) {
                const { data: prods } = await supabase
                    .from('productos')
                    .select('*')
                    .in('id', ids)
                    .eq('activo', true)
                setProductos(prods || [])
            }
            setLoading(false)
        }
        load()
    }, [id])

    if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

    if (notFound) return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 48 }}>🔍</p>
            <h2>Colección no encontrada</h2>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Volver al inicio</Link>
        </main>
    )

    return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28, flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, padding: 0, transition: 'color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--color-wine)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                    <HiArrowLeft size={16} /> Volver
                </button>
                <span style={{ opacity: 0.4 }}>›</span>
                <Link to="/" style={{ color: 'var(--color-wine)', textDecoration: 'none' }}>Inicio</Link>
                <span style={{ opacity: 0.4 }}>›</span>
                <span>{coleccion.titulo}</span>
            </div>

            {/* Banner de colección */}
            {coleccion.imagen_url && (
                <div style={{
                    position: 'relative', borderRadius: 20, overflow: 'hidden',
                    height: 220, marginBottom: 36,
                }}>
                    <img src={coleccion.imagen_url} alt={coleccion.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        padding: '24px 28px',
                    }}>
                        <h1 style={{ color: '#fff', fontSize: 28, fontFamily: 'var(--font-display)', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                            {coleccion.titulo}
                        </h1>
                        {coleccion.descripcion && (
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '4px 0 0', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                                {coleccion.descripcion}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {!coleccion.imagen_url && (
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '0 0 8px' }}>{coleccion.titulo}</h1>
                    {coleccion.descripcion && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>{coleccion.descripcion}</p>}
                </div>
            )}

            {/* Productos */}
            {productos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: 40 }}>📦</p>
                    <h3>Esta colección aún no tiene productos</h3>
                    <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Ver catálogo completo</Link>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                        {productos.length} producto{productos.length !== 1 ? 's' : ''} en esta colección
                    </p>
                    <div className="products-grid">
                        {productos.map(producto => (
                            <ProductCard
                                key={producto.id}
                                producto={producto}
                                onPersonalizar={() => setSelected(producto)}
                            />
                        ))}
                    </div>
                </>
            )}

            {selected && (
                <ProductCustomizer producto={selected} onClose={() => setSelected(null)} />
            )}
        </main>
    )
}
