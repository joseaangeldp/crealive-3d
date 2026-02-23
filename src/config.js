// ============================================================
// src/config.js — Variables y constantes configurables globales
// Crealive 3D — Plataforma de impresión 3D
// ============================================================

// Número de WhatsApp del negocio (variable de entorno)
export const WHATSAPP_NEGOCIO = import.meta.env.VITE_WHATSAPP_NEGOCIO || '584246049228'

// Email del administrador
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@crealive3d.com'

// API Key para email marketing (Resend)
export const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ''

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
