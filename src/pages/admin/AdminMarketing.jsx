// ============================================================
// src/pages/admin/AdminMarketing.jsx — Lista de clientes para campañas
//
// El envío de correos desde el navegador se eliminó a propósito: usaba
// una API key expuesta en el bundle público. Las campañas se envían
// desde una herramienta externa (Brevo/Mailchimp) cargando la lista;
// el opt-in explícito por canal llega con el bloque de consentimiento.
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminMarketing() {
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [copiado, setCopiado] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('clientes')
                .select('nombre, email, whatsapp, fecha_registro')
                .eq('activo', true)
                .order('fecha_registro', { ascending: false })
            setClientes(data || [])
            setLoading(false)
        }
        load()
    }, [])

    const exportarCSV = () => {
        const filas = [
            ['nombre', 'email', 'whatsapp', 'fecha_registro'],
            ...clientes.map(c => [c.nombre || '', c.email || '', c.whatsapp || '', c.fecha_registro || '']),
        ]
        const csv = filas
            .map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clientes-crealive-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const copiarEmails = () => {
        navigator.clipboard.writeText(clientes.map(c => c.email).filter(Boolean).join(', ')).then(() => {
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        })
    }

    const formatFecha = iso => iso ? new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric'
    }) : '—'

    return (
        <div style={{ maxWidth: 760 }}>
            <h1 className="admin-page-title">Email Marketing</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
                Exportá la lista de clientes y cargala en tu herramienta de campañas
                (Brevo, Mailchimp). El envío no se hace desde el panel.
            </p>

            {loading ? (
                <div className="spinner" />
            ) : clientes.length === 0 ? (
                <div className="empty-state">
                    <h3>Aún no hay clientes registrados</h3>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" style={{ fontSize: 14 }} onClick={exportarCSV}>
                            Exportar CSV ({clientes.length})
                        </button>
                        <button className="btn btn-outline" style={{ fontSize: 14 }} onClick={copiarEmails}>
                            {copiado ? 'Copiado' : 'Copiar emails'}
                        </button>
                    </div>

                    <div className="table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr><th>Nombre</th><th>Email</th><th>WhatsApp</th><th>Registro</th></tr>
                            </thead>
                            <tbody>
                                {clientes.map((c, i) => (
                                    <tr key={c.email || i}>
                                        <td style={{ fontWeight: 600 }}>{c.nombre || '—'}</td>
                                        <td>{c.email || '—'}</td>
                                        <td style={{ fontSize: 12 }}>{c.whatsapp || '—'}</td>
                                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatFecha(c.fecha_registro)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
