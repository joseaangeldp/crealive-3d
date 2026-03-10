// ============================================================
// src/pages/Home.jsx — Página principal con carrusel de colecciones
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import ProductCustomizer from '../components/ProductCustomizer'
import './Home.css'

// Colecciones de ejemplo (se muestran si Supabase no está configurado aún)
const DEMO_COLECCIONES = [
    {
        id: '1',
        titulo: 'Colección Primavera',
        descripcion: 'Macetas y organizadores llenos de color para decorar tu hogar',
        imagen_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    },
    {
        id: '2',
        titulo: 'Llaveros Personalizados',
        descripcion: 'Tu nombre, tus colores — piezas únicas para regalar',
        imagen_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
    },
    {
        id: '3',
        titulo: 'Retratos en 3D',
        descripcion: 'Convertimos tus fotos en esculturas únicas impresas en 3D',
        imagen_url: 'https://images.unsplash.com/photo-1609770231080-e321deccc34c?w=800&q=80',
    },
]

// Productos demo para más vendidos (fallback)
const DEMO_MAS_VENDIDOS = [
    { id: '1', nombre: 'Organizador Modular', categoria: 'Porta objetos', descripcion: 'Perfecto para escritorios y mesas de trabajo', precio: 12.99, imagen_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', activo: true },
    { id: '3', nombre: 'Llavero Personalizado', categoria: 'Llaveros / Accesorios', descripcion: 'Con tu nombre o iniciales', precio: 5.99, imagen_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&q=80', activo: true },
    { id: '4', nombre: 'Retrato en Relieve', categoria: 'Retratos personalizados', descripcion: 'Tu foto convertida en escultura 3D', precio: 24.99, imagen_url: 'https://images.unsplash.com/photo-1609770231080-e321deccc34c?w=400&q=80', activo: true },
    { id: '2', nombre: 'Maceta Geométrica', categoria: 'Macetas / Decoración hogar', descripcion: 'Diseño minimalista para plantas pequeñas', precio: 9.99, imagen_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', activo: true },
]

export default function Home() {
    const [colecciones, setColecciones] = useState(DEMO_COLECCIONES)
    const [activeSlide, setActiveSlide] = useState(0)
    const [masVendidos, setMasVendidos] = useState(DEMO_MAS_VENDIDOS)
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from('colecciones')
                    .select('*')
                    .eq('activo', true)
                    .order('orden')
                if (!error && data && data.length > 0) setColecciones(data)
            } catch (_) {
                // Supabase no configurado — se usan las colecciones demo
            }
        }
        load()
    }, [])

    // Cargar productos más vendidos
    useEffect(() => {
        const loadMasVendidos = async () => {
            try {
                // Intentar ordenar por ventas si existe la columna
                let { data, error } = await supabase
                    .from('productos')
                    .select('*')
                    .eq('activo', true)
                    .order('ventas', { ascending: false })
                    .limit(4)
                if (error || !data || data.length === 0) {
                    // Fallback: tomar los primeros 4 activos
                    ; ({ data, error } = await supabase
                        .from('productos')
                        .select('*')
                        .eq('activo', true)
                        .limit(4))
                }
                if (!error && data && data.length > 0) setMasVendidos(data)
            } catch (_) {
                // usa el demo
            }
        }
        loadMasVendidos()
    }, [])

    // Auto-advance carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(s => (s + 1) % colecciones.length)
        }, 4500)
        return () => clearInterval(timer)
    }, [colecciones.length])

    return (
        <main>
            {/* ── Carrusel hero ── */}
            <section className="hero-carousel">
                <div className="carousel-track"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                    {colecciones.map(col => (
                        <div key={col.id} className="carousel-slide">
                            <img src={col.imagen_url} alt={col.titulo} className="carousel-img" />
                            <div className="carousel-overlay">
                                <div className="carousel-content">
                                    <span className="carousel-label">Novedades</span>
                                    <h2 className="carousel-title">{col.titulo}</h2>
                                    <p className="carousel-desc">{col.descripcion}</p>
                                    <Link to="/catalogo" className="btn btn-ghost">Ver catálogo →</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots */}
                <div className="carousel-dots">
                    {colecciones.map((_, i) => (
                        <button key={i} className={'carousel-dot' + (i === activeSlide ? ' active' : '')}
                            onClick={() => setActiveSlide(i)} aria-label={`Ir a slide ${i + 1}`} />
                    ))}
                </div>
            </section>

            {/* ── Cómo funciona ── */}
            <section className="section how-it-works">
                <div className="container">
                    <h2 className="section-title">¿Cómo funciona?</h2>
                    <p className="section-sub">De tu idea a tu puerta en 4 pasos simples</p>
                    <div className="steps-grid">
                        {[
                            { step: '01', emoji: '🛍️', title: 'Explora el catálogo', desc: 'Busca entre nuestros productos o pide un diseño completamente personalizado' },
                            { step: '02', emoji: '🎨', title: 'Elige colores y detalles', desc: 'Selecciona entre 13 colores de filamento y nos cuentas exactamente qué quieres' },
                            { step: '03', emoji: '💬', title: 'Envias tu pedido', desc: 'Te redirigimos a WhatsApp con tu pedido listo — solo tienes que confirmar' },
                            { step: '04', emoji: '📦', title: 'Recibe tu pieza', desc: 'Fabricamos tu pieza con amor y te la enviamos a donde estés' },
                        ].map(s => (
                            <div key={s.step} className="step-card">
                                <div className="step-number">{s.step}</div>
                                <span className="step-emoji">{s.emoji}</span>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Más Vendidos ── */}
            <section className="section mas-vendidos">
                <div className="container">
                    <div className="mas-vendidos__header">
                        <div>
                            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 4 }}>🔥 Más Vendidos</h2>
                            <p className="section-sub" style={{ textAlign: 'left', marginBottom: 0 }}>Los favoritos de nuestra comunidad</p>
                        </div>
                        <Link to="/catalogo" className="btn btn-ghost mas-vendidos__ver-todos">Ver todos →</Link>
                    </div>

                    <div className="mas-vendidos__grid">
                        {masVendidos.map((producto, idx) => (
                            <div key={producto.id} className="mas-vendidos__item">
                                {idx === 0 && <span className="badge-top">⭐ N°1</span>}
                                <ProductCard
                                    producto={producto}
                                    onPersonalizar={() => setSelectedProduct(producto)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modal personalizador desde Home */}
            {selectedProduct && (
                <ProductCustomizer
                    producto={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* ── Sección de propuesta de valor ── */}
            <section className="section home-features">
                <div className="container">
                    <h2 className="section-title">¿Qué hacemos?</h2>
                    <p className="section-sub">Fabricamos productos, personalizados y con amor por el detalle</p>
                    <div className="features-grid">
                        {[
                            { emoji: '🎨', title: 'Colores a elección', desc: 'Muchos colores de filamento disponibles para tu pieza' },
                            { emoji: '✏️', title: '100% personalizado', desc: 'Tu mensaje, tu diseño — nada genérico' },
                            { emoji: '📦', title: 'Envío a todo el país', desc: 'Hacemos llegar tu pedido a donde estés' },
                            { emoji: '💬', title: 'Por WhatsApp', desc: 'Pide, nosotros producimos, tu recibes' },
                        ].map(f => (
                            <div key={f.title} className="feature-card card">
                                <span className="feature-emoji">{f.emoji}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="home-cta">
                <div className="container">
                    <div className="home-cta__inner">
                        <h2>¿Listo/a para diseñar tu pieza?</h2>
                        <p>Explora el catálogo y personaliza lo que quieras</p>
                        <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
