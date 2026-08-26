# tribuTACOS — Documentación Funcional

Especificación funcional de los módulos del sistema, reglas de negocio tributario y propuesta de valor para personas físicas en México.

---

## 1. Propósito y Alcance

tribuTACOS es una plataforma integral de inteligencia fiscal, auditoría de Comprobantes Fiscales Digitales por Internet (CFDI 3.3 y 4.0) y pre-declaración automatizada de impuestos (ISR e IVA) diseñada para personas físicas bajo el régimen de Sueldos y Salarios (Capítulo I LISR) y Actividad Empresarial y Servicios Profesionales (Capítulo II LISR).

El objetivo central es calcular y proyectar de manera transparente los **Pagos Provisionales Mensuales (ISR e IVA definitivo)** y la **Declaración Anual del ISR**, validando y conciliando las determinaciones contra los documentos oficiales emitidos por el Servicio de Administración Tributaria (SAT).

---

## 2. Módulos Funcionales

### 2.1 Tablero de Control Consolidado (Dashboard)
* Presenta una visión ejecutiva del estado financiero y fiscal anual del contribuyente.
* Métricas clave: Ingresos Totales Cobrados, Egresos Operativos Deducibles, Utilidad Fiscal del Ejercicio, Retenciones Acumuladas y Determinación Proyectada (Saldo a Favor o Impuesto a Cargo).
* Desglose de ingresos por régimen fiscal y proporción de masa salarial vs. actividad profesional.

### 2.2 Pre-Declaración Mensual (12 Meses)
* Simulación de los 12 pagos provisionales del ejercicio bajo el principio de **flujo de efectivo** (facturas PUE y complementos de pago PPD con fecha de cobro o pago verificada).
* Determinación acumulativa del Impuesto Sobre la Renta (Art. 106 LISR).
* Determinación de IVA mensual y gestión automática del **arrastre de saldos a favor** conforme a los artículos 5 y 6 de la LIVA.
* Modal interactivo para inspección de los borradores oficiales de ISR e IVA mes a mes.

### 2.3 Pre-Declaración Anual
* Determinación del ISR del ejercicio mediante la tarifa progresiva del Art. 152 LISR.
* Desglose en cascada de cinco pasos: Ingresos Acumulables -> Deducciones Personales -> Base Gravable -> ISR Determinado -> Liquidación Final (acreditamiento de retenciones y pagos provisionales).
* Cálculo y visualización de la tasa efectiva de tributación y tasa marginal aplicable.

### 2.4 Gestión de Egresos y Clasificación Taxonómica
* Clasificación automática de partidas de gasto en 8 rubros operativos estandarizados.
* Filtrado analítico por categoría contable, proveedor y deducibilidad bancarizada.
* Matriz mensual de compras y gastos con desglose de IVA acreditable.

### 2.5 Deducciones Personales (Art. 151 LISR)
* Auditoría de requisitos de deducibilidad en gastos personales: formas de pago electrónicas autorizadas (tarjeta de crédito, débito, transferencia) y uso de CFDI correspondiente (`D01` a `D10`).
* Aplicación automática del límite legal general: el menor entre el 15% del total de ingresos acumulables o el equivalente a 5 UMAs anuales.
* Tratamiento especializado para aportaciones voluntarias a Planes Personales de Retiro (PPR, Fracc. V) y pólizas de Seguro de Gastos Médicos Mayores (SGMM, Fracc. VI).

### 2.6 Sueldos, Salarios y Recibos de Nómina
* Consolidación de ingresos brutos por patrón, quincenas laboradas y retenciones de ISR aplicadas conforme al Art. 96 LISR.
* Desglose de percepciones gravadas e ingresos exentos conforme al Art. 93 LISR (aguinaldo, prima vacacional, previsión social).

### 2.7 Honorarios y Facturación Emitida
* Analítica de facturas de ingresos emitidas, estatus de cobro, retenciones de ISR (10%) e IVA (10.6667%) aplicadas por personas morales.
* Análisis de concentración de ingresos por cliente y distribución de servicios por clave SAT.

### 2.8 Auditoría y Conciliación Oficial SAT
* Comparativa directa entre los cálculos derivados de los XMLs de comprobantes y las declaraciones oficiales del SAT (PDFs).
* Verificación de números de operación, fechas de presentación y confirmación de acuses bancarios de pago.

---

## 3. Principios de Operación

1. **Determinismo Contable:** Todo cálculo se deriva estrictamente de las disposiciones de la ley fiscal vigente y los comprobantes timbrados.
2. **Privacidad y Soberanía de Datos:** Procesamiento 100% local sin envío de información fiscal confidencial a servidores externos.
3. **Auditoría Bidireccional:** Capacidad de contrastar la realidad contable (XMLs) contra las cifras oficiales presentadas ante la autoridad tributaria (PDFs).

---

## 4. Aviso Legal / Disclaimer

tribuTACOS es una herramienta de simulación, proyección analítica y pre-declaración informativa. No constituye asesoría fiscal, contable ni jurídica vinculante. Los cálculos y proyecciones no sustituyen las determinaciones, declaraciones formales ni obligaciones presentadas ante el Servicio de Administración Tributaria (SAT).

