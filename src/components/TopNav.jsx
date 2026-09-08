// ============================================================
// src/components/TopNav.jsx — Barra superior con logo de marca
// ============================================================
import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { HiOutlineShoppingCart } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import CartDrawer from './CartDrawer'
import SearchForm from './SearchForm'
import './TopNav.css'

export default function TopNav() {
    const { user, profile, isAdmin, logout } = useAuth()
    const { itemCount } = useCart()
    const [cartOpen, setCartOpen] = useState(false)
    // El catálogo ya trae su propio buscador; evitamos duplicarlo en el nav
    const enCatalogo = useLocation().pathname === '/catalogo'

    return (
        <>
            <nav className="topnav">
                <div className="topnav__inner">
                    <Link to="/" className="topnav__logo">
                        <img src="/logo.png" alt="Crealive 3D" className="topnav__logo-img" width="30" height="30" />
                        <span className="topnav__logo-word">
                            crealive<em>3D</em>
                        </span>
                    </Link>

                    <ul className="topnav__links">
                        <li><NavLink to="/" end>Inicio</NavLink></li>
                        <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                        <li><NavLink to="/galeria">Galería</NavLink></li>
                        {user && <li><NavLink to="/perfil">Mi cuenta</NavLink></li>}
                        {isAdmin && <li><NavLink to="/admin">Panel admin</NavLink></li>}
                    </ul>

                    {!enCatalogo && <SearchForm className="searchform--nav" />}

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
