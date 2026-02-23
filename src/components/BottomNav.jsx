// ============================================================
// src/components/BottomNav.jsx — Navegación inferior (móvil)
// ============================================================
import { NavLink } from 'react-router-dom'
import { HiOutlineHome, HiOutlineViewGrid, HiOutlineUser } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import './BottomNav.css'

export default function BottomNav() {
    const { user } = useAuth()

    return (
        <nav className="bottom-nav">
            <NavLink to="/" end className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}>
                <HiOutlineHome />
                <span>Inicio</span>
            </NavLink>

            <NavLink to="/catalogo" className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}>
                <HiOutlineViewGrid />
                <span>Catálogo</span>
            </NavLink>

            <NavLink
                to={user ? '/perfil' : '/login'}
                className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' active' : '')}
            >
                <HiOutlineUser />
                <span>{user ? 'Mi cuenta' : 'Ingresar'}</span>
            </NavLink>
        </nav>
    )
}
