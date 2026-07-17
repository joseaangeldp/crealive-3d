-- ============================================================
-- Migración de seguridad — RLS, roles de admin y token público de pedidos
-- Crealive 3D · Bloque B (feat/admin-roles)
--
-- Aplicar UNA VEZ en el SQL Editor de Supabase (rol postgres).
-- Idempotente: se puede re-ejecutar sin efectos secundarios.
--
-- Principios:
--  · La anon key es pública; TODA la autorización vive en estas policies.
--  · El rol admin vive en user_roles, tabla que solo admins pueden modificar.
--  · Ningún identificador enumerable da acceso a datos personales: la
--    consulta anónima de pedidos usa public_token (uuid aleatorio), nunca id.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABLA DE ROLES
-- ────────────────────────────────────────────────────────────
create table if not exists public.user_roles (
    user_id    uuid primary key references auth.users (id) on delete cascade,
    role       text not null check (role in ('admin')),
    created_at timestamptz not null default now(),
    created_by uuid references auth.users (id)
);

-- Punto único de verdad para "¿el usuario actual es admin?".
-- security definer: se ejecuta como el dueño de la función (postgres) y por
-- eso puede leer user_roles sin disparar recursión en las policies de esa
-- misma tabla.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
    );
$$;


-- ────────────────────────────────────────────────────────────
-- 2. TOKEN PÚBLICO DE PEDIDOS (para /pedido/:token sin login)
--    Independiente del tipo de pedidos.id: aunque el id fuera secuencial,
--    nunca se expone anónimamente.
-- ────────────────────────────────────────────────────────────
alter table public.pedidos
    add column if not exists public_token uuid not null default gen_random_uuid();

create unique index if not exists pedidos_public_token_key
    on public.pedidos (public_token);


-- ────────────────────────────────────────────────────────────
-- 3. LIMPIEZA: eliminar TODAS las policies existentes de nuestras tablas
--    y de storage.objects (estado actual desconocido/permisivo).
-- ────────────────────────────────────────────────────────────
do $$
declare
    p record;
begin
    for p in
        select policyname, tablename
        from pg_policies
        where schemaname = 'public'
          and tablename in ('clientes','productos','colecciones','pedidos',
                            'pedido_items','galeria','categorias',
                            'filament_colors','ediciones_limitadas','user_roles')
    loop
        execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
    end loop;

    for p in
        select policyname
        from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
    loop
        execute format('drop policy if exists %I on storage.objects', p.policyname);
    end loop;
end
$$;


-- ────────────────────────────────────────────────────────────
-- 4. ACTIVAR RLS EN TODAS LAS TABLAS
--    galeria puede no existir aún en la base (el diagnóstico del
--    2026-07-17 listó 8 tablas y no la incluía); se crea si falta,
--    con las columnas que usa AdminGallery.jsx. No-op si ya existe.
-- ────────────────────────────────────────────────────────────
create table if not exists public.galeria (
    id          uuid primary key default gen_random_uuid(),
    titulo      text not null,
    categoria   text,
    descripcion text,
    imagen_url  text not null,
    orden       int default 0,
    fecha       timestamptz default now()
);

alter table public.clientes            enable row level security;
alter table public.productos           enable row level security;
alter table public.colecciones         enable row level security;
alter table public.pedidos             enable row level security;
alter table public.pedido_items        enable row level security;
alter table public.galeria             enable row level security;
alter table public.categorias          enable row level security;
alter table public.filament_colors     enable row level security;
alter table public.ediciones_limitadas enable row level security;
alter table public.user_roles          enable row level security;


-- ────────────────────────────────────────────────────────────
-- 5. POLICIES
-- ────────────────────────────────────────────────────────────

-- ── user_roles: cada quien lee SU rol; solo admins gestionan roles.
--    Un admin no puede degradarse/borrarse a sí mismo (evita quedarse sin admins).
create policy "leer rol propio o admin lee todos" on public.user_roles
    for select using (user_id = auth.uid() or public.is_admin());
create policy "solo admin asigna roles" on public.user_roles
    for insert with check (public.is_admin());
create policy "solo admin modifica roles ajenos" on public.user_roles
    for update using (public.is_admin() and user_id <> auth.uid());
