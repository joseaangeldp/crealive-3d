// ============================================================
// src/config/tema-temporada.js
// INTERRUPTOR ÚNICO de la notificación temática de temporada.
//
// Cambiar de béisbol a Navidad, o apagarla del todo, es editar
// SOLO este archivo. No hay lógica de tema regada por componentes.
// ============================================================

export const temaTemporada = {
    // ── Interruptor maestro ──────────────────────────────────
    // false = la notificación no se monta en ninguna parte.
    activo: true,

    // Identificador del tema. Se usa para la clave de localStorage
    // (`crealive_promo_<tema>`), de modo que quien cierre la de
    // béisbol IGUAL vea la de Navidad cuando la actives.
    tema: 'beisbol',

    // Id de la colección destino (tabla `colecciones` de Supabase).
    // Lo obtenés desde el panel Admin → Colecciones.
    // El clic navega a `/coleccion/<coleccionId>`.
    coleccionId: '5bc1e7a3-3b10-4765-85ed-0225cb204e7a',

    // Textos visibles.
    texto: {
        titulo: '¡Arranca la temporada de béisbol!',
        descripcion: 'Piezas con temática de béisbol, por tiempo limitado.',
        cta: 'Ver la colección',
    },

    // Animación a mostrar. Debe existir en el registro ANIMACIONES
    // de BannerTemporada.jsx. Actualmente disponibles:
    //   'beisbol'  → bate golpeando la pelota
    //   'navidad'  → copo de nieve
    //   'halloween'→ calabaza
    animacion: 'beisbol',

    // Sonido en sincronía con la animación. Debe existir en el registro
    // SONIDOS de BannerTemporada.jsx (sintetizado con Web Audio, sin archivos).
    // null = sin sonido. Actualmente: 'beisbol' (el "crack" del bate).
    // El navegador solo lo reproduce tras la primera interacción del usuario.
    sonido: 'beisbol',

    // Cuánto espera tras cargar la página antes de aparecer (ms).
    // No bloquea ni retrasa el contenido: solo demora su aparición.
    delayMs: 1500,

    // Rutas donde la notificación NO debe aparecer.
    // Coincidencia exacta o por prefijo de segmento
    // ('/pedido' cubre '/pedido/123'; '/admin' cubre '/admin/pedidos').
    // Se excluye el flujo de compra (checkout) y el panel admin, para
    // no interrumpir una venta en curso.
    // (El carrito es un drawer, no una ruta, así que no hace falta listarlo.
    //  La propia colección destino se excluye automáticamente.)
    rutasExcluidas: ['/confirmacion', '/pedido', '/admin'],
}
