// ============================================================
// src/pages/Catalog.jsx — Catálogo de productos con filtros y personalizador
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS } from '../config'
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

export default function Catalog() {
    const [productos, setProductos] = useState(DEMO_PRODUCTOS)
    const [categoria, setCategoria] = useState('Todos')
    const [selected, setSelected] = useState(null) // producto seleccionado para customizar
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from('productos')
                    .select('*')
                    .eq('activo', true)
                if (!error && data && data.length > 0) setProductos(data)
            } catch (_) {
                // Supabase no configurado — se usan los productos demo
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
            </div>

            {/* Modal personalizador */}
            {selected && (
                <ProductCustomizer
                    producto={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </main>
    )
}
