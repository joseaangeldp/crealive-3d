// ============================================================
// src/components/ProductCard.jsx — Tarjeta de producto
// ============================================================
import { Link } from 'react-router-dom'
import './ProductCard.css'

export default function ProductCard({ producto, onPersonalizar, edicionActiva }) {
    return (
        <div className="product-card card">
            <Link to={`/producto/${producto.id}`} className="product-card__img-wrap" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
                <img
                    src={producto.imagen_url || 'https://via.placeholder.com/300x220?text=Crealive+3D'}
                    alt={producto.nombre}
                    className="product-card__img"
                    loading="lazy"
                />
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

