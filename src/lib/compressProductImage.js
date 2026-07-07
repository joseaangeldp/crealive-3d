// ============================================================
// src/lib/compressProductImage.js — Compresión de imágenes
// Crealive 3D
// ============================================================
// Comprime una imagen en el navegador antes de subirla a
// Supabase Storage: WebP, máx. 1600px de lado, ~300KB.
// Corre en un Web Worker para no congelar la UI del admin.

import imageCompression from 'browser-image-compression'

const OPCIONES = {
    maxSizeMB: 0.3,          // objetivo ~300KB
    maxWidthOrHeight: 1600,  // suficiente para lightbox/detalle
    fileType: 'image/webp',
    initialQuality: 0.8,
    useWebWorker: true,
}

/**
 * Comprime un File de imagen a WebP liviano.
 * Si la compresión falla (formato raro, worker bloqueado),
 * devuelve el archivo original para no romper la subida.
 *
 * @param {File} file - imagen elegida en el input
 * @returns {Promise<{ file: File, extension: string, contentType: string }>}
 */
export async function compressProductImage(file) {
    try {
        const comprimido = await imageCompression(file, OPCIONES)
        return { file: comprimido, extension: 'webp', contentType: 'image/webp' }
    } catch (err) {
        console.warn('Compresión falló, subiendo original:', err.message)
        const extension = (file.name.split('.').pop() || 'jpg').toLowerCase()
        return { file, extension, contentType: file.type || 'image/jpeg' }
    }
}
