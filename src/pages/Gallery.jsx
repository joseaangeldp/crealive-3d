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

            {/* Lightbox */}
            {lightbox && (
                <>
                    <div className="overlay" onClick={() => setLightbox(null)} style={{ zIndex: 500 }} />
                    <div className="lightbox" style={{ zIndex: 501 }}>
                        <button className="modal-close" onClick={() => setLightbox(null)} aria-label="Cerrar">✕</button>
                        <img src={lightbox.imagen_url} alt={lightbox.titulo} className="lightbox-img" decoding="async" onError={onImgError} />
                        <div className="lightbox-info">
                            <span className="gallery-cat">{lightbox.categoria}</span>
                            <h2>{lightbox.titulo}</h2>
                            <p>{lightbox.descripcion}</p>
                            <a
                                className="lightbox-original"
                                href={lightbox.imagen_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Ver imagen original ↗
                            </a>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
