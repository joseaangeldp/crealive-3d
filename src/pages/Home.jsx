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

                        {/* Paso 01 */}
                        <div className="step-card">
                            <div className="step-number">01</div>
                            <span className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                            </span>
                            <h3>Explora el catálogo</h3>
                            <p>Busca entre nuestros productos o pide un diseño completamente personalizado</p>
                        </div>

                        {/* Paso 02 */}
                        <div className="step-card">
                            <div className="step-number">02</div>
                            <span className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                                </svg>
                            </span>
                            <h3>Elige colores y detalles</h3>
                            <p>Selecciona entre muchos colores de filamento y nos cuentas exactamente qué quieres</p>
                        </div>

                        {/* Paso 03 */}
                        <div className="step-card">
                            <div className="step-number">03</div>
                            <span className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </span>
                            <h3>Envías tu pedido</h3>
                            <p>Te redirigimos a WhatsApp con tu pedido listo — solo tienes que confirmar</p>
                        </div>

                        {/* Paso 04 */}
                        <div className="step-card">
                            <div className="step-number">04</div>
                            <span className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16.5 9.4 7.55 4.24" />
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.29 7 12 12 20.71 7" />
                                    <line x1="12" y1="22" x2="12" y2="12" />
                                </svg>
                            </span>
                            <h3>Recibe tu pieza</h3>
                            <p>Fabricamos tu pieza con amor y te la enviamos a donde estés</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Más Vendidos ── */}
            <section className="section mas-vendidos">
                <div className="container">
                    <div className="mas-vendidos__header">
                        <div>
                            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-wine)" strokeWidth="1.7"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{ width: 28, height: 28, flexShrink: 0 }}>
                                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                                </svg>
                                Más Vendidos
                            </h2>
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

                        {/* Colores */}
                        <div className="feature-card card">
                            <span className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                                </svg>
                            </span>
                            <h3>Colores a elección</h3>
                            <p>Muchos colores de filamento disponibles para tu pieza</p>
                        </div>

                        {/* Personalizado */}
                        <div className="feature-card card">
                            <span className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </span>
                            <h3>100% personalizado</h3>
                            <p>Tu mensaje, tu diseño — nada genérico</p>
                        </div>

                        {/* Envío */}
                        <div className="feature-card card">
                            <span className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13" rx="1" />
                                    <path d="M16 8h4l3 5v3h-7V8z" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            </span>
                            <h3>Envío a todo el país</h3>
                            <p>Hacemos llegar tu pedido a donde estés</p>
                        </div>

                        {/* WhatsApp */}
                        <div className="feature-card card">
                            <span className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                </svg>
                            </span>
                            <h3>Por WhatsApp</h3>
                            <p>Pide, nosotros producimos, tú recibes</p>
                        </div>

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
