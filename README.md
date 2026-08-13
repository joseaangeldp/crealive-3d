# Crealive 3D

Tienda de impresión 3D personalizada. SPA en **React + Vite**, datos e imágenes
en **Supabase** (región `sa-east-1`, São Paulo), deploy en **Vercel**, checkout
por WhatsApp.

## Desarrollo local

```bash
cp .env.example .env   # completar valores
npm install
npm run dev
```

## Imágenes y performance

Las imágenes del catálogo/galería se sirven directo desde Supabase Storage
(buckets `productos` y `galeria`).

- **Subidas nuevas (panel admin):** se comprimen en el navegador antes de subir
  con `src/lib/compressProductImage.js` (WebP, máx. 1600px, ~300KB, en Web
  Worker) y se suben con `contentType: image/webp` y `cacheControl: 31536000`.
- **Frontend:** `loading="lazy"` + `decoding="async"` en catálogo, galería y
  carrusel (primer slide `eager` con `fetchpriority="high"`).

### Script de backfill (imágenes viejas)

`scripts/backfill-images.js` comprime las imágenes ya existentes en Storage.
Sobrescribe el **mismo path**, así que las URLs guardadas en la base de datos
no cambian.

Las credenciales se cargan desde `.env.local` (gitignored) con `dotenv`. Agregá
solo esta línea a tu `.env.local` local (la URL se reutiliza de
`VITE_SUPABASE_URL`, que ya está):

```
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> La `service_role` key da acceso total saltándose RLS: va **solo** en
> `.env.local`, **nunca** commiteada, **nunca** en Vercel y **nunca** con prefijo
> `VITE_` (eso la publicaría en el bundle). Se obtiene en Supabase → Project
> Settings → API → `service_role`.

```bash
node scripts/backfill-images.js            # dry-run: solo reporta pesos
node scripts/backfill-images.js --execute  # aplica (¡sobrescribe Storage!)
```

Es de un solo uso: las subidas nuevas ya salen comprimidas del panel admin. Usa
la `service_role`, así que **salta las policies de Storage** — funciona aunque la
escritura pública esté restringida a admins.

## Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` / Vercel | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` / Vercel | Llave pública (anon) |
| `VITE_WHATSAPP_NEGOCIO` | `.env` / Vercel | WhatsApp del negocio |
| `VITE_RESEND_API_KEY` | `.env` / Vercel | Envío de emails |
| `VITE_ADMIN_EMAIL` | `.env` / Vercel | Acceso al panel `/admin` |
| `SUPABASE_SERVICE_ROLE_KEY` | solo `.env.local` | Script de backfill — **secreta; nunca commitear, nunca en Vercel, nunca con prefijo `VITE_`** |

## Flujo de trabajo

Ramas por feature (`feat/`, `fix/`, `chore/`) y PR obligatorio hacia `main`.
Ver `CONTRIBUTING.md`.
