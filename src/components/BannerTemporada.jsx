// ============================================================
// src/components/BannerTemporada.jsx
// Notificación temática de temporada — descartable, no bloqueante.
//
// TODA la lógica temática vive acá + en src/config/tema-temporada.js.
// Para cambiar de béisbol a Navidad o apagarla: editá el config, nada más.
// ============================================================
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HiX } from 'react-icons/hi'
import { temaTemporada } from '../config/tema-temporada'
import './BannerTemporada.css'

const STORAGE_PREFIX = 'crealive_promo_'

// ── Registro de animaciones por tema ─────────────────────────
// Para sumar un tema nuevo: agregá una entrada acá y su bloque CSS
// en BannerTemporada.css. No se toca ningún otro componente.
const ANIMACIONES = {
    beisbol: () => (
        <span className="bt-anim bt-anim--beisbol" aria-hidden="true">
            <span className="bt-pelota" />
            <span className="bt-bate" />
        </span>
    ),
    navidad: () => (
        <span className="bt-anim bt-anim--navidad" aria-hidden="true">
            <span className="bt-copo">❄</span>
        </span>
    ),
    halloween: () => (
        <span className="bt-anim bt-anim--halloween" aria-hidden="true">
            <span className="bt-calabaza">🎃</span>
        </span>
    ),
}

export default function BannerTemporada() {
    const {
        activo, tema, coleccionId, texto, animacion, delayMs, rutasExcluidas,
    } = temaTemporada
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const [visible, setVisible] = useState(false)

    const storageKey = `${STORAGE_PREFIX}${tema}`
    const destino = `/coleccion/${coleccionId}`

    // ¿Corresponde mostrarla en esta ruta / estado?
    const rutaExcluida = (rutasExcluidas || []).some(
        (r) => pathname === r || pathname.startsWith(`${r}/`),
    )
    const yaEnColeccion = pathname === destino
    let yaCerrada = false
    try { yaCerrada = localStorage.getItem(storageKey) === 'cerrada' } catch { /* localStorage no disponible */ }

    const permitida = activo && !rutaExcluida && !yaEnColeccion && !yaCerrada

    // Aparece unos segundos DESPUÉS de cargar. No bloquea la carga:
    // el componente renderiza null hasta que el temporizador la habilita.
    useEffect(() => {
        if (!permitida) { setVisible(false); return }
        const t = setTimeout(() => setVisible(true), delayMs)
        return () => clearTimeout(t)
    }, [permitida, delayMs])

    if (!permitida || !visible) return null

    const Animacion = ANIMACIONES[animacion] || ANIMACIONES.beisbol

    const cerrar = (e) => {
        e.stopPropagation()
        // Al cerrar, no vuelve a aparecer para ESTE tema.
        try { localStorage.setItem(storageKey, 'cerrada') } catch { /* noop */ }
        setVisible(false)
    }

    return (
        <div className="banner-temporada" role="region" aria-label={texto.titulo}>
            <button type="button" className="banner-temporada__card" onClick={() => navigate(destino)}>
                <span className="banner-temporada__anim"><Animacion /></span>
                <span className="banner-temporada__text">
                    <span className="banner-temporada__titulo">{texto.titulo}</span>
                    {texto.descripcion && (
                        <span className="banner-temporada__desc">{texto.descripcion}</span>
                    )}
                    <span className="banner-temporada__cta">{texto.cta} →</span>
                </span>
            </button>
            <button
                type="button"
                className="banner-temporada__close"
                onClick={cerrar}
                aria-label="Cerrar notificación"
            >
                <HiX size={20} />
            </button>
        </div>
    )
}
