// ============================================================
// src/contexts/CartContext.jsx — Carrito de compras global
// Persiste en localStorage para sobrevivir recargas de página
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'crealive_cart'

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    // Persistir en localStorage cada vez que cambia el carrito
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }, [items])

    // Total de unidades para el badge
    const itemCount = items.reduce((sum, i) => sum + i.cantidad, 0)

    // Agregar item al carrito
    const addItem = (item) => {
        setItems(prev => [...prev, item])
    }

    // Eliminar item por índice
    const removeItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    // Actualizar cantidad de un item
    const updateQty = (index, qty) => {
        if (qty < 1) return
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, cantidad: qty } : item
        ))
    }

    // Vaciar carrito
    const clearCart = () => setItems([])

    return (
        <CartContext.Provider value={{ items, itemCount, addItem, removeItem, updateQty, clearCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
    return ctx
}
