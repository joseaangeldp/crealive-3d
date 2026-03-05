// ============================================================
// src/components/BottomNav.jsx — Navegación inferior (móvil)
// Incluye icono de carrito con badge
// ============================================================
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { HiOutlineHome, HiOutlineViewGrid, HiOutlineUser, HiOutlineShoppingCart, HiOutlinePhotograph } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import CartDrawer from './CartDrawer'
import './BottomNav.css'

export default function BottomNav() {
    const { user } = useAuth()
    const { itemCount } = useCart()
    const [cartOpen, setCartOpen] = useState(false)

    return (
        <>
            <nav className="bottom-nav">
                <NavLink to="/" end className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}>
                    <HiOutlineHome />
                    <span>Inicio</span>
                </NavLink>

                <NavLink to="/catalogo" className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}>
                    <HiOutlineViewGrid />
                    <span>Catálogo</span>
                </NavLink>

                <NavLink to="/galeria" className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}>
                    <HiOutlinePhotograph />
                    <span>Galería</span>
                </NavLink>

                {/* Icono carrito */}
                <button
                    className="bottom-nav__item bottom-nav__cart"
                    onClick={() => setCartOpen(true)}
                    aria-label="Carrito"
                >
                    <span className="bottom-nav__cart-icon">
                        <HiOutlineShoppingCart />
                        {itemCount > 0 && (
                            <span className="cart-badge-mobile">{itemCount}</span>
                        )}
                    </span>
                    <span>Carrito</span>
                </button>

                <NavLink
                    to={user ? '/perfil' : '/login'}
                    className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}
                >
                    <HiOutlineUser />
                    <span>{user ? 'Mi cuenta' : 'Ingresar'}</span>
                </NavLink>
            </nav>

            {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
        </>
    )
}
