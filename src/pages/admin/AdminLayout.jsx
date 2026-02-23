// ============================================================
// src/pages/admin/AdminLayout.jsx — Layout del panel de administración
// Sidebar + contenido anidado con React Router Outlet
// ============================================================
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ADMIN_EMAIL } from '../../config'
import {
    HiOutlineClipboardList,
    HiOutlineUsers,
    HiOutlineCube,
    HiOutlinePhotograph,
    HiOutlineMail,
    HiOutlineLogout,
} from 'react-icons/hi'
import './Admin.css'

const NAV_LINKS = [
    { to: '/admin/pedidos', label: 'Pedidos', Icon: HiOutlineClipboardList },
    { to: '/admin/clientes', label: 'Clientes', Icon: HiOutlineUsers },
    { to: '/admin/productos', label: 'Productos', Icon: HiOutlineCube },
    { to: '/admin/colecciones', label: 'Colecciones', Icon: HiOutlinePhotograph },
    { to: '/admin/marketing', label: 'Email Marketing', Icon: HiOutlineMail },
]

export default function AdminLayout() {
    const navigate = useNavigate()

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
            {/* Sidebar */}
            <aside className="admin-sidebar">
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
