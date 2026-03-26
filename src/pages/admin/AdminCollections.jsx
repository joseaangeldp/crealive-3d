// ============================================================
// src/pages/admin/AdminCollections.jsx — CRUD de colecciones
// Incluye asignación de productos a cada colección
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiTrash, HiUpload } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
    titulo: '', descripcion: '', imagen_url: '',
    activo: true, orden: 0,
    productos_ids: [],   // UUIDs de productos asignados a esta colección
}
const BUCKET = 'colecciones'

export default function AdminCollections() {
    const [colecciones, setColecciones] = useState([])
    const [productos, setProductos] = useState([])   // todos los productos activos
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [searchProd, setSearchProd] = useState('')

    const fetchColecciones = async () => {
        setLoading(true)
        const { data } = await supabase.from('colecciones').select('*').order('orden')
        setColecciones(data || [])
        setLoading(false)
    }

    const fetchProductos = async () => {
        const { data } = await supabase.from('productos').select('id, nombre, imagen_url, categoria').eq('activo', true).order('nombre')
        setProductos(data || [])
    }

    useEffect(() => { fetchColecciones(); fetchProductos() }, [])

    const openNew = () => {
        setForm(EMPTY_FORM); setEditItem(null); setShowForm(true)
        setSaveError(''); setUploadError(''); setSearchProd('')
    }
    const openEdit = c => {
        setForm({
            titulo: c.titulo || '',
            descripcion: c.descripcion || '',
            imagen_url: c.imagen_url || '',
            activo: c.activo,
            orden: c.orden || 0,
            productos_ids: Array.isArray(c.productos_ids) ? c.productos_ids : [],
        })
        setEditItem(c.id); setShowForm(true)
        setSaveError(''); setUploadError(''); setSearchProd('')
    }
    const closeForm = () => { setShowForm(false); setEditItem(null); setSaveError('') }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    // Toggle producto en la colección
    const toggleProducto = (id) => {
        setForm(f => {
            const ids = f.productos_ids || []
            const nuevo = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
            return { ...f, productos_ids: nuevo }
        })
    }

    // Subir imagen a Supabase Storage
    const handleImageUpload = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true); setUploadError('')
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true })
            if (uploadErr) throw uploadErr
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
            setForm(f => ({ ...f, imagen_url: data.publicUrl }))
        } catch (err) {
            setUploadError(`Error al subir imagen: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async e => {
        e.preventDefault()
        setSaving(true); setSaveError('')
        const payload = {
            titulo: form.titulo,
            descripcion: form.descripcion,
            imagen_url: form.imagen_url,
            activo: form.activo,
            orden: parseInt(form.orden) || 0,
            productos_ids: form.productos_ids || [],
        }
        const { error } = editItem
            ? await supabase.from('colecciones').update(payload).eq('id', editItem)
            : await supabase.from('colecciones').insert(payload)

        if (error) {
            // Si falla por columna productos_ids que no existe aún, intentar sin ella
            if (error.message?.includes('productos_ids')) {
                setSaveError('⚠️ Ejecutá esta query en Supabase primero:\nALTER TABLE colecciones ADD COLUMN IF NOT EXISTS productos_ids uuid[] DEFAULT \'{}\';')
            } else {
                setSaveError(error.message)
            }
            setSaving(false); return
        }
        setSaving(false)
        closeForm()
        fetchColecciones()
    }

    const handleDelete = async id => {
        if (!window.confirm('¿Eliminar esta colección?')) return
        await supabase.from('colecciones').delete().eq('id', id)
        setColecciones(prev => prev.filter(c => c.id !== id))
    }

    // Productos filtrados por búsqueda
    const productosFiltrados = searchProd.trim()
        ? productos.filter(p => p.nombre.toLowerCase().includes(searchProd.toLowerCase()))
        : productos

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Colecciones</h1>
                <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    <HiPlus /> Agregar
                </button>
            </div>

            {/* ── SQL hint ── */}
            <div style={{ background: '#FFF9C4', border: '1px solid #F5E642', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#7A6800', marginBottom: 20 }}>
                <strong>⚠️ Antes de usar:</strong> ejecutá esta query en Supabase SQL Editor si aún no lo hiciste:
                <code style={{ display: 'block', marginTop: 6, background: 'rgba(0,0,0,0.06)', padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
                    {"ALTER TABLE colecciones ADD COLUMN IF NOT EXISTS productos_ids uuid[] DEFAULT '{}';"}
                </code>
            </div>

            {/* ── FORMULARIO ── */}
            {showForm && (
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 className="admin-form-title">{editItem ? 'Editar' : 'Nueva'} colección</h2>
                    <form className="admin-form" onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
                            <div className="form-group">
                                <label className="form-label">Título *</label>
                                <input name="titulo" className="form-input" value={form.titulo} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Orden</label>
                                <input name="orden" type="number" min="0" className="form-input" style={{ width: 70 }} value={form.orden} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea name="descripcion" className="form-input" rows={2} value={form.descripcion} onChange={handleChange} style={{ resize: 'vertical' }} />
                        </div>

                        {/* Imagen */}
                        <div className="form-group">
                            <label className="form-label">Imagen del carrusel</label>
                            {form.imagen_url && (
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                                    <img src={form.imagen_url} alt="preview"
                                        style={{ height: 120, width: '100%', borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                                    <button type="button" onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                                        style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ×
                                    </button>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <label className="btn btn-outline" style={{ cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.7 : 1 }}>
                                    <HiUpload /> {uploading ? 'Subiendo...' : 'Subir imagen'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                </label>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>o pegá una URL:</span>
                                <input name="imagen_url" type="url" className="form-input" placeholder="https://..."
                                    value={form.imagen_url} onChange={handleChange} style={{ flex: 1, minWidth: 180 }} />
                            </div>
                            {uploadError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {uploadError}</p>}
                        </div>

                        {/* ── PRODUCTOS ASIGNADOS ── */}
                        <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                            <label className="form-label">
                                📦 Productos en esta colección
                                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                                    ({form.productos_ids?.length || 0} seleccionados)
                                </span>
                            </label>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                                Los productos seleccionados aparecerán cuando alguien haga clic en esta colección desde el carrusel.
                            </p>

                            {/* Buscador */}
                            <input
                                className="form-input"
                                placeholder="Buscar producto..."
                                value={searchProd}
                                onChange={e => setSearchProd(e.target.value)}
                                style={{ marginBottom: 12, fontSize: 13 }}
                            />

                            {/* Chips de seleccionados */}
                            {(form.productos_ids || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                    {(form.productos_ids || []).map(pid => {
                                        const p = productos.find(x => x.id === pid)
                                        if (!p) return null
                                        return (
                                            <span key={pid} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                background: 'rgba(196,118,138,0.12)', border: '1px solid var(--color-wine)',
                                                color: 'var(--color-wine)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                                            }}>
                                                {p.nombre}
                                                <button type="button" onClick={() => toggleProducto(pid)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-wine)', fontSize: 14, padding: 0, lineHeight: 1 }}>
                                                    ×
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Lista de productos para seleccionar */}
                            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                                {productosFiltrados.length === 0 ? (
                                    <p style={{ padding: 16, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin productos</p>
                                ) : productosFiltrados.map(p => {
                                    const sel = (form.productos_ids || []).includes(p.id)
                                    return (
                                        <div key={p.id} onClick={() => toggleProducto(p.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                                cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                                                background: sel ? 'rgba(196,118,138,0.06)' : 'transparent',
                                                transition: 'background 0.12s',
                                            }}>
                                            <input type="checkbox" checked={sel} onChange={() => {}} style={{ flexShrink: 0, accentColor: 'var(--color-wine)' }} />
                                            {p.imagen_url
                                                ? <img src={p.imagen_url} alt={p.nombre} style={{ width: 36, height: 30, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                                                : <div style={{ width: 36, height: 30, background: '#eee', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
                                            }
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.categoria}</div>
                                            </div>
                                            {sel && <span style={{ marginLeft: 'auto', color: 'var(--color-wine)', fontWeight: 700, fontSize: 14 }}>✓</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                            Mostrar en carrusel
                        </label>

                        {saveError && (
                            <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, whiteSpace: 'pre-line' }}>
                                ⚠️ {saveError}
                            </div>
                        )}
                        <div className="admin-form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                                {saving ? 'Guardando...' : 'Guardar colección'}
                            </button>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── LISTA ── */}
            <div className="table-wrap">
                {loading ? <div className="spinner" /> : colecciones.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🗂️</div>
                        <h3>No hay colecciones aún</h3>
                        <p>Creá la primera con el botón de arriba.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead><tr>
                            <th>#</th><th>Imagen</th><th>Título</th><th>Descripción</th><th>Productos</th><th>Estado</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {colecciones.map(c => (
                                <tr key={c.id}>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{c.orden}</td>
                                    <td>
                                        {c.imagen_url
                                            ? <img src={c.imagen_url} alt={c.titulo} style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                                            : <div style={{ width: 64, height: 40, background: '#eee', borderRadius: 8 }} />
                                        }
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{c.titulo}</td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 180 }}>{c.descripcion}</td>
                                    <td>
                                        <span style={{ fontSize: 13, color: Array.isArray(c.productos_ids) && c.productos_ids.length > 0 ? 'var(--color-wine)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                                            {Array.isArray(c.productos_ids) ? c.productos_ids.length : 0} productos
                                        </span>
                                    </td>
                                    <td><span className={`badge ${c.activo ? 'badge-entregado' : 'badge-cancelado'}`}>{c.activo ? 'Activo' : 'Oculto'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(c)}>
                                                <HiPencil /> Editar
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#B91C1C' }} onClick={() => handleDelete(c.id)}>
                                                <HiTrash /> Eliminar
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
