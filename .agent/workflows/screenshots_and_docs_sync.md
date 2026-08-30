---
description: Pipeline de captura automatizada de pantallas con Playwright, scroll de contenedores y actualización de manuales de usuario.
---

# Workflow: Captura de Pantallas y Actualización de Manuales

Este workflow documenta cómo capturar las vistas completas de la aplicación web y mantener sincronizado el manual de usuario con sus imágenes y explicaciones.

---

## 1. Pipeline de Capturas y Sincronización de Documentación

> [!IMPORTANT]
> **Regla de Desarrollo Ágil (Cero Sobrecarga):** Las capturas de pantalla y la compilación de documentación en PDF **NO** deben ejecutarse durante el ciclo normal de desarrollo del frontend o backend. Se ejecutan exclusivamente bajo demanda antes de un commit, PR o release mediante `make` (fachada de `scripts/tributacos.py`).

### Comandos del Pipeline

Para no ralentizar el desarrollo local:

1. **Solo capturas de pantalla:**
   ```bash
   make screenshots
   # equivalente: python scripts/tributacos.py screenshots
   ```
2. **Pipeline completo de pre-release (Capturas + Sincronización de manual + PDFs):**
   ```bash
   make docs-sync
   ```
   Incluye los tres PDFs oficiales: técnico, manual de usuario y guía de instalación (`make pdf-instalacion`).

---

## 2. Reglas Técnicas de Captura (Playwright)

El shell de tribuTACOS utiliza una arquitectura de pantalla completa con un contenedor interno con scroll vertical:

- **Estructura en `frontend/src/App.jsx`**: `<main className="h-screen overflow-hidden">` y `<div className="flex-1 overflow-y-auto p-6 sm:p-8">`.
- **Regla de Scroll**: **NO** utilizar `window.scrollTo(0, y)`. Debe manipularse el `scrollTop` del contenedor interno:
  ```javascript
  await page.evaluate((top) => {
    const container = document.querySelector('div.overflow-y-auto');
    if (container) container.scrollTop = top;
  }, scrollPositionPx);
  ```
- **Resolución y Escalado Estándar**:
  - Viewport: `1500 x 950` px.
  - `deviceScaleFactor: 2` (para nitidez en pantallas Retina / 4K).
- **Espera de Renderizado**: Al cambiar de pestaña o ejecutar scroll, esperar al menos `800ms` a `1500ms` para estabilizar transiciones CSS y animaciones de gráficos (Recharts).

---

## 3. Nomenclatura Estándar de Imágenes (`manual_usuario/img/`)

| Vista / Pantalla | Captura Superior (Hero/KPIs) | Captura Inferior (Scroll) |
| :--- | :--- | :--- |
| **Dashboard Principal** | `01_dashboard_global.png` | `01_dashboard_scroll_graficas_y_retenciones.png` |
| **Modal Ingesta XML** | `02_upload_modal.png` | — |
| **Pagos Provisionales** | `03_predeclaracion_mensual.png` | `03_predeclaracion_mensual_scroll_tabla.png` |
| **Borrador Oficial SAT** | `04_borrador_sat_modal.png` | — |
| **Declaración Anual** | `05_predeclaracion_anual.png` | `05_predeclaracion_anual_scroll_deducciones_y_conciliacion.png` |
| **Gastos y Compras** | `06_gastos_y_compras.png` | `06_gastos_scroll_categorias_y_grafica.png` |
| **Deducciones Personales** | `07_deducciones_personales.png` | `07_deducciones_scroll_tabla_facturas.png` |
| **Sueldos y Salarios** | `08_sueldos_y_salarios.png` | `08_sueldos_scroll_patrones_y_exentos.png` |
| **Detalle de Recibos** | `09_recibos_nomina_detalle.png` | `09_recibos_scroll_tabla_quincenas.png` |
| **Honorarios / Act. Prof.** | `10_honorarios_emitidos.png` | `10_honorarios_scroll_desglose_clientes.png` |
| **Facturas Emitidas** | `11_facturas_clientes.png` | `11_facturas_scroll_tabla_comprobantes.png` |
| **Conciliación SAT** | `12_auditoria_sat_oficial.png` | `12_auditoria_scroll_matriz_declarada_y_bancos.png` |

---

## 4. Ejecución del Script de Captura

Con el entorno levantado (`make dev` o frontend en `http://localhost:3000`):

```bash
make screenshots
```

El script directo `node frontend/scripts/capture_screenshots.js` hace lo mismo; preferir `make` / el runner para no divergir.

---

## 5. Recompilación del Manual Completo

Tras editar o añadir contenido a los capítulos individuales (`01_*.md` a `09_*.md`), regenerar el documento integral **con el Makefile** (lee `VERSION` y recompila PDFs):

```bash
make docs-sync
```

No copiar a mano el script `node -e` del Makefile: esa es la fuente unica y incluye badges de canal (`STABLE` / `RC`).
