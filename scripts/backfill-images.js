// ============================================================
// scripts/backfill-images.js — Compresión de imágenes existentes
// Crealive 3D — script de UN SOLO USO
// ============================================================
//
// Lista los buckets 'productos' y 'galeria', baja cada imagen,
// la comprime a WebP (1600px máx, calidad 80) y sobrescribe el
// MISMO path con contentType image/webp + cacheControl 1 año.
// Las URLs guardadas en la base de datos NO cambian.
//
// USO:
//   1. Variables de entorno (NUNCA commitear la service_role key):
//        export SUPABASE_URL="https://<project-ref>.supabase.co"
//        export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
//   2. Dry-run (por defecto — solo reporta, no toca nada):
//        node scripts/backfill-images.js
//   3. Aplicar de verdad (pedir permiso antes de correr en producción):
//        node scripts/backfill-images.js --execute
//
// Requiere: npm i -D sharp  (ya en devDependencies)

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EXECUTE = process.argv.includes('--execute')

const BUCKETS = ['productos', 'galeria']
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 80
// No recomprimir lo que ya está liviano (subidas nuevas ya vienen en WebP)
const SKIP_UNDER_BYTES = 350 * 1024

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
    console.error('   export SUPABASE_URL="https://<ref>.supabase.co"')
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="<key>"')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const fmt = bytes => `${(bytes / 1024).toFixed(0)} KB`

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

async function processBucket(bucket, totals) {
    console.log(`\n📦 Bucket "${bucket}"`)
    const files = await listAllFiles(bucket)
    console.log(`   ${files.length} archivos encontrados`)

    for (const f of files) {
        const size = f.metadata?.size ?? 0
        if (size < SKIP_UNDER_BYTES) {
            console.log(`   ⏭️  ${f.name} — ${fmt(size)} (ya liviano, se salta)`)
            totals.skipped++
            continue
        }

        const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(f.name)
        if (dlError) {
            console.error(`   ❌ ${f.name} — error al bajar: ${dlError.message}`)
            totals.errors++
            continue
        }

        let webp
        try {
            const input = Buffer.from(await blob.arrayBuffer())
            webp = await sharp(input)
                .rotate() // respeta orientación EXIF antes de perderla
                .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: WEBP_QUALITY })
                .toBuffer()
        } catch (err) {
            console.error(`   ❌ ${f.name} — error al comprimir: ${err.message}`)
            totals.errors++
            continue
        }

        const ahorro = ((1 - webp.length / size) * 100).toFixed(0)
        totals.before += size
        totals.after += webp.length
        totals.processed++

        if (!EXECUTE) {
            console.log(`   🔍 ${f.name} — ${fmt(size)} → ${fmt(webp.length)} (−${ahorro}%) [dry-run]`)
            continue
        }

        const { error: upError } = await supabase.storage.from(bucket)
            .upload(f.name, webp, {
                upsert: true,
                contentType: 'image/webp',
                cacheControl: '31536000',
            })
        if (upError) {
            console.error(`   ❌ ${f.name} — error al subir: ${upError.message}`)
            totals.errors++
            continue
        }
        console.log(`   ✅ ${f.name} — ${fmt(size)} → ${fmt(webp.length)} (−${ahorro}%)`)
    }
}

async function main() {
    console.log(EXECUTE
        ? '🚀 MODO EXECUTE — se van a SOBRESCRIBIR los archivos del Storage'
        : '🔍 MODO DRY-RUN — solo reporte, no se modifica nada (usa --execute para aplicar)')

    const totals = { processed: 0, skipped: 0, errors: 0, before: 0, after: 0 }
    for (const bucket of BUCKETS) {
        await processBucket(bucket, totals)
    }

    console.log('\n════════ RESUMEN ════════')
    console.log(`Procesados: ${totals.processed} | Saltados: ${totals.skipped} | Errores: ${totals.errors}`)
    if (totals.processed > 0) {
        const ahorro = ((1 - totals.after / totals.before) * 100).toFixed(0)
        console.log(`Peso total: ${fmt(totals.before)} → ${fmt(totals.after)} (−${ahorro}%)`)
    }
    if (!EXECUTE) console.log('\nNada fue modificado. Ejecuta con --execute para aplicar.')
}

main().catch(err => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
})
