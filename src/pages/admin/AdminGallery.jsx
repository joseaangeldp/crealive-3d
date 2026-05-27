// ============================================================
// src/pages/admin/AdminGallery.jsx — Gestión de galería de trabajos
// CRUD completo + subida de imágenes a Supabase Storage
// ============================================================
import { useEffect, useState } from 'react'
import {
    HiPlus, HiPencil, HiTrash, HiUpload, HiEye, HiSearch,
    HiPhotograph, HiArrowUp, HiArrowDown,
} from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS } from '../../config'

const BUCKET = 'galeria'

// Categorías de galería (sin "Todos" que es solo filtro en frontend)
const CATS_GALERIA = CATEGORIAS.filter(c => c !== 'Todos')

const EMPTY_FORM = {
    titulo: '',
    categoria: CATS_GALERIA[0] || '',
    descripcion: '',
    imagen_url: '',
    orden: 0,
}

export default function AdminGallery() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [preview, setPreview] = useState(null)   // lightbox preview
    const [deleting, setDeleting] = useState(null) // id siendo eliminado

    // ── Carga inicial ──
    const fetchItems = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('galeria')
            .select('*')
            .order('orden', { ascending: true })
        setItems(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchItems() }, [])

    // ── Abrir formulario ──
    const openNew = () => {
        const maxOrden = items.length > 0 ? Math.max(...items.map(i => i.orden || 0)) + 1 : 1
        setForm({ ...EMPTY_FORM, categoria: CATS_GALERIA[0] || '', orden: maxOrden })
        setEditItem(null)
        setShowForm(true)
        setSaveError('')
    }

    const openEdit = (item) => {
        setForm({ ...item })
        setEditItem(item.id)
        setShowForm(true)
        setSaveError('')
    }

    const closeForm = () => {
        setShowForm(false)
        setEditItem(null)
        setSaveError('')
    }

    const handleChange = e => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
    }

    // ── Subir imagen al bucket 'galeria' ──
    const handleImageUpload = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setSaveError('')
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(fileName, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
            setForm(f => ({ ...f, imagen_url: data.publicUrl }))
        } catch (err) {
            setSaveError(`Error al subir imagen: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }

    // ── Guardar (create / update) ──
    const handleSave = async e => {
        e.preventDefault()
        if (!form.titulo.trim()) { setSaveError('El título es obligatorio.'); return }
        if (!form.imagen_url) { setSaveError('Debés subir una imagen.'); return }
        setSaving(true)
        setSaveError('')
        try {
            const payload = {
                titulo: form.titulo.trim(),
                categoria: form.categoria,
                descripcion: form.descripcion.trim(),
                imagen_url: form.imagen_url,
                orden: Number(form.orden) || 0,
            }
            let result
            if (editItem) {
                result = await supabase.from('galeria').update(payload).eq('id', editItem)
            } else {
                result = await supabase.from('galeria').insert(payload)
            }
            if (result.error) throw result.error
            closeForm()
            fetchItems()
        } catch (err) {
            setSaveError(err.message || 'Error al guardar. Verificá los permisos de Supabase (RLS).')
        } finally {
            setSaving(false)
        }
    }

    // ── Eliminar ──
    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta foto de la galería?')) return
        setDeleting(id)
        await supabase.from('galeria').delete().eq('id', id)
        setItems(prev => prev.filter(i => i.id !== id))
        setDeleting(null)
    }

    // ── Mover orden (simple ± 1) ──
    const moveItem = async (id, direction) => {
        const idx = items.findIndex(i => i.id === id)
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= items.length) return

        const updated = [...items]
        const tempOrden = updated[idx].orden
        updated[idx] = { ...updated[idx], orden: updated[swapIdx].orden }
        updated[swapIdx] = { ...updated[swapIdx], orden: tempOrden }
        setItems(updated)

        // Persistir los dos cambios en paralelo
        await Promise.all([
            supabase.from('galeria').update({ orden: updated[idx].orden }).eq('id', updated[idx].id),
            supabase.from('galeria').update({ orden: updated[swapIdx].orden }).eq('id', updated[swapIdx].id),
        ])
        fetchItems()
    }

    // ── Filtro búsqueda ──
    const filtrados = items.filter(i => {
        const q = search.toLowerCase()
        return (
            i.titulo?.toLowerCase().includes(q) ||
            i.categoria?.toLowerCase().includes(q) ||
            i.descripcion?.toLowerCase().includes(q)
        )
    })

    return (
        <div>
            {/* Encabezado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 2 }}>Galería de trabajos</h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                        {items.length} foto{items.length !== 1 ? 's' : ''} publicada{items.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 20px', fontSize: 13 }}>
                    <HiPlus /> Agregar foto
                </button>
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
                <HiSearch style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontSize: 16, pointerEvents: 'none',
                }} />
                <input
                    className="form-input"
                    placeholder="Buscar por título o categoría..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                />
            </div>

            {/* ── Formulario ── */}
            {showForm && (
                <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
                    <h2 className="admin-form-title">{editItem ? 'Editar' : 'Nueva'} foto de galería</h2>
                    <form className="admin-form" onSubmit={handleSave}>

                        {/* Vista previa de imagen */}
                        <div className="form-group">
                            <label className="form-label">Imagen</label>

                            {form.imagen_url ? (
                                <div style={{ marginBottom: 12, position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={form.imagen_url}
                                        alt="preview"
                                        style={{
                                            width: '100%', maxWidth: 340, maxHeight: 220,
                                            objectFit: 'cover', borderRadius: 12,
                                            border: '2px solid var(--color-wine)',
                                            display: 'block',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                                        style={{
                                            position: 'absolute', top: -8, right: -8,
                                            width: 22, height: 22, background: '#ef4444',
                                            color: '#fff', border: 'none', borderRadius: '50%',
                                            fontSize: 13, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                        title="Quitar imagen"
                                    >×</button>
                                </div>
                            ) : (
                                <div style={{
                                    width: '100%', maxWidth: 340, height: 160,
                                    borderRadius: 12, border: '2px dashed var(--color-border)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 12, background: 'var(--color-surface-2)',
                                    color: 'var(--color-text-muted)', gap: 8,
                                }}>
                                    <HiPhotograph size={32} />
                                    <span style={{ fontSize: 13 }}>Sin imagen aún</span>
                                </div>
                            )}

                            <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <HiUpload />
                                {uploading ? 'Subiendo...' : form.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                            {uploading && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    marginLeft: 12, fontSize: 13, color: 'var(--color-wine)',
                                }}>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Subiendo...
                                </div>
                            )}
                        </div>

                        {/* Título y categoría */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Título *</label>
                                <input
                                    name="titulo"
                                    className="form-input"
                                    placeholder="Ej: Organizador modular azul"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <select name="categoria" className="form-input status-select" value={form.categoria} onChange={handleChange}>
                                    {CATS_GALERIA.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="form-group">
                            <label className="form-label">Descripción (opcional)</label>
                            <textarea
                                name="descripcion"
                                className="form-input"
                                rows={2}
                                placeholder="Ej: Para un cliente en Buenos Aires — filamento azul pastel"
                                value={form.descripcion}
                                onChange={handleChange}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Orden */}
                        <div className="form-group" style={{ maxWidth: 140 }}>
                            <label className="form-label">Orden de aparición</label>
                            <input
                                name="orden"
                                type="number"
                                min="0"
                                className="form-input"
                                value={form.orden}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Error */}
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

            {/* ── Grid de imágenes ── */}
            {loading ? (
                <div className="spinner" />
            ) : filtrados.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📷</div>
                    <h3>{search ? 'Sin resultados' : 'La galería está vacía'}</h3>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {!search && 'Hacé clic en "Agregar foto" para publicar la primera imagen.'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 18,
                }}>
                    {filtrados.map((item, idx) => (
                        <div
                            key={item.id}
                            className="card"
                            style={{
                                padding: 0, overflow: 'hidden',
                                transition: 'transform 0.18s, box-shadow 0.18s',
                                position: 'relative',
                            }}
                        >
                            {/* Imagen */}
                            <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                                <img
                                    src={item.imagen_url}
                                    alt={item.titulo}
                                    style={{
                                        width: '100%', height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.3s',
                                        cursor: 'zoom-in',
                                    }}
                                    onClick={() => setPreview(item)}
                                />
                                {/* Badge de orden */}
                                <span style={{
                                    position: 'absolute', top: 8, left: 8,
                                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                                    fontSize: 11, fontWeight: 700,
                                    borderRadius: 20, padding: '2px 8px',
                                    backdropFilter: 'blur(4px)',
                                }}>#{item.orden}</span>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '12px 14px' }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: 'var(--color-wine)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>{item.categoria}</span>
                                <h3 style={{
                                    fontSize: 14, fontWeight: 700, margin: '4px 0 4px',
                                    color: 'var(--color-text)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{item.titulo}</h3>
                                {item.descripcion && (
                                    <p style={{
                                        fontSize: 12, color: 'var(--color-text-muted)',
                                        margin: '0 0 10px', lineHeight: 1.4,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>{item.descripcion}</p>
                                )}

                                {/* Acciones */}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 9px', fontSize: 12 }}
                                        onClick={() => setPreview(item)}
                                        title="Vista previa"
                                    >
                                        <HiEye />
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 9px', fontSize: 12 }}
                                        onClick={() => openEdit(item)}
                                        title="Editar"
                                    >
                                        <HiPencil /> Editar
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 9px', fontSize: 12, color: '#ef4444' }}
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deleting === item.id}
                                        title="Eliminar"
                                    >
                                        <HiTrash />
                                    </button>

                                    {/* Flechas de orden */}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            style={{ padding: '4px 7px', fontSize: 12 }}
                                            disabled={idx === 0}
                                            onClick={() => moveItem(item.id, 'up')}
                                            title="Mover arriba"
                                        ><HiArrowUp /></button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            style={{ padding: '4px 7px', fontSize: 12 }}
                                            disabled={idx === filtrados.length - 1}
                                            onClick={() => moveItem(item.id, 'down')}
                                            title="Mover abajo"
                                        ><HiArrowDown /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Lightbox Preview ── */}
            {preview && (
                <>
                    <div
                        className="overlay"
                        onClick={() => setPreview(null)}
                        style={{ zIndex: 500 }}
                    />
                    <div className="lightbox" style={{ zIndex: 501 }}>
                        <button
                            className="modal-close"
                            onClick={() => setPreview(null)}
                            aria-label="Cerrar"
                        >✕</button>
                        <img
                            src={preview.imagen_url}
                            alt={preview.titulo}
                            className="lightbox-img"
                        />
                        <div className="lightbox-info">
                            <span className="gallery-cat">{preview.categoria}</span>
                            <h2>{preview.titulo}</h2>
                            <p>{preview.descripcion}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
