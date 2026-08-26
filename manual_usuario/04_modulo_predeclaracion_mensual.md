# tribuTACOS — Manual de Usuario

# Capítulo 04: Módulo de Pre-Declaración Mensual (ISR e IVA)

[![Marco Legal](https://img.shields.io/badge/LISR-Art.%20106%20%28PFAE%29-blue.svg?style=flat-square)](#)
[![IVA](https://img.shields.io/badge/LIVA-Art.%205%20%7C%206-emerald.svg?style=flat-square)](#)
[![Flujo de Efectivo](https://img.shields.io/badge/Flujo-PUE%20%7C%20PPD%20%2B%20REP-indigo.svg?style=flat-square)](#)

Matriz analítica de los 12 meses del ejercicio, pagos provisionales acumulativos de ISR, acreditamiento de IVA y generación del borrador oficial SAT.

---

## 1. Fundamento Legal y Flujo de Efectivo

El módulo opera bajo el principio estricto de **flujo de efectivo** exigido por la legislación tributaria mexicana:

* **Ingresos Computables:** Facturas emitidas con método `PUE` (Pago en una Sola Exhibición) y complementos de recepción de pagos `PPD + REP` efectivamente cobrados en el mes (`fecha_pago`).
* **Gastos Deducibles:** Facturas recibidas `PUE` y complementos de pago efectivamente erogados mediante medios bancarizados autorizados.
* **Pagos Provisionales de ISR (Art. 106 LISR):** Determinación acumulativa progresiva desde enero hasta el mes de causación.
* **Declaración Definitiva de IVA (Art. 5 y 6 LIVA):** Impuesto mensual definitivo con control y arrastre automático de saldos a favor.

![Matriz de Pre-Declaración Mensual](img/03_predeclaracion_mensual.png)

---

## 2. Matriz Comparativa de 12 Meses

La tabla principal desglosa cronológicamente el comportamiento fiscal del ejercicio:

| Columna | Concepto Fiscal | Descripción |
| :--- | :--- | :--- |
| **Mes** | Periodo fiscal | Del mes `01 (Enero)` al `12 (Diciembre)`. |
| **Ingresos PFAE** | Flujo cobrado | Facturación efectivamente percibida en el mes. |
| **Gastos Deducibles** | Egresos operativos | Comprobantes de gasto pagados con requisitos fiscales. |
| **Utilidad / Pérdida** | Margen operativo | Semáforo visual en verde (utilidad) o rojo (pérdida). |
| **ISR Retenido (10%)** | Retenciones PM | Retenciones efectuadas por clientes Personas Morales. |
| **ISR a Pagar** | Pago provisional | Monto resultante tras acreditar pagos previos y retenciones. |
| **IVA a Pagar / Favor** | Impuesto definitivo | IVA trasladado menos IVA acreditable, retenciones y arrastres. |
| **Acción** | Botón interactivo | Acceso al borrador oficial mediante <kbd>📄 Borrador</kbd>. |

> [!IMPORTANT]
> **Arrastre Automático de IVA:** Cuando un mes genera saldo a favor de IVA, tribuTACOS lo arrastra de forma automática como remanente acreditable para los meses siguientes, optimizando el flujo de caja del contribuyente sin requerir cálculos manuales.

---

## 3. Modal de Borrador Oficial SAT (ISR e IVA)

Al hacer clic en el botón <kbd>📄 Borrador</kbd> de cualquier mes, se despliega la ventana emergente con el desglose exacto que solicita el formulario del portal del SAT:

![Modal de Borrador Oficial SAT](img/04_borrador_sat_modal.png)

### 3.1 Pestaña ISR (Régimen 122 - Art. 106 LISR):
* Ingresos acumulados del ejercicio al mes corriente.
* Deducciones acumuladas del ejercicio al mes corriente.
* Base gravable provisional acumulada.
* ISR causado acumulado según tarifa mensual oficial del SAT.
* **Menos:** Pagos provisionales realizados en meses anteriores del mismo ejercicio.
* **Menos:** Retenciones de ISR acumuladas efectuadas por personas morales.
* **ISR a Pagar en el Periodo**.

### 3.2 Pestaña IVA (Régimen 21 - Art. 5 y 6 LIVA):
* Total de actos o actividades gravados a la tasa general del `16%`.
* IVA trasladado efectivamente cobrado en el mes.
* **Menos:** IVA acreditable pagado en gastos operativos del mes.
* **Menos:** IVA retenido por personas morales en el mes (`10.6667%`).
* **Menos:** Remanente de saldo a favor de IVA arrastrado de periodos anteriores.
* **Impuesto a Cargo o Nuevo Saldo a Favor de IVA**.

> [!TIP]
> **Llenado Directo en el SAT:** Los campos del borrador replican el orden y nomenclatura del servicio de *Declaraciones y Pagos* del SAT, permitiendo copiar y pegar las cifras con absoluta tranquilidad durante la presentación mensual.
