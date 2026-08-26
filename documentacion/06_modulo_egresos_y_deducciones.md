# tribuTACOS — Manual de Usuario

# Capítulo 06: Módulo de Egresos y Deducciones

Auditoría de compras y gastos operativos, clasificación jerárquica en los 8 rubros maestros del SAT y optimizador de deducciones personales (Art. 151 LISR).

---

## 1. Gastos y Facturas Recibidas (Egresos Operativos)

Este módulo procesa todas las facturas recibidas de proveedores, verificando su estatus de bancarización y asociándolas a los 8 rubros operativos:

![Módulo de Gastos y Compras](img/06_gastos_y_compras.png)

### 1.1 Funcionalidades Principales:
* **Filtro por Mes y por Rubro SAT:** Permite auditar erogaciones mes con mes o por tipo de servicio/producto.
* **Comprobación de Bancarización:** Alerta inmediata sobre facturas mayores a $2,000.00 MXN liquidadas en efectivo (`01`), las cuales son no deducibles conforme a la LISR.
* **Tratamiento de Notas de Crédito:** Descuentos y devoluciones emitidos por proveedores que restan el monto de gastos deducibles.
* **Explorador Maestro-Detalle:** Visualización de cada partida individual de la factura con su clave UNSPSC y tasa de IVA correspondiente.

---

## 2. Deducciones Personales (Art. 151 LISR)

El módulo de **Deducciones Personales** analiza las facturas con uso `D01` a `D10` y las constancias fiscales externas (aportaciones a PPR y seguros):

![Módulo de Deducciones Personales](img/07_deducciones_personales.png)

### 2.1 Termómetro del Límite Legal:
* **Tope General:** El menor entre el **15% del total de ingresos acumulables** o **5 UMAs anuales** ($198,031.80 MXN en 2024; $220,614.90 MXN en 2026).
* **Planes Personales de Retiro (PPR - Fracc. V):** Subtope independiente de hasta el **10% de los ingresos acumulables o 5 UMAs anuales**, permitiendo maximizar el saldo a favor.
* **Seguro de Gastos Médicos Mayores (SGMM - Fracc. VI):** Integrado en el límite general con validación de medios de pago electrónicos.

### 2.2 Auditoría de Requisitos Fiscales:
* **Medios de Pago Permitidos:** Tarjeta de débito/crédito (`04`/`28`), transferencia electrónica (`03`), cheque nominativo (`02`).
* **Medios Inválidos:** Todo gasto médico o dental pagado en efectivo (`01`) es marcado como **No Aceptado** de forma automática por el motor fiscal.
