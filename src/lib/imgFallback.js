// ============================================================
// src/lib/imgFallback.js — Placeholder neutro de marca para imágenes rotas
// NUNCA caer en una foto de stock: si una imagen falla, mostramos un
// fondo crema suave con el isotipo "C" de crealive en tono vino tenue.
// ============================================================

export const BRAND_PLACEHOLDER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#F3EDE2"/>' +
        '<path d="M172 112 H242 V134 H192 V166 H242 V188 H172 Q162 188 162 178 V122 Q162 112 172 112 Z" ' +
        'fill="#C84B7A" opacity="0.28"/>' +
        '<rect x="216" y="134" width="26" height="32" rx="2" fill="#C84B7A" opacity="0.28"/>' +
        '</svg>'
    )

// Handler para onError de <img>. Evita bucle si el propio placeholder fallara.
export function onImgError(e) {
    const img = e.currentTarget
    if (img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = BRAND_PLACEHOLDER
}
