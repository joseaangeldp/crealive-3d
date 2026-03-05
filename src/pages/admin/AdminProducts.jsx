// ============================================================
// src/pages/admin/AdminProducts.jsx — CRUD de productos
// Incluye barra de búsqueda y subida de imagen a Supabase Storage
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiEye, HiEyeOff, HiSearch, HiUpload } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS } from '../../config'

const EMPTY_FORM = { nombre: '', categoria: CATEGORIAS[1], descripcion: '', precio: '', imagen_url: '', activo: true }
const BUCKET = 'productos' // Nombre del bucket en Supabase Storage

export default function AdminProducts() {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [uploading, setUploading] = useState(false)

    const fetchProductos = () => {
        supabase.from('productos').select('*').order('nombre')
            .then(({ data }) => { setProductos(data || []); setLoading(false) })
    }
    useEffect(fetchProductos, [])

    const openNew = () => { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true); setSaveError('') }
    const openEdit = p => { setForm(p); setEditItem(p.id); setShowForm(true); setSaveError('') }
    const closeForm = () => { setShowForm(false); setEditItem(null); setSaveError('') }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    // ── Subir imagen a Supabase Storage ──
    const handleImageUpload = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setSaveError('')
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(fileName, file, { upsert: true })
            if (uploadError) throw uploadError

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
            setForm(f => ({ ...f, imagen_url: data.publicUrl }))
        } catch (err) {
            setSaveError(`Error al subir imagen: ${err.message}. Verificá que el bucket '${BUCKET}' existe y es público en Supabase Storage.`)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async e => {
        e.preventDefault()
        setSaving(true)
        setSaveError('')
        try {
            let result
            if (editItem) {
                result = await supabase.from('productos').update({ ...form, precio: parseFloat(form.precio) }).eq('id', editItem)
            } else {
                result = await supabase.from('productos').insert({ ...form, precio: parseFloat(form.precio) })
            }
            if (result.error) throw result.error
            closeForm()
            fetchProductos()
        } catch (err) {
            setSaveError(err.message || 'Error al guardar. Verificá los permisos de Supabase (RLS).')
        } finally {
            setSaving(false)
        }
    }

    const toggleActivo = async (id, activo) => {
        await supabase.from('productos').update({ activo: !activo }).eq('id', id)
        setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: !activo } : p))
    }

    // ── Filtro de búsqueda ──
    const filtrados = productos.filter(p => {
        const q = search.toLowerCase()
        return p.nombre?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q)
    })

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Productos</h1>
                <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    <HiPlus /> Agregar
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
                <HiSearch style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontSize: 16, pointerEvents: 'none',
                }} />
                <input
                    className="form-input"
                    placeholder="Buscar por nombre o categoría..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                />
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
                    <h2 className="admin-form-title">{editItem ? 'Editar' : 'Nuevo'} producto</h2>
                    <form className="admin-form" onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input name="nombre" className="form-input" value={form.nombre} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Precio (USD)</label>
                                <input name="precio" type="number" step="0.01" min="0" className="form-input" value={form.precio} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoría</label>
                            <select name="categoria" className="form-input status-select" value={form.categoria} onChange={handleChange}>
                                {CATEGORIAS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea name="descripcion" className="form-input" rows={2} value={form.descripcion} onChange={handleChange} style={{ resize: 'vertical' }} />
                        </div>

                        {/* Imagen */}
                        <div className="form-group">
                            <label className="form-label">Imagen del producto</label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Preview */}
                                {form.imagen_url && (
                                    <img src={form.imagen_url} alt="preview"
                                        style={{ width: 64, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', flexShrink: 0 }} />
                                )}
                                {/* Upload button */}
                                <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 13, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <HiUpload />
                                    {uploading ? 'Subiendo...' : 'Subir foto'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                </label>
                                {/* URL manual como fallback */}
                                <input name="imagen_url" type="url" className="form-input" placeholder="O pegá una URL..."
                                    value={form.imagen_url} onChange={handleChange}
                                    style={{ flex: 1, minWidth: 160 }} />
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                            Producto activo (visible en catálogo)
                        </label>
                        {saveError && (
                            <div style={{
                                background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C',
                                borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
                            }}>
                                ⚠️ {saveError}
                            </div>
                        )}
                        <div className="admin-form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Contador de resultados */}
            {search && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para "{search}"
                </p>
            )}

            <div className="table-wrap">
                {loading ? <div className="spinner" /> : filtrados.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🔍</div>
                        <h3>{search ? 'Sin resultados' : 'No hay productos aún'}</h3>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead><tr>
                            <th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {filtrados.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        {p.imagen_url
                                            ? <img src={p.imagen_url} alt={p.nombre} style={{ width: 48, height: 38, objectFit: 'cover', borderRadius: 8 }} />
                                            : <div style={{ width: 48, height: 38, borderRadius: 8, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                                        }
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.categoria}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-wine)' }}>${Number(p.precio).toFixed(2)}</td>
                                    <td><span className={`badge ${p.activo ? 'badge-entregado' : 'badge-cancelado'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(p)}>
                                                <HiPencil /> Editar
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => toggleActivo(p.id, p.activo)}>
                                                {p.activo ? <><HiEyeOff /> Ocultar</> : <><HiEye /> Mostrar</>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
