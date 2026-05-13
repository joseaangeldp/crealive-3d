# Guía de migración Supabase: us-west-1 → sa-east-1 (São Paulo)

> **Objetivo:** Reducir latencia para usuarios en Latinoamérica (~180ms → ~20ms)  
> **Tiempo estimado:** 45–90 minutos  
> **Downtime esperado:** 5–10 minutos (solo al cambiar las env vars en Vercel)

---

## Pre-requisitos

```bash
# Verificar que tenés instalados:
psql --version          # >= 14
pg_dump --version       # >= 14
supabase --version      # CLI de Supabase (npm i -g supabase)
```

---

## PASO 1 — Exportar la base de datos actual (us-west-1)

### 1.1 Obtener la cadena de conexión del proyecto actual
En **Supabase Dashboard → Settings → Database → Connection string (URI)**:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### 1.2 Hacer el dump completo
```bash
# Dump de esquema + datos (excluye buckets de Storage, que se migran aparte)
pg_dump \
  "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --schema=public \
  -f crealive_backup_$(date +%Y%m%d).sql

# Verificar que el archivo no está vacío
wc -l crealive_backup_*.sql
```

> ⚠️ **Tablas incluidas en el dump:** `clientes`, `productos`, `colecciones`, `pedidos`, `pedido_items`, `categorias`, `colores`, `ediciones_limitadas`

---

## PASO 2 — Crear el nuevo proyecto en São Paulo

1. Ir a **https://supabase.com/dashboard/new**
2. Configurar:
   - **Name:** `crealive-3d-saopaulo` (o el que prefieras)
   - **Region:** `South America (São Paulo) — sa-east-1`  
   - **Password:** guardar en lugar seguro (la vas a necesitar en el Paso 3)
3. Esperar ~2 minutos a que el proyecto esté listo
4. Anotar los nuevos valores desde **Settings → API**:
   - `VITE_SUPABASE_URL` → `https://[NUEVO-PROJECT-REF].supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → la nueva anon key

---

## PASO 3 — Restaurar el dump en el proyecto nuevo

```bash
# Obtener la connection string del proyecto nuevo (sa-east-1)
# Settings → Database → Connection string

psql \
  "postgresql://postgres.[NUEVO-PROJECT-REF]:[NUEVA-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  -f crealive_backup_$(date +%Y%m%d).sql

# Verificar restauración — contar filas en tablas principales
psql \
  "postgresql://postgres.[NUEVO-PROJECT-REF]:[NUEVA-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  -c "SELECT 'productos' as tabla, count(*) FROM public.productos
      UNION ALL SELECT 'colecciones', count(*) FROM public.colecciones
      UNION ALL SELECT 'pedidos', count(*) FROM public.pedidos
      UNION ALL SELECT 'clientes', count(*) FROM public.clientes;"
```

### 3.1 Recrear las políticas RLS
Las políticas de Row Level Security **no siempre migran correctamente** con pg_dump.  
Verificar en el SQL Editor del proyecto nuevo que existan las policies:

```sql
-- Verificar policies existentes
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Si faltan, re-ejecutar los scripts de creación de tablas que están en  
`src/lib/supabase.js` (comentados al inicio del archivo).

---

## PASO 4 — Migrar archivos de Storage

### 4.1 Listar los buckets actuales
```bash
# Con el CLI de Supabase (proyecto viejo)
supabase storage ls --project-ref [VIEJO-PROJECT-REF]

# Buckets esperados en Crealive 3D:
# - productos (imágenes de productos)
# - colecciones (imágenes de banners del carrusel)
# - galeria (trabajos terminados)
```

### 4.2 Descargar archivos del bucket viejo
```bash
# Requiere: pip install supabase (Python SDK)
# O usar el script de bash con la API REST:

VIEJO_URL="https://[VIEJO-PROJECT-REF].supabase.co"
VIEJO_KEY="[VIEJA-SERVICE-ROLE-KEY]"   # Settings → API → service_role

for BUCKET in productos colecciones galeria; do
  mkdir -p storage_backup/$BUCKET
  
  # Listar archivos del bucket
  curl -s "$VIEJO_URL/storage/v1/object/list/$BUCKET" \
    -H "Authorization: Bearer $VIEJO_KEY" \
    -H "Content-Type: application/json" \
    -d '{"prefix": ""}' | \
  jq -r '.[].name' | while read FILE; do
    curl -s -o "storage_backup/$BUCKET/$FILE" \
      "$VIEJO_URL/storage/v1/object/public/$BUCKET/$FILE"
    echo "Descargado: $BUCKET/$FILE"
  done
done
```

