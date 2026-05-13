// ============================================================
// src/components/HeroParticles.jsx
// Canvas con partículas flotantes sobre el hero
// Respeta prefers-reduced-motion
// ============================================================
import { useEffect, useRef } from 'react'
import './HeroParticles.css'

const COUNT = 48

export default function HeroParticles() {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let rafId

        const resize = () => {
            canvas.width  = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
        }

        const mkParticle = () => ({
            x:      Math.random() * canvas.width,
            y:      Math.random() * canvas.height,
            r:      Math.random() * 1.8 + 0.6,
            vx:     (Math.random() - 0.5) * 0.28,
            vy:     (Math.random() - 0.5) * 0.28,
            alpha:  Math.random() * 0.14 + 0.04,
        })

        let pts = []
        const init = () => {
            resize()
            pts = Array.from({ length: COUNT }, mkParticle)
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            pts.forEach(p => {
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width)  p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
                ctx.fill()
            })
            rafId = requestAnimationFrame(draw)
        }

        init()
        draw()

        const onResize = () => { resize(); pts = Array.from({ length: COUNT }, mkParticle) }
        window.addEventListener('resize', onResize, { passive: true })

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', onResize)
        }
    }, [])

    return <canvas ref={canvasRef} className="hero-particles" aria-hidden="true" />
}
