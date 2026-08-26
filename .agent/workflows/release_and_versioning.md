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
5. **`README.md`**: Badges de versión y referencias de capturas.
6. **`manual_usuario/`**: Actualizar referencias de versión y recompilar `MANUAL_DE_USUARIO_COMPLETO.md`.

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
```

---

## 4. Checklist para el Pull Request

- [ ] Todos los tests de backend pasan (`11 passed`).
- [ ] El frontend compila sin errores de lint o TypeScript/JSX (`npm run build`).
- [ ] `CHANGELOG.md` documenta los cambios con la versión exacta.
- [ ] `README.md` y `manual_usuario/` están alineados con las capturas de la versión.
- [ ] El branch sigue el formato `feature/vX.Y.Z-descripcion` o `release/vX.Y.Z`.
- [ ] Título del PR: `Release vX.Y.Z: Resumen conciso`.
