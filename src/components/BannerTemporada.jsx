// ============================================================
// src/components/BannerTemporada.jsx
// Notificación temática de temporada — descartable, no bloqueante.
//
// TODA la lógica temática vive acá + en src/config/tema-temporada.js.
// Para cambiar de béisbol a Navidad o apagarla: editá el config, nada más.
// ============================================================
import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HiX, HiVolumeUp, HiVolumeOff } from 'react-icons/hi'
import { temaTemporada } from '../config/tema-temporada'
import './BannerTemporada.css'

const STORAGE_PREFIX = 'crealive_promo_'
const PERIODO_MS = 1800   // debe coincidir con la duración de las animaciones CSS
const CONTACTO = 0.42     // fracción del ciclo en la que el bate golpea la pelota

// ── Registro de animaciones por tema ─────────────────────────
// Para sumar un tema nuevo: agregá una entrada acá + su bloque CSS
// en BannerTemporada.css. No se toca ningún otro componente.
// Cada animación recibe { onSwing } para sincronizar el sonido con el golpe.
const ANIMACIONES = {
    beisbol: ({ onSwing }) => (
        <svg className="bt-scene" viewBox="0 0 200 160" aria-hidden="true">
            <defs>
                <linearGradient id="btWood" x1="0" y1="0" x2="1" y2="1.2">
                    <stop offset="0" stopColor="#F3DBB6" />
                    <stop offset="0.5" stopColor="#C88A4E" />
                    <stop offset="1" stopColor="#8A5A2C" />
                </linearGradient>
                <radialGradient id="btBall" cx="0.36" cy="0.3" r="0.85">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.75" stopColor="#F1EADB" />
                    <stop offset="1" stopColor="#D6C9B0" />
                </radialGradient>
                <radialGradient id="btGlow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="rgba(232,96,44,0.4)" />
                    <stop offset="1" stopColor="rgba(232,96,44,0)" />
                </radialGradient>
            </defs>

            {/* resplandor suave detrás */}
            <circle className="bt-glow" cx="100" cy="82" r="74" fill="url(#btGlow)" />

            {/* destello de impacto */}
            <g className="bt-impact">
                <path d="M150 34 l7 17 17 7 -17 7 -7 17 -7 -17 -17 -7 17 -7 z"
                    fill="#FFE08A" stroke="#E8602C" strokeWidth="1.6" strokeLinejoin="round" />
            </g>

            {/* pelota con costuras */}
            <g className="bt-ball">
                <circle cx="150" cy="52" r="13" fill="url(#btBall)" stroke="#CBBEA3" strokeWidth="1" />
                <path d="M142 44 q4.5 8 0 16 M158 44 q-4.5 8 0 16"
                    fill="none" stroke="#D6455F" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* bate */}
            <g className="bt-bat" onAnimationIteration={onSwing}>
                <path className="bt-bat__body"
                    d="M100 28 C113 28 115 66 108 106 L104 140 L96 140 L92 106 C85 66 87 28 100 28 Z"
                    fill="url(#btWood)" stroke="#6E4423" strokeWidth="1.6" />
                <circle cx="100" cy="147" r="8.5" fill="url(#btWood)" stroke="#6E4423" strokeWidth="1.6" />
                <path d="M94 126 h12 M94 132 h12 M94 138 h12"
                    stroke="#6E4423" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
                <path d="M96.5 38 C92.5 66 92.5 98 96.5 126"
                    fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.6" strokeLinecap="round" />
            </g>
        </svg>
    ),
    navidad: () => (
        <svg className="bt-scene" viewBox="0 0 200 160" aria-hidden="true">
            <circle className="bt-glow" cx="100" cy="80" r="74" fill="rgba(138,196,220,0.25)" />
            <g className="bt-copo" stroke="var(--color-blue)" strokeWidth="4" strokeLinecap="round">
                <line x1="100" y1="42" x2="100" y2="118" />
                <line x1="67" y1="61" x2="133" y2="99" />
                <line x1="133" y1="61" x2="67" y2="99" />
            </g>
        </svg>
    ),
    halloween: () => (
        <svg className="bt-scene" viewBox="0 0 200 160" aria-hidden="true">
            <circle className="bt-glow" cx="100" cy="82" r="74" fill="rgba(232,96,44,0.28)" />
            <text className="bt-calabaza" x="100" y="112" textAnchor="middle" fontSize="86">🎃</text>
        </svg>
    ),
}

// ── Registro de sonidos por tema ─────────────────────────────
// Sintetizados con Web Audio en el momento — sin archivos ni librerías.
// null = tema sin sonido. Reciben el AudioContext ya activo.
const SONIDOS = {
    beisbol: (ctx) => {
        const now = ctx.currentTime
        // Cuerpo grave del golpe ("thock")
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(230, now)
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.09)
        const og = ctx.createGain()
        og.gain.setValueAtTime(0.0001, now)
        og.gain.exponentialRampToValueAtTime(0.42, now + 0.005)
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.13)
        osc.connect(og).connect(ctx.destination)
        osc.start(now); osc.stop(now + 0.14)
        // "Crack" agudo (ráfaga de ruido filtrado con caída rápida)
        const dur = 0.08
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5)
        }
        const noise = ctx.createBufferSource()
        noise.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.7
        const ng = ctx.createGain(); ng.gain.value = 0.32
        noise.connect(bp).connect(ng).connect(ctx.destination)
        noise.start(now); noise.stop(now + dur)
    },
    navidad: null,
    halloween: null,
}

