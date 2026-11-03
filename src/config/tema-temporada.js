// ============================================================
// src/config/tema-temporada.js
// INTERRUPTOR ÚNICO de la temporada: notificación + decoración.
//
// Cambiar de tema, o apagarlo del todo, es editar SOLO este archivo.
// `tema: 'ninguno'` apaga TODO (notificación + nieve + luces +
// bambalinas + scroll reveal) sin tocar ningún componente.
// No hay lógica de tema regada por el código: vive acá, en
// BannerTemporada.jsx (notificación) y en DecoracionTemporada.jsx (Parte 2).
// ============================================================

export const temaTemporada = {
    // ── Interruptor maestro de la NOTIFICACIÓN ───────────────
    // false = la notificación no se monta. (La decoración global
    // depende de `tema`, ver abajo.) Para apagar TODO de una sola
    // vez, poné tema: 'ninguno'.
    activo: true,

    // Identificador del tema. Enciende la notificación y, cuando vale
    // 'navidad', también toda la decoración global (Parte 2).
    //   'navidad'  → temporada navideña completa (notificación + decoración)
    //   'ninguno'  → TODO apagado, cero rastro visual
    //   'beisbol' / 'halloween' → solo notificación temática
    // Se usa además para la clave de localStorage (`crealive_promo_<tema>`):
    // quien cierre la de un tema, igual verá la del siguiente cuando lo actives.
    tema: 'navidad',

    // Id de la colección destino (tabla `colecciones` de Supabase).
    // El clic en el CTA navega a `/coleccion/<coleccionId>`.
    //   Navidad → d5075693-6ac5-4317-a1db-17ceea2f7156  ("Coleccion Navidad")
    // Para apuntar a otra colección (p. ej. "Feria de la Chinita", si algún
    // día se crea esa colección), reemplazá SOLO este id por el suyo.
    coleccionId: 'd5075693-6ac5-4317-a1db-17ceea2f7156',

    // Textos visibles de la notificación.
    texto: {
        titulo: 'La Navidad llegó a Crealive 3D',
        descripcion: 'Piezas navideñas impresas en 3D, por tiempo limitado.',
        cta: 'Ver la colección',
    },

    // Animación de la notificación. Debe existir en el registro ANIMACIONES
    // de BannerTemporada.jsx. Actualmente disponibles:
    //   'navidad'  → copo de nieve cayendo
    //   'beisbol'  → bate golpeando la pelota
    //   'halloween'→ calabaza
    animacion: 'navidad',

    // Sonido en sincronía con la animación (Web Audio, sin archivos).
    // null = sin sonido. Actualmente: 'beisbol' (el "crack" del bate).
    // Navidad va sin sonido ('navidad' está registrado como null).
    sonido: 'navidad',

    // Cuánto espera tras cargar la página antes de aparecer (ms).
    // No bloquea ni retrasa el contenido: solo demora su aparición.
    delayMs: 1500,

    // Rutas donde la notificación NO debe aparecer (coincidencia exacta
    // o por prefijo de segmento: '/pedido' cubre '/pedido/123').
    // Se excluye el checkout y el panel admin para no interrumpir una venta.
    rutasExcluidas: ['/confirmacion', '/pedido', '/admin'],

    // ── Decoración navideña global (Parte 2) ─────────────────
    // Solo se monta cuando tema === 'navidad'. Cada sub-interruptor
    // permite afinar sin tocar componentes. TODO respeta
    // prefers-reduced-motion y se carga diferido, después del contenido.
    //
    // Nota: luces y bambalinas son SOLO de escritorio (en móvil la barra
    // superior no existe, así que no hay header que enmarcar). La nieve sí
    // aparece en móvil, pero con muchos menos copos.
    decoracion: {
        nieve: true,         // capa de copos (canvas), pointer-events:none, se pausa en pestaña oculta
        luces: true,         // guirnalda de luces bordeando el header (desktop)
        bambalinas: true,    // guirnalda/adornos SVG colgando bajo el header (desktop)
        scrollReveal: true,  // las secciones aparecen al entrar en viewport (una vez)
    },
}
