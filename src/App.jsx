// ============================================================
// src/App.jsx — Configuración de rutas principal
// Crealive 3D
// ============================================================
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import TopNav from './components/TopNav'
import BottomNav from './components/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'

// Páginas cliente (carga diferida para rendimiento)
const Home = lazy(() => import('./pages/Home'))
const Catalog = lazy(() => import('./pages/Catalog'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))

// Panel Admin
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminClients = lazy(() => import('./pages/admin/AdminClients'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCollections = lazy(() => import('./pages/admin/AdminCollections'))
const AdminMarketing = lazy(() => import('./pages/admin/AdminMarketing'))

function Loading() {
    return <div className="spinner" style={{ marginTop: '80px' }} />
}

export default function App() {
    return (
        <>
            <TopNav />

            <Suspense fallback={<Loading />}>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<Home />} />
                    <Route path="/catalogo" element={<Catalog />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Register />} />
                    <Route path="/confirmacion" element={<OrderConfirmation />} />

                    {/* Rutas protegidas (cliente) */}
                    <Route path="/perfil" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />

                    {/* Admin */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminOrders />} />
                        <Route path="pedidos" element={<AdminOrders />} />
                        <Route path="clientes" element={<AdminClients />} />
                        <Route path="productos" element={<AdminProducts />} />
                        <Route path="colecciones" element={<AdminCollections />} />
                        <Route path="marketing" element={<AdminMarketing />} />
                    </Route>
                </Routes>
            </Suspense>

            <BottomNav />
        </>
    )
}
