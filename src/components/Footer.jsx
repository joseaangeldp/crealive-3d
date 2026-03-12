// ============================================================
// src/components/Footer.jsx — Footer global
// ============================================================
// 👇 Edita aquí los enlaces de tus redes sociales
// ============================================================
import { Link } from 'react-router-dom'
import { WHATSAPP_NEGOCIO } from '../config'
import './Footer.css'

const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/crealive3d',   // ← pon tu @
    facebook: 'https://facebook.com/crealive3d',    // ← pon tu página
    tiktok: 'https://tiktok.com/@crealive3d',     // ← pon tu @
}

const EMAIL_CONTACTO = 'contacto@crealive3d.com'     // ← pon tu email real

// ─── Íconos SVG ────────────────────────────────────────────────
function IconInstagram() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
    )
}

function IconFacebook() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    )
}

function IconTikTok() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5
                     2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01
                     a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34
                     6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.54V6.79
                     a4.84 4.84 0 0 1-1.07-.1z" />
        </svg>
    )
}


function IconWhatsApp() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                     -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463
                     -2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
                     .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371
                     -.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                     -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016
                     -1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077
                     4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085
                     1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198
                     -.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214
                     -3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45
                     4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0
                     1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815
                     11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142
                     1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005
                     c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
    )
}

function IconMail() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polyline points="2,4 12,13 22,4" />
        </svg>
    )
}

function IconPrint3D() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="1" />
        </svg>
    )
}

// ─── Componente principal ───────────────────────────────────────
export default function Footer() {
    const year = new Date().getFullYear()
    const waUrl = `https://wa.me/${WHATSAPP_NEGOCIO}?text=Hola%20Crealive%203D%2C%20quisiera%20hacer%20un%20pedido%20%F0%9F%98%8A`

    const socials = [
        { key: 'instagram', url: SOCIAL_LINKS.instagram, icon: <IconInstagram />, label: 'Instagram' },
        { key: 'facebook', url: SOCIAL_LINKS.facebook, icon: <IconFacebook />, label: 'Facebook' },
        { key: 'tiktok', url: SOCIAL_LINKS.tiktok, icon: <IconTikTok />, label: 'TikTok' },
        { key: 'whatsapp', url: waUrl, icon: <IconWhatsApp />, label: 'WhatsApp' },
    ]

    return (
        <footer className="site-footer">
            <div className="container footer-inner">

                {/* ── Marca ── */}
                <div className="footer-brand">
                    <span className="footer-logo">Crealive 3D</span>
                    <p className="footer-tagline">
                        Impresión 3D artesanal,<br />personalizada y con amor.
                    </p>

                    {/* Redes sociales — íconos */}
                    <div className="footer-socials">
                        {socials.map(s => (
                            <a key={s.key}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`footer-social-link footer-social-link--${s.key}`}
                                aria-label={s.label}
                                title={s.label}
                            >
                                {s.icon}
                                <span className="footer-social-name">{s.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* ── Navegación ── */}
                <div className="footer-col">
                    <h4 className="footer-col-title">Navegar</h4>
                    <ul className="footer-links">
                        <li><Link to="/">Inicio</Link></li>
                        <li><Link to="/catalogo">Catálogo</Link></li>
                        <li><Link to="/galeria">Galería</Link></li>
                        <li><Link to="/perfil">Mi cuenta</Link></li>
                    </ul>
                </div>

                {/* ── Contacto ── */}
                <div className="footer-col">
                    <h4 className="footer-col-title">Contacto</h4>
                    <ul className="footer-links">
                        <li>
                            <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                <IconWhatsApp />
                                WhatsApp
                            </a>
                        </li>
                        {SOCIAL_LINKS.instagram && (
                            <li>
                                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">
                                    <IconInstagram />
                                    Instagram
                                </a>
                            </li>
                        )}
                        <li>
                            <a href={`mailto:${EMAIL_CONTACTO}`}>
                                <IconMail />
                                {EMAIL_CONTACTO}
                            </a>
                        </li>
                    </ul>

                    {/* Mini-CTA WhatsApp */}
                    <a href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-wa-btn"
                    >
                        <IconWhatsApp />
                        Hacer un pedido
                    </a>
                </div>

            </div>

            {/* ── Separador degradado ── */}
            <div className="footer-divider" />

            {/* ── Copyright ── */}
            <div className="footer-bottom">
                <div className="container footer-bottom__inner">
                    <span className="footer-bottom__print">
                        <IconPrint3D />
                    </span>
                    <p>© {year} Crealive 3D · Todos los derechos reservados</p>
                    <p className="footer-made-with">Hecho con ❤️ y filamento PLA</p>
                </div>
            </div>
        </footer>
    )
}
