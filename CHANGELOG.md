# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0-rc.4] - 2026-08-31

### Añadido
- Paquete [`control_panel/`](../control_panel/) modular (`domain/`, `config/`, `ui/views/`, `infra/`).
- Paquete [`tributacos_core/`](../tributacos_core/) con `runtime.py` compartido (CLI, panel, PyInstaller).
- Tests del panel: `control_panel/tests/test_config.py` y `test_gui_smoke.py` (`@pytest.mark.gui`; CI con `python3-tk` y `xvfb-run`).
- Script `control_panel/scripts/capture_screenshots.py`, comando `make screenshots-gui` y capturas en `docs/img/` y `manual_usuario/img/` (`panel_*.png`).
- Manual de usuario: capítulos 01, 02 y 08 documentan el Panel de Operaciones; PDF regenerado.

### Cambiado
- Panel de Operaciones movido fuera de `scripts/`; entry point `python -m control_panel` / `make gui`.
- `scripts/runtime.py` pasa a ser shim hacia `tributacos_core.runtime`.
- `make test` y `pytest.ini` incluyen `control_panel/tests`.
- Documentación técnica, guía de instalación y workflows `.agent/` sincronizados con la arquitectura del panel.

### Corregido
- `ServerManager.schedule`: wrapper `after(ms, fn)` en Tkinter (`panel.py`).
- `PROJECT_ROOT` en `control_panel/infra/bootstrap.py` apunta a la raíz del repo.
- Pandocquiles: compilación del manual en PDF sin timeout de Puppeteer (`render-pdf.js`; omite badges `shields.io` en PDF).

## [1.1.0-rc.3] - 2026-08-31

### Corregido
- **Windows (.exe)**: arranque sin consola (`console=False`) — stdio y logging de uvicorn redirigidos a `%APPDATA%\\tributacos\\logs\\tributacos.log` (evita `isatty` sobre `stdout=None`).

### Añadido
- Smoke tests del build congelado: `packaging/test_frozen_boot.py` (CI Linux) y `packaging/windows/smoke-frozen.ps1` (Release Windows, `/api/health`).
- PyInstaller: `collect_submodules` para `app`, `passlib` y `uvicorn`.

## [1.1.0-rc.2] - 2026-08-31

### Corregido
- **Windows (.exe)**: PyInstaller incluye `passlib.handlers.bcrypt`, `bcrypt` y dependencias de auth (`jose`, `cryptography`) para que el launcher arranque sin `ModuleNotFoundError`.

## [1.1.0-rc.1] - 2026-08-30

### Añadido
- Empaquetado multiplataforma: modo standalone (`:8080`), Panel de Operaciones GUI, Docker Compose publicado, workflows de CI/Release y spec de PyInstaller/Inno Setup para Windows.
- Launchers Docker para Windows, macOS y Linux; datos de usuario en `%APPDATA%/tributacos` en modo instalado.
- PDF oficial de la guía de instalación (`docs/tribuTACOS_instalacion_usuario.pdf`) y comando `make pdf-instalacion`.
- Pre-releases SemVer (`vX.Y.Z-rc.N`): GitHub Release marcado como pre-release y Docker sin pisar `latest`.
- **Acerca de** en el Panel de Operaciones: contacto, aviso legal y ficha tecnica para tickets (incluye atajos de captura).

### Cambiado
- El `Makefile` es una fachada de `scripts/tributacos.py`: `make X` y el Panel de Operaciones ejecutan el mismo codigo (respaldos fechados, Docker, cache, carpetas de ingesta).
- Panel de Operaciones: cabecera con estado en vivo, botones primario/peligro, URL clicable y registro con hora.
- Ficha tecnica de **Acerca de**: health/puertos, ruta real de SQLite, conteos de CFDI/SAT (sin RFC ni montos), git y Node.
- Un segundo clic en `tributacos.exe` reabre el navegador en la instancia que ya corre (el puerto 8080 no se duplica).

## [1.0.1] - 2026-08-26

### Añadido
- **Automatización y Flujo de Trabajo en `Makefile`**:
  - Reestructuración del menú interactivo en 5 fases secuenciales (`Inicio`, `Datos/CFDIs`, `Calidad`, `Documentación`, `Mantenimiento`).
  - Nuevos comandos autodescriptivos: `make db-seed`, `make db-reset`, `make screenshots`, `make docs-sync`, `make pdf-all`, `make pdf-manual`, `make pdf-tecnica`.
  - Integración de `make docs-sync` para orquestar en un solo paso las capturas de pantalla, la sincronización del manual maestro y la compilación de PDFs oficiales.
- **Motor de Documentación (Pandocquiles by shellaquiles.org)**:
  - Archivo fuente persistente `utils/pandocquiles.env` y auto-aprovisionamiento de variables `.env` al inicializar el submódulo.
  - Optimización en memoria con PIL/Pillow para redimensionamiento inteligente y compresión de capturas de alta densidad, evitando saturación de Puppeteer en documentos extensos.
  - Reglas de whitelist en `.gitignore` para versionar los PDFs oficiales generados (`!manual_usuario/*.pdf`, `!docs/*.pdf`).
