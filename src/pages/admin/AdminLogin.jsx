// ============================================================
// src/pages/admin/AdminLogin.jsx — Login del panel de administración
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ADMIN_EMAIL } from '../../config'
import '../../pages/Auth.css'

export default function AdminLogin() {
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
            const { data, error: authErr } = await supabase.auth.signInWithPassword(form)
            if (authErr) throw authErr

            // Verificar que el email sea el admin configurado
            if (data.user.email !== ADMIN_EMAIL) {
                await supabase.auth.signOut()
                throw new Error('No tenés permisos de administrador.')
            }

            navigate('/admin')
        } catch (err) {
            setError(err.message || 'Error de autenticación.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>Panel Admin</h1>
                    <p>Crealive 3D — Acceso restringido al equipo</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="admin-email">Email</label>
                        <input id="admin-email" name="email" type="email" className="form-input"
                            placeholder="admin@crealive3d.com" value={form.email}
                            onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="admin-pass">Contraseña</label>
                        <input id="admin-pass" name="password" type="password" className="form-input"
                            value={form.password} onChange={handleChange} required />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Verificando...' : 'Ingresar al panel'}
                    </button>
                </form>
            </div>
        </div>
    )
}
