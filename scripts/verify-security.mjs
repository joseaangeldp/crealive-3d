// ============================================================
// scripts/verify-security.mjs — Verificación adversarial de RLS
// Crealive 3D · Bloque B, Fase 3
//
// Simula a un atacante con la anon key pública (la que va en el
// bundle): primero anónimo, luego como usuario recién registrado.
// Todo lo marcado "bloqueado" debe fallar; lo público debe funcionar.
//
// Uso:  node scripts/verify-security.mjs
// Requiere .env.local (gitignored) con:
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
//
// Efectos secundarios (limpiar a mano después):
//   - crea un usuario de prueba test-rls-<timestamp>@example.com
//   - crea un pedido de prueba "TEST verificación — borrar"
// ============================================================
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
    readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
if (!URL_ || !KEY) {
    console.error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
    process.exit(1)
}

let fallos = 0
const reporte = (ok, nombre, detalle = '') => {
    if (!ok) fallos++
    console.log(`${ok ? '  PASS' : '✗ FAIL'}  ${nombre}${detalle ? `  [${detalle}]` : ''}`)
}

// "Bloqueado" = da error de policy O no afecta/devuelve ninguna fila.
const bloqueado = ({ data, error }) =>
    Boolean(error) || data == null || (Array.isArray(data) && data.length === 0)

async function pruebasDeEscritura(db, quien) {
    reporte(bloqueado(await db.from('productos').insert({ nombre: 'hack', categoria: 'x', precio: 1 }).select()),
        `${quien}: INSERT en productos bloqueado`)
    reporte(bloqueado(await db.from('productos').update({ nombre: 'hack' }).eq('activo', true).select()),
        `${quien}: UPDATE en productos bloqueado`)
    reporte(bloqueado(await db.from('galeria').delete().neq('titulo', '').select()),
        `${quien}: DELETE en galeria bloqueado`)
    reporte(bloqueado(await db.from('pedidos').update({ estado: 'entregado' }).neq('estado', '').select()),
        `${quien}: UPDATE en pedidos bloqueado`)

    const up = await db.storage.from('productos').upload(`test-rls-${Date.now()}.txt`, new Blob(['x']))
    reporte(Boolean(up.error), `${quien}: subida a Storage (bucket productos) bloqueada`)
}

async function main() {
    console.log(`\nVerificación adversarial contra ${URL_}\n`)

    // ── 1. Como ANÓNIMO ──
    console.log('— Anónimo (solo anon key) —')
    const anon = createClient(URL_, KEY)

    reporte(bloqueado(await anon.from('clientes').select('email').limit(5)),
        'anónimo: no lee la tabla clientes')
    reporte(bloqueado(await anon.from('pedidos').select('*').limit(5)),
        'anónimo: no lee pedidos')
    reporte(bloqueado(await anon.from('user_roles').select('*').limit(5)),
        'anónimo: no lee user_roles')
    await pruebasDeEscritura(anon, 'anónimo')

    // Lo público debe seguir funcionando
    const cat = await anon.from('productos').select('id, nombre').eq('activo', true).limit(3)
    reporte(!cat.error, 'anónimo: SÍ lee el catálogo (productos activos)', cat.error?.message)

    // Checkout de invitado vía RPC + consulta por token
    const ped = await anon.rpc('crear_pedido', {
        p_pedido: { producto_nombre: 'TEST verificación — borrar', color_elegido: '—', cantidad: 1 },
    })
    reporte(!ped.error && typeof ped.data === 'string',
        'anónimo: SÍ crea pedido vía crear_pedido (checkout invitado)', ped.error?.message)
    if (ped.data) {
        const pub = await anon.rpc('pedido_publico', { p_token: ped.data })
        const camposOk = pub.data && pub.data.estado === 'pendiente'
            && !('email' in (pub.data || {})) && !('cliente_id' in (pub.data || {}))
        reporte(!pub.error && camposOk,
            'anónimo: SÍ consulta el pedido por token, sin datos sensibles', pub.error?.message)
    }

    // ── 2. Como USUARIO AUTENTICADO NO-ADMIN ──
    // El proyecto valida emails contra MX reales, así que no se puede crear
    // un usuario efímero desde aquí. Preferimos iniciar sesión con una cuenta
    // NO admin ya registrada (TEST_USER_EMAIL / TEST_USER_PASSWORD en
    // .env.local); el alta efímera queda como último recurso.
    console.log('\n— Usuario autenticado (no admin) —')
    let sesion = null
    let usuarioEfimero = null

    if (env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD) {
        const login = await anon.auth.signInWithPassword({
            email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD,
        })
        if (login.error) console.log(`  SKIP  no se pudo iniciar sesión con TEST_USER_* (${login.error.message})`)
        else sesion = login.data
    } else {
        const emailTest = `rls-check-${Date.now()}@gmail.com`
        const alta = await anon.auth.signUp({
            email: emailTest, password: `Rls!${Date.now()}x`,
            options: { data: { nombre: 'Test RLS', whatsapp: null } },
        })
        if (alta.error || !alta.data.session) {
            console.log(`  SKIP  sin sesión de prueba (${alta.error?.message || 'confirmación de email activa'}).`)
            console.log('        Definí TEST_USER_EMAIL y TEST_USER_PASSWORD en .env.local con una cuenta NO admin ya registrada.')
        } else { sesion = alta.data; usuarioEfimero = emailTest }
    }

    if (sesion) {
        const db = anon // el cliente ya lleva la sesión del usuario
        const uid = sesion.user.id

        const cli = await db.from('clientes').select('id')
        const soloPropia = !cli.error && (cli.data || []).length > 0 && (cli.data || []).every(c => c.id === uid)
        reporte(soloPropia, 'autenticado: solo ve SU propia fila de clientes (no la PII de otros)',
            cli.error?.message || `filas visibles: ${(cli.data || []).length}`)

        const roles = await db.from('user_roles').select('*')
        reporte(!roles.error && (roles.data || []).every(r => r.user_id === uid),
            'autenticado: no lee roles ajenos')

        const auto = await db.from('user_roles').insert({ user_id: uid, role: 'admin' }).select()
        reporte(Boolean(auto.error), 'autenticado: NO puede auto-asignarse rol admin', auto.error?.code)

        await pruebasDeEscritura(db, 'autenticado')

        const perfil = await db.from('clientes').select('nombre').eq('id', uid).single()
        reporte(!perfil.error && Boolean(perfil.data),
            'autenticado: su perfil existe en clientes (trigger de registro)', perfil.error?.message)

        await db.auth.signOut()
    }

    console.log(`\n${fallos === 0 ? 'TODO OK — superficie cerrada.' : `${fallos} verificaciones FALLARON — revisar policies.`}`)
    const limpieza = ['el pedido "TEST verificación — borrar"']
    if (usuarioEfimero) limpieza.unshift(`el usuario ${usuarioEfimero} (Auth)`)
    console.log(`Limpieza manual: borrar ${limpieza.join(' y ')}.\n`)
    process.exit(fallos === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
