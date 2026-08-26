# Documentación Técnica — tribuTACOS

## 1. Arquitectura y Tecnologías

El sistema opera bajo una arquitectura cliente-servidor moderna y desacoplada:
* **Backend:** Python 3.11+, FastAPI (asíncrono en puerto `8010`), SQLAlchemy 2.0 (SQLite / PostgreSQL), `lxml` (parser de alta velocidad para XMLs de CFDI 3.3 y 4.0), `pdfplumber` (parser de PDFs oficiales del SAT).
* **Frontend:** Next.js 15 (App Router, React 19 en puerto `3000`), Tailwind CSS con sistema de diseño semántico autodescriptivo y componentes modulares.
* **Automatización:** GNU Makefile con comandos de ciclo de vida completo (`make setup`, `make dev`, `make test`, `make db-fresh`, `make build`).

---

## 2. Capa Backend (`/backend`)

### A. Calculadoras de Dominio Puras (`app/cfdis/calculators/`)
La lógica de negocio fiscal está desacoplada de la base de datos en funciones puras y deterministas:
1. `tarifas.py`: Cálculo de la tarifa progresiva Art. 152 LISR con desglose de tramos e importes marginales.
2. `nomina.py`: Procesamiento de sueldos, percepciones gravadas y exentas (Art. 93), retenciones y serie quincenal/mensual.
3. `honorarios.py`: Facturación PFAE emitida, serie mensual, concentración de clientes y mix de conceptos.
4. `gastos.py`: Deducibilidad operativa, matriz mensual y asignación de los 8 rubros maestros SAT.
5. `deducciones.py`: Deducciones personales (Art. 151), validación de forma de pago y cálculo del doble tope legal (15% ingresos o 5 UMAs).
6. `intereses.py`: Intereses nominales, reales y retenciones del sistema financiero.
7. `simulador_sat.py`: Pre-declaración mensual provisional (ISR e IVA) y determinación anual con cascada visual de 5 pasos.

### B. Motor Fiscal y Caché (`app/cfdis/engine.py` y `app/cfdis/storage.py`)
* `build_fiscal_summary`: Orquesta todas las calculadoras inyectando parámetros fiscales y exclusiones de la base de datos.
* `SummaryCache`: Almacena en base de datos los resúmenes compilados para respuesta instantánea (<2ms).

### C. Catálogos y Sembrado (`app/catalogos/` y `app/seeds/`)
* Catálogo de 52,547 claves SAT sembrado automáticamente en SQLite (`catalog_sat_keys`).
* `seed_fiscal.py`: Tarifas oficiales del Art. 152 LISR (2021 a 2026) y factores UMA.
* `recalculate_dataset.py`: Generador determinista del dataset fiscal de prueba.
* `seed_demo.py`: Carga y exportación del fixture comprimido `demo_dataset.json.gz`.

---

## 3. Capa Frontend (`/frontend/src`)

### Componentes Visuales Desacoplados
* Los componentes en `components/` consumen directamente las matrices y series precalculadas por el backend.
* Navegación por pestañas modularizada: Dashboard, Pre-Declaración Mensual, Gastos, Honorarios, Sueldos, Deducciones Personales y Conciliación SAT.
* Barrel export centralizado en `SatUI.jsx`.

---

## 4. Comandos de Operación (`Makefile`)

```bash
# Desarrollo
make dev          # Inicia Backend (:8010) y Frontend (:3000) en paralelo
make test         # Ejecuta la suite de 11 tests en Pytest
make build        # Compila el bundle de producción de Next.js

# Base de Datos y Datos de Prueba
make db-fresh     # Recrea la BD limpia y carga el fixture demo oficial
make db-empty     # Crea la BD limpia con catálogos SAT pero sin comprobantes
make db-export    # Exporta el estado actual de la BD a fixture comprimido
make clean        # Limpia cachés temporales de compilación
```

---

## 5. Aviso Legal / Disclaimer

tribuTACOS es una plataforma de análisis, proyección y simulación fiscal basada en comprobantes digitales (CFDI) y la legislación mexicana aplicable. Sus determinaciones y cálculos tienen finalidad exclusivamente informativa y estimativa, no constituyen asesoría tributaria vinculante y no reemplazan las declaraciones formales ante el SAT.

