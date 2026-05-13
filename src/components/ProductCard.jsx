// ============================================================
// src/components/ProductCard.jsx — Tarjeta de producto
// Soporta modo offline: muestra ícono de categoría sin imagen
// ============================================================
import { Link } from 'react-router-dom'
import './ProductCard.css'

// Íconos SVG por categoría
function CatIcon({ categoria }) {
    const cat = (categoria || '').toLowerCase()

    if (cat.includes('maceta') || cat.includes('decoración') || cat.includes('hogar')) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 1 5 5c0 3-2 5-5 9-3-4-5-6-5-9a5 5 0 0 1 5-5z" />
            <path d="M9 20h6M12 16v4" />
        </svg>
    )
    if (cat.includes('llavero') || cat.includes('accesorio')) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M12 12v8M9 17h6" />
        </svg>
    )
    if (cat.includes('retrato') || cat.includes('personaliz')) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    )
    if (cat.includes('porta') || cat.includes('organiz')) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
        </svg>
    )
    // Ícono genérico 3D
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    )
}

export default function ProductCard({ producto, onPersonalizar, edicionActiva, offline }) {
    return (
        <div className="product-card card">
            <Link to={`/producto/${producto.id}`} className="product-card__img-wrap" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
                {offline ? (
                    <div className="product-card__offline">
                        <span className="product-card__offline-icon">
                            <CatIcon categoria={producto.categoria} />
                        </span>
                        <span className="product-card__offline-label">Sin conexión</span>
                    </div>
                ) : (
                    <img
                        src={producto.imagen_url || ''}
                        alt={producto.nombre}
                        className="product-card__img"
                        loading="lazy"
                    />
                )}
                <span className="product-card__cat">{producto.categoria}</span>
                {edicionActiva && (
                    <span style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'linear-gradient(135deg, #C4768A, #8B5CF6)',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 20,
                        boxShadow: '0 2px 6px rgba(196,118,138,0.4)',
                    }}>✨ Ed. Limitada</span>
                )}
            </Link>
            <div className="product-card__body">
                <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="product-card__name">{producto.nombre}</h3>
                </Link>
                {producto.descripcion && (
                    <p className="product-card__desc">{producto.descripcion}</p>
                )}
                <div className="product-card__footer">
                    <span className="product-card__price">${Number(producto.precio).toFixed(2)}</span>
                    <button className="btn btn-primary product-card__btn" onClick={onPersonalizar}>
                        Personalizar
                    </button>
                </div>
            </div>
        </div>
    )
}