create policy "solo admin elimina roles ajenos" on public.user_roles
    for delete using (public.is_admin() and user_id <> auth.uid());

-- ── productos / colecciones: catálogo público (solo activos); admin todo.
create policy "publico ve productos activos" on public.productos
    for select using (activo = true or public.is_admin());
create policy "solo admin inserta productos" on public.productos
    for insert with check (public.is_admin());
create policy "solo admin actualiza productos" on public.productos
    for update using (public.is_admin());
create policy "solo admin elimina productos" on public.productos
    for delete using (public.is_admin());

create policy "publico ve colecciones activas" on public.colecciones
    for select using (activo = true or public.is_admin());
create policy "solo admin inserta colecciones" on public.colecciones
    for insert with check (public.is_admin());
create policy "solo admin actualiza colecciones" on public.colecciones
    for update using (public.is_admin());
create policy "solo admin elimina colecciones" on public.colecciones
    for delete using (public.is_admin());

-- ── galeria / categorias / filament_colors / ediciones_limitadas:
--    contenido no sensible, lectura pública; escritura solo admin.
create policy "lectura publica galeria" on public.galeria
    for select using (true);
create policy "solo admin inserta galeria" on public.galeria
    for insert with check (public.is_admin());
create policy "solo admin actualiza galeria" on public.galeria
    for update using (public.is_admin());
create policy "solo admin elimina galeria" on public.galeria
    for delete using (public.is_admin());

create policy "lectura publica categorias" on public.categorias
    for select using (true);
create policy "solo admin inserta categorias" on public.categorias
    for insert with check (public.is_admin());
create policy "solo admin actualiza categorias" on public.categorias
    for update using (public.is_admin());
create policy "solo admin elimina categorias" on public.categorias
    for delete using (public.is_admin());

create policy "lectura publica colores" on public.filament_colors
    for select using (true);
create policy "solo admin inserta colores" on public.filament_colors
    for insert with check (public.is_admin());
create policy "solo admin actualiza colores" on public.filament_colors
    for update using (public.is_admin());
create policy "solo admin elimina colores" on public.filament_colors
    for delete using (public.is_admin());

create policy "lectura publica ediciones" on public.ediciones_limitadas
    for select using (true);
create policy "solo admin inserta ediciones" on public.ediciones_limitadas
    for insert with check (public.is_admin());
create policy "solo admin actualiza ediciones" on public.ediciones_limitadas
    for update using (public.is_admin());
create policy "solo admin elimina ediciones" on public.ediciones_limitadas
    for delete using (public.is_admin());

-- ── clientes: cada quien su propia fila; admin todas. Nadie borra salvo admin.
create policy "cliente lee su fila o admin todas" on public.clientes
    for select using (id = auth.uid() or public.is_admin());
create policy "cliente crea su propia fila" on public.clientes
    for insert with check (id = auth.uid());
create policy "cliente actualiza su fila o admin todas" on public.clientes
    for update using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());
create policy "solo admin elimina clientes" on public.clientes
    for delete using (public.is_admin());

-- ── pedidos: el dueño ve los suyos; admin ve/gestiona todos.
--    NO hay policy de INSERT directo: los pedidos (incluido checkout de
--    invitados) se crean únicamente vía la función crear_pedido() de abajo.
--    La consulta anónima va únicamente vía pedido_publico(token).
create policy "dueno ve sus pedidos o admin todos" on public.pedidos
    for select using (cliente_id = auth.uid() or public.is_admin());
create policy "solo admin actualiza pedidos" on public.pedidos
    for update using (public.is_admin());
create policy "solo admin elimina pedidos" on public.pedidos
    for delete using (public.is_admin());

-- ── pedido_items: visibles para el dueño del pedido y el admin.
create policy "items visibles para dueno o admin" on public.pedido_items
    for select using (
        public.is_admin()
        or exists (
            select 1 from public.pedidos p
            where p.id = pedido_id and p.cliente_id = auth.uid()
        )
    );
create policy "solo admin actualiza items" on public.pedido_items
    for update using (public.is_admin());
create policy "solo admin elimina items" on public.pedido_items
    for delete using (public.is_admin());