const prefiereMenosMovimiento = () =>
    typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

export default function BannerTemporada() {
    const {
        activo, tema, coleccionId, texto, animacion, sonido, delayMs, rutasExcluidas,
    } = temaTemporada
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const [visible, setVisible] = useState(false)
    const [soundOn, setSoundOn] = useState(true)

    const ctxRef = useRef(null)
    const crackTimerRef = useRef(null)
    const reducedMotion = prefiereMenosMovimiento()

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

    // ── Audio ────────────────────────────────────────────────
    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            const AC = window.AudioContext || window.webkitAudioContext
            if (AC) ctxRef.current = new AC()
        }
        return ctxRef.current
    }, [])

    const desbloquearAudio = useCallback(() => {
        const ctx = getCtx()
        if (ctx && ctx.state === 'suspended') ctx.resume()
    }, [getCtx])

    const reproducirCrack = useCallback(() => {
        if (!soundOn || reducedMotion) return
        const synth = SONIDOS[sonido]
        if (!synth) return
        const ctx = getCtx()
        if (!ctx) return
        if (ctx.state === 'suspended') ctx.resume()
        if (ctx.state !== 'running') return   // el navegador aún no lo autorizó
        try { synth(ctx) } catch { /* noop */ }
    }, [soundOn, reducedMotion, sonido, getCtx])

    // Programa el "crack" para el momento de contacto del ciclo actual.
    const programarCrack = useCallback(() => {
        clearTimeout(crackTimerRef.current)
        crackTimerRef.current = setTimeout(reproducirCrack, PERIODO_MS * CONTACTO)
    }, [reproducirCrack])

    const cerrar = useCallback(() => {
        // Al cerrar, no vuelve a aparecer para ESTE tema.
        try { localStorage.setItem(storageKey, 'cerrada') } catch { /* noop */ }
        clearTimeout(crackTimerRef.current)
        setVisible(false)
    }, [storageKey])

    // Aparece unos segundos DESPUÉS de cargar. No bloquea la carga:
    // el componente renderiza null hasta que el temporizador la habilita.
    useEffect(() => {
        if (!permitida) { setVisible(false); return }
        const t = setTimeout(() => setVisible(true), delayMs)
        return () => clearTimeout(t)
    }, [permitida, delayMs])

    // Al abrir: bloquear scroll de fondo, cerrar con Escape,
    // desbloquear audio con la primera interacción y arrancar el primer golpe.
    useEffect(() => {
        if (!visible) return
        document.body.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') cerrar() }
        window.addEventListener('keydown', onKey)
        window.addEventListener('pointerdown', desbloquearAudio, { once: true })
        programarCrack()   // primer golpe del ciclo inicial
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('pointerdown', desbloquearAudio)
            clearTimeout(crackTimerRef.current)
        }
    }, [visible, cerrar, desbloquearAudio, programarCrack])

    if (!permitida || !visible) return null

    const Animacion = ANIMACIONES[animacion] || ANIMACIONES.beisbol

    const irAColeccion = () => {
        desbloquearAudio()
        reproducirCrack()
        navigate(destino)
    }

    const toggleSonido = () => {
        desbloquearAudio()
        setSoundOn((v) => !v)
    }

    return (
        <div
            className="banner-temporada"
            role="dialog"
            aria-modal="true"
            aria-label={texto.titulo}
            onPointerDown={desbloquearAudio}
        >
            <div className="banner-temporada__backdrop" onClick={cerrar} />

            <div className="banner-temporada__card">
                <button className="banner-temporada__close" onClick={cerrar} aria-label="Cerrar">
                    <HiX size={24} />
                </button>

                {SONIDOS[sonido] && (
                    <button
                        className="banner-temporada__sound"
                        onClick={toggleSonido}
                        aria-label={soundOn ? 'Silenciar sonido' : 'Activar sonido'}
                        aria-pressed={soundOn}
                    >
                        {soundOn ? <HiVolumeUp size={18} /> : <HiVolumeOff size={18} />}
                    </button>
                )}

                <div className="banner-temporada__anim">
                    <Animacion onSwing={programarCrack} />
                </div>

                <div className="banner-temporada__text">
                    <h2 className="banner-temporada__titulo">{texto.titulo}</h2>
                    {texto.descripcion && (
                        <p className="banner-temporada__desc">{texto.descripcion}</p>
                    )}
                </div>

                <button className="banner-temporada__cta" onClick={irAColeccion}>
                    {texto.cta} →
                </button>
            </div>
        </div>
    )
}
