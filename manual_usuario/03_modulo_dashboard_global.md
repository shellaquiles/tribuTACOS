# tribuTACOS — Manual de Usuario

# Capítulo 03: Módulo Dashboard Principal

[![Módulo](https://img.shields.io/badge/Módulo-Dashboard%20Principal-blue.svg?style=flat-square)](#)
[![KPIs](https://img.shields.io/badge/KPIs-Ingresos%20%7C%20Gastos%20%7C%20Deducciones-emerald.svg?style=flat-square)](#)
[![Recálculo](https://img.shields.io/badge/Recálculo-Reactivo%20%3C15ms-indigo.svg?style=flat-square)](#)

Visión consolidada del ejercicio fiscal, KPIs financieros, distribución de ingresos por régimen y determinación preliminar anual.

---

## 1. Visión General del Tablero

El **Dashboard Principal** es la pantalla de bienvenida y centro de mando del contribuyente. Proporciona una radiografía financiera y fiscal inmediata del ejercicio seleccionado:

![Dashboard Principal y KPIs](img/01_dashboard_global.png)

---

## 2. Componentes y Métricas del Tablero

### 2.1 Tarjeta Hero de Determinación Proyectada
* **Saldo Estimado:** Muestra en tipografía destacada el saldo a favor proyectado con devolución estimada del SAT (en color verde esmeralda) o el impuesto a cargo a liquidar (en color ámbar/rojo).
* **Número de Acuse SAT:** Si existe una declaración anual oficial conciliada en PDF, muestra el número de operación oficial registrado ante la autoridad tributaria.
* **Desglose Sintético:** Presenta el resumen de:
  - Ingresos Acumulables Totales
  - Deducciones Personales Aplicadas
  - ISR Causado Anual (Art. 152 LISR)
  - Retenciones Acreditables (Nómina y Clientes Personas Morales)

### 2.2 Cuatro Indicadores Financieros Clave (KPIs)

| Indicador KPI | Descripción Contable | Impacto en la Determinación |
| :--- | :--- | :--- |
| **Ingresos Totales** | Suma consolidada de percepciones por nómina y facturación de honorarios/actividad empresarial. | Base acumulable bruta del ejercicio fiscal. |
| **Gastos Deducibles** | Monto total de egresos operativos bancarizados con CFDI de tipo Gasto. | Disminuye la base gravable mensual de PFAE (Art. 106). |
| **Deducciones Personales** | Monto aceptado para el cálculo anual dentro de los topes de la LISR. | Reduce la base gravable anual del Art. 152 LISR. |
| **Retenciones de ISR** | Impuestos retenidos por terceros (patrones y personas morales clientes). | Se acreditan íntegramente contra el impuesto anual causado. |

> [!NOTE]
> **Recálculo Instantáneo:** Al alternar el selector de año fiscal o tras realizar una nueva carga de comprobantes, todas las cifras del Dashboard se recalculan en memoria en menos de 15 milisegundos.

---

## 3. Mix y Distribución de Ingresos

Gráfico de distribución interactivo que contrasta visualmente el peso relativo de las fuentes de ingreso del contribuyente:
* **Sueldos y Salarios (Capítulo I):** Percepciones ordinarias, asimilados, aguinaldo y primas vacacionales.
* **Servicios Profesionales / PFAE (Capítulo II):** Facturas timbradas por honorarios y actividades empresariales independientes.
