// ============================================================
// src/pages/admin/AdminMarketing.jsx — Email Marketing masivo
// Usa Resend API para enviar emails a todos los clientes
// ============================================================
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RESEND_API_KEY } from '../../config'

export default function AdminMarketing() {
    const [form, setForm] = useState({ asunto: '', mensaje: '' })
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState(null) // { ok, text }

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSend = async e => {
        e.preventDefault()
        if (!RESEND_API_KEY || RESEND_API_KEY === 're_xxxxxxxxxx') {
            setResult({ ok: false, text: 'Configurá VITE_RESEND_API_KEY en tu archivo .env para enviar emails.' })
            return
        }

        setSending(true)
        setResult(null)

        try {
            // Obtener todos los emails de la tabla clientes
            const { data: clientes } = await supabase
                .from('clientes')
                .select('email, nombre')
                .eq('activo', true)

            if (!clientes || clientes.length === 0) {
                setResult({ ok: false, text: 'No hay clientes activos registrados.' })
                setSending(false)
                return
            }

            // Enviar batch via Resend API
            // Resend soporta hasta 50 destinatarios por batch. Para listas grandes,
            // dividir en grupos de 50.
            const destinos = clientes.map(c => ({
                from: 'Crealive 3D <noreply@crealive3d.com>',
                to: [c.email],
                subject: form.asunto,
                html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAFAF8;border-radius:16px">
            <h1 style="font-family:Georgia,serif;color:#C4768A;font-size:26px;margin-bottom:16px">Crealive 3D</h1>
            <p>Hola ${c.nombre || ''},</p>
            <div style="margin:20px 0;line-height:1.7;color:#2E2E2E">${form.mensaje.replace(/\n/g, '<br>')}</div>
            <hr style="border:none;border-top:1px solid #EDEDEA;margin:24px 0">
            <p style="font-size:12px;color:#7a7a7a">Recibís este email porque te registraste en Crealive 3D. Para darte de baja respondé este email.</p>
          </div>
        `,
            }))

            // Llamar a Resend batch endpoint
            const res = await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(destinos.slice(0, 50)), // máx 50 por batch
            })

            if (res.ok) {
                setResult({ ok: true, text: `✅ Email enviado a ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} correctamente.` })
                setForm({ asunto: '', mensaje: '' })
            } else {
                const err = await res.json()
                setResult({ ok: false, text: `Error: ${err.message || 'Respuesta inválida de Resend.'}` })
            }
        } catch (err) {
            setResult({ ok: false, text: `Error de red: ${err.message}` })
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <h1 className="admin-page-title">Email Marketing</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 28, fontSize: 14 }}>
                Enviá un email a todos los clientes registrados. Usamos la API de{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-wine)' }}>Resend</a>
                . Acordate de configurar <code>VITE_RESEND_API_KEY</code> en tu <code>.env</code>.
            </p>

            <div className="card" style={{ padding: 28 }}>
                <form className="admin-form" onSubmit={handleSend}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="mk-asunto">Asunto del email</label>
                        <input id="mk-asunto" name="asunto" className="form-input"
                            placeholder="Ej: Novedades de la temporada 🎉"
                            value={form.asunto} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="mk-mensaje">Cuerpo del mensaje</label>
                        <textarea id="mk-mensaje" name="mensaje" className="form-input"
                            rows={8} style={{ resize: 'vertical' }}
                            placeholder="Escribí el contenido del email aquí. Podés usar saltos de línea."
                            value={form.mensaje} onChange={handleChange} required />
                    </div>

                    {result && (
                        <div className={result.ok ? '' : 'auth-error'} style={result.ok ? {
                            background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D',
                            borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14,
                        } : {}}>
                            {result.text}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={sending}
                        style={{ padding: '13px 28px', fontSize: 14 }}>
                        {sending ? 'Enviando...' : '📧 Enviar a todos los clientes'}
                    </button>
                </form>
            </div>
        </div>
    )
}
