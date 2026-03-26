// ============================================================
// src/pages/admin/AdminLayout.jsx — Layout del panel de administración
// Sidebar con toggle para móvil + fix seguridad (checking state)
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
    HiOutlineHome,
    HiOutlineColorSwatch,
    HiOutlineSparkles,
} from 'react-icons/hi'
import './Admin.css'

const NAV_LINKS = [
    { to: '/admin', label: 'Dashboard', Icon: HiOutlineHome, end: true },
    { to: '/admin/pedidos', label: 'Pedidos', Icon: HiOutlineClipboardList },
    { to: '/admin/clientes', label: 'Clientes', Icon: HiOutlineUsers },
    { to: '/admin/productos', label: 'Productos', Icon: HiOutlineCube },
    { to: '/admin/colecciones', label: 'Colecciones', Icon: HiOutlinePhotograph },
    { to: '/admin/categorias', label: 'Categorías', Icon: HiOutlineTag },
    { to: '/admin/colores', label: 'Colores', Icon: HiOutlineColorSwatch },
    { to: '/admin/ediciones', label: 'Ed. Limitadas', Icon: HiOutlineSparkles },
    { to: '/admin/marketing', label: 'Email Marketing', Icon: HiOutlineMail },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [checking, setChecking] = useState(true)  // ← fix seguridad

    // Cerrar sidebar al navegar (móvil)
    useEffect(() => { setSidebarOpen(false) }, [location.pathname])

    // Verificar que hay sesión de admin al montar — NO renderizar hasta verificar
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session || session.user.email !== ADMIN_EMAIL) {
                navigate('/admin/login')
            } else {
                setChecking(false)  // ← solo muestra el panel si es admin
            }
        }).catch(() => navigate('/admin/login'))
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    if (checking) return <div className="spinner" style={{ margin: '80px auto' }} />

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
                    {NAV_LINKS.map(({ to, label, Icon, end }) => (
                        <NavLink key={to} to={to} end={end}
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
