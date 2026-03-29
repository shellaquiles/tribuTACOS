---
description: Contexto del proyecto Declara Pro – guía de arquitectura, convenciones y estado actual para retomar el proyecto rápidamente.
---

# 🏢 Proyecto: Declara Pro

Aplicación local de análisis fiscal personal (CFDI) para México.
- **Stack**: FastAPI (Python 3.11 venv) + React/Vite (frontend)
- **Arranque**: `make dev` en `/home/kubrick/www/declara`
- **Puertos**: Backend `localhost:8010`, Frontend `localhost:5173`
- **Venv**: `backend/venv/` (Python 3.11 — usar siempre este, NO el pip del sistema)

---

## 🗂️ Estructura de Directorios Clave

```
declara/
├── backend/
│   ├── main.py            # FastAPI app, rutas /api/*
│   ├── sat_bridge.py      # Orquestador: consolida datos por año/sección
│   ├── parser.py          # Parser universal de XMLs CFDI (lxml)
│   ├── cat_sat.py         # Módulo catálogo SAT c_ClaveProdServ (SQLite de satcfdi)
│   ├── catalogs_sat.db    # SQLite descargado de SAT-CFDI/python-satcfdi
│   ├── c_ClaveProdServ.json # Fallback JSON (bambucode, 52,512 registros)
│   └── venv/              # Python 3.11 – tiene satcfdi 4.9.9 instalado
├── frontend/src/
│   ├── App.jsx            # Shell principal: Sidebar, routing de secciones
│   ├── SatUI.jsx          # Todos los componentes de análisis fiscal
│   └── index.css          # Variables CSS / glassmorphism design system
├── cfdi_emitidos/         # XMLs de facturas emitidas, por año
└── cfdi_recibidos/        # XMLs de facturas recibidas (nómina, gastos)
```

---

## 🏗️ Arquitectura de UI (SatUI.jsx)

El sidebar tiene 3 secciones principales, cada una con sub-pestañas:

### 1. Módulo Nómina (Sueldos y Salarios — CFDI recibidos tipo Nómina)
- `SueldosSection` → Info Global (KPIs, Waterfall, filtro por empleador)
- `GraficasNomina` → Gráficas mensuales (BarChart + LineChart)
- `NominaDetalleSection` → Detalle de recibos por empleador con `ReciboNomina`

### 2. Módulo AEyP / Honorarios (CFDI emitidos tipo Ingreso)
> **Filosofía purista**: solo procesa ingresos emitidos. Sin deducciones ni egresos.
- `HonorariosSection` → Info Global (KPIs, Waterfall, filtro por **RFC de cliente**)
- `AnaliticaAeypSection` → Gráficas (tendencia mensual + PieChart concentración)
- `FacturasAeypSection` → Maestro-Detalle: `ReciboAeyp` expandible por cliente/RFC

### 3. Módulo Egresos (aún en desarrollo)

---

## 🔑 Decisiones de Diseño Importantes

### Agrupamiento por RFC (No por Nombre)
- Los clientes de Honorarios se agrupan por **`receptor_rfc`** como llave primaria.
- El nombre visible es el más corto encontrado asociado al RFC (para manejar variantes de nombre entre CFDIs 3.3 y 4.0).
- En `sat_bridge.py`, el campo `rfc` se expone en cada item de `lista_honorarios`.

### ReciboAeyp – Footer con 3 acciones
Cada recibo de honorarios tiene en su pie:
1. **UUID/Folio** (botón azul): abre `CfdiVisualizerModal`
2. **💻 JSON**: abre `XmlViewerModal` con los datos parseados por el backend
3. **⬇️ XML**: descarga el archivo XML original vía `/api/download_xml?filename=`

### Conceptos por ClaveProdServ
- El parser extrae `ClaveProdServ`, `NoIdentificacion` y `Descripcion` de cada concepto.
- En `HonorariosSection.calcConceptos`: se agrupa por `clave` (ClaveProdServ).
- En `ConceptCard`: badge superior = código SAT + descripción del catálogo (`desc_sat`), cuerpo = NoIdentificacion(s) distintos como metaItems.

### Catálogo SAT (`cat_sat.py`)
- Fuente primaria: SQLite de `satcfdi` (tabla `C756_c_ClaveProdServ`), 52,514 registros.
- Fuente fallback: `c_ClaveProdServ.json` local (bambucode).
- Uso: `cat_sat.describe('80101500')` → `"Servicios de consultoría..."`

---

## 📦 Dependencias Backend (venv)

```bash
# Instalar todo con:
cd backend && source venv/bin/activate
# Paquetes clave:
# - fastapi, uvicorn
# - lxml (parser XML)
# - satcfdi==4.9.9 (catálogos SAT, requiere Python >=3.10)
```

---

## 🎨 Design System (index.css)

- **Glassmorphism**: `backdrop-filter: blur`, tarjetas con `rgba` + border suave.
- **Fuente**: Inter (Google Fonts)
- **Colores clave**: `--blue: #3b82f6`, `--green: #10b981`, `--red: #ef4444`
- **ConceptCard**: borde rojo/verde con acento superior de 4px. Badge SAT en la parte superior.

---

## 📋 Estado Actual (Marzo 2026)

### ✅ Completado
- Sidebar con 3 secciones: Nómina, AEyP, Egresos
- Módulo Nómina: 3 vistas (Info Global, Gráficas, Detalle)
- Módulo AEyP: 3 vistas (Info Global, Gráficas, Detalle) — purista de CFDI emitidos
- Filtrado de clientes AEyP por RFC con selector de botones pill
- Footer de ReciboAeyp: UUID + JSON + XML
- ConceptCards agrupadas por ClaveProdServ con catálogo SAT local
- Catálogo SAT integrado: `satcfdi` (SQLite oficial) con fallback JSON

### 🔄 Pendiente / En progreso
- [ ] Módulo Egresos (egresos, intereses, notas de crédito)
- [ ] Exportación CSV/Excel de datos filtrados
- [ ] Módulo Gráficas AEyP (`AnaliticaAeypSection`) – verificar que el PieChart use `desc_sat` del catálogo para nombrar segmentos

---

## 🚀 Flujo de Trabajo Típico

```bash
cd /home/kubrick/www/declara
make dev    # Inicia backend (puerto 8010) y frontend (puerto 5173)
```

El backend re-parsea los XMLs en cada request (no hay caché en disco).
Los XMLs viven en `cfdi_emitidos/{año}/` y `cfdi_recibidos/{año}/`.
