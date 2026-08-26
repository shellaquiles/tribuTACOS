---
description: Pipeline de captura automatizada de pantallas con Playwright, scroll de contenedores y actualización de manuales de usuario.
---

# Workflow: Captura de Pantallas y Actualización de Manuales

Este workflow documenta cómo capturar las vistas completas de la aplicación web y mantener sincronizado el manual de usuario con sus imágenes y explicaciones.

---

## 1. Reglas Técnicas de Captura (Playwright)

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

## 2. Nomenclatura Estándar de Imágenes (`manual_usuario/img/`)

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

## 3. Ejecución del Script de Captura

Con el entorno levantado (`make dev` o frontend en `http://localhost:3000`):

```bash
node frontend/scripts/capture_screenshots.js
```

---

## 4. Recompilación del Manual Completo

Tras editar o añadir contenido a los capítulos individuales (`01_*.md` a `09_*.md`), se debe regenerar el documento integral:

```bash
node -e '
const fs = require("fs");
const path = require("path");
const dir = "manual_usuario";
const files = [
  "01_introduccion_y_propuesta_de_valor.md",
  "02_primeros_pasos_e_ingesta.md",
  "03_modulo_dashboard_global.md",
  "04_modulo_predeclaracion_mensual.md",
  "05_modulo_predeclaracion_anual.md",
  "06_modulo_egresos_y_deducciones.md",
  "07_modulo_ingresos_y_nomina.md",
  "08_modulo_auditoria_sat_conciliacion.md",
  "09_roadmap_y_evolucion_modulos.md"
];
let fullDoc = `# tribuTACOS — Manual de Usuario Completo\n\n> **Plataforma de Inteligencia Fiscal, Conciliación de Comprobantes Digitales (CFDI 3.3/4.0) y Simulación Analítica de Pre-Declaración Mensual y Anual para Personas Físicas en México.**\n\n---\n\n## Tabla de Contenidos\n\n`;
files.forEach((f, idx) => {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  const titleMatch = content.match(/# Capítulo \d+: ([^\n\r]+)/);
  const title = titleMatch ? titleMatch[1] : f;
  fullDoc += `${idx + 1}. [Capítulo 0${idx + 1}: ${title}](#capítulo-0${idx + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")})\n`;
});
fullDoc += "\n---\n\n";
files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), "utf8");
  content = content.replace(/^# tribuTACOS — Manual de Usuario\s*\n+/g, "");
  fullDoc += content + "\n\n---\n\n";
});
fs.writeFileSync(path.join(dir, "MANUAL_DE_USUARIO_COMPLETO.md"), fullDoc.trim() + "\n");
console.log("MANUAL_DE_USUARIO_COMPLETO.md consolidado exitosamente.");
'
```
