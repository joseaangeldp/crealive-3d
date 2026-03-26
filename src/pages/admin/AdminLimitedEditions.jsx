// ============================================================
// src/pages/admin/AdminLimitedEditions.jsx — Ediciones Limitadas
// CRUD completo: producto o colección, colores exclusivos, stock, fechas, banner
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiTrash, HiUpload, HiX } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const BUCKET = 'productos'

const EMPTY_FORM = {
    nombre: '',
    tipo: 'producto',
    producto_id: '',
    descripcion: '',
    colores_exclusivos: [],
    stock: 0,
    fecha_inicio: '',
    fecha_fin: '',
    banner_url: '',
    activo: true,
}

export default function AdminLimitedEditions() {
    const [ediciones, setEdiciones] = useState([])
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState('')
    // Color exclusivo form
    const [nuevoColorHex, setNuevoColorHex] = useState('#C4768A')
    const [nuevoColorNombre, setNuevoColorNombre] = useState('')

    const fetchEdiciones = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('ediciones_limitadas')
            .select('*, productos(nombre)')
            .order('created_at', { ascending: false })
        setEdiciones(data || [])
        setLoading(false)
    }

    const fetchProductos = async () => {
        const { data } = await supabase.from('productos').select('id, nombre').eq('activo', true).order('nombre')
        setProductos(data || [])
    }

    useEffect(() => { fetchEdiciones(); fetchProductos() }, [])

    const openNew = () => {
        setForm({ ...EMPTY_FORM, producto_id: productos[0]?.id || '' })
        setEditItem(null); setShowForm(true); setSaveError(''); setSuccess('')
        setNuevoColorHex('#C4768A'); setNuevoColorNombre('')
    }

    const openEdit = (ed) => {
        setForm({
            nombre: ed.nombre,
            tipo: ed.tipo,
            producto_id: ed.producto_id || '',
            descripcion: ed.descripcion || '',
            colores_exclusivos: Array.isArray(ed.colores_exclusivos) ? ed.colores_exclusivos : [],
            stock: ed.stock || 0,
            fecha_inicio: ed.fecha_inicio || '',
            fecha_fin: ed.fecha_fin || '',
            banner_url: ed.banner_url || '',
            activo: ed.activo,
        })
        setEditItem(ed.id); setShowForm(true); setSaveError(''); setSuccess('')
        setNuevoColorHex('#C4768A'); setNuevoColorNombre('')
    }

    const closeForm = () => { setShowForm(false); setEditItem(null); setSaveError('') }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    const agregarColor = () => {
        if (!nuevoColorNombre.trim()) return
        const ya = form.colores_exclusivos.some(c => c.hex.toLowerCase() === nuevoColorHex.toLowerCase())
        if (ya) return
        setForm(f => ({ ...f, colores_exclusivos: [...f.colores_exclusivos, { hex: nuevoColorHex, name: nuevoColorNombre.trim() }] }))
        setNuevoColorNombre('')
        setNuevoColorHex('#C4768A')
    }

    const eliminarColor = (hex) => {
        setForm(f => ({ ...f, colores_exclusivos: f.colores_exclusivos.filter(c => c.hex !== hex) }))
    }

    const handleBannerUpload = async e => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const ext = file.name.split('.').pop()
        const fileName = `banner_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true })
        if (!uploadError) {
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
            setForm(f => ({ ...f, banner_url: data.publicUrl }))
        }
        setUploading(false)
    }

    const handleSave = async e => {
        e.preventDefault()
        if (!form.nombre.trim()) { setSaveError('El nombre es requerido'); return }
        setSaving(true); setSaveError('')
        const payload = {
            ...form,
            stock: Number(form.stock) || 0,
            producto_id: form.tipo === 'producto' && form.producto_id ? form.producto_id : null,
        }
        const { error: err } = editItem
            ? await supabase.from('ediciones_limitadas').update(payload).eq('id', editItem)
            : await supabase.from('ediciones_limitadas').insert(payload)
        if (err) { setSaveError(err.message); setSaving(false); return }
        setSuccess(editItem ? 'Edición actualizada.' : 'Edición creada.')
        closeForm()
        fetchEdiciones()
        setSaving(false)
    }

    const handleDelete = async (ed) => {
        if (!window.confirm(`¿Eliminar la edición "${ed.nombre}"?`)) return
        await supabase.from('ediciones_limitadas').delete().eq('id', ed.id)
        setEdiciones(prev => prev.filter(e => e.id !== ed.id))
        setSuccess(`"${ed.nombre}" eliminada.`)
    }

    const toggleActivo = async (ed) => {
        await supabase.from('ediciones_limitadas').update({ activo: !ed.activo }).eq('id', ed.id)
        setEdiciones(prev => prev.map(e => e.id === ed.id ? { ...e, activo: !e.activo } : e))
    }

    const formatFecha = f => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>✨ Ediciones Limitadas</h1>
                <button className="btn btn-primary" onClick={openNew} style={{ fontSize: 13, padding: '8px 18px' }}>
                    <HiPlus /> Nueva edición
                </button>
            </div>

            {success && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                    ✓ {success}
                </div>
            )}

            {/* ── FORMULARIO ── */}
            {showForm && (
                <div className="card" style={{ padding: 24, marginBottom: 28 }}>
                    <h2 className="admin-form-title">{editItem ? 'Editar' : 'Nueva'} edición limitada</h2>
                    <form className="admin-form" onSubmit={handleSave}>

                        {/* Nombre */}
                        <div className="form-group">
                            <label className="form-label">Nombre de la edición *</label>
                            <input name="nombre" className="form-input" value={form.nombre} onChange={handleChange} placeholder="Ej: Colección San Valentín" required />
                        </div>

                        {/* Tipo */}
                        <div className="form-group">
                            <label className="form-label">Tipo</label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {['producto', 'coleccion'].map(t => (
                                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                                        <input type="radio" name="tipo" value={t} checked={form.tipo === t} onChange={handleChange} />
                                        {t === 'producto' ? '📦 Producto individual' : '🗂️ Colección temática'}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Producto base (si tipo = producto) */}
                        {form.tipo === 'producto' && (
                            <div className="form-group">
                                <label className="form-label">Producto base</label>
                                <select name="producto_id" className="form-input status-select" value={form.producto_id} onChange={handleChange}>
                                    <option value="">— Sin producto vinculado —</option>
                                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Descripción */}
                        <div className="form-group">
                            <label className="form-label">Descripción (opcional)</label>
                            <textarea name="descripcion" className="form-input" rows={2} value={form.descripcion} onChange={handleChange} style={{ resize: 'vertical' }} />
                        </div>

                        {/* Colores exclusivos */}
                        <div className="form-group">
                            <label className="form-label">🎨 Colores exclusivos de esta edición</label>
                            {form.colores_exclusivos.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                    {form.colores_exclusivos.map(c => (
                                        <div key={c.hex} style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '5px 10px', borderRadius: 20,
                                            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: 12,
                                        }}>
                                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                                            <button type="button" onClick={() => eliminarColor(c.hex)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 0 }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Color</label>
                                    <input type="color" value={nuevoColorHex} onChange={e => setNuevoColorHex(e.target.value)}
                                        style={{ width: 48, height: 36, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Nombre</label>
                                    <input className="form-input" placeholder="Ej: Rojo Especial..." value={nuevoColorNombre}
                                        onChange={e => setNuevoColorNombre(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarColor() } }}
                                        style={{ padding: '7px 12px', fontSize: 13 }} />
                                </div>
                                <button type="button" onClick={agregarColor} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
                                    + Agregar
                                </button>
                            </div>
                        </div>

                        {/* Stock y fechas */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Stock disponible</label>
                                <input type="number" name="stock" min="0" className="form-input" value={form.stock} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha inicio</label>
                                <input type="date" name="fecha_inicio" className="form-input" value={form.fecha_inicio} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha fin</label>
                                <input type="date" name="fecha_fin" className="form-input" value={form.fecha_fin} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Banner */}
                        <div className="form-group">
                            <label className="form-label">Banner (imagen)</label>
                            {form.banner_url && (
                                <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                                    <img src={form.banner_url} alt="banner" style={{ height: 80, borderRadius: 10, border: '1px solid var(--color-border)', objectFit: 'cover' }} />
                                    <button type="button" onClick={() => setForm(f => ({ ...f, banner_url: '' }))}
                                        style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ×
                                    </button>
                                </div>
                            )}
                            <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <HiUpload /> {uploading ? 'Subiendo...' : 'Subir imagen'}
                                <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                            Edición activa (visible en catálogo)
                        </label>

                        {saveError && (
                            <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13 }}>
                                ⚠️ {saveError}
                            </div>
                        )}
                        <div className="admin-form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── LISTA ── */}
            <div className="table-wrap">
                {loading ? <div className="spinner" /> : ediciones.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">✨</div>
                        <h3>No hay ediciones limitadas</h3>
                        <p>Creá la primera con el botón de arriba.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead><tr>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Producto</th>
                            <th>Stock</th>
                            <th>Período</th>
                            <th>Colores</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {ediciones.map(ed => (
                                <tr key={ed.id} style={{ opacity: ed.activo ? 1 : 0.6 }}>
                                    <td style={{ fontWeight: 600 }}>
                                        {ed.banner_url && <img src={ed.banner_url} alt="" style={{ width: 32, height: 24, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />}
                                        {ed.nombre}
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                        {ed.tipo === 'producto' ? '📦 Producto' : '🗂️ Colección'}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {ed.productos?.nombre || '—'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{ed.stock}</td>
                                    <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                        {formatFecha(ed.fecha_inicio)} → {formatFecha(ed.fecha_fin)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {Array.isArray(ed.colores_exclusivos) && ed.colores_exclusivos.slice(0, 5).map(c => (
                                                <span key={c.hex} title={c.name} style={{
                                                    width: 16, height: 16, borderRadius: '50%',
                                                    background: c.hex, border: '1.5px solid rgba(0,0,0,0.12)',
                                                    display: 'inline-block', flexShrink: 0,
                                                }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleActivo(ed)}
                                            style={{
                                                background: ed.activo ? '#DCFCE7' : '#FEF2F2',
                                                color: ed.activo ? '#15803D' : '#B91C1C',
                                                border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12,
                                                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                                            }}
                                        >
                                            {ed.activo ? '✓ Activa' : '✕ Inactiva'}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openEdit(ed)}>
                                                <HiPencil /> Editar
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleDelete(ed)}>
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
