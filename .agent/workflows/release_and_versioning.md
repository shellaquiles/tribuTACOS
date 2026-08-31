---
description: Guía y protocolo para preparar un nuevo Release / Pull Request con incremento de versión (SemVer), actualización de capturas y manuales.
---

# Protocolo: Preparación de Release y Cambio de Versión

Este workflow establece el proceso estricto para empaquetar una nueva versión de **tribuTACOS** y preparar un Pull Request limpio.

---

## 1. Regla de Incremento de Versión (SemVer)

- **Patch / Corrección (ej. 1.0.0 ➔ 1.0.1):** Mejoras visuales, actualización de capturas, ajustes menores de UI, corrección de textos o dependencias.
- **Minor / Funcionalidad (ej. 1.0.1 ➔ 1.1.0):** Nuevas pantallas, nuevos motores de cálculo fiscal, soporte para nuevos regímenes (ej. RESICO), empaquetado de usuario final.
- **Major / Ruptura (ej. 1.1.0 ➔ 2.0.0):** Cambio de arquitectura, migración de base de datos incompatible, reestructuración total del API.

### Pre-release (`rc`)

Antes de un estable se publica un **release candidate** para pruebas. El identificador SemVer va en `VERSION` y en la etiqueta Git:

| Canal | `VERSION` | Etiqueta Git | GitHub | Docker |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas | `1.1.0-rc.1` | `v1.1.0-rc.1` | Pre-release (no latest) | Solo tag `1.1.0-rc.1` |
| Siguiente RC | `1.1.0-rc.2` | `v1.1.0-rc.2` | Pre-release | Solo `1.1.0-rc.2` |
| Estable | `1.1.0` | `v1.1.0` | Latest | `1.1.0`, `1.1` y `latest` |

También se aceptan `-beta.N` y `-alpha.N` si hace falta un ciclo más temprano. No se usa `v1.1.0-rc` sin número.

La etiqueta **es** el disparador: `release.yml` y `docker-publish.yml` escuchan `v*`. El archivo `VERSION` debe coincidir con la etiqueta (sin la `v`); si no, el release falla.

---

## 2. Archivos Obligatorios a Sincronizar

Al cambiar de versión, el único archivo fuente es **`VERSION`** (una línea: `X.Y.Z` o `X.Y.Z-rc.N`).

```bash
echo "1.1.0-rc.1" > VERSION
python scripts/sync_version.py   # o: make version-sync
```

Eso actualiza copias derivadas:

1. **`frontend/package.json`**
2. **`README.md`** (badge)
3. **`docs/01_arquitectura_general.md`**
4. **`docs/INSTALACION_USUARIO.md`**
5. **`manual_usuario/01_introduccion_y_propuesta_de_valor.md`**
6. **`manual_usuario/MANUAL_DE_USUARIO_COMPLETO.md`** (badges; regenerar con `make docs-sync` si cambió el contenido)
7. **`packaging/windows/tributacos.iss`**
8. **`.agent/workflows/declara_context.md`**
9. **`.agent/workflows/documentation_style_guide.md`** (badge de ejemplo)

Backend (`app.config.VERSION`) y frontend (`NEXT_PUBLIC_APP_VERSION`) **leen `VERSION` en tiempo de ejecución/build**; no hay que editarlos a mano. La UI muestra `STABLE` o `RC` según el identificador.

Luego, en el mismo PR:

10. **`CHANGELOG.md`**: entrada superior con fecha ISO (`## [1.1.0-rc.1] - YYYY-MM-DD`).
11. **`manual_usuario/MANUAL_DE_USUARIO_COMPLETO.md`**: `make docs-sync` (lee `VERSION`).
12. **PDFs oficiales** (`make pdf-all`): técnico, manual de usuario y guía de instalación.

El instalador Windows se llama `TributacosSetup-<VERSION>.exe` (sin `v` extra; ejemplo `TributacosSetup-1.1.0-rc.1.exe`). Esos tres PDFs deben existir **antes** del build de PyInstaller (el spec los copia a `manuals/`).

---

## 3. Pipeline de Verificación

Antes de abrir el PR:

```bash
# 1. Pruebas y lint (mismo codigo que python scripts/tributacos.py)
make test
make lint

# 2. Validar compilación de Frontend (dev o standalone)
cd frontend && npm run build

# 3. Capturas si hubo cambios en la UI
# Interfaz web fiscal (Playwright; requiere make dev)
make screenshots
# Panel de Operaciones (Tkinter → docs/img/)
make screenshots-gui

# 4. Manual unificado y PDFs oficiales (técnico, usuario, instalación)
make pdf-all
```

---

## 4. Checklist para el Pull Request

- [ ] Todos los tests pasan (`make test`: backend + control_panel).
- [ ] El frontend compila sin errores de lint o TypeScript/JSX (`make lint` y `npm run build`).
- [ ] Si cambió el panel: `docs/img/panel_*.png` actualizados (`make screenshots-gui`) y `make pdf-instalacion` regenerado.
- [ ] `CHANGELOG.md` documenta los cambios con la versión exacta.
- [ ] `README.md`, `manual_usuario/` y `docs/` declaran la versión exacta (`vX.Y.Z STABLE` o `vX.Y.Z-rc.N RC`).
- [ ] Los PDFs oficiales (`docs/` y `manual_usuario/`, incluida la guía de instalación) fueron regenerados con `make pdf-all`.
- [ ] `make version-sync` no deja copias derivadas desfasadas.
- [ ] El branch sigue el formato `feature/vX.Y.Z-descripcion` o `release/vX.Y.Z`.
- [ ] Título del PR: `Release vX.Y.Z: Resumen conciso` (o `Pre-release vX.Y.Z-rc.N: ...`).

---

## 5. Publicar artefactos (GitHub Release)

Cuando el commit a probar ya está en el remoto (idealmente en `main`):

```bash
# Pre-release de pruebas
git tag v1.1.0-rc.1
git push origin v1.1.0-rc.1

# Cuando las pruebas cierren, el estable (sin sufijo)
git tag v1.1.0
git push origin v1.1.0
```

Los workflows `.github/workflows/docker-publish.yml` y `release.yml` generan:

- Imagenes `ghcr.io/shellaquiles/tributacos-backend` y `tributacos-frontend`
- `TributacosSetup-<version>.exe` (Windows; el nombre **no** lleva `v` extra)
- `tributacos-docker-<version>.zip` (Docker en Win/Mac/Linux, con `.env` fijando la version)
- `SHA256SUMS.txt`

Un tag con guion (`v1.1.0-rc.1`) se publica como **pre-release**: no sustituye el latest de GitHub ni las etiquetas Docker `latest` / `1.1`.

Verificar la pestana **Releases** del repositorio antes de anunciar la version.
