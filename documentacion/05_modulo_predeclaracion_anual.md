# tribuTACOS — Manual de Usuario

# Capítulo 05: Módulo de Declaración Anual

Determinación del Impuesto Sobre la Renta anual conforme al Artículo 152 de la LISR, desglose en cascada de cinco pasos, cálculo de tasas y gestión de devoluciones.

---

## 1. Visión General de la Determinación Anual

El módulo de **Declaración Anual** integra todos los ingresos acumulables del contribuyente (Sueldos y Salarios + Honorarios/PFAE + Intereses) y computa el impuesto del ejercicio contra la tarifa progresiva del **Art. 152 LISR**.

![Declaración Anual y Cascada de Determinación](img/05_predeclaracion_anual.png)

---

## 2. La Cascada Fiscal de Cinco Pasos

La plataforma visualiza el cálculo en cinco etapas transparentes y auditables:

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

---

## 3. Métricas Financieras del Ejercicio

* **Tasa Efectiva de Impuesto:** Porcentaje real del ingreso que representa el impuesto determinado ($\text{ISR Determinado} / \text{Ingresos Totales}$).
* **Tasa Marginal:** Porcentaje aplicable al último tramo de la tarifa en el que se ubica la base gravable (de acuerdo con el límite superior del Art. 152 LISR, de hasta el 35%).
* **Determinación de Saldos Anuales:**
  - **Saldo a Favor (Devolución SAT):** Se origina cuando el total de retenciones e impuestos pagados provisionalmente durante el ejercicio excede el ISR anual causado, indicando el importe disponible para solicitar devolución automática con CLABE interbancaria o compensación contra ejercicios futuros.
  - **Saldo a Cargo (Línea de Captura):** Se origina cuando el impuesto anual determinado es superior a los anticipos y retenciones acumuladas en el año, señalando el importe a enterar a la autoridad fiscal.
