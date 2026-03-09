// ============================================================
// src/pages/Login.jsx — Inicio de sesión + Google OAuth
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Login() {
    const { login, loginWithGoogle } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [oauthLoading, setOauthLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(form)
            navigate('/')
        } catch (err) {
            setError('Email o contraseña incorrectos.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        try {
            setOauthLoading(true)
            await loginWithGoogle()
        } catch (err) {
            setError('Error al conectar con Google. Intentá de nuevo.')
            setOauthLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>Bienvenida/o</h1>
                    <p>Iniciá sesión para ver tu historial de pedidos</p>
                </div>

                {/* Google OAuth */}
                <button
                    className="btn-google"
                    onClick={handleGoogle}
                    disabled={oauthLoading}
                    type="button"
                >
                    <svg className="btn-google__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {oauthLoading ? 'Redirigiendo...' : 'Continuar con Google'}
                </button>

                <div className="auth-divider"><span>o</span></div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="form-input"
                            placeholder="hola@ejemplo.com" value={form.email}
                            onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Contraseña</label>
                        <input id="password" name="password" type="password" className="form-input"
                            placeholder="Tu contraseña" value={form.password}
                            onChange={handleChange} required />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="auth-switch">
                    ¿No tenés cuenta? <Link to="/registro">Registrate gratis</Link>
                </p>
            </div>
        </div>
    )
}
