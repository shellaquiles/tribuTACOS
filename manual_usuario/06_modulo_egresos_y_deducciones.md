# tribuTACOS — Manual de Usuario

# Capítulo 06: Módulo de Egresos y Deducciones

[![Gastos](https://img.shields.io/badge/Egresos-8%20Rubros%20SAT-blue.svg?style=flat-square)](#)
[![Deducciones](https://img.shields.io/badge/Art.%20151-Topes%2015%25%20%7C%205%20UMAs-emerald.svg?style=flat-square)](#)
[![Bancarización](https://img.shields.io/badge/Bancarización-Tarjeta%20%7C%20SPEI-purple.svg?style=flat-square)](#)

Auditoría de compras y gastos operativos, clasificación jerárquica en los 8 rubros maestros del SAT y optimizador de deducciones personales (Art. 151 LISR).

---

## 1. Gastos y Facturas Recibidas (Egresos Operativos)

Este módulo procesa todas las facturas recibidas de proveedores, verificando su estatus de bancarización y asociándolas a los 8 rubros operativos:

![Módulo de Gastos y Compras](img/06_gastos_y_compras.png)

### 1.1 Funcionalidades Principales:
* **Filtro por Mes y por Rubro SAT:** Permite auditar erogaciones mes con mes o por tipo de servicio/producto.
* **Comprobación de Bancarización:** Alerta inmediata sobre facturas mayores a `$2,000.00 MXN` liquidadas en efectivo (`01`), las cuales son no deducibles conforme al Art. 27 Fracc. III de la LISR.
* **Tratamiento de Notas de Crédito:** Descuentos y devoluciones emitidos por proveedores que restan el monto de gastos deducibles.
* **Explorador Maestro-Detalle:** Visualización de cada partida individual de la factura con su clave UNSPSC y tasa de IVA correspondiente.

> [!WARNING]
> **Regla Estricta de Bancarización (Art. 27 Fracc. III LISR):** Los pagos de gastos operativos que excedan los `$2,000.00 MXN` deben realizarse obligatoriamente mediante cheque nominativo, transferencia electrónica (SPEI), tarjeta de crédito, débito o servicios. Cualquier pago en efectivo por encima de dicho umbral es descalificado automáticamente.

---

## 2. Deducciones Personales (Art. 151 LISR)

El módulo de **Deducciones Personales** analiza las facturas con uso `D01` a `D10` y las constancias fiscales externas (aportaciones a PPR y primas de seguros):

![Módulo de Deducciones Personales](img/07_deducciones_personales.png)

### 2.1 Termómetro del Límite Legal:

| Concepto de Deducción | Límite / Tope Máximo Legal | Criterio de Aceptación |
| :--- | :--- | :--- |
| **Tope General (Fracc. I a IV)** | Menor entre el **15% del ingreso total** o **5 UMAs anuales**. | Gastos médicos, dentales, hospitalarios, lentes y gastos funerarios. |
| **PPR (Fracc. V - Retiro)** | **10% de ingresos acumulables** o **5 UMAs anuales** (subtope independiente). | Aportaciones complementarias a Planes Personales de Retiro. |
| **SGMM (Fracc. VI - Seguros)** | Dentro del tope general del 15% / 5 UMAs. | Primas por seguros de gastos médicos mayores. |

### 2.2 Auditoría de Medios de Pago en Salud:

* **Medios Válidos:** Tarjeta de débito/crédito (`04`/`28`), transferencia electrónica SPEI (`03`), cheque nominativo (`02`).
* **Medios Inválidos:** Todo honorario médico, dental o psicológico pagado en efectivo (`01`) es marcado como **No Deducible** por disposición expresa del Art. 151 Fracc. I.

### 2.3 Claves de Uso de CFDI de Deducciones Personales:
* `D01`: Honorarios médicos, dentales y gastos hospitalarios.
* `D02`: Gastos médicos por incapacidad o discapacidad.
* `D03`: Gastos funerales.
* `D04`: Donativos.
* `D05`: Intereses reales devengados y efectivamente pagados por créditos hipotecarios.
* `D06`: Aportaciones voluntarias al SAR.
* `D07`: Primas por seguros de gastos médicos.
* `D08`: Gastos de transportación escolar obligatoria.
* `D09`: Depósitos en cuentas personales especiales para el ahorro.
* `D10`: Pagos por servicios educativos (colegiaturas con tope por nivel escolar).
