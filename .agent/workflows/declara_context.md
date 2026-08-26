---
description: Contexto del proyecto tribuTACOS – guía de arquitectura, convenciones y estado actual para retomar el proyecto rápidamente.
---

# Proyecto: tribuTACOS

Plataforma de inteligencia fiscal, conciliación de comprobantes digitales (CFDI 3.3/4.0 en XML) y pre-declaración automática (ISR e IVA) para personas físicas con actividad empresarial, profesional y asalariados en México.

* **Versión Actual**: `1.0.1 STABLE`
* **Stack**: FastAPI (Python 3.11) + Next.js 15 App Router / React 19 / Tailwind CSS (Frontend) + SQLite / PostgreSQL (SQLAlchemy 2.0).
* **Arranque Rápido**: `make dev` en la raíz del proyecto.
* **Puertos**: Backend `http://127.0.0.1:8010` (Swagger en `/docs`), Frontend `http://localhost:3000`.
* **Contribuyente Demo**: `Sheila Shellaquiles Ortega` (`SHLL250825XYZ` • `tributacos@shellaquiles.org`).
* **Documentación y Manuales**: Ubicados en [`manual_usuario/`](file:///home/kubrick/www/tributacos/manual_usuario/) y [`docs/`](file:///home/kubrick/www/tributacos/docs/).

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
│   └── tests/                              # Suite de pruebas unitarias con Pytest (11 tests)
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
├── manual_usuario/                         # Manual de Usuario estructurado por capítulos
│   ├── img/                                # Biblioteca de capturas de pantalla v1.0.1
│   └── MANUAL_DE_USUARIO_COMPLETO.md       # Documento consolidado
├── CHANGELOG.md                            # Registro de versiones y cambios
└── Makefile                                # Suite automatizada de comandos
```

---

## 2. Workflows Disponibles en `.agent/workflows/`

1. **`/declara_context` ([`declara_context.md`](file:///home/kubrick/www/tributacos/.agent/workflows/declara_context.md)):** Guía de arquitectura, convenciones y estado actual para incorporar a cualquier nuevo desarrollador.
2. **`/release_and_versioning` ([`release_and_versioning.md`](file:///home/kubrick/www/tributacos/.agent/workflows/release_and_versioning.md)):** Checklist riguroso para bump de versión (SemVer), sincronización de archivos y apertura de Pull Request.
3. **`/screenshots_and_docs_sync` ([`screenshots_and_docs_sync.md`](file:///home/kubrick/www/tributacos/.agent/workflows/screenshots_and_docs_sync.md)):** Protocolo de captura con Playwright usando scroll de contenedor interno y regeneración del manual consolidado.
4. **`/documentation_style_guide` ([`documentation_style_guide.md`](file:///home/kubrick/www/tributacos/.agent/workflows/documentation_style_guide.md)):** Reglas de redacción técnica, callouts (`[!TIP]`, `[!WARNING]`), formato de etiquetas `<kbd>`, tablas y cifras fiscales.

---

## 3. Comandos Esenciales del Makefile

| Comando | Función |
| :--- | :--- |
| `make setup` | Instala dependencias en Python y Node.js, y restaura la BD con datos demo. |
| `make dev` | Inicia simultáneamente Backend (FastAPI :8010) y Frontend (Next.js :3000). |
| `make test` | Corre los 11 tests unitarios de cálculo fiscal con Pytest. |
| `make db-fresh` | Recrea la base de datos limpia e importa `demo_dataset.json.gz`. |
| `make build` | Compila el bundle optimizado de producción en Next.js. |
| `make pdf` | Compila la documentación técnica y el manual de usuario en PDF usando Pandocquiles by shellaquiles.org (inicializa el submódulo y aprovisiona automáticamente `utils/pandocquiles/.env` desde `utils/pandocquiles.env`). |




