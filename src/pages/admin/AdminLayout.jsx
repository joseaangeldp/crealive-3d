// ============================================================
// src/pages/admin/AdminLayout.jsx — Layout del panel de administración
// Sidebar con toggle para móvil
// ============================================================
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ADMIN_EMAIL } from '../../config'
import {
    HiOutlineClipboardList,
    HiOutlineUsers,
    HiOutlineCube,
    HiOutlinePhotograph,
    HiOutlineMail,
    HiOutlineTag,
    HiOutlineLogout,
    HiMenu,
    HiX,
} from 'react-icons/hi'
import './Admin.css'

const NAV_LINKS = [
    { to: '/admin/pedidos', label: 'Pedidos', Icon: HiOutlineClipboardList },
    { to: '/admin/clientes', label: 'Clientes', Icon: HiOutlineUsers },
    { to: '/admin/productos', label: 'Productos', Icon: HiOutlineCube },
    { to: '/admin/colecciones', label: 'Colecciones', Icon: HiOutlinePhotograph },
    { to: '/admin/categorias', label: 'Categorías', Icon: HiOutlineTag },
    { to: '/admin/marketing', label: 'Email Marketing', Icon: HiOutlineMail },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Cerrar sidebar al navegar (móvil)
    useEffect(() => { setSidebarOpen(false) }, [location.pathname])

    // Verificar que hay sesión de admin al montar
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session || session.user.email !== ADMIN_EMAIL) {
                navigate('/admin/login')
            }
        })
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    return (
        <div className="admin-wrapper" style={{ paddingBottom: 0 }}>
            {/* Botón hamburguesa (solo móvil) */}
            <button
                className="admin-hamburger"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="Abrir menú"
            >
                {sidebarOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>

            {/* Overlay oscuro al abrir sidebar en móvil */}
            {sidebarOpen && (
                <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="admin-sidebar__logo">
                    Crealive 3D
                    <span>Panel de administración</span>
                </div>

                <nav className="admin-nav">
                    {NAV_LINKS.map(({ to, label, Icon }) => (
                        <NavLink key={to} to={to}
                            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <button className="admin-sidebar__logout" onClick={handleLogout}>
                    <HiOutlineLogout size={16} />
                    Cerrar sesión
                </button>
            </aside>

            {/* Contenido principal */}
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    )
}
