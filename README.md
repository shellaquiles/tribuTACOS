# 🌮 tributacos

> **Radiografía fiscal y desmenuzador universal de CFDIs (XML). Analiza nómina, honorarios e impuestos locales con la misma claridad con la que pides tres con todo.**

*Porque cuadrar tus impuestos con el SAT debería ser tan transparente y directo como pedir tacos en la esquina: sin intermediarios, con las cuentas claras y bien servido.*

---

## 🚀 Características Principales

- ⚡ **Desmenuzador Universal de CFDIs**: Parsea e ingesta comprobantes 3.3, 4.0, complementos de nómina 1.2, retenciones y pagos 2.0.
- 💾 **Base de Datos & Parse-Once**: Estrategia de alto rendimiento con SQLAlchemy (SQLite para standalone / PostgreSQL para SaaS) y caché inteligente de resúmenes fiscales.
- 📂 **Ingesta Dual**:
  - **Drag & Drop en UI**: Sube archivos `.xml` sueltos o `.zip` completos con auto-clasificación por RFC.
  - **Rutas Locales por Cliente**: Conecta carpetas en disco, NAS o Dropbox para sincronización instantánea.
- 👥 **Nómina y Sueldos**: Desglose de ingresos brutos vs netos, retenciones ISR, exentos (aguinaldo, PTU, primas) y recibos timbrados por empleador.
- 💼 **Honorarios / AEyP (Actividad Empresarial y Profesional)**: Flujo de caja efectivo (PUE), retenciones sufridas (ISR/IVA) y mix de servicios.
- 📅 **Egresos Mensuales Dinámicos**: Análisis mes a mes con selector interactivo, KPIs, evolución gráfica, mix de proveedores/cuentas SAT y visor estructurado de facturas.
- 🏥 **Deducciones Personales (Art. 151 LISR)**: Validación estricta de formas de pago válidas para deducción anual y control de topes.
- 🧮 **Simulador y Determinación Anual ISR**: Cálculo automático contra las tarifas oficiales del SAT con detalle de cuota fija, excedente y tasa marginal.
- ⬇️ **Exportación CSV Excel-Ready**: Descarga reportes completos con BOM UTF-8 en un solo clic.

---

## 🛠️ Stack Tecnológico

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, lxml, Pydantic v2, Python-Jose (JWT scaffolding).
- **Frontend**: React 19, Vite, Recharts, Vanilla CSS con Glassmorphism y Dark/Light theme tokens.
- **Base de Datos**: SQLite (`tributacos.db`) / PostgreSQL compatible.

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos
- Python 3.11+
- Node.js 18+ y npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/tributacos.git
cd tributacos
```

### 2. Iniciar el entorno de desarrollo (Backend + Frontend)
```bash
make dev
```

El comando iniciará:
- 🌐 **Frontend**: `http://localhost:5173`
- ⚡ **Backend API**: `http://localhost:8010` (Documentación Swagger en `http://localhost:8010/docs`)

---

## ⚙️ Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz o en `backend/` si deseas personalizar la configuración:

```env
# Base de Datos
DATABASE_URL=sqlite:///tributacos.db
# Para PostgreSQL:
# DATABASE_URL=postgresql://usuario:password@localhost:5432/tributacos

# Directorio de almacenamiento de XMLs
DATA_DIR=./backend/data

# Autenticación JWT (v1 = false, v2 = true)
AUTH_ENABLED=false
SECRET_KEY=clave-secreta-para-firmar-tokens
```

---

## 🗺️ Estructura del Proyecto

```
tributacos/
├── backend/
│   ├── app/
│   │   ├── auth/           # Scaffolding JWT & seguridad
│   │   ├── cfdis/          # Parser, engine fiscal, storage & router
│   │   ├── config.py       # Configuración centralizada
│   │   ├── database.py     # Sesión & engine SQLAlchemy
│   │   ├── models.py       # Modelos Client, Cfdi, Cache, Batch
│   │   └── main.py         # Entrypoint FastAPI
│   ├── data/               # Storage de XMLs por cliente
│   ├── requirements.txt
│   └── tributacos.db
├── frontend/
│   ├── src/
│   │   ├── components/     # UploadModal, Primitives
│   │   ├── App.jsx         # Shell principal & navegación
│   │   ├── SatUI.jsx       # Componentes de visualización fiscal
│   │   ├── csvExport.js    # Utilería de exportación CSV
│   │   └── index.css       # Sistema de diseño
│   ├── index.html
│   └── package.json
├── Makefile                # Automatización de tareas
└── README.md
```

---

## 📄 Licencia

MIT © tributacos
