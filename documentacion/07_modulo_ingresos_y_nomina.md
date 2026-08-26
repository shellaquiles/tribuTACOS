# tribuTACOS — Manual de Usuario

# Capítulo 07: Módulo de Ingresos y Nómina

Auditoría integral de Sueldos y Salarios (Capítulo I), desglose de recibos quincenales, facturación emitida por Honorarios/PFAE (Capítulo II) y concentración de clientes.

---

## 1. Sueldos y Salarios (Capítulo I LISR)

El módulo de **Sueldos y Salarios** procesa los complementos de nómina 1.2 timbrados por los empleadores durante el ejercicio:

![Módulo de Sueldos y Salarios](img/08_sueldos_y_salarios.png)

### 1.1 Indicadores Consolidados:
* **Masa Salarial Bruta:** Total de percepciones devengadas ($30,000.00 MXN mensuales / $15,000.00 quincenales de base).
* **Percepciones Gravadas:** Monto sujeto a retención de ISR conforme al Art. 96 LISR.
* **Percepciones Exentas (Art. 93 LISR):** Aguinaldo (hasta 30 UMAs exentas), prima vacacional (hasta 15 UMAs exentas) y previsión social.
* **Retenciones de ISR de Nómina:** Impuesto retenido por el patrón acumulable para acreditar en la declaración anual.

---

## 2. Detalle de Recibos de Nómina

Visualización quincena por quincena de los recibos de nómina:

![Detalle de Recibos de Nómina](img/09_recibos_nomina_detalle.png)

* **Desglose de Percepciones:** Sueldos, bono de productividad, aguinaldo y primas.
* **Desglose de Deducciones:** Retención de ISR y cuotas de seguridad social IMSS (obrero).
* **Auditoría de Fechas:** Fecha de inicio, fecha de fin y días laborados.

---

## 3. Honorarios y Facturación Emitida (Capítulo II LISR)

El módulo de **Honorarios / Act. Prof.** analiza los ingresos generados por prestación de servicios profesionales y proyectos de desarrollo/DevOps:

![Módulo de Honorarios y Facturación Emitida](img/10_honorarios_emitidos.png)

### 3.1 Métricas de Facturación:
* **Total Facturado:** Subtotal de facturas de ingresos emitidas en el ejercicio.
* **Retenciones de ISR Sufridas:** 10% retenido por clientes personas morales.
* **Retenciones de IVA Sufridas:** 10.6667% (dos terceras partes del IVA) retenido por personas morales.
* **Mix de Servicios por Clave SAT:** Servicios de consultoría TI (`80101500`), desarrollo de APIs FastAPI (`81111508`), DevOps (`81111811`) y ciberseguridad (`81111801`).

---

## 4. Explorador de Facturas Emitidas

Visualizador estructurado de cada comprobante emitido a clientes:

![Explorador de Facturas Emitidas](img/11_facturas_clientes.png)

* Búsqueda instantánea por folio, RFC de cliente, método de pago (`PUE` / `PPD`) y estatus fiscal.
* Exportación a CSV individual o consolidada.
