# Capítulo 7: Módulo 4 — Ingresos, Nómina y Honorarios

## 👥 Propósito del Módulo

El módulo de **Ingresos y Nómina** integra cuatro pantallas para auditar y gestionar los ingresos percibidos y emitidos por el contribuyente:
1. **Sueldos y Salarios (Info Global):** Auditoría de nómina de empleadores con cálculo de ingresos exentos según el **Artículo 93 de la LISR**.
2. **Detalle de Recibos de Nómina:** Visor maestro-detalle quincena por quincena con percepciones ordinarias, extraordinarias y deducciones.
3. **Honorarios Emitidos (Info Global):** Ingresos bajo flujo de efectivo con agrupación por cliente (RFC) y catálogo de conceptos SAT.
4. **Facturas Clientes:** Visor granular de facturas emitidas, desglose de impuestos y descarga de XMLs.

---

## 👔 Sección 1 y 2: Sueldos, Salarios y Recibos de Nómina

---

### 1. Resumen de Sueldos: Ingreso Bruto, Gravado y Exento

![Resumen de Sueldos y Salarios: Percepciones Brutas, Gravadas y Exentas](img/08_sueldos_01_resumen_gravado_exento.png)

Despliega los totales acumulados del ejercicio:
- **Total Ingresos Brutos:** Suma de todas las percepciones timbradas por los patrones.
- **Ingreso Gravado Acumulable:** Base sujeta al cálculo del ISR anual.
- **Ingresos Exentos (Art. 93 LISR):** Montos libres de gravamen conforme a la ley.
- **ISR Retenido Total:** Impuesto retenido por los patrones y timbrado en los CFDIs.

---

### 2. Desglose de Ingresos Exentos según el Artículo 93 de la LISR

![Desglose Analítico de Ingresos Exentos Art. 93: Aguinaldo, Prima Vacacional y PTU](img/08_sueldos_02_exentos_art93_desglose.png)

Aplica de forma automática los topes legales de exención fiscal en Unidades de Medida y Actualización (UMA):
- **Aguinaldo (Gratificación Anual):** Exento hasta **30 UMAs**.
- **Prima Vacacional:** Exenta hasta **15 UMAs**.
- **Reparto de Utilidades (PTU):** Exenta hasta **15 UMAs**.
- **Previsión Social:** Fondos de ahorro, vales de despensa y ayuda de transporte.

---

### 3. Listado de Empleadores y Retenciones

![Lista de Empleadores Registrados, Recibos Timbrados e ISR Retenido](img/08_sueldos_03_lista_empleadores.png)

Detalla cada patrón con su razón social, RFC, número de comprobantes emitidos, base gravable e impuesto retenido, permitiendo detectar omisiones de timbrado.

---

### 4. Visor Detallado de Recibos de Nómina Quincenales

![Visor Detallado de Recibos de Nómina Quincena por Quincena](img/09_recibos_01_vista_quincenal.png)

![Desglose de Percepciones Ordinarias, Extraordinarias y Deducciones IMSS e ISR](img/09_recibos_02_desglose_percepciones_deducciones.png)

Permite inspeccionar quincena por quincena:
- **Percepciones:** Sueldo ordinario, vacaciones, primas, bonos.
- **Deducciones:** Cuotas obreras del IMSS (clave 001) y retención de ISR (clave 002).
- **Herramientas:** Acceso inmediato a la visualización gráfica, estructura JSON y descarga del XML original.

---

## 💼 Sección 3 y 4: Honorarios, Actividad Empresarial y Claves SAT

---

### 1. KPIs de Facturación y Selector de Clientes por RFC (Pills)

![KPIs de Facturación de Honorarios y Selector de Clientes por RFC en Píldoras](img/10_honorarios_01_kpis_y_selector_clientes.png)

- **Principio de Flujo de Efectivo:** Procesa facturas PUE y recibos de pago P asociados a facturas PPD considerando la `fecha_pago` bancaria.
- **Selector de Clientes en Píldoras (Pills):** Permite filtrar los comprobantes de un cliente específico con un solo clic utilizando el `receptor_rfc` como llave primaria.

---

### 2. Catálogo Oficial de Conceptos SAT (`c_ClaveProdServ`)

![Conceptos Facturados Vinculados al Catálogo Oficial de más de 52,000 Claves SAT](img/10_honorarios_02_conceptos_catalogo_sat.png)

tributacos integra una base de datos local SQLite con más de **52,514 claves oficiales del SAT**:
- Traduce códigos crudos (ej. `80101500`) a su descripción legal: *"Servicios de consultoría de gestión y servicios empresariales"*.
- Agrupa los montos facturados por tipo de servicio para identificar las principales fuentes de ingresos del contribuyente.

---

### 3. Maestro-Detalle de Facturas Emitidas y Descarga de XMLs

![Maestro-Detalle de Facturación por Cliente con Desglose de Impuestos](img/11_facturas_01_maestro_detalle.png)

![Tarjeta de Factura con Botones de Folio Gráfico, JSON y Descarga de XML](img/11_facturas_02_recibo_acciones_xml.png)

Cada factura cuenta con un pie de página de 3 botones:
1. **Folio / UUID (Botón Azul):** Abre el visualizador gráfico interactivo.
2. **💻 JSON (Botón Gris):** Despliega el objeto estructurado procesado por el backend.
3. **⬇️ XML (Botón Verde):** Descarga el archivo XML original timbrado por el SAT.
