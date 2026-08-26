# tribuTACOS — Manual de Usuario

# Capítulo 04: Módulo de Pre-Declaración Mensual (ISR e IVA)

Matriz analítica de los 12 meses del ejercicio, pagos provisionales acumulativos de ISR, acreditamiento de IVA y generación del borrador oficial SAT.

---

## 1. Fundamento Legal y Flujo de Efectivo

El módulo opera bajo el principio de **flujo de efectivo** exigido por la legislación tributaria para personas físicas con Actividad Empresarial y Profesional:
* **Ingresos Computables:** Facturas emitidas con método `PUE` (Pago en una Sola Exhibición) y complementos de pago `PPD` efectivamente cobrados en el mes (`fecha_pago`).
* **Gastos Deducibles:** Facturas recibidas `PUE` y complementos de pago efectivamente erogados mediante medios bancarizados.
* **Pagos Provisionales de ISR (Art. 106 LISR):** Cálculo acumulativo desde enero hasta el mes de causación.
* **Determinación de IVA (Art. 5 y 6 LIVA):** Impuesto definitivo mensual con acreditamiento de saldos a favor arrastrables.

![Matriz de Pre-Declaración Mensual](img/03_predeclaracion_mensual.png)

---

## 2. Matriz Comparativa de 12 Meses

La tabla principal desglosa para cada uno de los meses del año (Enero a Diciembre):
1. **Ingresos PFAE Efectivos:** Monto cobrado en el mes.
2. **Gastos Operativos Efectivos:** Monto pagado deducible.
3. **Utilidad / Pérdida del Periodo:** Semáforo visual en verde (utilidad) o rojo (pérdida).
4. **ISR Retenido (10% PM):** Retenciones aplicadas por personas morales en el periodo.
5. **ISR a Pagar Proyectado:** Determinación del pago provisional tras descontar retenciones y pagos anteriores.
6. **IVA a Pagar / Remanente:** IVA cobrado menos IVA acreditable, retención de IVA y remanentes anteriores.
7. **Acción Borrador:** Botón para abrir el desglose oficial del mes.

---

## 3. Modal de Borrador Oficial SAT (ISR e IVA)

Al hacer clic en el botón **"Borrador"** de cualquier mes, se abre la ventana emergente con el borrador interactivo:

![Modal de Borrador Oficial SAT](img/04_borrador_sat_modal.png)

### 3.1 Pestaña ISR (Régimen 122 - Art. 106):
* Ingresos acumulados del ejercicio al mes corriente.
* Deducciones acumuladas del ejercicio al mes corriente.
* Base gravable provisional acumulada.
* ISR causado acumulado según tarifa mensual del SAT.
* Menos: Pagos provisionales realizados en meses anteriores del mismo ejercicio.
* Menos: Retenciones de ISR efectuadas por personas morales acumuladas.
* **ISR a Pagar en el Periodo**.

### 3.2 Pestaña IVA (Régimen 21 - Art. 5/6 LIVA):
* Total de actos o actividades gravados al 16%.
* IVA trasladado cobrado en el mes.
* Menos: IVA acreditable pagado en gastos del mes.
* Menos: IVA retenido por personas morales en el mes (10.6667%).
* Menos: Remanente de saldo a favor de IVA arrastrado de periodos anteriores.
* **Impuesto a Cargo o Nuevo Saldo a Favor de IVA**.
