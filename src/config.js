// ============================================================
// src/config.js — Variables y constantes configurables globales
// Crealive 3D — Plataforma de impresión 3D
// ============================================================

// Número de WhatsApp del negocio (variable de entorno)
export const WHATSAPP_NEGOCIO = import.meta.env.VITE_WHATSAPP_NEGOCIO || '584246049228'

// REGLA DE SEGURIDAD: nada secreto puede llevar prefijo VITE_ (se publica
// en el bundle). El rol admin vive en la tabla user_roles (Supabase RLS),
// y cualquier envío de correo futuro va server-side en una Edge Function.

// ============================================================
// Colores de filamento disponibles
// ============================================================
export const FILAMENT_COLORS = [
    { name: 'Azul', hex: '#A8C8E8' },
    { name: 'Rojo', hex: '#F4A5A5' },
    { name: 'Verde', hex: '#A8D5A2' },
    { name: 'Verde Claro', hex: '#C8E6C1' },
    { name: 'Vino', hex: '#C4768A' },
    { name: 'Blanco', hex: '#F8F8F8' },
    { name: 'Negro', hex: '#3A3A3A' },
    { name: 'Gris Claro', hex: '#D4D4D4' },
    { name: 'Morado', hex: '#C3A8D5' },
    { name: 'Rosado', hex: '#F5C6D8' },
    { name: 'Amarillo', hex: '#F5E4A0' },
    { name: 'Beige', hex: '#E8D8C4' },
    { name: 'Marrón', hex: '#C4A882' },
]

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
