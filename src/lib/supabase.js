// ============================================================
// src/lib/supabase.js — Cliente de Supabase
// Crealive 3D
// ============================================================
//
// ============================================================
// SQL — SCRIPTS DE CREACIÓN DE TABLAS EN SUPABASE
// Ejecutar en el SQL Editor de tu proyecto Supabase
// ============================================================
//
// -- 1. Tabla de clientes
// create table public.clientes (
//   id uuid primary key default gen_random_uuid(),
//   nombre text not null,
//   email text unique not null,
//   whatsapp text,
//   fecha_registro timestamptz default now(),
//   activo boolean default true
// );
// alter table public.clientes enable row level security;
// create policy "Clientes pueden leer sus propios datos" on public.clientes
//   for select using (auth.uid() = id);
// create policy "Clientes pueden actualizar sus propios datos" on public.clientes
//   for update using (auth.uid() = id);
// create policy "Inserción pública al registrarse" on public.clientes
//   for insert with check (true);
//
// -- 2. Tabla de productos
// create table public.productos (
//   id uuid primary key default gen_random_uuid(),
//   nombre text not null,
//   categoria text not null,
//   descripcion text,
//   precio numeric(10,2) not null,
//   imagen_url text,
//   activo boolean default true
// );
// alter table public.productos enable row level security;
// create policy "Todos pueden ver productos activos" on public.productos
//   for select using (activo = true);
// create policy "Solo admin puede modificar productos" on public.productos
//   for all using (auth.email() = current_setting('app.admin_email', true));
//
// -- 3. Tabla de colecciones (banners del carrusel)
// create table public.colecciones (
//   id uuid primary key default gen_random_uuid(),
//   titulo text not null,
//   descripcion text,
//   imagen_url text,
//   activo boolean default true,
//   orden int default 0
// );
// alter table public.colecciones enable row level security;
// create policy "Todos pueden ver colecciones activas" on public.colecciones
//   for select using (activo = true);
// create policy "Solo admin puede modificar colecciones" on public.colecciones
//   for all using (auth.email() = current_setting('app.admin_email', true));
//
// -- 4. Tabla de pedidos
// create table public.pedidos (
//   id uuid primary key default gen_random_uuid(),
//   cliente_id uuid references public.clientes(id),
//   producto_id uuid references public.productos(id),
//   producto_nombre text,
//   color_elegido text,
//   mensaje text,
//   cantidad int default 1,
//   estado text default 'pendiente',
//   fecha timestamptz default now()
// );
// alter table public.pedidos enable row level security;
// create policy "Clientes ven sus propios pedidos" on public.pedidos
//   for select using (auth.uid() = cliente_id);
// create policy "Clientes insertan sus pedidos" on public.pedidos
//   for insert with check (auth.uid() = cliente_id);
// create policy "Admin ve todos los pedidos" on public.pedidos
//   for all using (auth.email() = current_setting('app.admin_email', true));
//
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Variables de Supabase no configuradas. Revisá el archivo .env')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)
