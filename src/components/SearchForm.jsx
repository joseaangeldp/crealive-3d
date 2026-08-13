// ============================================================
// src/components/SearchForm.jsx — Buscador global
// Presente en el TopNav (escritorio) y como barra en móvil.
// Al enviar, lleva al catálogo con el término: /catalogo?q=...
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineSearch } from 'react-icons/hi'
import './SearchForm.css'

export default function SearchForm({ className = '', placeholder = 'Buscar piezas…' }) {
    const [q, setQ] = useState('')
    const navigate = useNavigate()

    const submit = e => {
        e.preventDefault()
        const term = q.trim()
        navigate(term ? `/catalogo?q=${encodeURIComponent(term)}` : '/catalogo')
    }

    return (
        <form className={`searchform ${className}`.trim()} role="search" onSubmit={submit}>
            <HiOutlineSearch className="searchform__icon" size={18} aria-hidden="true" />
            <input
                type="search"
                className="searchform__input"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={placeholder}
                aria-label="Buscar productos"
                enterKeyHint="search"
            />
        </form>
    )
}
