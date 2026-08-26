# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
