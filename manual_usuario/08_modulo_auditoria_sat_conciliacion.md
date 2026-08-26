# tribuTACOS — Manual de Usuario

# Capítulo 08: Módulo de Auditoría SAT y Conciliación Oficial

[![Auditoría](https://img.shields.io/badge/Auditoría-Bidireccional%20XML%20vs%20PDF-blue.svg?style=flat-square)](#)
[![SAT](https://img.shields.io/badge/SAT-Declaraciones%20%7C%20Acuses-emerald.svg?style=flat-square)](#)
[![Bancario](https://img.shields.io/badge/Conciliación-Líneas%20de%20Captura-indigo.svg?style=flat-square)](#)

Conciliación 1 a 1 de declaraciones anuales, pagos provisionales de 12 meses y acuses bancarios de pago extraídos de los PDFs oficiales del SAT.

---

## 1. Visión General de la Auditoría Bidireccional

Este módulo permite contrastar la realidad contable obtenida de los comprobantes digitales timbrados (**XMLs**) contra las cifras registradas formalmente ante la autoridad tributaria (**PDFs oficiales del SAT**):

![Módulo de Auditoría SAT Oficial](img/12_auditoria_sat_oficial.png)

---

## 2. Documentos Oficiales a Descargar e Ingestar

Para habilitar la conciliación automática, el contribuyente o contador debe descargar del portal del SAT y de su banca electrónica los siguientes comprobantes en formato **PDF**:

| Documento | Origen / Dónde Descargar | Datos Extraídos por el Parser |
| :--- | :--- | :--- |
| **Declaración Anual (PDF)** | *Portal del SAT ➔ Declaraciones ➔ Consulta de Declaraciones* | Folio de 14 dígitos, tipo de declaración, fecha de timbrado, base gravable e ISR a favor/cargo con CLABE. |
| **Pagos Provisionales (PDF)** | *Portal del SAT ➔ Pagos Provisionales / Declaraciones y Pagos* | Ingresos, deducciones, retenciones de ISR/IVA, pagos provisionales e IVA de los 12 meses. |
| **Acuses Bancarios (PDF)** | *Banca Electrónica ➔ Pagos de Impuestos Federales SAT* | Folio de control bancario, línea de captura, fecha efectiva de pago e importe transferido. |

### Procesamiento y Carga en tribuTACOS:
* **Desde la Interfaz Web:** Arrastre los archivos PDF al modal de carga o al panel de Conciliación SAT.
* **Desde la Terminal:** Ejecute `make db-import-pdf` para procesar por lotes todos los PDFs colocados en el directorio local.
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

![Detalle Mensual de Declaraciones Oficiales, Folios SAT y Pagos Efectivos](img/12_auditoria_scroll_matriz_declarada_y_bancos.png)

### 3.3 Detalle Mensual de Declaraciones y Folios SAT:
* **Estatus SAT de Presentación:** Etiqueta oficial indicando declaración `Normal` o `Complementaria`.
* **Cifras de Flujo Declaradas:** Ingresos facturados reportados, ISR retenido, IVA cobrado e IVA acreditable.
* **Pago Efectivo Realizado:** Monto transferido con línea de captura bancaria asociada.
* **Folio SAT Oficial:** Número de operación de 10 a 14 dígitos verificado y botón de auditoría <kbd>Ver Detalle SAT</kbd>.

> [!IMPORTANT]
> **Utilidad Preventiva:** Este módulo detecta discrepancias fiscales entre lo timbrado en CFDI por clientes/proveedores y lo presentado en el portal del SAT, evitando cartas invitación, multas o diferencias en revisiones electrónicas de la autoridad.

