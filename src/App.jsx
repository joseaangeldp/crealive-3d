// ============================================================
// src/App.jsx — Configuración de rutas principal
// Crealive 3D
// ============================================================
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import TopNav from './components/TopNav'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Páginas cliente (carga diferida para rendimiento)
const Home = lazy(() => import('./pages/Home'))
const Catalog = lazy(() => import('./pages/Catalog'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const Gallery = lazy(() => import('./pages/Gallery'))
const OrderStatus = lazy(() => import('./pages/OrderStatus'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))

// Panel Admin
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminClients = lazy(() => import('./pages/admin/AdminClients'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCollections = lazy(() => import('./pages/admin/AdminCollections'))
const AdminMarketing = lazy(() => import('./pages/admin/AdminMarketing'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminColors = lazy(() => import('./pages/admin/AdminColors'))
const AdminLimitedEditions = lazy(() => import('./pages/admin/AdminLimitedEditions'))

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
                    <Route path="/galeria" element={<Gallery />} />
                    <Route path="/pedido/:id" element={<OrderStatus />} />
                    <Route path="/producto/:id" element={<ProductDetail />} />

                    {/* Rutas protegidas (cliente) */}
                    <Route path="/perfil" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />

                    {/* Admin */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="pedidos" element={<AdminOrders />} />
                        <Route path="clientes" element={<AdminClients />} />
                        <Route path="productos" element={<AdminProducts />} />
                        <Route path="colecciones" element={<AdminCollections />} />
                        <Route path="categorias" element={<AdminCategories />} />
                        <Route path="colores" element={<AdminColors />} />
                        <Route path="ediciones" element={<AdminLimitedEditions />} />
                        <Route path="marketing" element={<AdminMarketing />} />
                    </Route>
                </Routes>
            </Suspense>

            <Footer />
            <BottomNav />
        </>
    )
}
