# tribuTACOS — 03. Motor Fiscal y Algoritmos LISR/LIVA

Modelación matemática, fundamentos legales y algoritmos deterministas para pagos provisionales de ISR e IVA, nómina y determinación anual.

---

## 1. Fundamentos Legales y Módulos de Cálculo

El motor fiscal implementado en [`backend/app/cfdis/calculators/`](../backend/app/cfdis/calculators/) y coordinado por [`backend/app/cfdis/engine.py`](../backend/app/cfdis/engine.py) opera como un conjunto de funciones matemáticas deterministas desacopladas de la persistencia:

* [`tarifas.py`](../backend/app/cfdis/calculators/tarifas.py): Cálculo de la tarifa del Art. 152 LISR con desglose de límite inferior, cuota fija, porcentaje excedente e impuesto marginal.
* [`nomina.py`](../backend/app/cfdis/calculators/nomina.py): Cálculo de sueldos, desglose de percepciones gravadas y exentas (Art. 93 LISR), deducciones y serie temporal de recibos.
* [`honorarios.py`](../backend/app/cfdis/calculators/honorarios.py): Facturación PFAE emitida, serie de 12 meses, concentración por cliente y mezcla de conceptos por clave SAT.
* [`gastos.py`](../backend/app/cfdis/calculators/gastos.py): Deducibilidad operativa, matriz mensual de egresos y asignación de rubros SAT.
* [`deducciones.py`](../backend/app/cfdis/calculators/deducciones.py): Deducciones personales (Art. 151 LISR), integración de planes de retiro (PPR), gastos médicos y cálculo del doble tope legal.
* [`intereses.py`](../backend/app/cfdis/calculators/intereses.py): Intereses nominales, cálculo de interés real y retenciones financieras.
* [`simulador_sat.py`](../backend/app/cfdis/calculators/simulador_sat.py): Pre-declaración mensual provisional y determinación anual con desglose paso a paso.

```mermaid
flowchart TD
    subgraph Ingresos["1. Ingresos Acumulables"]
        Nomina["Sueldos y Salarios (Art. 94/96)"]
        PFAE["Honorarios / PFAE (Art. 100/106)"]
        Intereses["Intereses Financieros (Art. 133/135)"]
    end

    subgraph Provisionales["2. Determinaciones Provisionales"]
        ISR_Prov["ISR Mensual Acumulativo (Art. 106)"]
        IVA_Def["IVA Definitivo Mensual (Art. 5/6 LIVA)"]
    end

    subgraph Anual["3. Determinación Anual ISR (Art. 152)"]
        Deds_Pers["Deducciones Personales (Art. 151)"]
        Tarifa_Anual["Tarifa Anual Progresiva"]
        Liquidacion["Liquidación Final\n(Saldo a Favor / Saldo a Cargo)"]
    end

    PFAE --> ISR_Prov
    PFAE --> IVA_Def
    Nomina --> Liquidacion
    Intereses --> Liquidacion
    ISR_Prov --> Liquidacion
    Deds_Pers --> Liquidacion
    Tarifa_Anual --> Liquidacion

    classDef blueBox fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a;
    classDef purpleBox fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
    classDef amberBox fill:#fffbeb,stroke:#f59e0b,stroke-width:1.5px,color:#78350f;
    classDef greenBox fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b;

    class Nomina,PFAE,Intereses blueBox;
    class ISR_Prov,IVA_Def purpleBox;
    class Deds_Pers,Tarifa_Anual amberBox;
    class Liquidacion greenBox;
```

---

## 2. Pagos Provisionales de ISR (Art. 106 LISR)

Para personas físicas con Actividad Empresarial y Profesional, el pago provisional de ISR se calcula de forma acumulativa mes a mes dentro del ejercicio fiscal:

### 2.1 Base Gravable Acumulada:
```
Base Gravable Acumulada(m) = MAX(0, Σ Ingresos PFAE(1..m) - Σ Gastos Deducibles(1..m))
```

### 2.2 Tarifa Mensual Acumulada:
Para calcular el impuesto causado acumulado al mes `m`, se anualiza la base y se aplica la tarifa del Art. 152 multiplicada por la proporción del periodo `m / 12`:
```
ISR Causado Acumulado(m) = TarifaAnual(Base(m) × 12 / m) × (m / 12)
```

### 2.3 ISR Neto a Pagar del Mes:
```
ISR a Pagar(m) = MAX(0, ISR Causado Acumulado(m) - Σ Pagos Prov Anteriores - Σ ISR Retenido)
```

---

## 3. IVA Definitivo y Acreditamiento de Saldos a Favor (Art. 5 y 6 LIVA)

A diferencia del ISR, el IVA es un impuesto definitivo de causación mensual que permite el acreditamiento de remanentes a favor generados en periodos anteriores:

```mermaid
flowchart TD
    A["IVA Cobrado en Facturas (16%)"] --> B["- IVA Acreditable en Gastos Deducibles"]
    B --> C["- IVA Retenido por Personas Morales (10.6667%)"]
    C --> D{"Resultado del Periodo"}
    
    D -->|Saldo a Cargo| E["Aplicar Remanente de IVA a Favor Anterior"]
    E --> F["IVA Neto a Pagar"]
    
    D -->|Saldo a Favor| G["Generar Nuevo Remanente de IVA a Favor"]
    G --> H["Arrastre a Periodos Siguientes (Art. 6 LIVA)"]

    classDef baseNode fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a;
    classDef decNode fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f;
    classDef payNode fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#881337;
    classDef favorNode fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b;

    class A,B,C baseNode;
    class D decNode;
    class E,F payNode;
    class G,H favorNode;
```

---

## 4. Topes de Deducciones Personales (Art. 151 LISR)

Las deducciones personales (honorarios médicos `D01`, gastos dentales `D02`, gastos hospitalarios `D03`, intereses reales hipotecarios `D05`, primas de seguros `D07`, colegiaturas) están sujetas a un límite general:

```
Tope Legal General = MIN(15% × Total Ingresos Anuales, 5 × UMA Anual)
```

### 4.1 Excepciones y Reglas Específicas:
* **Planes Personales de Retiro (PPR - Fracc. V):** Cuentan con un límite independiente de hasta el **10% de los ingresos acumulables o 5 UMAs anuales**, adicional al tope general.
* **Seguro de Gastos Médicos Mayores (SGMM - Fracc. VI):** Se computa dentro del límite general sin subtopes específicos.

### 4.2 Valores de 5 UMAs Anuales por Ejercicio:
* **2022:** $178,938.00 MXN
* **2023:** $189,222.00 MXN
* **2024:** $198,031.80 MXN
* **2025:** $209,113.65 MXN
* **2026:** $220,614.90 MXN

---

## 5. Tarifa Progresiva Anual (Art. 152 LISR)

La determinación anual aplica la tarifa progresiva sobre la base gravable:

$$\text{Base Gravable Anual} = \text{Ingresos Acumulables Totales} - \text{Deducciones Personales Aceptadas}$$

$$\text{ISR Causado Anual} = \text{Cuota Fija} + (\text{Base Gravable} - \text{Límite Inferior}) \times \text{Tasa Marginal}$$

$$\text{Resultado Final} = \text{ISR Causado Anual} - \text{Retenciones Nómina} - \text{Retenciones PFAE} - \text{Pagos Provisionales ISR}$$

* Si $\text{Resultado Final} < 0$: **Saldo a Favor** (sujeto a devolución o compensación).
* Si $\text{Resultado Final} > 0$: **Saldo a Cargo** (impuesto a liquidar ante el SAT).
