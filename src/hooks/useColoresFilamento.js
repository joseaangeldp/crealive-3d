// ============================================================
// src/hooks/useColoresFilamento.js — Fuente ÚNICA de colores de filamento
// Lee la tabla filament_colors de Supabase. Antes había un array
// hardcodeado (FILAMENT_COLORS) que causaba que el modal mostrara
// colores viejos; este hook lo reemplaza en todo el cliente.
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * @param {{ soloDisponibles?: boolean }} opts
 *   soloDisponibles=true  → solo los disponibles (catálogo, modal, producto)
 *   soloDisponibles=false → todos (panel admin)
 * @returns {{ colores, loading, error, recargar }}
 */
export function useColoresFilamento({ soloDisponibles = true } = {}) {
    const [colores, setColores] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const recargar = useCallback(async () => {
        setLoading(true)
        setError(null)
        let query = supabase.from('filament_colors').select('*').order('orden')
        if (soloDisponibles) query = query.eq('disponible', true)
        const { data, error: err } = await query
        if (err) {
            setError(err)
            setColores([])
        } else {
            setColores(data || [])
        }
        setLoading(false)
    }, [soloDisponibles])

    useEffect(() => { recargar() }, [recargar])

    return { colores, loading, error, recargar }
}

/**
 * Colores efectivos de un producto: aplica el subset por producto
 * (colores_disponibles, array de hex) y suma los personalizados
 * (colores_extra). Compartido por el modal y la página de producto para
 * que el filtrado sea idéntico en ambos.
 *
 *  · colores_disponibles null/undefined → todos los colores globales
 *  · array con hexes                     → solo esos
 *  · array vacío                         → ninguno estándar (solo extras)
 */
export function coloresDeProducto(coloresGlobales, producto) {
    const disponibles = producto?.colores_disponibles
    const extra = Array.isArray(producto?.colores_extra) ? producto.colores_extra : []

    let base
    if (Array.isArray(disponibles) && disponibles.length > 0) {
        base = coloresGlobales.filter(c => disponibles.includes(c.hex))
    } else if (disponibles === null || disponibles === undefined) {
        base = coloresGlobales
    } else {
        base = []
    }

    const baseHexes = new Set(base.map(c => c.hex.toLowerCase()))
    const extraFiltrados = extra.filter(c => !baseHexes.has(c.hex.toLowerCase()))
    return [...base, ...extraFiltrados]
}
