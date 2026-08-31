---
description: Contexto del proyecto tribuTACOS – guía de arquitectura, convenciones y estado actual para retomar el proyecto rápidamente.
---

# Proyecto: tribuTACOS

Plataforma de inteligencia fiscal, conciliación de comprobantes digitales (CFDI 3.3/4.0 en XML) y pre-declaración automática (ISR e IVA) para personas físicas con actividad empresarial, profesional y asalariados en México.

* **Versión Actual**: `1.1.0-rc.2 RC`
* **Stack**: FastAPI (Python 3.11) + Next.js 15 App Router / React 19 / Tailwind CSS (Frontend) + SQLite / PostgreSQL (SQLAlchemy 2.0).
* **Fuente de comandos**: `scripts/tributacos.py`. `make X` es una fachada del mismo codigo (también el Panel de Operaciones).
* **Arranque Rápido (dev)**: `make setup` y `make dev` — Backend `:8010` (Swagger `/docs`) + Frontend `:3000`.
* **Usuario final**: `make gui` (Panel de Operaciones) o `make standalone` (`http://127.0.0.1:8080`). Docker: `make docker-up` (`:3000`).
* **Contribuyente Demo**: `Sheila Shellaquiles Ortega` (`SHLL250825XYZ` • `tributacos@shellaquiles.org`).
* **Documentación y Manuales**: [`manual_usuario/`](file:///home/kubrick/www/tributacos/manual_usuario/) (uso), [`docs/`](file:///home/kubrick/www/tributacos/docs/) (técnica + instalación).
* **Web vs panel**: la interfaz fiscal (dashboard, XML, CSV, SAT) vive en el navegador. El panel solo cubre arranque, carpetas, PDFs SAT, respaldos y cache.

---

## 1. Estructura del Repositorio

```text
tributacos/
├── .agent/
│   └── workflows/
│       ├── declara_context.md              # Este archivo: Onboarding y arquitectura global
│       ├── release_and_versioning.md       # Procedimiento de incremento de versión y PR
│       ├── screenshots_and_docs_sync.md    # Pipeline de captura con scroll y sync de manuales
│       └── documentation_style_guide.md    # Estilo de redacción, formato fiscal y convenciones
├── backend/                                # Servidor API FastAPI y Motor Fiscal
│   ├── app/
│   │   ├── catalogos/                      # Catálogos SAT y taxonomía fiscal de 8 rubros
│   │   ├── cfdis/                          # Motor de ingesta, cálculo fiscal y routers REST
│   │   │   ├── calculators/                # Calculadoras puras (nómina, honorarios, deducciones, etc.)
│   │   │   ├── engine.py                   # Orquestador y caché de resúmenes fiscales
│   │   │   ├── parser.py                   # Parser de XMLs con lxml C-Speed
│   │   │   └── router.py                   # Endpoints /api/cfdis y /api/summary
│   │   ├── sat_docs/                       # Extracción y conciliación de PDFs oficiales del SAT
│   │   ├── seeds/                          # Fixtures deterministas (demo_dataset.json.gz)
│   │   ├── config.py                       # Configuración de entorno y versión
│   │   ├── database.py                     # Sesión SQLAlchemy e inicialización
│   │   └── main.py                         # Instancia FastAPI y middlewares CORS
│   └── tests/                              # Suite de pruebas del backend (Pytest)
├── frontend/                               # Aplicación Cliente Web Next.js 15
│   ├── src/
│   │   ├── components/                     # Componentes desacoplados por módulo
│   │   │   ├── ui/                         # Primitives y Modales (FriendlyObjectViewer, XmlViewerModal, etc.)
│   │   │   ├── nomina/                     # Sueldos y desglose de recibos quincenales
│   │   │   ├── honorarios/                 # Facturas de honorarios y filtros por cliente
│   │   │   ├── egresos/                    # Matriz de compras, 8 rubros y modal de notas de crédito
│   │   │   ├── deducciones/                # Deducciones personales y determinación anual
│   │   │   ├── dashboard/                  # Dashboard global y KPIs ejecutivos
│   │   │   ├── PreDeclaracionMensualSection.jsx # Matriz de 12 meses y borrador SAT
│   │   │   └── PreDeclaracionAnualSection.jsx   # Cascada fiscal anual en 5 pasos
│   │   ├── App.jsx                         # Shell principal y layout responsivo
│   │   └── index.css                       # Design System y paleta de colores corporativa
│   └── scripts/
│       └── capture_screenshots.js          # Script Playwright de captura automatizada con scroll
├── scripts/                                # Runner multiplataforma y Panel de Operaciones
│   ├── tributacos.py                       # Fuente unica de comandos (`make X` / GUI)
│   ├── tributacos_gui.py                   # Panel Tkinter (no replica la web fiscal)
│   └── runtime.py                          # Rutas de datos, respaldos e ingesta
├── packaging/                              # PyInstaller, Inno Setup, bundle Docker
├── docker/                                 # Dockerfiles backend / frontend
├── docs/                                   # Documentación técnica + INSTALACION_USUARIO.md
├── manual_usuario/                         # Manual de Usuario estructurado por capítulos
│   ├── img/                                # Biblioteca de capturas de pantalla
│   └── MANUAL_DE_USUARIO_COMPLETO.md       # Documento consolidado
├── VERSION                                 # SemVer fuente unica (`X.Y.Z` o `X.Y.Z-rc.N`)
├── CHANGELOG.md                            # Registro de versiones y cambios
└── Makefile                                # Fachada de scripts/tributacos.py (`make X`)
```

---

## 2. Workflows Disponibles en `.agent/workflows/`

1. **`/declara_context` ([`declara_context.md`](file:///home/kubrick/www/tributacos/.agent/workflows/declara_context.md)):** Guía de arquitectura, convenciones y estado actual para incorporar a cualquier nuevo desarrollador.
2. **`/release_and_versioning` ([`release_and_versioning.md`](file:///home/kubrick/www/tributacos/.agent/workflows/release_and_versioning.md)):** Checklist riguroso para bump de versión (SemVer), sincronización de archivos y apertura de Pull Request.
3. **`/screenshots_and_docs_sync` ([`screenshots_and_docs_sync.md`](file:///home/kubrick/www/tributacos/.agent/workflows/screenshots_and_docs_sync.md)):** Protocolo de captura con Playwright usando scroll de contenedor interno y regeneración del manual consolidado.
4. **`/documentation_style_guide` ([`documentation_style_guide.md`](file:///home/kubrick/www/tributacos/.agent/workflows/documentation_style_guide.md)):** Reglas de redacción técnica, callouts (`[!TIP]`, `[!WARNING]`), formato de etiquetas `<kbd>`, tablas y cifras fiscales.

---

### Comandos Principales

`make X` y `python scripts/tributacos.py X` ejecutan el mismo codigo. El Panel de Operaciones también llama ese runner. Ver `make help`:

| Fase | Comando | Descripción |
| :--- | :--- | :--- |
| **1. Inicio & Dev** | `make doctor` | Verifica Python, Node.js y Docker. |
| | `make setup` | Instala dependencias y prepara la BD con datos demo. |
| | `make dev` | Inicia Backend (`:8010`) y Frontend (`:3000`). |
| | `make stop` | Detiene servidores en los puertos 8010, 3000 y 8080. |
| | `make gui` / `make standalone` | Panel de Operaciones / servidor unico `:8080`. |
| | `make docker-up` / `make docker-down` | Inicia o detiene Docker Compose. |
| | `make version-sync` | Propaga `VERSION` a badges, `package.json` e instalador. |
| **2. Base de Datos** | `make db-seed` | Restaura la BD con el dataset demo completo (139 CFDIs). |
| | `make db-reset` | Limpia la base de datos dejando solo catálogos del SAT. |
| | `make db-import-xml` | Procesa y clasifica XMLs locales en la base de datos. |
| | `make db-import-sat` | Procesa declaraciones y acuses oficiales en PDF del SAT. |
| | `make db-export` | Copia fechada en `respaldos/` (mismo archivo que la GUI). |
| | `make db-import-backup INPUT=...` | Restaura un respaldo `.json.gz` (reemplaza la BD). |
| | `make clear-cache` | Limpia la cache de calculos fiscales. |
| | `make open-xml-recibidos` / `open-xml-emitidos` / `open-pdf-sat` / `open-backups` | Abre carpetas de ingesta y respaldos. |
| **3. Calidad** | `make test` | Corre las pruebas del backend con Pytest. |
| | `make lint` | Verifica tipado y estándares de código en el Frontend. |
| | `make build` | Compila el bundle optimizado de producción en Next.js. |
| **4. Documentación** | `make screenshots` | Captura pantallas completas con scroll (Playwright). |
| | `make docs-sync` | Pipeline de pre-release: capturas + manual + PDFs oficiales. |
| | `make pdf-all` | Compila los PDFs oficiales (técnico, manual e instalación) con Pandocquiles by shellaquiles.org. |
| | `make pdf-manual` | Compila únicamente el Manual de Usuario en PDF. |
| | `make pdf-tecnica` | Compila únicamente la Documentación Técnica en PDF. |
| | `make pdf-instalacion` | Compila la Guía de instalación para usuario final. |
| **5. Mantenimiento** | `make clean` | Elimina temporales, cachés y PDFs generados. |
| | `make clean-deep` | Elimina librerías `node_modules` y entorno virtual `venv`. |
