// ============================================================
// src/pages/Gallery.jsx — Galería de trabajos terminados
// Sin datos mock: carga real desde Supabase con estados propios.
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { onImgError } from '../lib/imgFallback'
import { CATEGORIAS } from '../config'
import './Gallery.css'

export default function Gallery() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [categoria, setCategoria] = useState('Todos')
    const [lightbox, setLightbox] = useState(null)

    const cargar = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const { data, error: err } = await supabase.from('galeria').select('*').order('orden')
            if (err) throw err
            setItems(data || [])
        } catch (_) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    // Visor abierto: cerrar con Escape y bloquear el scroll del fondo.
    useEffect(() => {
        if (!lightbox) return
        const onKey = (e) => { if (e.key === 'Escape') setLightbox(null) }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [lightbox])

    const filtrados = categoria === 'Todos'
        ? items
        : items.filter(i => i.categoria === categoria)

    return (
        <main>
            <div className="gallery-header">
                <div className="container">
                    <h1>Galería</h1>
                    <p>Trabajos reales hechos con amor para nuestros clientes</p>
                </div>
            </div>

            <div className="container section">
                {/* Filtros (ocultos mientras hay error) */}
                {!error && (
                    <div className="category-filters">
                        {CATEGORIAS.map(cat => (
                            <button
                                key={cat}
                                className={'cat-btn' + (categoria === cat ? ' active' : '')}
                                onClick={() => setCategoria(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    /* ── Cargando: skeletons con la forma de las tarjetas ── */
                    <div className="gallery-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="gallery-card gallery-card--skeleton">
                                <div className="gallery-img gallery-img--skeleton" />
                                <div className="gallery-info">
                                    <span className="gallery-skel-line gallery-skel-line--sm" />
                                    <span className="gallery-skel-line" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    /* ── Error / sin conexión ── */
                    <div className="gallery-state">
                        <h3>No pudimos cargar la galería</h3>
                        <p>Revisá tu conexión e intentá de nuevo.</p>
                        <button className="btn btn-primary" onClick={cargar}>Reintentar</button>
                    </div>
                ) : filtrados.length === 0 ? (
                    /* ── Vacío (query OK, sin resultados) ── */
                    <div className="gallery-state">
                        <h3>
                            {categoria === 'Todos'
                                ? 'Todavía no hay piezas en la galería'
                                : 'No hay piezas en esta categoría todavía'}
                        </h3>
                        <p>Muy pronto vas a ver acá nuestros trabajos terminados.</p>
                    </div>
                ) : (
                    /* ── Grid con piezas reales ── */
                    <div className="gallery-grid">
                        {filtrados.map(item => (
                            <div
                                key={item.id}
                                className="gallery-card"
                                onClick={() => setLightbox(item)}
                            >
                                <img
                                    src={item.imagen_url}
                                    alt={item.titulo}
                                    className="gallery-img"
                                    loading="lazy"
                                    decoding="async"
                                    width="800"
                                    height="600"
                                    onError={onImgError}
                                />
                                <div className="gallery-info">
                                    <span className="gallery-cat">{item.categoria}</span>
                                    <h3>{item.titulo}</h3>
                                    <p>{item.descripcion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA oscuro — al final de la galería */}
            <div className="gallery-cta">
                <div className="gallery-cta__inner">
                    <div>
                        <h2>¿Te gustó lo que ves?</h2>
                        <p>Pedí tu pieza personalizada — la fabricamos para vos</p>
                    </div>
                    <Link to="/catalogo" className="btn btn-primary gallery-cta__btn">
                        Ver catálogo →
                    </Link>
                </div>
            </div>

            {/* Visor — solo la imagen, sin tarjeta ni panel de info */}
            {lightbox && (
                <div
                    className="lightbox-overlay"
                    onClick={() => setLightbox(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightbox.titulo}
                >
                    <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Cerrar">✕</button>
                    <img
                        src={lightbox.imagen_url}
                        alt={lightbox.titulo}
                        className="lightbox-img"
                        decoding="async"
                        onError={onImgError}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </main>
    )
}
