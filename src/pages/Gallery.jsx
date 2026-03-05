// ============================================================
// src/pages/Gallery.jsx — Galería de trabajos terminados
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS } from '../config'
import './Gallery.css'

const DEMO_GALLERY = [
    { id: 1, titulo: 'Organizador de escritorio', categoria: 'Porta objetos / Organizadores', descripcion: 'Para un cliente en Buenos Aires — filamento azul pastel', imagen_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { id: 2, titulo: 'Maceta colgante geométrica', categoria: 'Macetas / Decoración hogar', descripcion: 'Diseño a medida en color verde menta', imagen_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80' },
    { id: 3, titulo: 'Llaveros personalizados x5', categoria: 'Llaveros / Accesorios', descripcion: 'Nombres en relieve, colores variados', imagen_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80' },
    { id: 4, titulo: 'Retrato familiar en 3D', categoria: 'Retratos personalizados', descripcion: 'Regalo de cumpleaños — tres figuras en relieve', imagen_url: 'https://images.unsplash.com/photo-1609770231080-e321deccc34c?w=600&q=80' },
    { id: 5, titulo: 'Porta celular minimalista', categoria: 'Porta objetos / Organizadores', descripcion: 'Color negro sólido para escritorio', imagen_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80' },
    { id: 6, titulo: 'Maceta con drenaje', categoria: 'Macetas / Decoración hogar', descripcion: 'Diseño personalizado con sistema de drenaje incluido', imagen_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80' },
    { id: 7, titulo: 'Set de llaveros graduación', categoria: 'Llaveros / Accesorios', descripcion: 'Pedido de 20 unidades para regalo de egresados', imagen_url: 'https://images.unsplash.com/photo-1583394293253-4f6413b41d1e?w=600&q=80' },
    { id: 8, titulo: 'Organizador modular apilable', categoria: 'Porta objetos / Organizadores', descripcion: 'Sistema de 4 módulos en color rosado', imagen_url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80' },
]

export default function Gallery() {
    const [items, setItems] = useState(DEMO_GALLERY)
    const [categoria, setCategoria] = useState('Todos')
    const [lightbox, setLightbox] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                const { data, error } = await supabase.from('galeria').select('*').order('orden')
                if (!error && data && data.length > 0) setItems(data)
            } catch (_) { /* usa demo */ }
        }
        load()
    }, [])

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
                {/* Filtros */}
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

                {/* Grid masonry */}
                <div className="gallery-grid">
                    {filtrados.map(item => (
                        <div
                            key={item.id}
                            className="gallery-card"
                            onClick={() => setLightbox(item)}
                        >
                            <img src={item.imagen_url} alt={item.titulo} className="gallery-img" />
                            <div className="gallery-info">
                                <span className="gallery-cat">{item.categoria}</span>
                                <h3>{item.titulo}</h3>
                                <p>{item.descripcion}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filtrados.length === 0 && (
                    <div className="empty-state">
                        <div className="icon">📷</div>
                        <h3>No hay trabajos en esta categoría aún</h3>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <>
                    <div className="overlay" onClick={() => setLightbox(null)} style={{ zIndex: 500 }} />
                    <div className="lightbox" style={{ zIndex: 501 }}>
                        <button className="modal-close" onClick={() => setLightbox(null)} aria-label="Cerrar">✕</button>
                        <img src={lightbox.imagen_url} alt={lightbox.titulo} className="lightbox-img" />
                        <div className="lightbox-info">
                            <span className="gallery-cat">{lightbox.categoria}</span>
                            <h2>{lightbox.titulo}</h2>
                            <p>{lightbox.descripcion}</p>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
