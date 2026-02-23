// ============================================================
// src/components/TopNav.jsx — Barra de navegación superior (desktop)
// ============================================================
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './TopNav.css'

export default function TopNav() {
    const { user, logout } = useAuth()

    return (
        <nav className="topnav">
            <div className="topnav__inner">
                <Link to="/" className="topnav__logo">
                    Crealive <span>3D</span>
                </Link>

                <ul className="topnav__links">
                    <li><NavLink to="/" end>Inicio</NavLink></li>
                    <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                    {user && <li><NavLink to="/perfil">Mi cuenta</NavLink></li>}
                </ul>

                <div className="topnav__actions">
                    {user ? (
                        <>
                            <span className="topnav__user">Hola, {user.user_metadata?.nombre || user.email}</span>
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
    )
}
