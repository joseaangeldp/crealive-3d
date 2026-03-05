// ============================================================
// src/pages/admin/AdminMarketing.jsx — Email Marketing con diseño
// Template HTML con logo, banner, botón CTA y footer de marca
// ============================================================
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RESEND_API_KEY, WHATSAPP_NEGOCIO } from '../../config'

const LOGO_URL = 'https://crealive3d.vercel.app/favicon.png'
const SITE_URL = 'https://crealive3d.vercel.app'

function buildEmail({ nombre = '', asunto, cuerpo, imagenUrl, btnTexto, btnUrl }) {
    const banner = imagenUrl
        ? `<img src="${imagenUrl}" alt="Banner" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:24px;display:block">`
        : ''
    const cta = btnTexto
        ? `<div style="text-align:center;margin:28px 0">
            <a href="${btnUrl || SITE_URL}" style="display:inline-block;background:#C4768A;color:#fff;padding:14px 36px;border-radius:30px;text-decoration:none;font-weight:700;font-size:15px;font-family:sans-serif">
              ${btnTexto} →
            </a>
          </div>`
        : ''

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0ED;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" style="max-width:520px;background:#FAFAF8;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2E2E2E 0%,#3d3232 100%);padding:28px 32px;text-align:center">
            <img src="${LOGO_URL}" alt="Crealive 3D" width="52" height="52" style="border-radius:12px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;color:#F5C6D8;letter-spacing:0.04em">Crealive 3D</h1>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:0.08em;text-transform:uppercase">Impresión 3D personalizada</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            ${banner}
            <p style="margin:0 0 16px;font-size:16px;color:#2E2E2E">Hola ${nombre ? nombre : 'there'},</p>
            <div style="font-size:15px;line-height:1.75;color:#444">${cuerpo.replace(/\n/g, '<br>')}</div>
            ${cta}
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #EDEDEA;margin:0"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;text-align:center">
            <p style="margin:0 0 8px;font-size:13px;color:#888">Seguinos y escribinos</p>
            <a href="https://wa.me/${WHATSAPP_NEGOCIO}" style="display:inline-block;background:#25D366;color:#fff;padding:8px 20px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;margin-bottom:12px">WhatsApp</a>
            <p style="margin:8px 0 0;font-size:11px;color:#bbb">Recibís este email porque te registraste en Crealive 3D.<br>Para darte de baja respondé este email con "Baja".</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export default function AdminMarketing() {
    const [form, setForm] = useState({
        asunto: '',
        cuerpo: '',
        imagenUrl: '',
        btnTexto: '',
        btnUrl: '',
    })
    const [preview, setPreview] = useState(false)
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState(null)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSend = async e => {
        e.preventDefault()
        if (!RESEND_API_KEY || RESEND_API_KEY === 're_xxxxxxxxxx') {
            setResult({ ok: false, text: 'Configurá VITE_RESEND_API_KEY en tu .env y en Vercel.' })
            return
        }
        setSending(true)
        setResult(null)
        try {
            const { data: clientes } = await supabase.from('clientes').select('email, nombre').eq('activo', true)
            if (!clientes?.length) {
                setResult({ ok: false, text: 'No hay clientes activos registrados.' })
                setSending(false)
                return
            }
            const destinos = clientes.map(c => ({
                from: 'Crealive 3D <noreply@crealive3d.com>',
                to: [c.email],
                subject: form.asunto,
                html: buildEmail({ nombre: c.nombre, ...form }),
            }))
            const res = await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(destinos.slice(0, 50)),
            })
            if (res.ok) {
                setResult({ ok: true, text: `✅ Email enviado a ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}.` })
                setForm({ asunto: '', cuerpo: '', imagenUrl: '', btnTexto: '', btnUrl: '' })
            } else {
                const err = await res.json()
                setResult({ ok: false, text: `Error: ${err.message}` })
            }
        } catch (err) {
            setResult({ ok: false, text: `Error: ${err.message}` })
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Email Marketing</h1>
                <button type="button" className="btn btn-outline" style={{ fontSize: 13, padding: '7px 16px' }}
                    onClick={() => setPreview(p => !p)}>
                    {preview ? '✏️ Editar' : '👁 Preview'}
                </button>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
                Enviá un email con diseño a todos los clientes registrados usando{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-wine)' }}>Resend</a>.
            </p>

            {preview ? (
                /* ── Vista previa del email ── */
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--color-surface-2)', fontSize: 13, borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <strong>Asunto:</strong> {form.asunto || '(sin asunto)'}
                    </div>
                    <div
                        style={{ padding: 0 }}
                        dangerouslySetInnerHTML={{ __html: buildEmail({ nombre: 'María', ...form }) }}
                    />
                </div>
            ) : (
                /* ── Formulario ── */
                <div className="card" style={{ padding: 28 }}>
                    <form className="admin-form" onSubmit={handleSend}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="mk-asunto">Asunto del email</label>
                            <input id="mk-asunto" name="asunto" className="form-input"
                                placeholder="Ej: ¡Novedades de temporada 🎉" value={form.asunto} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="mk-cuerpo">Mensaje principal</label>
                            <textarea id="mk-cuerpo" name="cuerpo" className="form-input" rows={6}
                                style={{ resize: 'vertical' }}
                                placeholder="Escribí el texto del email aquí. Podés usar saltos de línea."
                                value={form.cuerpo} onChange={handleChange} required />
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginTop: 4 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--color-text-muted)' }}>Opcionales</p>
                            <div className="form-group">
                                <label className="form-label" htmlFor="mk-img">URL de imagen banner (opcional)</label>
                                <input id="mk-img" name="imagenUrl" type="url" className="form-input"
                                    placeholder="https://... (foto de producto, promoción, etc.)"
                                    value={form.imagenUrl} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="mk-btn">Texto del botón CTA</label>
                                    <input id="mk-btn" name="btnTexto" className="form-input"
                                        placeholder="Ej: Ver catálogo"
                                        value={form.btnTexto} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="mk-url">URL del botón</label>
                                    <input id="mk-url" name="btnUrl" type="url" className="form-input"
                                        placeholder="https://crealive3d.vercel.app/catalogo"
                                        value={form.btnUrl} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {result && (
                            <div style={result.ok
                                ? { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14 }
                                : { background: '#FFF5F5', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14 }}>
                                {result.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" className="btn btn-outline" style={{ fontSize: 13 }}
                                onClick={() => setPreview(true)}>
                                👁 Ver preview
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={sending} style={{ flex: 1, fontSize: 14 }}>
                                {sending ? 'Enviando...' : '📧 Enviar a todos los clientes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

