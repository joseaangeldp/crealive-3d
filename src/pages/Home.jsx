// ============================================================
// src/pages/Home.jsx — Página principal con carrusel de colecciones
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

export default function Home() {
    const [colecciones, setColecciones] = useState(DEMO_COLECCIONES)
    const [activeSlide, setActiveSlide] = useState(0)

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
                            { step: '01', emoji: '🛍️', title: 'Explorás el catálogo', desc: 'Buscá entre nuestros productos o pedí un diseño completamente personalizado' },
                            { step: '02', emoji: '🎨', title: 'Elegís colores y detalles', desc: 'Seleccionás entre 13 colores de filamento y nos contás exactamente qué querés' },
                            { step: '03', emoji: '💬', title: 'Enviás tu pedido', desc: 'Te redirigimos a WhatsApp con tu pedido listo — solo tenés que confirmar' },
                            { step: '04', emoji: '📦', title: 'Recibís tu pieza', desc: 'Fabricamos tu pieza con amor y te la enviamos a donde estés' },
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

            {/* ── Sección de propuesta de valor ── */}
            <section className="section home-features">
                <div className="container">
                    <h2 className="section-title">¿Qué hacemos?</h2>
                    <p className="section-sub">Impresión 3D artesanal, personalizada y con amor por el detalle</p>
                    <div className="features-grid">
                        {[
                            { emoji: '🎨', title: 'Colores a elección', desc: '13 colores de filamento disponibles para tu pieza' },
                            { emoji: '✏️', title: '100% personalizado', desc: 'Tu mensaje, tu diseño — nada genérico' },
                            { emoji: '📦', title: 'Envío a todo el país', desc: 'Hacemos llegar tu pedido a donde estés' },
                            { emoji: '💬', title: 'Por WhatsApp', desc: 'Pedís, nosotros producimos, vos recibís' },
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
                        <p>Explorá el catálogo y personalizá lo que querés</p>
                        <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
