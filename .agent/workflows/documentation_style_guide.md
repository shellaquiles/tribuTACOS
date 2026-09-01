---
description: Guía de estilo de redacción editorial, formato técnico fiscal, diseño visual y presentación para la documentación de tribuTACOS.
---

# Guía de Estilo Editorial y Documentación Técnica

Esta guía define el tono, vocabulario, convenciones de marcado y estructura visual para la documentación, manuales y changelogs de **tribuTACOS**.

---

## 1. Tono y Voz

- **Profesional, Técnico y Riguroso:** Utilizar terminología contable y fiscal mexicana precisa (Artículos de LISR, LIVA, CFF, CFDI 3.3/4.0, Anexo 20, complementos de nómina 1.2, etc.).
- **Didáctico y Orientado al Usuario:** Explicar claramente *qué significa cada cálculo*, *por qué se determina de esa forma* y *cuál es la acción recomendada*.
- **Enfoque de Confianza Fiscal:** Transmitir certeza matemática, idempotencia en los datos y advertencias claras sobre lo que es simulación analítica vs presentaciones oficiales ante el SAT.

---

## 2. Convenciones de Formato y Marcado Markdown

### 2.1 Botones y Teclas Interactivas
- Usar siempre la etiqueta `<kbd>` para cualquier botón, atajo o control de la interfaz de usuario:
  - `<kbd>📂 Cargar Comprobantes XML</kbd>`
  - `<kbd>📁 Por Rubro / Categoría</kbd>`
  - `<kbd>📄 Borrador</kbd>`
  - `<kbd>📥 Exportar (CSV)</kbd>`
- **Botones del Panel de Operaciones:** documentarlos con el mismo nombre que en la GUI. Fuente de verdad: [`control_panel/config/copy.py`](file:///home/kubrick/www/tributacos/control_panel/config/copy.py) (`TASKS`, `InicioCopy`, `TAB_LABELS`). Ejemplos:
  - `<kbd>Exportar respaldo</kbd>`, `<kbd>Restaurar respaldo</kbd>`
  - `<kbd>Procesar facturas XML</kbd>`, `<kbd>Procesar PDFs descargados</kbd>`
  No describir el panel como un clon del Makefile: comparte el runner, no la interfaz web.

### 2.2 Montos Monetarios y Claves Fiscales
- **Moneda:** Formato `$123,456.78 MXN` o en tablas `$123,456.78`.
- **Claves Fiscales y Tipos:** En bloques de código en línea: `01` (Efectivo), `03` (Transferencia), `PUE`, `PPD`, `D01`, `001 Sueldo Base`.
- **Porcentajes:** `16%` (IVA), `10%` (Retención ISR PM), `10.6667%` (Retención IVA PM).

### 2.3 Bloques de Alerta (Callouts de GitHub)
Utilizar bloques de alerta para destacar aspectos críticos:

- `> [!NOTE]`: Para notas aclaratorias, tiempos de respuesta (<15ms) o funcionamiento interno.
- `> [!TIP]`: Para estrategias fiscales legales (ej. deducciones personales Art. 151, aportaciones PPR para devolución).
- `> [!IMPORTANT]`: Para reglas contables clave (ej. arrastre automático de saldos a favor de IVA, compensaciones).
- `> [!WARNING]`: Para requisitos de deducibilidad estrictos (ej. regla de bancarización para compras mayores a `$2,000.00 MXN`).
- `> [!CAUTION]`: Para riesgos de multas, discrepancias fiscales o pérdida de deducibilidad.

---

## 3. Estándar de Badges e Imágenes

- **Badge de Versión Obligatorio:** En el capítulo 1 y en el documento unificado / docs técnicos, incluir el badge de versión exacto:
  ```markdown
  [![Versión](https://img.shields.io/badge/Versión-v1.1.0%20STABLE-blue.svg?style=flat-square)](#)
  ```
- **Declaración Explícita de Versión de Referencia:** Justo debajo de los badges principales, declarar en blockquote:
  ```markdown
  > **Versión de Referencia:** Este documento y sus guías visuales corresponden a **tribuTACOS vX.Y.Z STABLE** (o `vX.Y.Z-rc.N RC` en un pre-release).
  ```
- **Badges Normativos de Capítulo:** Incluir al inicio de cada capítulo badges de estilo `flat-square` referenciando las leyes o módulos aplicables:
  ```markdown
  [![Marco Legal](https://img.shields.io/badge/LISR-Art.%20106%20%28PFAE%29-blue.svg?style=flat-square)](#)
  [![IVA](https://img.shields.io/badge/LIVA-Art.%205%20%7C%206-emerald.svg?style=flat-square)](#)
  ```
- **Imágenes:** Referencias relativas estandarizadas con texto alternativo descriptivo:
  - `manual_usuario/img/` — capturas de la interfaz web (Playwright).
  - `docs/img/` — capturas del Panel de Operaciones (Tkinter).

---

## 4. Estructura Estándar de un Capítulo del Manual

1. **Encabezado y Badges:** Título del módulo, badge de versión (en capítulo 1) y badges normativos.
2. **Declaración de Versión de Referencia:** (En capítulo 1 y manual unificado).
3. **Propuesta de Valor:** Resumen en 1 o 2 párrafos del propósito del módulo.
4. **Captura Superior:** Captura de la vista superior (KPIs / Tarjetas Hero).
5. **Tabla de Indicadores / Métricas:** Tabla en markdown con `Indicador | Fundamento Legal / Descripción | Impacto`.
6. **Captura Inferior (Scroll):** Imagen de la parte inferior (tablas matrices, gráficos o desglose).
7. **Explorador y Acciones Interactivas:** Documentación de filtros, pestañas, inspectores y exportaciones.
8. **Callouts de Alerta:** Notas, advertencias y recomendaciones fiscales.

