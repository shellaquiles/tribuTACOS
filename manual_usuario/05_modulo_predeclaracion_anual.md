# tribuTACOS — Manual de Usuario

# Capítulo 05: Módulo de Declaración Anual

[![Marco Legal](https://img.shields.io/badge/LISR-Art.%20152%20%28Tarifa%20Anual%29-blue.svg?style=flat-square)](#)
[![Deducciones](https://img.shields.io/badge/Deducciones-Art.%20151%20%7C%20Topes%20UMA-emerald.svg?style=flat-square)](#)
[![Devolución](https://img.shields.io/badge/SAT-Devolución%20Automática%20CLABE-indigo.svg?style=flat-square)](#)

Determinación del Impuesto Sobre la Renta anual conforme al Artículo 152 de la LISR, desglose en cascada de cinco pasos, cálculo de tasas y gestión de devoluciones.

---

## 1. Visión General de la Determinación Anual

El módulo de **Declaración Anual** integra todos los ingresos acumulables del contribuyente (Sueldos y Salarios + Honorarios/PFAE + Intereses) y computa el impuesto del ejercicio contra la tarifa progresiva del **Art. 152 LISR**:

![Declaración Anual y Cascada de Determinación](img/05_predeclaracion_anual.png)

---

## 2. La Cascada Fiscal de Cinco Pasos

La plataforma visualiza el cálculo anual en cinco etapas transparentes y auditables:

```mermaid
flowchart TD
    P1["1. Ingresos Acumulables Totales\n(Nómina + PFAE + Intereses)"] --> P2["2. Menos: Deducciones Personales Aceptadas\n(Art. 151 LISR - Sujetas a Topes)"]
    P2 --> P3["3. Igual: Base Gravable Anual\n(Monto sujeto a Tarifa Art. 152)"]
    P3 --> P4["4. Igual: ISR Determinado del Ejercicio\n(Cuota Fija + Excedente x Tasa Marginal)"]
    P4 --> P5["5. Menos: Pagos Provisionales & Retenciones\n(Nómina + Honorarios + Pagos Realizados)"]
    P5 --> Res["Resultado Final\n• Saldo a Favor (Devolución SAT)\n• Saldo a Cargo (Línea de Captura)"]

    classDef blueBox fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a;
    classDef amberBox fill:#fffbeb,stroke:#f59e0b,stroke-width:1.5px,color:#78350f;
    classDef greenBox fill:#ecfdf5,stroke:#10b981,stroke-width:1.5px,color:#064e3b;

    class P1,P2,P3,P4,P5 blueBox;
    class Res greenBox;
```

### Tabla de Desglose de la Cascada Fiscal:

| Paso | Concepto | Operación Aritmética | Fundamento LISR |
| :---: | :--- | :--- | :--- |
| **1** | **Ingresos Acumulables** | Sueldos + Honorarios Netos + Otros ingresos | Art. 94 y Art. 100 |
| **2** | **Deducciones Personales** | Suma de deducciones aceptadas dentro de topes | Art. 151 |
| **3** | **Base Gravable Anual** | Paso 1 − Paso 2 | Art. 152 |
| **4** | **ISR Determinado** | Cuota Fija + [(Base Gravable − Límite Inferior) × Tasa %] | Art. 152 (Tarifa anual) |
| **5** | **Anticipos y Retenciones** | Retenciones Nómina + Retenciones PM + Pagos Prov. | Art. 96 y Art. 106 |
| **=** | **Saldo Final del Ejercicio** | Paso 4 − Paso 5 | **Saldo a Favor o a Cargo** |

---

## 3. Métricas Financieras del Ejercicio

* **Tasa Efectiva de Impuesto:** Porcentaje real del ingreso que representa el impuesto determinado (calculado como `(ISR Determinado / Ingresos Totales) × 100`). Permite evaluar la carga fiscal neta del contribuyente.
* **Tasa Marginal:** Porcentaje aplicable al último tramo de la tarifa en el que se ubica la base gravable (de acuerdo con el límite superior del Art. 152 LISR, de hasta el 35%).
* **Determinación de Saldos Anuales:**
  - **Saldo a Favor (Devolución SAT):** Se origina cuando el total de retenciones e impuestos pagados provisionalmente durante el ejercicio excede el ISR anual causado, indicando el importe disponible para solicitar devolución automática con CLABE interbancaria o compensación contra ejercicios futuros.
  - **Saldo a Cargo (Línea de Captura):** Se origina cuando el impuesto anual determinado es superior a los anticipos y retenciones acumuladas en el año, señalando el importe a enterar a la autoridad fiscal.

![Deducciones Personales, Tope Legal y Conciliación Oficial SAT](img/05_predeclaracion_anual_scroll_deducciones_y_conciliacion.png)

### 3.1 Termómetro de Deducciones y Conciliación Directa:
En la parte inferior del módulo se aprecian:
* **Termómetro del Tope Legal (Art. 151 LISR):** Tarjetas con el desglose de deducciones aplicadas, remanente disponible y porcentaje de aprovechamiento del tope con barra de progreso.
* **Conciliación Simulación vs Declaración Oficial SAT:** Comparativa 1 a 1 de Ingresos Acumulables, ISR Causado Anual y Saldo Final contra el acuse timbrado ante el SAT.

> [!TIP]
> **Estrategia Fiscal:** Aprovechar al máximo las deducciones del Artículo 151 (gastos médicos, colegiaturas, SGMM y aportaciones complementarias de retiro PPR) permite reducir la base gravable anual y maximizar el saldo a favor devuelto por el SAT.

