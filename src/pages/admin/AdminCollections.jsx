// ============================================================
// src/pages/admin/AdminCollections.jsx — CRUD de colecciones
// Banners del carrusel principal de la home
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiTrash, HiUpload } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = { titulo: '', descripcion: '', imagen_url: '', activo: true, orden: 0 }
const BUCKET = 'colecciones'

export default function AdminCollections() {
    const [colecciones, setColecciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

    const fetchColecciones = () => {
        supabase.from('colecciones').select('*').order('orden')
            .then(({ data }) => { setColecciones(data || []); setLoading(false) })
    }
    useEffect(fetchColecciones, [])

    const openNew = () => { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true); setUploadError('') }
    const openEdit = c => { setForm(c); setEditItem(c.id); setShowForm(true); setUploadError('') }
    const closeForm = () => { setShowForm(false); setEditItem(null); setUploadError('') }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    // ── Subir imagen a Supabase Storage ──
    const handleImageUpload = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setUploadError('')
        try {
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from(BUCKET).upload(fileName, file, { upsert: true })
            if (uploadError) throw uploadError
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
        setSaving(true)
        if (editItem) {
            await supabase.from('colecciones').update({ ...form, orden: parseInt(form.orden) }).eq('id', editItem)
        } else {
            await supabase.from('colecciones').insert({ ...form, orden: parseInt(form.orden) })
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

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Colecciones</h1>
                <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    <HiPlus /> Agregar
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 className="admin-form-title">{editItem ? 'Editar' : 'Nueva'} colección</h2>
                    <form className="admin-form" onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
                            <div className="form-group">
                                <label className="form-label">Título</label>
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

                        {/* ── Imagen de la colección ── */}
                        <div className="form-group">
                            <label className="form-label">Imagen de la colección</label>

                            {/* Preview */}
                            {form.imagen_url && (
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                                    <img
                                        src={form.imagen_url}
                                        alt="preview"
                                        style={{ height: 120, width: '100%', borderRadius: 10, objectFit: 'cover', display: 'block' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                                        style={{
                                            position: 'absolute', top: -8, right: -8,
                                            width: 22, height: 22, background: '#ef4444', color: '#fff',
                                            border: 'none', borderRadius: '50%', fontSize: 13, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {/* Botón de subida */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <label
                                    className="btn btn-outline"
                                    style={{ cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.7 : 1 }}
                                >
                                    <HiUpload />
                                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                        disabled={uploading}
                                    />
                                </label>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>o pegá una URL:</span>
                                <input
                                    name="imagen_url"
                                    type="url"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={form.imagen_url}
                                    onChange={handleChange}
                                    style={{ flex: 1, minWidth: 180 }}
                                />
                            </div>

                            {uploadError && (
                                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {uploadError}</p>
                            )}
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                            Mostrar en carrusel
                        </label>
                        <div className="admin-form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>{saving ? 'Guardando...' : 'Guardar'}</button>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                {loading ? <div className="spinner" /> : (
                    <table className="admin-table">
                        <thead><tr><th>#</th><th>Imagen</th><th>Título</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {colecciones.map(c => (
                                <tr key={c.id}>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{c.orden}</td>
                                    <td><img src={c.imagen_url || ''} alt={c.titulo} style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 8, background: '#eee' }} /></td>
                                    <td style={{ fontWeight: 600 }}>{c.titulo}</td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 200 }}>{c.descripcion}</td>
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
