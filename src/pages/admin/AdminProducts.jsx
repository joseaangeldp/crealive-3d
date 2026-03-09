// ============================================================
// src/pages/admin/AdminProducts.jsx — CRUD de productos
// Incluye barra de búsqueda, imágenes múltiples y colores por producto
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiEye, HiEyeOff, HiSearch, HiUpload } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { FILAMENT_COLORS } from '../../config'

const EMPTY_FORM = {
    nombre: '', categoria: '', descripcion: '', precio: '',
    imagen_url: '', imagenes: [],
    colores_disponibles: null,   // null = todos, [] = ninguno, [hex, …] = selección
    colores_extra: [],           // [{name, hex}] colores totalmente nuevos
    activo: true,
}
const BUCKET = 'productos'

export default function AdminProducts() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [uploading, setUploading] = useState(false)
    // Estado del formulario de color nuevo
    const [nuevoColorHex, setNuevoColorHex] = useState('#A8C8E8')
    const [nuevoColorNombre, setNuevoColorNombre] = useState('')
    const [colorNombreError, setColorNombreError] = useState('')

    // Modo de colores: 'todos' | 'seleccion' | 'ninguno'
    const colorMode = (() => {
        if (form.colores_disponibles === null) return 'todos'
        if (Array.isArray(form.colores_disponibles) && form.colores_disponibles.length === 0) return 'ninguno'
        return 'seleccion'
    })()

    const fetchProductos = () => {
        supabase.from('productos').select('*').order('nombre')
            .then(({ data }) => { setProductos(data || []); setLoading(false) })
    }

    const fetchCategorias = () => {
        supabase.from('categorias').select('nombre').order('nombre')
            .then(({ data }) => setCategorias((data || []).map(c => c.nombre)))
    }

    useEffect(() => { fetchProductos(); fetchCategorias() }, [])

    const openNew = () => {
        setForm({ ...EMPTY_FORM, categoria: categorias[0] || '' })
        setEditItem(null); setShowForm(true); setSaveError('')
        setNuevoColorHex('#A8C8E8'); setNuevoColorNombre(''); setColorNombreError('')
    }
    const openEdit = p => {
        setForm({
            ...p,
            colores_disponibles: p.colores_disponibles ?? null,
            colores_extra: Array.isArray(p.colores_extra) ? p.colores_extra : [],
        })
        setEditItem(p.id); setShowForm(true); setSaveError('')
        setNuevoColorHex('#A8C8E8'); setNuevoColorNombre(''); setColorNombreError('')
    }
    const closeForm = () => { setShowForm(false); setEditItem(null); setSaveError('') }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    // ── Cambio de modo de colores ──
    const handleColorMode = (mode) => {
        if (mode === 'todos') setForm(f => ({ ...f, colores_disponibles: null }))
        else if (mode === 'ninguno') setForm(f => ({ ...f, colores_disponibles: [], colores_extra: [] }))
        else setForm(f => ({ ...f, colores_disponibles: f.colores_disponibles?.length > 0 ? f.colores_disponibles : [FILAMENT_COLORS[0].hex] }))
    }

    // ── Agregar color personalizado ──
    const agregarColorCustom = () => {
        if (!nuevoColorNombre.trim()) { setColorNombreError('Escribí un nombre para el color'); return }
        const ya = (form.colores_extra || []).some(c => c.hex.toLowerCase() === nuevoColorHex.toLowerCase())
        if (ya) { setColorNombreError('Ya existe ese color'); return }
        setForm(f => ({ ...f, colores_extra: [...(f.colores_extra || []), { hex: nuevoColorHex, name: nuevoColorNombre.trim() }] }))
        setNuevoColorNombre('')
        setNuevoColorHex('#A8C8E8')
        setColorNombreError('')
    }

    const eliminarColorCustom = (hex) => {
        setForm(f => ({ ...f, colores_extra: (f.colores_extra || []).filter(c => c.hex !== hex) }))
    }

    // ── Toggle individual de color ──
    const toggleColor = (hex) => {
        setForm(f => {
            const actual = Array.isArray(f.colores_disponibles) ? f.colores_disponibles : []
            const nuevo = actual.includes(hex) ? actual.filter(h => h !== hex) : [...actual, hex]
            return { ...f, colores_disponibles: nuevo }
        })
    }

    // ── Subir imágenes a Supabase Storage (múltiples) ──
    const handleImageUpload = async e => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        setUploading(true)
        setSaveError('')
        try {
            const newUrls = []
            for (const file of files) {
                const ext = file.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET).upload(fileName, file, { upsert: true })
                if (uploadError) throw uploadError
                const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
                newUrls.push(data.publicUrl)
            }
            setForm(f => {
                const todas = [...(f.imagenes || []), ...newUrls]
                return { ...f, imagenes: todas, imagen_url: todas[0] || f.imagen_url }
            })
        } catch (err) {
            setSaveError(`Error al subir imagen: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (url) => {
        setForm(f => {
            const imagenes = f.imagenes.filter(u => u !== url)
            return { ...f, imagenes, imagen_url: imagenes[0] || '' }
        })
    }

    const handleSave = async e => {
        e.preventDefault()
        setSaving(true)
        setSaveError('')
        try {
            const payload = {
                ...form,
                precio: parseFloat(form.precio),
                colores_disponibles: form.colores_disponibles,
            }
            let result
            if (editItem) {
                result = await supabase.from('productos').update(payload).eq('id', editItem)
            } else {
                result = await supabase.from('productos').insert(payload)
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
                                {categorias.length === 0
                                    ? <option value="">Cargando...</option>
                                    : categorias.map(c => <option key={c} value={c}>{c}</option>)
                                }
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea name="descripcion" className="form-input" rows={2} value={form.descripcion} onChange={handleChange} style={{ resize: 'vertical' }} />
                        </div>

                        {/* Imágenes múltiples */}
                        <div className="form-group">
                            <label className="form-label">Imágenes del producto</label>
                            {(form.imagenes || []).length > 0 && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                    {form.imagenes.map((url, i) => (
                                        <div key={url} style={{ position: 'relative' }}>
                                            <img src={url} alt={`img-${i}`}
                                                style={{
                                                    width: 62, height: 52, objectFit: 'cover', borderRadius: 8,
                                                    border: i === 0 ? '2px solid var(--color-wine)' : '1px solid var(--color-border)'
                                                }} />
                                            {i === 0 && <span style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 9, background: 'var(--color-wine)', color: '#fff', borderRadius: 4, padding: '1px 4px' }}>Principal</span>}
                                            <button type="button" onClick={() => removeImage(url)}
                                                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <HiUpload />
                                {uploading ? 'Subiendo...' : 'Subir fotos'}
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>Podés seleccionar varias a la vez</span>
                        </div>

                        {/* ── Colores disponibles ── */}
                        <div className="form-group">
                            <label className="form-label">Colores de filamento disponibles</label>

                            {/* Selector de modo */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                                {[
                                    { id: 'todos', label: '🌈 Todos los colores' },
                                    { id: 'seleccion', label: '✏️ Selección personalizada' },
                                    { id: 'ninguno', label: '🚫 Sin colores (sin stock)' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleColorMode(opt.id)}
                                        style={{
                                            padding: '6px 14px',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            borderRadius: 20,
                                            border: '1.5px solid',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-body)',
                                            borderColor: colorMode === opt.id ? 'var(--color-wine)' : 'var(--color-border)',
                                            background: colorMode === opt.id ? 'var(--color-wine)' : 'transparent',
                                            color: colorMode === opt.id ? '#fff' : 'var(--color-text)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid de colores cuando modo es 'seleccion' */}
                            {colorMode === 'seleccion' && (
                                <div>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                                        Hacé clic en los colores para activarlos o desactivarlos:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {FILAMENT_COLORS.map(color => {
                                            const activo = Array.isArray(form.colores_disponibles) && form.colores_disponibles.includes(color.hex)
                                            return (
                                                <button
                                                    key={color.hex}
                                                    type="button"
                                                    onClick={() => toggleColor(color.hex)}
                                                    title={color.name}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '6px',
                                                        border: activo ? '2px solid var(--color-wine)' : '2px solid var(--color-border)',
                                                        borderRadius: 10,
                                                        background: activo ? 'rgba(196,118,138,0.08)' : 'transparent',
                                                        cursor: 'pointer',
                                                        opacity: activo ? 1 : 0.5,
                                                        transition: 'all 0.15s',
                                                        minWidth: 52,
                                                    }}
                                                >
                                                    <span style={{
                                                        width: 28, height: 28, borderRadius: '50%',
                                                        background: color.hex,
                                                        border: '1px solid rgba(0,0,0,0.1)',
                                                        display: 'block',
                                                    }} />
                                                    <span style={{ fontSize: 9, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                                                        {color.name}
                                                    </span>
                                                    {activo && <span style={{ fontSize: 10, color: 'var(--color-wine)' }}>✓</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {Array.isArray(form.colores_disponibles) && form.colores_disponibles.length === 0 && (
                                        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
                                            ⚠️ No seleccionaste ningún color — esto es equivalente a "Sin colores".
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Vista previa para modo 'todos' o 'ninguno' */}
                            {colorMode === 'todos' && (
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    Se mostrarán los {FILAMENT_COLORS.length} colores globales del catálogo.
                                </p>
                            )}
                            {colorMode === 'ninguno' && (
                                <p style={{ fontSize: 12, color: '#ef4444' }}>
                                    🚫 El producto aparecerá como sin stock de filamento. Los clientes no podrán hacer pedidos.
                                </p>
                            )}

                            {/* ── Colores personalizados (extra) ── */}
                            {colorMode !== 'ninguno' && (
                                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>➕ Agregar color personalizado</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                                        ¿Tenés un filamento que no está en la lista? Agregalo con su nombre y color exacto.
                                    </p>

                                    {/* Colores custom ya agregados */}
                                    {(form.colores_extra || []).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                            {(form.colores_extra || []).map(c => (
                                                <div key={c.hex} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '5px 10px', borderRadius: 20,
                                                    background: 'var(--color-surface-2)',
                                                    border: '1px solid var(--color-border)',
                                                    fontSize: 12,
                                                }}>
                                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.hex}</span>
                                                    <button type="button" onClick={() => eliminarColorCustom(c.hex)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Formulario para nuevo color */}
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div>
                                            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Color</label>
                                            <input
                                                type="color"
                                                value={nuevoColorHex}
                                                onChange={e => setNuevoColorHex(e.target.value)}
                                                style={{ width: 48, height: 36, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 140 }}>
                                            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Nombre del color</label>
                                            <input
                                                className="form-input"
                                                placeholder="Ej: Coral, Turquesa..."
                                                value={nuevoColorNombre}
                                                onChange={e => { setNuevoColorNombre(e.target.value); setColorNombreError('') }}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarColorCustom() } }}
                                                style={{ padding: '7px 12px', fontSize: 13 }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={agregarColorCustom}
                                            className="btn btn-primary"
                                            style={{ padding: '8px 16px', fontSize: 13 }}
                                        >
                                            + Agregar
                                        </button>
                                    </div>
                                    {colorNombreError && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠️ {colorNombreError}</p>}
                                </div>
                            )}
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
                            <th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Colores</th><th>Estado</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {filtrados.map(p => {
                                const numColores = p.colores_disponibles === null ? FILAMENT_COLORS.length
                                    : Array.isArray(p.colores_disponibles) ? p.colores_disponibles.length : FILAMENT_COLORS.length
                                const sinStock = Array.isArray(p.colores_disponibles) && p.colores_disponibles.length === 0
                                return (
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
                                        <td>
                                            {sinStock
                                                ? <span className="badge badge-cancelado">🚫 Sin stock</span>
                                                : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                    {numColores === FILAMENT_COLORS.length ? 'Todos' : `${numColores} colores`}
                                                </span>
                                            }
                                        </td>
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
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
