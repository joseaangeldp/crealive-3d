-- ============================================================
-- Migración 03 — Cascada de hex de colores de filamento
-- Crealive 3D · rama fix/colores-modal-personalizar
--
-- Al editar o eliminar un color en el panel admin, mantiene consistente
-- la columna productos.colores_disponibles (text[] de hex): reemplaza o
-- limpia el hex EN CASCADA, todo en UNA transacción (atómico: o se
-- aplica el cambio de la fila + todos los productos, o nada).
--
-- Notas de diseño:
--  · El hex viejo se lee DENTRO de la función desde filament_colors
--    (nunca se confía del cliente, que podría tener la vista vieja).
--  · El array resultante se deduplica (evita swatches repetidos si el
--    nuevo hex ya existía en el array del producto).
--  · security definer + guard is_admin(); además capa de permisos GRANT.
--
-- Idempotente: create or replace. Aplicar en el SQL Editor de Supabase.
-- ============================================================

-- ── Editar color: ajusta la fila y propaga el nuevo hex a los productos ──
create or replace function public.admin_update_color(
    p_id      uuid,
    p_name    text,
    p_new_hex text
)
returns integer   -- nº de productos afectados por el cambio de hex
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_old_hex text;
    v_count   integer := 0;
begin
    if not public.is_admin() then
        raise exception 'no autorizado';
    end if;

    -- Hex actual leído de la propia fila (no se confía del cliente)
    select hex into v_old_hex from public.filament_colors where id = p_id;
    if v_old_hex is null then
        raise exception 'color % inexistente', p_id;
    end if;

    update public.filament_colors
       set name = p_name, hex = p_new_hex
     where id = p_id;

    -- Cascada solo si el hex realmente cambió; array_agg(distinct) deduplica
    if p_new_hex is distinct from v_old_hex then
        update public.productos
           set colores_disponibles = (
               select array_agg(distinct h)
               from unnest(array_replace(colores_disponibles, v_old_hex, p_new_hex)) as h
           )
         where colores_disponibles @> array[v_old_hex];
        get diagnostics v_count = row_count;
    end if;

    return v_count;
end $$;

-- ── Eliminar color: limpia el hex de los productos y borra la fila ──
create or replace function public.admin_delete_color(p_id uuid)
returns integer   -- nº de productos que lo tenían seleccionado
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_hex   text;
    v_count integer := 0;
begin
    if not public.is_admin() then
        raise exception 'no autorizado';
    end if;

    select hex into v_hex from public.filament_colors where id = p_id;
    if v_hex is null then
        raise exception 'color % inexistente', p_id;
    end if;

    update public.productos
       set colores_disponibles = array_remove(colores_disponibles, v_hex)
     where colores_disponibles @> array[v_hex];
    get diagnostics v_count = row_count;

    delete from public.filament_colors where id = p_id;

    return v_count;
end $$;

-- ── Permisos ──
-- Postgres concede EXECUTE a PUBLIC por defecto (y anon ∈ PUBLIC), así que
-- revocar solo a anon no bastaría: revocamos a PUBLIC y a anon, y concedemos
-- únicamente a authenticated. is_admin() es la segunda capa dentro de la función.
revoke execute on function public.admin_update_color(uuid, text, text) from public;
revoke execute on function public.admin_update_color(uuid, text, text) from anon;
grant  execute on function public.admin_update_color(uuid, text, text) to authenticated;

revoke execute on function public.admin_delete_color(uuid) from public;
revoke execute on function public.admin_delete_color(uuid) from anon;
grant  execute on function public.admin_delete_color(uuid) to authenticated;
