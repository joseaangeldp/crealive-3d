// ============================================================
// src/config.js — Variables y constantes configurables globales
// Crealive 3D — Plataforma de impresión 3D
// ============================================================

// Número de WhatsApp del negocio (variable de entorno)
export const WHATSAPP_NEGOCIO = import.meta.env.VITE_WHATSAPP_NEGOCIO || '584246049228'

// REGLA DE SEGURIDAD: nada secreto puede llevar prefijo VITE_ (se publica
// en el bundle). El rol admin vive en la tabla user_roles (Supabase RLS),
// y cualquier envío de correo futuro va server-side en una Edge Function.

// Los colores de filamento se leen de la tabla filament_colors (Supabase)
// vía el hook useColoresFilamento. No hay lista hardcodeada: una constante
// local se desincronizaba de la base (bug del modal con hexes viejos).

// ============================================================
// Categorías de productos
// ============================================================
export const CATEGORIAS = [
    'Todos',
    'Porta objetos / Organizadores',
    'Macetas / Decoración hogar',
    'Llaveros / Accesorios',
    'Retratos personalizados',
]

// ============================================================
// Estados de pedido
// ============================================================
export const ESTADOS_PEDIDO = [
    'pendiente',
    'en producción',
    'entregado',
    'cancelado',
]
