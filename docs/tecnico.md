# Documentación Técnica - Simulador de Pre-Declaración Anual ISR

## Arquitectura del Proyecto

Este proyecto opera bajo una arquitectura cliente-servidor, con un backend en Python (FastAPI) enfocado en procesamiento de datos XML y un frontend en React (Vite) para la visualización.

### Tecnologías Clave:
*   **Backend:** Python 3, FastAPI, lxml (para parseo rápido de XML), Uvicorn.
*   **Frontend:** React (JSX), Vite, Axios para requests, CSS estándar (Vanilla) estructurado con variables.

## Backend `/backend`

### Lógica de Extracción (Parser)
*   **`parser.py`**: El motor encargado del "scraping" de los archivos XML (`.xml` directos o dentro de `.zip`).
    *   Utiliza `lxml` para un recorrido rápido del DOM del CFDI.
    *   Asigna una clasificación (`categoria`): `ingreso`, `egreso`, `nomina`, `pago`.
    *   Extrae metadatos fiscales, base, impuestos retenidos/trasladados y el UUID.

### API y Lógica de Negocio
*   **`sat_bridge.py`**: Interfaz FastAPI y orquestador lógico.
    *   Se exponen endpoints, destacando `/api/summary?year={YYYY}`.
    *   **Procesamiento Flujo de Efectivo:** Revisa facturas PUE (reconocido al momento) y recibos de pago ('P').
    *   **Limpieza de Datos:** Elimina duplicaciones verificando `UUID`s, de forma que un XML extraído de un ZIP o en el directorio no modifique los saldos. 
    *   Calcula de forma mensual los movimientos de Honorarios (AEyP).
    *   Genera un objeto final JSON consumido de forma declarativa en el frontend.

## Frontend `/frontend/src`

Este fue reimplementado recientemente para ofrecer una UX/UI profesional, estilo "Dashboard", mejorando sustantivamente la legibilidad sobre la propuesta original.

### Componentes Principales (`SatUI.jsx`)
*   **`SueldosSection`**: Procesa la salida pre-calculada de patronos, listando dinámicamente sub-filas de ingresos exentos separados por tipo.
*   **`HonorariosSection`**: Tabula los periodos mensuales, ingresos acumulados y deducciones. Incluye visualización por tipo mediante 'Pills'.
*   **`DeterminacionSection`**: El motor de la interfaz, que aplica logica estática del LISR (Límites y Tablas).
    *   **Lógica de Cálculos (Art 152 LISR):** Posee pre-cargadas las tablas de ISR para **2024** y **2025** como constantes locales en disco y ejecuta una iteración (`calcISR`) para determinar la alícuota correcta a partir del ingreso base.

### Estilo Visual (`index.css`)
Implementado con 'design tokens' estáticos como variables en `:root`.
*   Aplica tarjetas flotantes (`SectionCard`), celdas de KPIs (`KpiRow`), jerarquías modulares y banners interactivos o dinámicos (`card-success`, `card-danger`).

## Flujo de Datos
1. Archivos ubicados en `/cfdi_emitidos` y `/cfdi_recibidos`.
2. Frontend hace GET a `localhost:8010/api/summary?year=Y`.
3. Backend llama `process_directory`, inyecta logs o descarta años anteriores en memoria, agrupa la suma de operaciones cobradas/pagadas en `sat_bridge.py` y emite el payload final.
4. Componente React se monta, el componente padre `App.jsx` parsea y distribuye como *props* hacia las secciones.

## Comandos de Ejecución Local

Para levantar el ecosistema completo desde `/home/kubrick/www/declara`, existen múltiples opciones.

### Opción 1: Usando el Makefile (Recomendado)

Si tienes `make` instalado, es la opción más sencilla para correr ambos servicios en paralelo. Crea automáticamente un entorno virtual (`venv`) en la carpeta `backend` e instala las dependencias la primera vez que se ejecuta.

```bash
make dev
```

Otros comandos útiles en el Makefile:
*   `make backend`: Solo levanta el servidor FastAPI (dentro de su `venv`).
*   `make frontend`: Solo levanta el servidor Vite.
*   `make install`: Crea el entorno virtual si no existe, instala las dependencias de Python y también ejecuta `npm install`.
*   `make clean`: Limpia cachés de Python, el entorno virtual (`venv`) y artefactos de build de Node.

### Opción 2: Usando el Script Shell

Se ha provisto un script que arranca ambos procesos en background y los mata al cancelar el script (Ctrl+C). Al igual que el `Makefile`, creará automáticamente el entorno virtual (`venv`) e instalará dependencias si no lo encuentra.

```bash
./levantar_proyecto.sh
```

### Opción 3: Manualmente (Terminales separadas)

Si prefieres tener control total y ver los logs por separado:

**Terminal 1 (Backend - Carpeta `/backend`):**
Primero, asegúrate de haber creado tu entorno virtual e instalado las dependencias:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=.. uvicorn sat_bridge:app --reload --port 8010
```

**Terminal 2 (Frontend - Carpeta `/frontend`):**
```bash
npm run dev
```
