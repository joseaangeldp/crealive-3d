// ============================================================
// src/components/DecoracionTemporada.jsx
// Capa ÚNICA de decoración de temporada (Parte 2).
//
// Se monta una sola vez (lazy) desde App.jsx y NO renderiza nada
// salvo que el config tenga tema === 'navidad'. Toda la decoración
// navideña global vive acá + en src/config/tema-temporada.js.
// Nada hardcodeado regado por el resto del código.
//
// Todo respeta prefers-reduced-motion y se carga diferido.
// Luces y bambalinas son solo de escritorio (en móvil no hay barra
// superior que enmarcar — ver TopNav.css). La nieve se reduce mucho
// en móvil para no trabar equipos de gama media.
// ============================================================
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { temaTemporada } from '../config/tema-temporada'
import './DecoracionTemporada.css'

const prefiereMenosMovimiento = () =>
    typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

// Rutas donde el scroll-reveal global aplica. Home ya tiene su propio
// reveal (useScrollReveal), y el checkout/admin quedan fuera a propósito.
const RUTAS_REVEAL = [/^\/catalogo$/, /^\/galeria$/, /^\/coleccion\//, /^\/producto\//]

// ── Nieve: capa de copos sobre toda la página ────────────────
// Canvas liviano, pointer-events:none, se pausa con la pestaña oculta,
// pocos copos en móvil. Se inicializa en idle para no competir con el
// primer paint del contenido.
function CapaNieve() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let rafId = 0
        let corriendo = false
        let copos = []

        const esMovil = () => window.matchMedia('(max-width: 768px)').matches
        const cuenta = () => (esMovil() ? 14 : 42)

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const nuevoCopo = () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            vy: Math.random() * 0.5 + 0.25,
            vx: (Math.random() - 0.5) * 0.25,
            vaiven: Math.random() * Math.PI * 2,
            alpha: Math.random() * 0.4 + 0.3,
        })

        const init = () => {
            resize()
            copos = Array.from({ length: cuenta() }, nuevoCopo)
        }

        const dibujar = () => {
            if (!corriendo) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            copos.forEach((c) => {
                c.vaiven += 0.01
                c.y += c.vy
                c.x += c.vx + Math.sin(c.vaiven) * 0.3
                if (c.y > canvas.height + 6) { c.y = -6; c.x = Math.random() * canvas.width }
                if (c.x > canvas.width + 6) c.x = -6
                if (c.x < -6) c.x = canvas.width + 6
                ctx.beginPath()
                ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`
                ctx.fill()
            })
            rafId = requestAnimationFrame(dibujar)
        }

        const arrancar = () => { if (!corriendo) { corriendo = true; dibujar() } }
        const parar = () => { corriendo = false; cancelAnimationFrame(rafId) }

        const onVisibilidad = () => { if (document.hidden) parar(); else arrancar() }
        const onResize = () => { init() }

        // Diferir el arranque hasta que el navegador esté ocioso.
        // (bind a window para evitar "Illegal invocation" al extraer el método)
        const pedirIdle = window.requestIdleCallback
            ? window.requestIdleCallback.bind(window)
            : (cb) => window.setTimeout(cb, 400)
        const cancelarIdle = window.cancelIdleCallback
            ? window.cancelIdleCallback.bind(window)
            : (id) => window.clearTimeout(id)
        const idleHandle = pedirIdle(() => { init(); arrancar() })

        window.addEventListener('resize', onResize, { passive: true })
        document.addEventListener('visibilitychange', onVisibilidad)

        return () => {
            parar()
            cancelarIdle(idleHandle)
            window.removeEventListener('resize', onResize)
            document.removeEventListener('visibilitychange', onVisibilidad)
        }
    }, [])

    return <canvas ref={canvasRef} className="deco-nieve" aria-hidden="true" />
}

// ── Luces: guirnalda sutil bordeando el header (desktop) ─────
function LucesHeader() {
    const bulbos = Array.from({ length: 28 })
    return (
        <div className="deco-luces" aria-hidden="true">
            <span className="deco-luces__cable" />
            {bulbos.map((_, i) => (
                <span key={i} className={`deco-luz deco-luz--${i % 3}`} style={{ '--i': i }} />
            ))}
        </div>
    )
}

// ── Bambalinas: guirnalda SVG colgando bajo el header (desktop) ──
// Estática (sobria y sin coste), motivo que se repite a lo ancho.
function Bambalinas() {
    return <div className="deco-bambalinas" aria-hidden="true" />
}

// ── Scroll reveal global ─────────────────────────────────────
// Revela los bloques de nivel superior (hijos directos de <main>) una
// sola vez, al entrar en viewport. A nivel de SECCIÓN, nunca tarjeta por
// tarjeta: en Catálogo/Colección el grid vive dentro de un contenedor de
// sección, así que aparece el bloque completo de golpe.
// Solo "arma" (oculta) lo que está por debajo del viewport, para no
// provocar ningún parpadeo de contenido ya visible.
function useScrollRevealGlobal(activo, pathname) {
    useEffect(() => {
        if (!activo) return
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
        if (!RUTAS_REVEAL.some((re) => re.test(pathname))) return

        let observer = null
        let timerArmado = 0
        let timerRed = 0
        let intentos = 0
        const armados = []

        const armar = (main) => {
            const vh = window.innerHeight
            observer = new IntersectionObserver((entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return
                    e.target.classList.add('is-visible')
                    observer.unobserve(e.target)
                })
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

            Array.from(main.children).forEach((el) => {
                const rect = el.getBoundingClientRect()
                // Solo lo que está claramente bajo el viewport (sin flash visible).
                if (rect.height > 0 && rect.top >= vh * 0.9) {
                    el.classList.add('reveal')
                    armados.push(el)
                    observer.observe(el)
                }
            })

            // Red de seguridad: si algo quedó armado y nunca se reveló
            // (observer que no dispara, contenido que cambió), mostrarlo.
            timerRed = window.setTimeout(() => {
                armados.forEach((el) => el.classList.add('is-visible'))
            }, 2600)
        }

        // La página es lazy + hace fetch: esperamos a que <main> tenga
        // contenido, reintentando un rato acotado.
        const intentar = () => {
            const main = document.querySelector('main')
            if ((!main || main.children.length === 0) && intentos < 6) {
                intentos += 1
                timerArmado = window.setTimeout(intentar, 180)
                return
            }
            if (main) armar(main)
        }
        timerArmado = window.setTimeout(intentar, 120)

        return () => {
            window.clearTimeout(timerArmado)
            window.clearTimeout(timerRed)
            if (observer) observer.disconnect()
            // Al desmontar/navegar, soltamos la clase que nosotros pusimos.
            armados.forEach((el) => el.classList.remove('reveal'))
        }
    }, [activo, pathname])
}

export default function DecoracionTemporada() {
    const { tema, decoracion } = temaTemporada
    const activa = tema === 'navidad'
    const reducido = prefiereMenosMovimiento()
    const { pathname } = useLocation()

    useScrollRevealGlobal(activa && !!decoracion?.scrollReveal && !reducido, pathname)

    if (!activa) return null

    return (
        <>
            {decoracion?.nieve && !reducido && <CapaNieve />}
            {decoracion?.bambalinas && <Bambalinas />}
            {decoracion?.luces && <LucesHeader />}
        </>
    )
}
