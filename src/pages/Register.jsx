// ============================================================
// src/pages/Register.jsx — Registro de clientes
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ nombre: '', email: '', whatsapp: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await register(form)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Error al registrarse. Intentá de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>Crear cuenta</h1>
                    <p>Unite a Crealive 3D y empezá a diseñar tus piezas</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="nombre">Nombre completo</label>
                        <input id="nombre" name="nombre" type="text" className="form-input"
                            placeholder="María García" value={form.nombre}
                            onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="form-input"
                            placeholder="hola@ejemplo.com" value={form.email}
                            onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="whatsapp">WhatsApp</label>
                        <input id="whatsapp" name="whatsapp" type="tel" className="form-input"
                            placeholder="+58 412 1234567" value={form.whatsapp}
                            onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Contraseña</label>
                        <input id="password" name="password" type="password" className="form-input"
                            placeholder="Mínimo 6 caracteres" value={form.password}
                            onChange={handleChange} required minLength={6} />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p className="auth-switch">
                    ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
                </p>
            </div>
        </div>
    )
}
