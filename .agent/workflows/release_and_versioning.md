---
description: Guía y protocolo para preparar un nuevo Release / Pull Request con incremento de versión (SemVer), actualización de capturas y manuales.
---

# Protocolo: Preparación de Release y Cambio de Versión

Este workflow establece el proceso estricto para empaquetar una nueva versión de **tribuTACOS** y preparar un Pull Request limpio.

---

## 1. Regla de Incremento de Versión (SemVer)

- **Patch / Corrección (ej. 1.0.0 ➔ 1.0.1):** Mejoras visuales, actualización de capturas, ajustes menores de UI, corrección de textos o dependencias.
- **Minor / Funcionalidad (ej. 1.0.1 ➔ 1.1.0):** Nuevas pantallas, nuevos motores de cálculo fiscal, soporte para nuevos regímenes (ej. RESICO).
- **Major / Ruptura (ej. 1.1.0 ➔ 2.0.0):** Cambio de arquitectura, migración de base de datos incompatible, reestructuración total del API.

---

## 2. Archivos Obligatorios a Sincronizar

Al cambiar de versión, se deben sincronizar **en el mismo commit/PR** los siguientes archivos:

1. **`frontend/package.json`**: `"version": "X.Y.Z"`
2. **`backend/app/config.py`**: `VERSION: str = "X.Y.Z"`
3. **`frontend/src/App.jsx`**: Badge de versión visible en el footer / sidebar (`vX.Y.Z STABLE`).
4. **`CHANGELOG.md`**: Entrada superior con fecha ISO y desglose por categorías (`### Agregado`, `### Modificado`, `### Corregido`).
5. **`README.md`**: Badges de versión (`vX.Y.Z STABLE`), tabla de documentación y referencias de capturas.
6. **`manual_usuario/01_introduccion_y_propuesta_de_valor.md`**: Badge de versión y bloque `> **Versión de Referencia:** Este documento y sus guías visuales corresponden a tribuTACOS vX.Y.Z STABLE.`
7. **`docs/01_arquitectura_general.md`**: Badge de versión y bloque `> **Versión de Referencia del Sistema:** Esta documentación técnica describe la arquitectura y especificación de tribuTACOS vX.Y.Z STABLE.`
8. **`manual_usuario/MANUAL_DE_USUARIO_COMPLETO.md`**: Recompilar el documento integral con la nueva versión declarada.
9. **Compilación de PDFs Oficiales (`make pdf`)**: Regenerar `docs/tribuTACOS_documentacion_tecnica.pdf` y `manual_usuario/tribuTACOS_manual_usuario.pdf` con **Pandocquiles by shellaquiles.org**.

---

## 3. Pipeline de Verificación

Antes de abrir el PR:

```bash
# 1. Ejecutar pruebas unitarias en Backend
cd backend && pytest

# 2. Validar compilación de Frontend
cd frontend && npm run build

# 3. Validar regeneración de capturas si hubo cambios en UI
node frontend/scripts/capture_screenshots.js

# 4. Recompilar manual unificado y PDFs oficiales con Pandocquiles
make pdf
```

---

## 4. Checklist para el Pull Request

- [ ] Todos los tests de backend pasan (`11 passed`).
- [ ] El frontend compila sin errores de lint o TypeScript/JSX (`npm run build`).
- [ ] `CHANGELOG.md` documenta los cambios con la versión exacta.
- [ ] `README.md`, `manual_usuario/` y `docs/` declaran la versión exacta `vX.Y.Z STABLE`.
- [ ] Los PDFs oficiales (`docs/` y `manual_usuario/`) fueron regenerados con `make pdf`.
- [ ] El branch sigue el formato `feature/vX.Y.Z-descripcion` o `release/vX.Y.Z`.
- [ ] Título del PR: `Release vX.Y.Z: Resumen conciso`.

