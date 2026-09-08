// ============================================================
// src/components/ScrollToTop.jsx — Sube al inicio al cambiar de ruta
// Sin esto, al navegar (p. ej. Inicio → Catálogo) la página mantenía
// la posición de scroll anterior en vez de arrancar arriba.
// ============================================================
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        // 'auto' (no smooth) para que el cambio de página se sienta instantáneo
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [pathname])

    return null
}
