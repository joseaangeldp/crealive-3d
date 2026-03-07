// ============================================================
// src/pages/admin/AdminCategories.jsx — Gestión de categorías
// Permite crear y eliminar categorías almacenadas en Supabase
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiTrash, HiTag } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

export default function AdminCategories() {
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [nombre, setNombre] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const [productosPorCategoria, setProductosPorCategoria] = useState({})

    // ── Cargar categorías y conteo de productos ──
    const fetchCategorias = async () => {
        setLoading(true)
        const { data: cats } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre')

        const { data: productos } = await supabase
            .from('productos')
            .select('categoria')

        const conteo = {}
        if (productos) {
            for (const p of productos) {
                if (p.categoria) conteo[p.categoria] = (conteo[p.categoria] || 0) + 1
            }
        }

        setCategorias(cats || [])
        setProductosPorCategoria(conteo)
        setLoading(false)
    }

    useEffect(() => { fetchCategorias() }, [])

    // ── Crear categoría ──
    const handleCreate = async e => {
        e.preventDefault()
        if (!nombre.trim()) return
        setSaving(true)
        setError('')
        setSuccess('')
        const { error: err } = await supabase
            .from('categorias')
            .insert({ nombre: nombre.trim() })
        if (err) {
            setError(err.code === '23505'
                ? 'Ya existe una categoría con ese nombre.'
                : err.message)
        } else {
            setSuccess(`Categoría "${nombre.trim()}" creada correctamente.`)
            setNombre('')
            fetchCategorias()
        }
        setSaving(false)
    }

    // ── Eliminar categoría ──
    const handleDelete = async (id, cat) => {
        const count = productosPorCategoria[cat] || 0
        const msg = count > 0
            ? `Esta categoría tiene ${count} producto(s) asociado(s). ¿Seguro que deseas eliminarla? Los productos quedarán sin categoría.`
            : `¿Eliminar la categoría "${cat}"?`
        if (!window.confirm(msg)) return
        setDeletingId(id)
        setError('')
        setSuccess('')
        const { error: err } = await supabase.from('categorias').delete().eq('id', id)
        if (err) {
            setError(err.message)
        } else {
            setSuccess(`Categoría "${cat}" eliminada.`)
            fetchCategorias()
        }
        setDeletingId(null)
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <HiTag size={22} style={{ color: 'var(--color-wine)' }} />
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Categorías</h1>
            </div>

            {/* Formulario nueva categoría */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 24, maxWidth: 520 }}>
                <h2 className="admin-form-title" style={{ marginBottom: 16 }}>Nueva categoría</h2>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                        className="form-input"
                        placeholder="Nombre de la categoría..."
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        style={{ flex: 1, minWidth: 180 }}
                        required
                        maxLength={80}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving || !nombre.trim()}
                        style={{ padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <HiPlus /> {saving ? 'Guardando...' : 'Agregar'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: 12, background: '#FFF5F5', border: '1px solid #FECACA',
                        color: '#B91C1C', borderRadius: 'var(--radius-md)', padding: '9px 13px', fontSize: 13,
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div style={{
                        marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0',
                        color: '#15803D', borderRadius: 'var(--radius-md)', padding: '9px 13px', fontSize: 13,
                    }}>
                        ✓ {success}
                    </div>
                )}
            </div>

            {/* Lista de categorías */}
            <div className="table-wrap">
                {loading ? (
                    <div className="spinner" />
                ) : categorias.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🏷️</div>
                        <h3>No hay categorías aún</h3>
                        <p>Crea la primera usando el formulario de arriba.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th style={{ textAlign: 'center' }}>Productos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorias.map(cat => (
                                <tr key={cat.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <HiTag style={{ color: 'var(--color-wine)', flexShrink: 0 }} />
                                            {cat.nombre}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${(productosPorCategoria[cat.nombre] || 0) > 0 ? 'badge-entregado' : 'badge-cancelado'}`}>
                                            {productosPorCategoria[cat.nombre] || 0} producto(s)
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '5px 12px', fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 5 }}
                                            onClick={() => handleDelete(cat.id, cat.nombre)}
                                            disabled={deletingId === cat.id}
                                        >
                                            <HiTrash />
                                            {deletingId === cat.id ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
                💡 Al eliminar una categoría, los productos asociados quedarán con su categoría sin cambios en texto, pero no aparecerán en el filtro del catálogo.
            </p>
        </div>
    )
}
