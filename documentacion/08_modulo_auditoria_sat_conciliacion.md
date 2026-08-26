# tribuTACOS — Manual de Usuario

# Capítulo 08: Módulo de Auditoría SAT y Conciliación Oficial

Conciliación 1 a 1 de declaraciones anuales, pagos provisionales de 12 meses y acuses bancarios de pago extraídos de los PDFs oficiales del SAT.

---

## 1. Visión General de la Auditoría Bidireccional

Este módulo permite contrastar la realidad contable obtenida de los comprobantes digitales timbrados (**XMLs**) contra las cifras registradas formalmente ante la autoridad tributaria (**PDFs oficiales del SAT**).

![Módulo de Auditoría SAT Oficial](img/12_auditoria_sat_oficial.png)

---

## 2. Documentos Oficiales a Descargar e Ingestar

Para habilitar la conciliación automática, el contribuyente o contador debe descargar del portal del SAT y de su banca electrónica los siguientes comprobantes en formato **PDF**:

1. **Declaración Anual del Ejercicio (PDF):**
   * *Dónde obtenerlo:* Portal del SAT ➔ *Declaraciones* ➔ *Consulta de Declaraciones Presentadas* ➔ *Declaración Anual de Personas Físicas*.
   * *Datos extraídos:* Número de operación, tipo de declaración (Normal/Complementaria), fecha de presentación, ingresos acumulables reportados, deducciones personales autorizadas e ISR a favor/cargo con CLABE interbancaria.

2. **Acuses y Declaraciones Mensuales Provisionales de ISR e IVA (PDF):**
   * *Dónde obtenerlo:* Portal del SAT ➔ *Pagos Provisionales / Declaraciones y Pagos* ➔ *Reimpresión de Acuses y Declaraciones*.
   * *Datos extraídos:* Ingresos del mes, deducciones del mes, ISR retenido, pagos provisionales efectuados, IVA causado, IVA acreditable y retenciones de IVA de los 12 periodos (Enero a Diciembre).

3. **Comprobantes Bancarios de Pago de Contribuciones Federales (PDF):**
   * *Dónde obtenerlo:* Portal de la institución bancaria (banca en línea) en el apartado de pagos de impuestos federales.
   * *Datos extraídos:* Folio de control bancario, línea de captura, fecha efectiva de pago e importe transferido a la Tesorería de la Federación.

### Procesamiento y Carga en tribuTACOS:
* **Desde la Interfaz Web:** Arrastre los archivos PDF al modal de carga o al panel de Conciliación SAT.
* **Desde la Terminal:** Ejecute `make db-import-pdf` para procesar por lotes todos los PDFs colocados en el directorio local de almacenamiento.
* **Motor de Extracción:** El parser interno de tribuTACOS extrae mediante expresiones regulares y análisis de tablas los folios de 14 dígitos, sellos digitales y matrices financieras sin requerir captura manual.

---

## 3. Componentes de la Pantalla de Auditoría

### 3.1 Resumen de la Declaración Anual Oficial:
* **Número de Operación:** Folio oficial de recepción emitido por el SAT al sellar y timbrar la declaración.
* **Fecha y Hora de Presentación:** Marca de tiempo oficial de acuse de recibo.
* **Tipo de Declaración:** Indicador de declaración Normal o Complementaria.
* **Cuenta CLABE Registrada:** Cuenta bancaria estandarizada a 18 dígitos designada ante la autoridad para el depósito del saldo a favor.

### 3.2 Matriz de Cumplimiento de Pagos Provisionales (12 Meses):
* **Tabla Comparativa Mensual:** Desglose mes a mes de los ingresos acumulados declarados ante el SAT, retenciones de ISR y montos de IVA reportados vs lo calculado por tribuTACOS.
* **Verificación de Acuses Bancarios:** Validación de comprobantes bancarios emitidos por la institución financiera con su respectiva línea de captura y sello digital.

### 3.3 Utilidad Contable y Preventiva:
* **Detección de Discrepancias Fiscales:** Identificación de diferencias entre lo timbrado por los clientes/proveedores en CFDI y lo presentado en el portal del SAT.
* **Prevención de Cartas Invitación:** Alerta temprana sobre omisiones de ingresos o retenciones inconsistentes antes de revisiones electrónicas del SAT.
* **Sustento para Declaraciones Complementarias:** Base de cálculo precisa para corregir periodos con inconsistencias.
