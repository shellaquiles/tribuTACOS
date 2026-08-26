# Documentación Funcional — tribuTACOS

## 1. Propósito y Alcance
**tribuTACOS** es una plataforma de inteligencia fiscal, conciliación de comprobantes digitales (CFDI 3.3/4.0) y pre-declaración automática (ISR e IVA) diseñada para Personas Físicas con Actividad Empresarial y Profesional (PFAE) y Sueldos y Salarios en México.

Su objetivo principal es calcular de forma anticipada y transparente los **Pagos Provisionales Mensuales (ISR R122 e IVA R21)** y la **Declaración Anual del ISR**, auditando la información contra los documentos oficiales emitidos por el SAT.

---

## 2. Módulos Principales de la Aplicación

### 1. Visión General (Dashboard Global)
* Consolida el estado financiero y fiscal anual del contribuyente.
* KPIs instantáneos: Ingresos Totales Cobrados, Egresos Pagados, Utilidad Fiscal, ISR Retenido e IVA a Favor/Cargo.
* Estado proyectado de saldo a favor o impuesto a cargo.

### 2. Pre-Declaraciones SAT
* **Pre-Declaración Mensual (12 Meses):**
  * Simula los 12 pagos provisionales del formulario R122 (ISR) y R21 (IVA definitivo).
  * Implementa el principio de **Flujo de Efectivo** (facturas PUE + complementos de pago PPD con fecha de cobro/pago).
  * Control automático del **arrastre de saldos a favor de IVA** (Art. 5 y 6 LIVA).
* **Pre-Declaración Anual:**
  * Papel de trabajo anual con visualización de cascada (**Waterfall de 5 pasos**).
  * Tarifa progresiva del Art. 152 LISR con detalle de cuota fija, límite inferior, excedente e impuesto marginal.
  * Determinación de tasa efectiva y tasa marginal.

### 3. Egresos y Deducciones
* **Gastos y Compras (8 Rubros SAT):**
  * Clasificación automática de partidas y conceptos contra el catálogo de más de 52,500 claves del SAT.
  * Filtro interactivo por categorías (Software/TI, Servicios Profesionales, Combustibles, Viáticos, Renta de Vehículos, Seguros, Cómputo, Otros Operativos).
  * Matriz mensual de proveedores y deducibilidad bancarizada.
* **Deducciones Personales (Art. 151 LISR):**
  * Auditoría de requisitos fiscales (formas de pago bancarizadas, métodos PUE).
  * Aplicación del doble tope legal: **15% del total de ingresos o 5 UMAs anuales**.
  * Soporte para aportaciones voluntarias y constancias externas físicas (PPRs).

### 4. Ingresos y Nómina
* **Sueldos y Salarios (Capítulo I LISR):**
  * Masa bruta anual, retenciones de ISR y cálculo de neto depositado por empleador.
  * Desglose detallado de ingresos gravados y exentos (Aguinaldo, PTU, Primas vacacionales/dominicales).
* **Honorarios y Facturas Clientes (Capítulo II LISR):**
  * Analítica mensual de facturación emitida, concentración por cliente (Top Clientes) y mix de conceptos por clave SAT.

### 5. Verificación Oficial (Auditoría SAT)
* Cruce comparativo 1 a 1 entre los PDFs oficiales emitidos por el SAT (Declaraciones Anuales, Pagos Provisionales, Acuses bancarios) y los cálculos obtenidos a partir de los XMLs.
* Detección de discrepancias y validación de acuses de recibo.

---

## 3. Beneficios Clave
* **Transparencia Total:** Cálculos matemáticos y fiscales abiertos y trazables paso a paso.
* **Anticipación Fiscal:** Proyecciones disponibles en cualquier momento del año, sin depender del portal del SAT.
* **Seguridad y Privacidad:** Datos procesados 100% de forma local en la base de datos relacional del usuario.
