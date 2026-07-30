-- ============================================================
-- Migración 02 — Creación automática de perfil en clientes
-- Crealive 3D · Bloque B (feat/admin-roles)
--
-- Arregla el bug de registro post-RLS: el frontend creaba la fila de
-- clientes desde el navegador, lo que falla cuando aún no hay sesión
-- (signUp con confirmación de email pendiente → auth.uid() es null) y
-- es frágil en el flujo de Google. Ahora el perfil se crea server-side
-- con un trigger en auth.users, idéntico para email y Google.
--
-- Idempotente: se puede re-ejecutar sin efectos secundarios.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Nunca abortar el alta en auth.users por un fallo de perfil:
    -- si algo sale mal se registra warning y el signup continúa.
    begin
        insert into public.clientes (id, nombre, email, whatsapp, activo, fecha_registro)
        values (
            new.id,
            left(coalesce(
                new.raw_user_meta_data ->> 'nombre',     -- registro por email del sitio
                new.raw_user_meta_data ->> 'full_name',  -- Google
                new.raw_user_meta_data ->> 'name',       -- Google (fallback)
                split_part(coalesce(new.email, ''), '@', 1)
            ), 120),
            coalesce(new.email, ''),
            nullif(new.raw_user_meta_data ->> 'whatsapp', ''),
            true,
            now()
        )
        on conflict (id) do update
            set nombre   = excluded.nombre,
                email    = excluded.email,
                whatsapp = coalesce(clientes.whatsapp, excluded.whatsapp);
    exception when others then
        raise warning 'handle_new_user (%): %', new.id, sqlerrm;
    end;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- Backfill: usuarios que se registraron mientras el flujo estaba roto
-- (existen en auth.users pero no tienen fila en clientes).
-- ────────────────────────────────────────────────────────────
insert into public.clientes (id, nombre, email, whatsapp, activo, fecha_registro)
select
    u.id,
    left(coalesce(
        u.raw_user_meta_data ->> 'nombre',
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        split_part(coalesce(u.email, ''), '@', 1)
    ), 120),
    coalesce(u.email, ''),
    nullif(u.raw_user_meta_data ->> 'whatsapp', ''),
    true,
    coalesce(u.created_at, now())
from auth.users u
where not exists (select 1 from public.clientes c where c.id = u.id)
on conflict do nothing;

-- Verificación rápida (opcional):
--   select count(*) as usuarios from auth.users;
--   select count(*) as perfiles from public.clientes;