-- ────────────────────────────────────────────────────────────
-- 6. RPC: crear_pedido — único camino de escritura del checkout.
--    security definer para que funcione también para invitados, con
--    validaciones estrictas. cliente_id SIEMPRE sale de auth.uid(),
--    nunca del payload (nadie crea pedidos a nombre de otro).
--    jsonb_populate_record(set) castea a los tipos reales de las columnas,
--    sea cual sea el tipo de los ids en la base.
-- ────────────────────────────────────────────────────────────
create or replace function public.crear_pedido(p_pedido jsonb, p_items jsonb default '[]'::jsonb)
returns uuid  -- devuelve el public_token para el enlace de seguimiento
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id    public.pedidos.id%type;
    v_token uuid;
begin
    if p_pedido is null or jsonb_typeof(p_pedido) <> 'object' then
        raise exception 'pedido inválido';
    end if;
    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then
        raise exception 'items inválidos';
    end if;

    insert into public.pedidos
        (cliente_id, producto_id, producto_nombre, color_elegido, mensaje, cantidad, estado, fecha)
    select
        auth.uid(),
        r.producto_id,
        left(coalesce(r.producto_nombre, ''), 200),
        left(coalesce(r.color_elegido, '—'), 100),
        left(r.mensaje, 500),
        least(greatest(coalesce(r.cantidad, 1), 1), 100),
        'pendiente',
        now()
    from jsonb_populate_record(null::public.pedidos, p_pedido) as r
    returning id, public_token into v_id, v_token;

    insert into public.pedido_items
        (pedido_id, producto_id, producto_nombre, color_elegido, cantidad, mensaje_especial)
    select
        v_id,
        r.producto_id,
        left(coalesce(r.producto_nombre, ''), 200),
        left(coalesce(r.color_elegido, '—'), 100),
        least(greatest(coalesce(r.cantidad, 1), 1), 100),
        left(r.mensaje_especial, 500)
    from jsonb_populate_recordset(null::public.pedido_items, p_items) as r;

    return v_token;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- 7. RPC: pedido_publico — consulta anónima SOLO por token aleatorio.
--    Devuelve únicamente campos no sensibles (primer nombre del cliente,
--    estado, items). Jamás email, WhatsApp ni ids enumerables.
-- ────────────────────────────────────────────────────────────
create or replace function public.pedido_publico(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'estado',          p.estado,
        'fecha',           p.fecha,
        'producto_nombre', p.producto_nombre,
        'color_elegido',   p.color_elegido,
        'mensaje',         p.mensaje,
        'cantidad',        p.cantidad,
        'cliente_nombre',  (select c.nombre from public.clientes c where c.id = p.cliente_id),
        'items', coalesce((
            select jsonb_agg(jsonb_build_object(
                'producto_nombre',  i.producto_nombre,
                'color_elegido',    i.color_elegido,
                'cantidad',         i.cantidad,
                'mensaje_especial', i.mensaje_especial))
            from public.pedido_items i
            where i.pedido_id = p.id), '[]'::jsonb)
    )
    from public.pedidos p
    where p.public_token = p_token;
$$;


-- ────────────────────────────────────────────────────────────
-- 8. STORAGE: lectura pública de los tres buckets; escritura solo admin.
--    (Elimina que cualquier registrado suba/sobrescriba con upsert:true.)
-- ────────────────────────────────────────────────────────────
create policy "lectura publica buckets crealive" on storage.objects
    for select using (bucket_id in ('productos','galeria','colecciones'));
create policy "solo admin sube archivos" on storage.objects
    for insert with check (
        bucket_id in ('productos','galeria','colecciones') and public.is_admin()
    );
create policy "solo admin sobrescribe archivos" on storage.objects
    for update using (
        bucket_id in ('productos','galeria','colecciones') and public.is_admin()
    );
create policy "solo admin elimina archivos" on storage.objects
    for delete using (
        bucket_id in ('productos','galeria','colecciones') and public.is_admin()
    );


-- ============================================================
-- BOOTSTRAP (correr POR SEPARADO, después de la migración):
-- asigna el primer admin. El SQL Editor corre como postgres, que
-- ignora RLS, por eso este insert inicial funciona sin ser admin.
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users
--   where email = 'TU_EMAIL_DE_LOGIN'
--   on conflict (user_id) do update set role = 'admin';
--
--   -- Verificar:
--   select u.email, r.role from public.user_roles r
--   join auth.users u on u.id = r.user_id;
-- ============================================================
