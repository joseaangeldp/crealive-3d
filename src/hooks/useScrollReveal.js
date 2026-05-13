// ============================================================
// src/hooks/useScrollReveal.js
// Activa clase .is-visible en elementos .reveal al entrar
// en viewport. Soporta delay escalonado via data-delay="ms".
// ============================================================
import { useEffect } from 'react'

/**
 * Observa todos los .reveal y .reveal-icon del contenedor
 * y añade .is-visible al entrar en viewport.
 * @param {string} selector — querySelector (default '.reveal, .reveal-icon')
 */
export function useScrollReveal(selector = '.reveal, .reveal-icon') {
    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const elements = document.querySelectorAll(selector)
        if (!elements.length) return

        if (reduced) {
            // Sin animación: simplemente mostrar todo
            elements.forEach(el => el.classList.add('is-visible'))
            return
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return
                const el = entry.target
                const delay = el.dataset.delay ? Number(el.dataset.delay) : 0
                setTimeout(() => el.classList.add('is-visible'), delay)
                observer.unobserve(el)
            })
        }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })

        elements.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [selector])
}