### 4.3 Crear los buckets en el proyecto nuevo y subir archivos
```bash
NUEVO_URL="https://[NUEVO-PROJECT-REF].supabase.co"
NUEVO_KEY="[NUEVA-SERVICE-ROLE-KEY]"

# Crear buckets (público)
for BUCKET in productos colecciones galeria; do
  curl -s -X POST "$NUEVO_URL/storage/v1/bucket" \
    -H "Authorization: Bearer $NUEVO_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"$BUCKET\", \"name\": \"$BUCKET\", \"public\": true}"

  # Subir archivos
  for FILE in storage_backup/$BUCKET/*; do
    FILENAME=$(basename $FILE)
    curl -s -X POST "$NUEVO_URL/storage/v1/object/$BUCKET/$FILENAME" \
      -H "Authorization: Bearer $NUEVO_KEY" \
      -H "Content-Type: image/jpeg" \
      --data-binary @$FILE
    echo "Subido: $BUCKET/$FILENAME"
  done
done
```

> 💡 **Alternativa más rápida:** Si las URLs de imágenes de productos están guardadas en la DB como  
> `https://[VIEJO-PROJECT-REF].supabase.co/storage/v1/object/public/...`  
> tendrás que actualizarlas en la tabla `productos` y `colecciones` después de migrar el Storage.

---

## PASO 5 — Actualizar variables de entorno en Vercel

1. Ir a **https://vercel.com/dashboard → crealive-3d → Settings → Environment Variables**
2. Editar las siguientes variables (para todos los entornos: Production, Preview, Development):

| Variable | Valor anterior | Nuevo valor |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://[VIEJO-REF].supabase.co` | `https://[NUEVO-REF].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `[vieja anon key]` | `[nueva anon key]` |

3. También actualizar si están presentes:
   - `VITE_ADMIN_EMAIL` — no cambia
   - `VITE_WHATSAPP_NEGOCIO` — no cambia
   - `VITE_RESEND_API_KEY` — no cambia

4. **Trigger manual de redeploy:**
   - Vercel → Deployments → tres puntos → "Redeploy"

---

## PASO 6 — Verificar funcionamiento

### 6.1 Checklist de verificación
```
□ La home carga productos / colecciones desde el nuevo proyecto
□ El catálogo muestra todos los productos con imágenes
□ Login de usuario funciona
□ Panel admin (/admin) carga y muestra pedidos
□ Se puede crear un nuevo pedido de prueba
□ Las imágenes en Storage cargan correctamente (URLs nuevas)
□ El email del admin sigue configurado en ADMIN_EMAIL
```

### 6.2 Test de latencia (comparación)
```bash
# Medir tiempo de respuesta antes y después
curl -o /dev/null -s -w "%{time_total}s\n" \
  "https://[NUEVO-REF].supabase.co/rest/v1/productos?select=id&limit=1" \
  -H "apikey: [NUEVA-ANON-KEY]"

# Esperado: < 80ms desde Argentina/Venezuela
```

---

## PASO 7 — Eliminar el proyecto viejo (después de 48hs de pruebas)

1. **Esperar mínimo 48 horas** con el nuevo proyecto en producción
2. Hacer un **dump final de seguridad** del proyecto viejo (por si acaso)
3. Ir a **Supabase Dashboard → [Proyecto viejo] → Settings → General → Delete project**
4. Confirmar con el nombre del proyecto

> ⚠️ Esta acción es **irreversible**. Asegurarse de que todo funciona antes de eliminar.

---

## Troubleshooting frecuente

| Problema | Causa probable | Solución |
|---|---|---|
| `invalid API key` en Vercel | Env vars no actualizadas | Forzar redeploy después de actualizar |
| Imágenes rotas | URLs de Storage con el ref viejo | Actualizar URLs en tabla `productos` / `colecciones` |
| RLS bloqueando admin | Policies no migradas | Re-ejecutar scripts de políticas |
| `connection refused` en pg_dump | Firewall de Supabase | Usar el Pooler URL (puerto 5432, no 6543) |
| Storage vacío | Buckets no creados como público | Recrear con `"public": true` en el JSON |
