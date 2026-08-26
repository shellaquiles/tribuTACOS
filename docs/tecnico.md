# Documentación Técnica — tribuTACOS

## 1. Arquitectura y Tecnologías

El sistema opera bajo una arquitectura cliente-servidor desacoplada:
* **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (SQLite / PostgreSQL), lxml (parser C de XMLs), pdfplumber (parser PDF).
* **Frontend:** React 18, Vite (con proxy `/api`), Recharts, Vanilla CSS con Design Tokens y Glassmorphism.
* **Automatización:** GNU Makefile con menú interactivo ANSI y comandos de ciclo de vida completo.

---

## 2. Capa Backend (`/backend`)

### A. Calculadoras de Dominio Puras (`app/cfdis/calculators/`)
La lógica de negocio fiscal está desacoplada de la base de datos en funciones deterministas:
1. `tarifas.py`: Cálculo de la tarifa progresiva Art. 152 LISR con desglose de tramos.
2. `nomina.py`: Procesamiento de sueldos, percepciones gravadas/exentas, deducciones y serie de 12 meses.
3. `honorarios.py`: Facturación PFAE emitida, serie mensual, concentración de clientes y mix de conceptos.
4. `gastos.py`: Deducibilidad, matriz mensual y asignación de rubros SAT.
5. `deducciones.py`: Deducciones personales (Art. 151), validación de forma de pago y topes de 5 UMAs.
6. `intereses.py`: Intereses nominales, reales y retenciones bancarias.
7. `simulador_sat.py`: Pre-declaración mensual provisional y determinación anual con cascada visual (waterfall de 5 pasos).

### B. Motor Fiscal y Caché (`app/cfdis/engine.py` y `app/cfdis/storage.py`)
* `build_fiscal_summary`: Orquesta las calculadoras inyectando parámetros fiscales y exclusiones de la base de datos.
* `SummaryCache`: Almacena en base de datos los resúmenes compilados para respuesta instantánea (<1ms).

### C. Catálogos y Sembrado (`app/catalogos/` y `app/seeds/`)
* Catálogo de 52,547 claves SAT sembrado automáticamente en SQLite.
* `seed_fiscal.py`: Tarifas del Art. 152 LISR (2021-2026) y factores UMA.
* `seed_demo.py`: Carga y exportación del fixture comprimido `demo_dataset.json.gz` (269 KB).

---

## 3. Capa Frontend (`/frontend/src`)

### Componentes Visuales (Thin Views)
* Los componentes en `components/` están desacoplados de la lógica fiscal pesada, consumiendo directamente las matrices y series precalculadas por el backend.
* Proxy de desarrollo configurado en `vite.config.js` (`/api` -> `http://127.0.0.1:8010`).
* Barrel export centralizado en `SatUI.jsx`.

---

## 4. Comandos de Operación (`Makefile`)

```bash
# Desarrollo
make dev          # Inicia Backend (:8010) y Frontend (:5173) con hot-reload
make test         # Ejecuta la suite de 11 tests en Pytest
make build        # Compila el bundle estático de producción de Vite

# Base de Datos y Datos de Prueba
make recreate-db  # Recrea la BD limpia y carga el fixture empaquetado
make seed-demo    # Carga datos de prueba y precalcula cachés
make export-demo  # Exporta el estado de la BD a fixture comprimido
make clean        # Limpia cachés temporales
```
