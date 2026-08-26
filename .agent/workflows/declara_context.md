---
description: Contexto del proyecto tribuTACOS – guía de arquitectura, convenciones y estado actual para retomar el proyecto rápidamente.
---

# 🏢 Proyecto: tribuTACOS

Plataforma de inteligencia fiscal, conciliación de comprobantes digitales (CFDI 3.3/4.0) y pre-declaración automática (ISR e IVA) para México.
- **Stack**: FastAPI (Python 3.11 venv) + React 18 / Vite (Frontend) + SQLite (SQLAlchemy 2.0).
- **Arranque**: `make dev` en la raíz del proyecto.
- **Puertos**: Backend `http://127.0.0.1:8010`, Frontend `http://localhost:5173`.
- **Contribuyente Demo**: `pixelead0 Shellaquiles org` (`SHLL250825XYZ` • `tributacos@shellaquiles.org`).

---

## 🗂️ Estructura de Directorios Clave

```
declara/
├── backend/
│   ├── app/
│   │   ├── catalogos/      # Catálogos SAT y semillas (seed_fiscal.py, seed.py)
│   │   ├── cfdis/          # Motor fiscal, parsers y calculadoras
│   │   │   ├── calculators/ # Funciones puras (tarifas, nomina, honorarios, gastos, deducciones, intereses, simulador_sat)
│   │   │   ├── engine.py   # Orquestador y caché de resúmenes fiscales
│   │   │   ├── parser.py   # Parser de XMLs (lxml)
│   │   │   ├── storage.py  # Ingesta, escaneo local y almacenamiento
│   │   │   └── router.py   # REST API /api/*
│   │   ├── sat_docs/       # Extracción y conciliación de PDFs oficiales del SAT
│   │   ├── seeds/          # Fixtures y seeder determinista (demo_dataset.json.gz)
│   │   ├── database.py     # SQLAlchemy Base, SessionLocal e init_db
│   │   ├── models.py       # Modelos relacionales ORM (Client, Cfdi, etc.)
│   │   ├── cli.py          # Interfaz de comandos (seed-demo, sync, etc.)
│   │   ├── config.py       # Configuración centralizada (.env)
│   │   └── main.py         # Instancia FastAPI y middlewares
│   ├── tests/              # Suite de pruebas unitarias con Pytest (11 tests)
│   ├── tributacos.db       # Base de datos relacional SQLite
│   └── venv/               # Entorno virtual de Python 3.11
├── frontend/src/
│   ├── components/         # Vistas UI desacopladas (Thin Views)
│   │   ├── ui/             # Primitives y Modals reutilizables
│   │   ├── nomina/         # Sueldos, quincenas y analítica de recibos
│   │   ├── honorarios/     # Facturas, clientes y mix de conceptos
│   │   ├── egresos/        # Matriz mensual y reporte por rubro SAT
│   │   ├── deducciones/    # Deducciones personales y determinación anual
│   │   ├── PreDeclaracionMensualSection.jsx # Matriz de 12 meses
│   │   └── ConciliacionSatSection.jsx      # Auditoría SAT vs XMLs
│   ├── SatUI.jsx           # Barrel export modular
│   ├── csvExport.js        # Utilería de exportación CSV
│   ├── App.jsx             # Shell principal y navegación por pestañas
│   └── index.css           # Design System profesional (Glassmorphism)
├── docs/                   # Documentación Técnica Especializada
└── Makefile                # Suite de comandos automatizados
```

---

## 🏗️ Módulos de la Aplicación

1. **Visión General**:
   - `DashboardSection`: KPIs anuales consolidados, flujo de efectivo y estado fiscal.
2. **Pre-Declaraciones SAT**:
   - `PreDeclaracionMensualSection`: Matriz interactiva de los 12 meses (ISR R122 + IVA R21 con arrastre de saldos a favor).
   - `PreDeclaracionAnualSection`: Determinación global del ejercicio, cascada visual (waterfall) y cálculo de saldo a favor/cargo.
3. **Egresos y Deducciones**:
   - `EgresosMensualesSection`: Clasificación en los 8 rubros maestros SAT y matriz mensual de compras/proveedores.
   - `DeduccionesPersonalesSection`: Validación de requisitos fiscales y topes legales (15% o 5 UMAs).
4. **Ingresos y Nómina**:
   - `SueldosSection`: Masa bruta, retenciones y serie mensual por empleador.
   - `HonorariosSection`: Facturación emitida PFAE, retenciones de PM y concentración de clientes.
5. **Verificación Oficial**:
   - `ConciliacionSatSection`: Cruce 1 a 1 entre declaraciones oficiales (PDFs) y comprobantes digitales (XMLs).

---

## 🚀 Comandos Rápidos del Makefile

| Comando | Descripción |
| :--- | :--- |
| `make` o `make help` | Despliega el menú interactivo con la lista de comandos disponibles. |
| `make dev` | Inicia Backend (FastAPI :8010) y Frontend (Vite :5173) con hot-reload. |
| `make test` | Ejecuta la suite completa de 11 tests en Pytest. |
| `make build` | Compila el bundle estático de producción del Frontend. |
| `make recreate-db` | Limpia la base de datos y carga el dataset de prueba fixture empaquetado. |
| `make seed-demo` | Carga el dataset completo de prueba con resúmenes en caché. |
| `make export-demo` | Exporta el estado actual de la BD a `demo_dataset.json.gz`. |
| `make clean` | Limpia artefactos temporales y cachés de Python. |
