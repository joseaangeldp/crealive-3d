// ============================================================
// scripts/backup-bucket.mjs — Respaldo local de los buckets de Storage
// Crealive 3D — SOLO DESCARGA (read-only), no modifica nada en Supabase
// ============================================================
//
// Baja TODOS los objetos de los buckets 'productos', 'galeria' y
// 'colecciones' a ./backup/<bucket>/ para tener un respaldo antes de
// correr el backfill con --execute (que sobrescribe los originales).
//
// USO:
//   1. En .env.local (gitignored): SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//      (la URL se reutiliza de VITE_SUPABASE_URL)
//   2. node scripts/backup-bucket.mjs
//
// La carpeta ./backup está en .gitignore — nunca se commitea.

import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)) })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKETS = ['productos', 'galeria', 'colecciones']
const OUT_DIR = fileURLToPath(new URL('../backup', import.meta.url))

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Falta configurar .env.local con:')
    console.error('   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   (obligatoria, sin prefijo VITE_)')
    console.error('   VITE_SUPABASE_URL=...  o  SUPABASE_URL=...      (una de las dos)')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const fmt = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function listAllFiles(bucket) {
    const files = []
    let page = 0
    const PAGE_SIZE = 100
    for (;;) {
        const { data, error } = await supabase.storage.from(bucket)
            .list('', { limit: PAGE_SIZE, offset: page * PAGE_SIZE })
        if (error) throw error
        files.push(...data.filter(f => f.id)) // solo archivos, no carpetas
        if (data.length < PAGE_SIZE) break
        page++
    }
    return files
}

async function backupBucket(bucket, totals) {
    console.log(`\n📦 Bucket "${bucket}"`)
    let files
    try {
        files = await listAllFiles(bucket)
    } catch (err) {
        console.error(`   ❌ no se pudo listar (${err.message}) — se salta`)
        totals.errors++
        return
    }
    console.log(`   ${files.length} archivos`)
    if (files.length === 0) return

    const dir = `${OUT_DIR}/${bucket}`
    await mkdir(dir, { recursive: true })

    for (const f of files) {
        const { data: blob, error } = await supabase.storage.from(bucket).download(f.name)
        if (error) {
            console.error(`   ❌ ${f.name} — ${error.message}`)
            totals.errors++
            continue
        }
        const buf = Buffer.from(await blob.arrayBuffer())
        await writeFile(`${dir}/${f.name}`, buf)
        totals.files++
        totals.bytes += buf.length
    }
    console.log(`   ✅ ${files.length} archivos guardados en backup/${bucket}/`)
}

async function main() {
    console.log('💾 Respaldo local de Storage (read-only) →', OUT_DIR)
    const totals = { files: 0, bytes: 0, errors: 0 }
    for (const bucket of BUCKETS) {
        await backupBucket(bucket, totals)
    }
    console.log('\n════════ RESUMEN ════════')
    console.log(`Archivos respaldados: ${totals.files} | Errores: ${totals.errors}`)
    console.log(`Peso total descargado: ${fmt(totals.bytes)}`)
    console.log('\nNada fue modificado en Supabase. Guardá la carpeta backup/ antes del --execute.')
}

main().catch(err => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
})
