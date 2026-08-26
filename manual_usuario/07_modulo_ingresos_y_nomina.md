# tribuTACOS — Manual de Usuario

# Capítulo 07: Módulo de Ingresos y Nómina

[![Sueldos](https://img.shields.io/badge/Sueldos-Capítulo%20I%20LISR-blue.svg?style=flat-square)](#)
[![Honorarios](https://img.shields.io/badge/Honorarios-Capítulo%20II%20PFAE-emerald.svg?style=flat-square)](#)
[![Nómina](https://img.shields.io/badge/CFDI-Nómina%201.2-purple.svg?style=flat-square)](#)

Auditoría integral de Sueldos y Salarios (Capítulo I), desglose de recibos quincenales, facturación emitida por Honorarios/PFAE (Capítulo II) y concentración de clientes.

---

## 1. Sueldos y Salarios (Capítulo I LISR)

El módulo de **Sueldos y Salarios** procesa los complementos de nómina 1.2 timbrados por los empleadores durante el ejercicio fiscal:

![Módulo de Sueldos y Salarios](img/08_sueldos_y_salarios.png)

### 1.1 Indicadores Consolidados:

| Indicador Salarial | Fundamento Legal | Descripción |
| :--- | :--- | :--- |
| **Masa Salarial Bruta** | Art. 94 LISR | Total acumulado de percepciones devengadas por el trabajador. |
| **Percepciones Gravadas** | Art. 96 LISR | Monto sujeto a la tarifa mensual de retención de ISR. |
| **Percepciones Exentas** | Art. 93 LISR | Aguinaldo (hasta 30 UMAs), prima vacacional (hasta 15 UMAs) y previsión social. |
| **Retenciones de ISR Nómina** | Art. 96 LISR | Impuesto retenido por el patrón acumulable para acreditar en la declaración anual. |

---

## 2. Detalle de Recibos de Nómina

Visualización interactiva quincena por quincena de los recibos de nómina timbrados:

![Detalle de Recibos de Nómina](img/09_recibos_nomina_detalle.png)

* **Desglose de Percepciones:** Sueldo base, bono de productividad, aguinaldo y prima vacacional.
* **Desglose de Deducciones:** Retención de ISR del periodo y cuotas obreras de seguridad social IMSS.
* **Auditoría de Vigencia:** Fecha de inicio, fecha de fin y días laborados efectivamente liquidados.

---

## 3. Honorarios y Facturación Emitida (Capítulo II LISR)

El módulo de **Honorarios / Act. Prof.** analiza los ingresos generados por prestación de servicios profesionales y proyectos independientes:

![Módulo de Honorarios y Facturación Emitida](img/10_honorarios_emitidos.png)

### 3.1 Métricas de Facturación:
* **Total Facturado:** Subtotal de facturas de ingresos emitidas en el ejercicio antes de impuestos.
* **Retenciones de ISR Sufridas:** `10%` retenido por clientes personas morales conforme al Art. 106 LISR.
* **Retenciones de IVA Sufridas:** `10.6667%` (dos terceras partes del IVA) retenido por personas morales conforme al Art. 1-A LIVA.
* **Mix de Servicios por Clave SAT:** Clasificación de facturación según el catálogo `c_ClaveProdServ`.

---

## 4. Explorador de Facturas Emitidas

Visualizador estructurado de cada comprobante emitido a clientes:

![Explorador de Facturas Emitidas](img/11_facturas_clientes.png)

* **Búsqueda Instantánea:** Filtrado por folio, RFC de cliente, método de pago (`PUE` / `PPD`) y estatus fiscal.
* **Exportación de Datos:** Descarga de reportes estructurados en formato CSV para conciliación contable externa.
