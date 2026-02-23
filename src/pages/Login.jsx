// ============================================================
// src/pages/Login.jsx — Inicio de sesión
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>Bienvenida/o</h1>
                    <p>Iniciá sesión para ver tu historial de pedidos</p>
                </div>

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
