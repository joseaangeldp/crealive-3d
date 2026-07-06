# Guía de contribución — Crealive 3D

Flujo de trabajo para este repositorio (React + Vite + Supabase + Vercel).

## Flujo por ramas

**Nunca se hace push directo a `main`.** Todo cambio entra por Pull Request.

1. Partir siempre de `main` actualizado:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Crear una rama con prefijo según el tipo de cambio:
   - `feat/nombre-corto` — nueva funcionalidad (ej. `feat/carrito-compras`)
   - `fix/nombre-corto` — corrección de bug (ej. `fix/header-movil`)
   - `chore/nombre-corto` — mantenimiento, configuración, dependencias
   - `docs/nombre-corto` — solo documentación
3. Hacer commits pequeños y enfocados en esa rama.
4. Subir la rama y abrir un PR hacia `main`:
   ```bash
   git push -u origin feat/nombre-corto
   gh pr create
   ```
5. Revisar el PR (y verificar el preview de Vercel) antes de hacer merge.

## Formato de commits (Conventional Commits)

```
<tipo>: <descripción corta en presente>
```

Tipos permitidos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.

Ejemplos:

- `feat: agregar galería de productos con filtros`
- `fix: corregir overflow del hero en móvil`
- `chore: actualizar dependencias de Vite`

## Qué NO se versiona

- Secretos y variables de entorno: `.env`, `.env.local` (usar `.env.example` como plantilla).
- Binarios de diseño 3D: `*.3mf`, `*.stl`, `*.obj`, `*.step`, `*.shapr`.
- Dependencias y builds: `node_modules/`, `dist/`.

Si una llave o secreto llega a subirse por accidente, **rotarla de inmediato**
en Supabase/GitHub — quitarla del repo no la elimina del historial.

## Checklist antes de abrir un PR

- [ ] La app compila: `npm run build`
- [ ] Probado localmente: `npm run dev`
- [ ] Sin archivos `.env` ni binarios en el diff
- [ ] Commits con formato Conventional Commits
