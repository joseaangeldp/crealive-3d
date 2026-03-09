// ============================================================
// src/components/TopNav.jsx — Barra superior con icono de carrito
// ============================================================
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { HiOutlineShoppingCart } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import CartDrawer from './CartDrawer'
import './TopNav.css'

export default function TopNav() {
    const { user, profile, logout } = useAuth()
    const { itemCount } = useCart()
    const [cartOpen, setCartOpen] = useState(false)

    return (
        <>
            <nav className="topnav">
                <div className="topnav__inner">
                    <Link to="/" className="topnav__logo">
                        Crealive <span>3D</span>
                    </Link>

                    <ul className="topnav__links">
                        <li><NavLink to="/" end>Inicio</NavLink></li>
                        <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                        <li><NavLink to="/galeria">Galería</NavLink></li>
                        {user && <li><NavLink to="/perfil">Mi cuenta</NavLink></li>}
                    </ul>

                    <div className="topnav__actions">
                        {/* Icono carrito */}
                        <button
                            className="topnav__cart-btn"
                            onClick={() => setCartOpen(true)}
                            aria-label="Abrir carrito"
                        >
                            <HiOutlineShoppingCart size={22} />
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
                                <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: '13px' }}>
                                    Iniciar sesión
                                </Link>
                                <Link to="/registro" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
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
