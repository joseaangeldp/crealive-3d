// ============================================================
// src/pages/admin/AdminDashboard.jsx — Dashboard de estadísticas
// KPIs, top productos, top categorías, últimos pedidos
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    HiOutlineClipboardList, HiOutlineUsers, HiOutlineCube,
    HiOutlineTrendingUp, HiOutlineCalendar, HiOutlineCurrencyDollar,
} from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const BADGE = {
    'pendiente': { bg: '#FEF3C7', color: '#92400E' },
    'en producción': { bg: '#DBEAFE', color: '#1E40AF' },
    'entregado': { bg: '#D1FAE5', color: '#065F46' },
    'cancelado': { bg: '#FEE2E2', color: '#991B1B' },
}

function KPICard({ icon: Icon, label, value, sub, accent }) {
    return (
        <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: accent || 'var(--color-wine)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={22} color="#fff" />
            </div>
            <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</p>
                {sub && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>{sub}</p>}
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [topProductos, setTopProductos] = useState([])
    const [topCategorias, setTopCategorias] = useState([])
    const [ultimosPedidos, setUltimosPedidos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)

            // Todos los pedidos
            const { data: pedidos } = await supabase
                .from('pedidos')
                .select('*, clientes(nombre)')
                .order('fecha', { ascending: false })

            // Todos los items de pedidos
            const { data: items } = await supabase
                .from('pedido_items')
                .select('*')

            // Todos los productos
            const { data: productos } = await supabase.from('productos').select('id, nombre, categoria, precio')

            // Todos los clientes
            const { data: clientes } = await supabase.from('clientes').select('id')

            const now = new Date()
            const hoy = now.toISOString().split('T')[0]
            const semanaAtras = new Date(now - 7 * 86400000).toISOString()

            const pedidosHoy = (pedidos || []).filter(p => p.fecha?.startsWith(hoy)).length
            const pedidosSemana = (pedidos || []).filter(p => p.fecha >= semanaAtras).length
            const totalPedidos = (pedidos || []).length
            const totalClientes = clientes?.length || 0

            // Ingreso estimado (pedidos × precio del producto)
            const ingresoTotal = (pedidos || []).reduce((acc, p) => {
                const prod = (productos || []).find(x => x.nombre === p.producto_nombre)
                return acc + (prod ? Number(prod.precio) * Number(p.cantidad || 1) : 0)
            }, 0)

            setStats({ pedidosHoy, pedidosSemana, totalPedidos, totalClientes, ingresoTotal })
            setUltimosPedidos((pedidos || []).slice(0, 6))

            // Top productos (por cantidad en pedidos)
            const conteoProducto = {}
            ;(pedidos || []).forEach(p => {
                if (p.producto_nombre) conteoProducto[p.producto_nombre] = (conteoProducto[p.producto_nombre] || 0) + Number(p.cantidad || 1)
            })
            ;(items || []).forEach(item => {
                if (item.producto_nombre) conteoProducto[item.producto_nombre] = (conteoProducto[item.producto_nombre] || 0) + Number(item.cantidad || 1)
            })
            const topProds = Object.entries(conteoProducto)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([nombre, qty]) => ({ nombre, qty }))
            setTopProductos(topProds)

            // Top categorías
            const conteoCat = {}
            ;(pedidos || []).forEach(p => {
                const prod = (productos || []).find(x => x.nombre === p.producto_nombre)
                if (prod?.categoria) conteoCat[prod.categoria] = (conteoCat[prod.categoria] || 0) + Number(p.cantidad || 1)
            })
            const topCats = Object.entries(conteoCat)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, qty]) => ({ cat, qty }))
            setTopCategorias(topCats)

            setLoading(false)
        }
        load()
    }, [])

    const formatFecha = iso => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

    if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />

    const maxProd = topProductos[0]?.qty || 1
    const maxCat = topCategorias[0]?.qty || 1

    return (
        <div>
            <h1 className="admin-page-title">Dashboard</h1>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <KPICard icon={HiOutlineClipboardList} label="Pedidos hoy" value={stats.pedidosHoy} accent="#C4768A" />
                <KPICard icon={HiOutlineCalendar} label="Pedidos esta semana" value={stats.pedidosSemana} accent="#8B5CF6" />
                <KPICard icon={HiOutlineTrendingUp} label="Pedidos en total" value={stats.totalPedidos} accent="#0891B2" />
                <KPICard icon={HiOutlineUsers} label="Clientes registrados" value={stats.totalClientes} accent="#059669" />
                <KPICard icon={HiOutlineCurrencyDollar} label="Ingreso estimado" value={`$${stats.ingresoTotal.toFixed(0)}`} sub="Basado en precios de productos" accent="#D97706" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Top Productos */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <HiOutlineCube size={18} color="var(--color-wine)" />
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Productos más pedidos</h2>
                    </div>
                    {topProductos.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Sin datos aún.</p>
                    ) : topProductos.map((p, i) => (
                        <div key={p.nombre} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {i === 0 && <span style={{ fontSize: 16 }}>🥇</span>}
                                    {i === 1 && <span style={{ fontSize: 16 }}>🥈</span>}
                                    {i === 2 && <span style={{ fontSize: 16 }}>🥉</span>}
                                    {i > 2 && <span style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 20, textAlign: 'center' }}>#{i + 1}</span>}
                                    {p.nombre}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-wine)' }}>{p.qty} uds.</span>
                            </div>
                            <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 6,
                                    background: 'var(--color-wine)',
                                    width: `${Math.round((p.qty / maxProd) * 100)}%`,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Top Categorías */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <HiOutlineTrendingUp size={18} color="#8B5CF6" />
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Categorías más populares</h2>
                    </div>
                    {topCategorias.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Sin datos aún.</p>
                    ) : topCategorias.map((c, i) => (
                        <div key={c.cat} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.cat}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{c.qty} uds.</span>
                            </div>
                            <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 6,
                                    background: 'linear-gradient(90deg, #8B5CF6, #C4768A)',
                                    width: `${Math.round((c.qty / maxCat) * 100)}%`,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Últimos pedidos */}
            <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiOutlineClipboardList size={18} color="var(--color-wine)" />
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Últimos pedidos</h2>
                    </div>
                    <Link to="/admin/pedidos" style={{ fontSize: 12, color: 'var(--color-wine)', fontWeight: 600, textDecoration: 'none' }}>
                        Ver todos →
                    </Link>
                </div>
                {ultimosPedidos.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Sin pedidos aún.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ultimosPedidos.map(p => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', background: 'var(--color-surface-2)',
                                borderRadius: 10, border: '1px solid var(--color-border)',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.clientes?.nombre || 'Cliente'} — {p.producto_nombre}
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        {formatFecha(p.fecha)} · ×{p.cantidad}
                                    </p>
                                </div>
                                <span style={{
                                    background: BADGE[p.estado]?.bg || '#f3f4f6',
                                    color: BADGE[p.estado]?.color || '#374151',
                                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                }}>
                                    {p.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
