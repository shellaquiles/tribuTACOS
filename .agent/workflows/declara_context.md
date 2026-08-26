---
description: Contexto del proyecto tribuTACOS – guía de arquitectura, convenciones y estado actual para retomar el proyecto rápidamente.
---

# Proyecto: tribuTACOS

Plataforma de inteligencia fiscal, conciliación de comprobantes digitales (CFDI 3.3/4.0 en XML) y pre-declaración automática (ISR e IVA) para México.
* **Stack**: FastAPI (Python 3.11) + Next.js 15 App Router / React 19 / Tailwind CSS (Frontend) + SQLite / PostgreSQL (SQLAlchemy 2.0).
* **Arranque**: `make dev` en la raíz del proyecto.
* **Puertos**: Backend `http://127.0.0.1:8010`, Frontend `http://localhost:3000`.
* **Contribuyente Demo**: `Sheila Shellaquiles Ortega` (`SHLL250825XYZ` • `tributacos@shellaquiles.org`).
* **Documentación Técnica**: Ubicada en `/docs` y manual de usuario en `/documentacion`.

---

## Estructura de Directorios

```text
declara/
├── backend/                  # Servidor API FastAPI y Lógica de Negocio
│   ├── app/
│   │   ├── catalogos/        # Catálogos SAT y semillas (seed_fiscal.py, seed.py, taxonomia.py)
│   │   ├── cfdis/            # Motor fiscal, parsers y calculadoras
│   │   │   ├── calculators/  # Funciones puras (tarifas, nomina, honorarios, gastos, deducciones, intereses, simulador_sat)
│   │   │   ├── engine.py     # Orquestador y caché de resúmenes fiscales
│   │   │   ├── parser.py     # Parser de XMLs (lxml)
│   │   │   ├── storage.py    # Ingesta, escaneo local y almacenamiento
│   │   │   ├── schemas.py    # Esquemas Pydantic v2
│   │   │   └── router.py     # REST API /api/cfdis y /api/summary
│   │   ├── sat_docs/         # Extracción y conciliación de PDFs oficiales del SAT
│   │   ├── seeds/            # Fixtures y seeder determinista (demo_dataset.json.gz, recalculate_dataset.py)
│   │   ├── database.py       # SQLAlchemy Base, SessionLocal e init_db
│   │   ├── models.py         # Modelos relacionales ORM (Client, Cfdi, etc.)
│   │   ├── cli.py            # Interfaz de comandos unificada (seed-demo, init-db, sync)
│   │   ├── config.py         # Configuración centralizada
│   │   └── main.py           # Instancia FastAPI y middlewares
│   ├── tests/                # Suite de pruebas unitarias con Pytest (11 tests)
│   ├── tributacos.db         # Base de datos relacional SQLite
│   └── requirements.txt      # Dependencias de Python
├── frontend/                 # Aplicación Cliente Next.js 15
│   ├── src/
│   │   ├── app/              # App Router (layout.js, page.js, globals.css)
│   │   ├── components/       # Vistas UI desacopladas
│   │   │   ├── ui/           # Primitives y Modales reutilizables
│   │   │   ├── nomina/       # Sueldos, quincenas y analítica de recibos
│   │   │   ├── honorarios/   # Facturas, clientes y mix de conceptos
│   │   │   ├── egresos/      # Matriz mensual y reporte por rubro SAT
│   │   │   ├── deducciones/  # Deducciones personales y determinación anual
│   │   │   ├── PreDeclaracionMensualSection.jsx # Matriz de 12 meses
│   │   │   └── ConciliacionSatSection.jsx      # Auditoría SAT vs XMLs
│   │   ├── SatUI.jsx         # Barrel export modular
│   │   ├── csvExport.js      # Utilería de exportación CSV con UTF-8 BOM
│   │   ├── App.jsx           # Shell principal y navegación por pestañas
│   │   └── index.css         # Tokens de diseño y estilos globales
│   ├── package.json          # Dependencias de Node.js
│   └── next.config.mjs       # Configuración de Next.js
├── docs/                     # Documentación Técnica Especializada
├── documentacion/            # Manual de Usuario con Guías Visuales
├── Makefile                  # Suite de comandos automatizados
└── levantar_proyecto.sh      # Script de inicialización rápida
```

---

## Módulos de la Aplicación

1. **Tablero de Control**:
   - `DashboardSection`: KPIs anuales consolidados, flujo de efectivo y estado fiscal proyectado.
2. **Pre-Declaraciones SAT**:
   - `PreDeclaracionMensualSection`: Matriz interactiva de los 12 meses (ISR Art. 106 + IVA Art. 5/6 con arrastre de saldos a favor).
   - `PreDeclaracionAnualSection`: Determinación global del ejercicio, cascada visual en cinco pasos y cálculo de saldo a favor/cargo.
3. **Egresos y Deducciones**:
   - `EgresosMensualesSection`: Clasificación en los 8 rubros operativos SAT y matriz mensual de compras/proveedores.
   - `DeduccionesPersonalesSection`: Validación de requisitos fiscales y topes legales (15% de ingresos o 5 UMAs, más PPR independiente).
4. **Ingresos y Nómina**:
   - `SueldosSection`: Masa bruta, percepciones exentas (Art. 93), retenciones y serie quincenal/mensual.
   - `HonorariosSection`: Facturación emitida PFAE, retenciones de PM y concentración de clientes.
5. **Verificación Oficial**:
   - `ConciliacionSatSection`: Cruce 1 a 1 entre declaraciones oficiales (PDFs) y comprobantes digitales (XMLs).

---

## Comandos del Makefile

| Comando | Descripción |
| :--- | :--- |
| `make` o `make help` | Despliega el menú interactivo con la lista de comandos disponibles. |
| `make setup` | Instala dependencias y prepara la base de datos limpia con datos de prueba. |
| `make dev` | Inicia Backend (FastAPI :8010) y Frontend (Next.js :3000) en paralelo. |
| `make test` | Ejecuta la suite de pruebas unitarias y de integración en Pytest. |
| `make build` | Compila el bundle de producción de Next.js. |
| `make db-fresh` | Recrea la base de datos limpia y carga el fixture demo empaquetado. |
| `make db-empty` | Crea la base de datos limpia con catálogos SAT pero sin comprobantes. |
| `make db-export` | Exporta el estado actual de la BD a `demo_dataset.json.gz`. |
| `make clean` | Limpia artefactos temporales y cachés de compilación. |