- **Ecosistema de Workflows para Onboarding y Gobernanza**:
  - Creación de `.agent/workflows/declara_context.md` (arquitectura general, catálogos y comandos).
  - Creación de `.agent/workflows/release_and_versioning.md` (protocolo SemVer y checklist para PRs).
  - Creación de `.agent/workflows/screenshots_and_docs_sync.md` (pipeline de capturas con Playwright y scroll asistido).
  - Creación de `.agent/workflows/documentation_style_guide.md` (guía de estilo editorial, badges y nomenclatura fiscal).

### Mejorado
- **Interfaz y Experiencia de Usuario**:
  - Desactivación de indicadores flotantes de desarrollo de Next.js (`devIndicators: false`) para asegurar capturas 100% limpias.
  - Inclusión de badges de versión visible `v1.0.1 STABLE` en el footer institucional y en la barra lateral de navegación.
  - Documentación completa de botones interactivos, selectores por mes, modos de visualización (por rubro, proveedor, cronológico), acordeones y exportaciones CSV.
- **Rediseño Editorial y Minimalismo Estilo Suizo**:
  - Retícula geométrica con bordes finos de 1px y eliminación de sombras difusas (*no drop shadows*).
  - Tipografía con números tabulares de gran escala (`tabular-nums`) y micro-etiquetas en mayúsculas sobrias para máxima legibilidad contable.
  - Paleta de color viva y equilibrada: Azul Eléctrico (`#2563EB`) para Nómina, Verde Esmeralda (`#10B981`) para Honorarios, Ámbar Cálido (`#F59E0B`) para totales/deducciones y Rosa Coral para saldos a cargo.
- **Sincronización de Versión en Backend y Frontend**:
  - FastAPI `version="1.0.1"` en `backend/app/main.py` y `VERSION = "1.0.1"` en `backend/app/config.py`.
  - Frontend `package.json` en versión `1.0.1`.


## [1.0.0] - 2026-08-26

### Añadido
- **Motor de Ingesta y Parsing Universal**:
  - Parser C optimizado con `lxml` para comprobantes fiscales digitales CFDI versión 3.3 y 4.0.
  - Soporte de carga mediante arrastrar y soltar (Drag & Drop), explorador del sistema y paquetes comprimidos `.zip` descargados del portal del SAT.
  - Ingesta idempotente con deduplicación por UUID fiscal y clasificación automática por RFC emisor/receptor.
- **Motor Fiscal Determinista (LISR y LIVA)**:
  - **Sueldos y Salarios**: Cálculo de percepciones gravadas y exentas (Art. 93 LISR), retenciones y recibos de nómina (Complemento CFDI 1.2).
  - **Actividad Empresarial y Servicios Profesionales (PFAE)**: Determinación de pagos provisionales acumulativos mensuales de ISR (Art. 106 LISR) con aplicación de tarifa multianual.
  - **IVA Definitivo**: Cálculo de pagos mensuales (Art. 5 LIVA) con retenciones del 10.6667% y arrastre cronológico automático de saldos a favor (Art. 6 LIVA).
  - **Deducciones Personales**: Auditoría en tiempo real del doble tope legal (15% de ingresos acumulables vs 5 UMAs anuales) conforme al Art. 151 LISR, subtope independiente para Planes Personales de Retiro (PPR, 10%) y verificación de bancarización obligatoria.
  - **Simulación de Declaración Anual**: Cascada fiscal paso a paso conforme al Art. 152 LISR, cálculo de tasa efectiva, tasa marginal y determinación de saldo a favor con devolución automática o saldo a cargo con línea de captura.
- **Taxonomía Automatizada de Egresos**:
  - Mapeo inteligente de más de 52,000 claves del catálogo `c_ClaveProdServ` del SAT a 8 rubros contables operativos.
- **Auditoría y Conciliación Oficial SAT**:
  - Extracción automatizada de cifras oficiales desde archivos PDF del SAT (`pdfplumber`): Declaración Anual, Pagos Provisionales mensuales y Acuses de Pago Bancarios con línea de captura.
  - Conciliación y cruce 1 a 1 entre comprobantes timbrados (XML) y documentos oficiales presentados ante la autoridad.
- **Frontend React 19 / Next.js 15 App Router**:
  - Tablero de Control global con tarjeta Hero de saldo estimado, desglose de regímenes fiscales y KPIs financieros reactivos (`<15ms`).
  - Matriz interactiva de 12 meses para pagos provisionales con modal de borrador oficial del SAT.
  - Vista interactiva de cascada fiscal y termómetro de deducciones personales.
  - Exportación de reportes tabulares a formato CSV con codificación UTF-8 BOM compatible con Microsoft Excel.
- **Suite de Pruebas y Aseguramiento de Calidad**:
  - 11 pruebas automatizadas con `pytest` y `pytest-asyncio` que validan límites de tarifas anuales, UMAs históricas, exclusiones, honorarios, nómina, deducciones y simulación anual al centavo.
- **Documentación Oficial y Compilador Pandocquiles**:
  - Manual de Usuario completo de 9 capítulos en [`manual_usuario/`](./manual_usuario/).
  - Documentación técnica de arquitectura y algoritmos en [`docs/`](./docs/).
  - Automatización en `Makefile` para generación de PDFs oficiales con `make pdf`.
