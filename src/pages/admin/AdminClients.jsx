// ============================================================
// src/pages/admin/AdminClients.jsx — Gestión de clientes
// Tabla con todos los clientes y exportación CSV
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminClients() {
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('clientes')
            .select('*, pedidos(count)')
            .order('fecha_registro', { ascending: false })
            .then(({ data }) => { setClientes(data || []); setLoading(false) })
    }, [])

    // Exportar lista de emails como CSV
    const exportarCSV = () => {
        const headers = ['Nombre', 'Email', 'WhatsApp', 'Fecha de registro']
        const rows = clientes.map(c => [
            c.nombre,
            c.email,
            c.whatsapp || '',
            new Date(c.fecha_registro).toLocaleDateString('es-AR'),
        ])
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'clientes-crealive3d.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const formatFecha = iso => new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric'
    })

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
                    Clientes <span style={{ fontSize: '16px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>({clientes.length})</span>
                </h1>
                <button className="btn btn-outline" onClick={exportarCSV} style={{ padding: '8px 20px', fontSize: '13px' }}>
                    📥 Exportar CSV
                </button>
            </div>

            <div className="table-wrap">
                {loading ? (
                    <div className="spinner" />
                ) : clientes.length === 0 ? (
                    <div className="empty-state"><div className="icon">👥</div><h3>Sin clientes registrados</h3></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>WhatsApp</th>
                                <th>Registro</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                                    <td style={{ fontSize: '13px' }}>{c.email}</td>
                                    <td style={{ fontSize: '13px' }}>{c.whatsapp || '—'}</td>
                                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatFecha(c.fecha_registro)}</td>
                                    <td>
                                        <span className={`badge ${c.activo ? 'badge-entregado' : 'badge-cancelado'}`}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
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
