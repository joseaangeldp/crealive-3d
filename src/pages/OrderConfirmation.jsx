// ============================================================
// src/pages/OrderConfirmation.jsx — Pantalla animada de confirmación
// ============================================================
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './OrderConfirmation.css'

export default function OrderConfirmation() {
    // Desplazar al top
    useEffect(() => { window.scrollTo(0, 0) }, [])

    return (
        <main className="confirmation-page">
            <div className="confirmation-card card anim-popIn">
                <div className="confirmation-icon anim-float">🎉</div>
                <h1 className="confirmation-title">¡Pedido enviado!</h1>
                <p className="confirmation-msg">
                    Tu pedido fue registrado y abrimos WhatsApp para que te contactes
                    con nosotros. ¡Te atendemos pronto!
                </p>

                <div className="confirmation-steps">
                    {[
                        { icon: '✅', text: 'Pedido guardado' },
                        { icon: '📲', text: 'WhatsApp abierto' },
                        { icon: '⏳', text: 'Te contactamos pronto' },
                    ].map(s => (
                        <div key={s.text} className="confirmation-step">
                            <span>{s.icon}</span>
                            <span>{s.text}</span>
                        </div>
                    ))}
                </div>

                <div className="confirmation-actions">
                    <Link to="/catalogo" className="btn btn-primary">Ver más productos</Link>
                    <Link to="/perfil" className="btn btn-outline">Ver mis pedidos</Link>
                </div>
            </div>
        </main>
    )
}
