// ============================================================
// src/pages/admin/AdminProducts.jsx — CRUD de productos
// Agregar, editar y desactivar productos del catálogo
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiPencil, HiEye, HiEyeOff } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS } from '../../config'

const EMPTY_FORM = { nombre: '', categoria: CATEGORIAS[1], descripcion: '', precio: '', imagen_url: '', activo: true }

export default function AdminProducts() {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const fetchProductos = () => {
        supabase.from('productos').select('*').order('nombre')
            .then(({ data }) => { setProductos(data || []); setLoading(false) })
    }
    useEffect(fetchProductos, [])

    const openNew = () => { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true) }
    const openEdit = p => { setForm(p); setEditItem(p.id); setShowForm(true) }
    const closeForm = () => { setShowForm(false); setEditItem(null) }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSave = async e => {
        e.preventDefault()
        setSaving(true)
        if (editItem) {
            await supabase.from('productos').update({ ...form, precio: parseFloat(form.precio) }).eq('id', editItem)
        } else {
            await supabase.from('productos').insert({ ...form, precio: parseFloat(form.precio) })
        }
        setSaving(false)
        closeForm()
        fetchProductos()
    }

    const toggleActivo = async (id, activo) => {
        await supabase.from('productos').update({ activo: !activo }).eq('id', id)
        setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: !activo } : p))
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Productos</h1>
                <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    <HiPlus /> Agregar
                </button>
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
                        <div className="form-group">
                            <label className="form-label">URL de imagen</label>
                            <input name="imagen_url" type="url" className="form-input" placeholder="https://..." value={form.imagen_url} onChange={handleChange} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                            Producto activo (visible en catálogo)
                        </label>
                        <div className="admin-form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                {loading ? <div className="spinner" /> : (
                    <table className="admin-table">
                        <thead><tr>
                            <th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {productos.map(p => (
                                <tr key={p.id}>
                                    <td><img src={p.imagen_url || ''} alt={p.nombre} style={{ width: 48, height: 38, objectFit: 'cover', borderRadius: 8, background: '#eee' }} /></td>
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
