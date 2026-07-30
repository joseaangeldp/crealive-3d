// ============================================================
// src/pages/admin/AdminTeam.jsx — Gestión de administradores
//
// Promueve a admin a usuarios YA registrados, buscándolos por email.
// No crea usuarios ni contraseñas. La RLS de user_roles garantiza que
// solo un admin puede promover/degradar, y nunca a sí mismo.
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminTeam() {
    const { user } = useAuth()
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [resultado, setResultado] = useState(null)   // cliente encontrado
    const [mensaje, setMensaje] = useState(null)       // { ok, text }

    const cargarAdmins = async () => {
        setLoading(true)
        const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: true })
        const ids = (roles || []).map(r => r.user_id)
        let perfiles = []
        if (ids.length > 0) {
            const { data } = await supabase
                .from('clientes')
                .select('id, nombre, email')
                .in('id', ids)
            perfiles = data || []
        }
        setAdmins((roles || []).map(r => ({
            ...r,
            perfil: perfiles.find(p => p.id === r.user_id) || null,
        })))
        setLoading(false)
    }

    useEffect(() => { cargarAdmins() }, [])

    const buscar = async e => {
        e.preventDefault()
        setMensaje(null)
        setResultado(null)
        const buscado = email.trim().toLowerCase()
        if (!buscado) return
        setBuscando(true)
        const { data } = await supabase
            .from('clientes')
            .select('id, nombre, email')
            .eq('email', buscado)
            .maybeSingle()
        setBuscando(false)
        if (!data) {
            setMensaje({ ok: false, text: 'No hay ningún usuario registrado con ese email. Pedile que se registre primero en el sitio.' })
            return
        }
        setResultado(data)
    }

    const promover = async () => {
        if (!resultado) return
        const { error } = await supabase.from('user_roles').insert({
            user_id: resultado.id,
            role: 'admin',
            created_by: user?.id ?? null,
        })
        if (error) {
            const yaEra = error.code === '23505'
            setMensaje({ ok: yaEra, text: yaEra ? 'Ese usuario ya es administrador.' : `No se pudo promover: ${error.message}` })
        } else {
            setMensaje({ ok: true, text: `${resultado.nombre || resultado.email} ahora es administrador.` })
            setResultado(null)
            setEmail('')
            cargarAdmins()
        }
    }

    const quitarAdmin = async (rol) => {
        const nombre = rol.perfil?.nombre || rol.perfil?.email || 'este usuario'
        if (!window.confirm(`¿Quitar permisos de administrador a ${nombre}?`)) return
        const { error } = await supabase.from('user_roles').delete().eq('user_id', rol.user_id)
        if (error) {
            setMensaje({ ok: false, text: `No se pudo quitar el rol: ${error.message}` })
        } else {
            cargarAdmins()
        }
    }

    return (
        <div style={{ maxWidth: 640 }}>
            <h1 className="admin-page-title">Equipo</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
                Los administradores pueden gestionar productos, pedidos, galería y clientes.
                Para sumar a alguien, primero debe registrarse normalmente en el sitio.
            </p>

            {/* Buscar y promover */}
            <div className="card" style={{ padding: 24, marginBottom: 28 }}>
                <form onSubmit={buscar} style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="email@delusuario.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setResultado(null); setMensaje(null) }}
                        style={{ flex: 1 }}
                        required
                    />
                    <button type="submit" className="btn btn-outline" disabled={buscando} style={{ fontSize: 14 }}>
                        {buscando ? 'Buscando…' : 'Buscar'}
                    </button>
                </form>

                {resultado && (
                    <div style={{
                        marginTop: 16, padding: '14px 16px', borderRadius: 12,
                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{resultado.nombre || '—'}</div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{resultado.email}</div>
                        </div>
                        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={promover}>
                            Hacer administrador
                        </button>
                    </div>
                )}

                {mensaje && (
                    <div style={{
                        marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 14,
                        ...(mensaje.ok
                            ? { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }
                            : { background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C' }),
                    }}>
                        {mensaje.text}
                    </div>
                )}
            </div>

            {/* Lista de admins actuales */}
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Administradores actuales</h2>
            {loading ? (
                <div className="spinner" />
            ) : (
                <div className="table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Nombre</th><th>Email</th><th>Desde</th><th></th></tr>
                        </thead>
                        <tbody>
                            {admins.map(rol => (
                                <tr key={rol.user_id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {rol.perfil?.nombre || '—'}
                                        {rol.user_id === user?.id && (
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>(vos)</span>
                                        )}
                                    </td>
                                    <td>{rol.perfil?.email || rol.user_id}</td>
                                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {rol.created_at ? new Date(rol.created_at).toLocaleDateString('es-AR') : '—'}
                                    </td>
                                    <td>
                                        {rol.user_id !== user?.id && (
                                            <button
                                                onClick={() => quitarAdmin(rol)}
                                                style={{
                                                    fontSize: 12, color: '#B91C1C', background: 'none',
                                                    border: '1px solid #FECACA', borderRadius: 6,
                                                    padding: '4px 10px', cursor: 'pointer',
                                                    fontFamily: 'var(--font-body)', fontWeight: 600,
                                                }}
                                            >
                                                Quitar acceso
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
