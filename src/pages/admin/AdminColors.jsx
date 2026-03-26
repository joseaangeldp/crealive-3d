// ============================================================
// src/pages/admin/AdminColors.jsx — Gestión de paleta de colores
// Permite añadir, editar, marcar disponible/no disponible y eliminar colores
// ============================================================
import { useEffect, useState } from 'react'
import { HiPlus, HiTrash, HiPencil, HiCheck, HiX } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = { name: '', hex: '#A8C8E8' }

export default function AdminColors() {
    const [colors, setColors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    // Edición inline
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState(EMPTY_FORM)

    const fetchColors = async () => {
        setLoading(true)
        const { data } = await supabase.from('filament_colors').select('*').order('orden')
        setColors(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchColors() }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) { setError('Escribí un nombre para el color'); return }
        setSaving(true); setError('')
        const orden = (colors[colors.length - 1]?.orden || 0) + 1
        const { error: err } = await supabase.from('filament_colors').insert({ name: form.name.trim(), hex: form.hex, disponible: true, orden })
        if (err) { setError(err.message); setSaving(false); return }
        setSuccess(`Color "${form.name.trim()}" agregado.`)
        setForm(EMPTY_FORM)
        setShowForm(false)
        fetchColors()
        setSaving(false)
    }

    const toggleDisponible = async (color) => {
        await supabase.from('filament_colors').update({ disponible: !color.disponible }).eq('id', color.id)
        setColors(prev => prev.map(c => c.id === color.id ? { ...c, disponible: !c.disponible } : c))
    }

    const handleDelete = async (color) => {
        if (!window.confirm(`¿Eliminar el color "${color.name}"? Esto puede afectar productos que lo usen.`)) return
        await supabase.from('filament_colors').delete().eq('id', color.id)
        setColors(prev => prev.filter(c => c.id !== color.id))
        setSuccess(`Color "${color.name}" eliminado.`)
    }

    const startEdit = (color) => {
        setEditingId(color.id)
        setEditForm({ name: color.name, hex: color.hex })
    }

    const saveEdit = async (color) => {
        if (!editForm.name.trim()) return
        await supabase.from('filament_colors').update({ name: editForm.name.trim(), hex: editForm.hex }).eq('id', color.id)
        setColors(prev => prev.map(c => c.id === color.id ? { ...c, name: editForm.name.trim(), hex: editForm.hex } : c))
        setEditingId(null)
        setSuccess('Color actualizado.')
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>🎨 Colores de Filamento</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setError('') }} style={{ fontSize: 13, padding: '8px 18px' }}>
                    <HiPlus /> Agregar color
                </button>
            </div>

            {error && <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>✓ {success}</div>}

            {/* Formulario agregar */}
            {showForm && (
                <div className="card" style={{ padding: '20px 24px', marginBottom: 24, maxWidth: 480 }}>
                    <h2 className="admin-form-title" style={{ marginBottom: 16 }}>Nuevo color</h2>
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Color</label>
                            <input type="color" value={form.hex} onChange={e => setForm(f => ({ ...f, hex: e.target.value }))}
                                style={{ width: 48, height: 38, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Nombre del color</label>
                            <input className="form-input" placeholder="Ej: Turquesa, Coral..." value={form.name}
                                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }}
                                style={{ padding: '7px 12px', fontSize: 13 }} required />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontSize: 13, padding: '8px 16px' }}>
                                {saving ? 'Guardando...' : '+ Agregar'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 13 }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid de colores */}
            {loading ? <div className="spinner" /> : (
                <div className="table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 56 }}>Color</th>
                                <th>Nombre</th>
                                <th>Hex</th>
                                <th style={{ textAlign: 'center' }}>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colors.map(color => (
                                <tr key={color.id} style={{ opacity: color.disponible ? 1 : 0.55 }}>
                                    <td>
                                        <span style={{
                                            display: 'block', width: 32, height: 32, borderRadius: '50%',
                                            background: color.hex, border: '2px solid rgba(0,0,0,0.08)',
                                        }} />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {editingId === color.id ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input type="color" value={editForm.hex} onChange={e => setEditForm(f => ({ ...f, hex: e.target.value }))}
                                                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 1 }} />
                                                <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(color); if (e.key === 'Escape') setEditingId(null) }}
                                                    autoFocus style={{ padding: '5px 10px', fontSize: 13, maxWidth: 180 }} />
                                            </div>
                                        ) : color.name}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                        {color.hex}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => toggleDisponible(color)}
                                            style={{
                                                background: color.disponible ? '#DCFCE7' : '#FEF2F2',
                                                color: color.disponible ? '#15803D' : '#B91C1C',
                                                border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12,
                                                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                                            }}
                                        >
                                            {color.disponible ? '✓ Disponible' : '✕ No disponible'}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {editingId === color.id ? (
                                                <>
                                                    <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                                                        onClick={() => saveEdit(color)}>
                                                        <HiCheck /> Guardar
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>
                                                        <HiX />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                                                        onClick={() => startEdit(color)}>
                                                        <HiPencil /> Editar
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        onClick={() => handleDelete(color)}>
                                                        <HiTrash /> Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {colors.length === 0 && (
                        <div className="empty-state">
                            <div className="icon">🎨</div>
                            <h3>No hay colores en la paleta</h3>
                            <p>Agregá tu primer color con el botón de arriba.</p>
                        </div>
                    )}
                </div>
            )}

            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
                💡 Los colores marcados como "No disponible" no aparecerán en el catálogo ni en los pedidos.
            </p>
        </div>
    )
}
