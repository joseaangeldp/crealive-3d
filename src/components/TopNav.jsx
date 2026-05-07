// ============================================================
// src/components/TopNav.jsx — Barra superior con logo de marca
// ============================================================
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { HiOutlineShoppingCart } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import CartDrawer from './CartDrawer'
import './TopNav.css'

function CrealiveIsotipo({ size = 28, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 60 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* C exterior: top arm + left column + bottom arm con curva */}
            <path d="M6 0 H52 V22 H20 V42 H52 V64 H6 Q0 64 0 58 V6 Q0 0 6 0 Z" fill={color} />
            {/* Notch interior (diente superior derecho del C) */}
            <rect x="34" y="22" width="18" height="20" rx="2" fill={color} />
        </svg>
    )
}

export default function TopNav() {
    const { user, profile, logout } = useAuth()
    const { itemCount } = useCart()
    const [cartOpen, setCartOpen] = useState(false)

    return (
        <>
            <nav className="topnav">
                <div className="topnav__inner">
                    <Link to="/" className="topnav__logo">
                        <CrealiveIsotipo size={28} color="var(--color-wine)" />
                        <span className="topnav__logo-word">
                            crealive<em>3D</em>
                        </span>
                    </Link>

                    <ul className="topnav__links">
                        <li><NavLink to="/" end>Inicio</NavLink></li>
                        <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                        <li><NavLink to="/galeria">Galería</NavLink></li>
                        {user && <li><NavLink to="/perfil">Mi cuenta</NavLink></li>}
                    </ul>

                    <div className="topnav__actions">
                        <button
                            className="topnav__cart-btn"
                            onClick={() => setCartOpen(true)}
                            aria-label="Abrir carrito"
                        >
                            <HiOutlineShoppingCart size={21} />
                            {itemCount > 0 && (
                                <span className="cart-badge">{itemCount}</span>
                            )}
                        </button>

                        {user ? (
                            <>
                                <span className="topnav__user">Hola, {
                                    profile?.nombre ||
                                    user.user_metadata?.full_name ||
                                    user.user_metadata?.name ||
                                    user.email
                                }</span>
                                <button className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={logout}>
                                    Salir
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="topnav__login-link">
                                    Iniciar sesión
                                </Link>
                                <Link to="/registro" className="btn btn-primary" style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 700 }}>
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
        </>
    )
}
