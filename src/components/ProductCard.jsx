// ============================================================
// src/components/ProductCard.jsx — Tarjeta de producto
// ============================================================
import './ProductCard.css'

export default function ProductCard({ producto, onPersonalizar }) {
    return (
        <div className="product-card card">
            <div className="product-card__img-wrap">
                <img
                    src={producto.imagen_url || 'https://via.placeholder.com/300x220?text=Crealive+3D'}
                    alt={producto.nombre}
                    className="product-card__img"
                    loading="lazy"
                />
                <span className="product-card__cat">{producto.categoria}</span>
            </div>
            <div className="product-card__body">
                <h3 className="product-card__name">{producto.nombre}</h3>
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
