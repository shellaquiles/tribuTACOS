# tribuTACOS — Manual de Usuario

# Capítulo 09: Arquitectura y Componentes Modulares

[![Arquitectura](https://img.shields.io/badge/Arquitectura-Modular%20Desacoplada-blue.svg?style=flat-square)](#)
[![Versión](https://img.shields.io/badge/Versión-v1.0%20%28Producción%29-emerald.svg?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20Next.js%2015-indigo.svg?style=flat-square)](#)

Estructura modular del sistema, arquitectura por capas, catálogo de componentes y flujo de datos fiscal.

---

## 1. Arquitectura Modular del Sistema

tribuTACOS está diseñado bajo un modelo desacoplado, determinista y de alto rendimiento organizado en tres capas independientes:

```mermaid
flowchart TD
    subgraph CoreEngine["Núcleo Fiscal y Datos"]
        M1["Parser C de XMLs (lxml)"]
        M2["Calculadoras Puras (LISR/LIVA)"]
        M3["Catálogo Maestro SAT (52,547 claves)"]
        M4["Persistencia Relacional (SQLAlchemy)"]
    end

    subgraph BusinessModules["Módulos Funcionales"]
        B1["Módulo 1: Tablero de Control & KPIs"]
        B2["Módulo 2: Pre-Declaración Mensual (12 Meses)"]
        B3["Módulo 3: Pre-Declaración Anual (Art. 152)"]
        B4["Módulo 4: Egresos en 8 Rubros SAT"]
        B5["Módulo 5: Deducciones Personales (Art. 151)"]
        B6["Módulo 6: Nómina y Sueldos (Capítulo I)"]
        B7["Módulo 7: Honorarios y PFAE (Capítulo II)"]
        B8["Módulo 8: Auditoría y Conciliación SAT"]
    end

    subgraph IntegrationLayer["Capa de Integración"]
        I1["API REST FastAPI (:8010)"]
        I2["Exportador CSV con UTF-8 BOM"]
        I3["UI Next.js 15 / React 19 (:3000)"]
    end

    CoreEngine --> BusinessModules
    BusinessModules --> IntegrationLayer

    classDef coreStyle fill:#1e293b,stroke:#0f172a,stroke-width:1.5px,color:#ffffff;
    classDef busStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a;
    classDef intStyle fill:#ecfdf5,stroke:#10b981,stroke-width:1.5px,color:#064e3b;

    class M1,M2,M3,M4 coreStyle;
    class B1,B2,B3,B4,B5,B6,B7,B8 busStyle;
    class I1,I2,I3 intStyle;
```

---

## 2. Catálogo de Módulos Funcionales del Sistema

| Módulo | Responsabilidad Fiscal y Contable | Tecnologías y Motores |
| :--- | :--- | :--- |
| **1. Tablero Global** | KPIs financieros consolidados, mix de ingresos y saldo estimado. | FastAPI `/api/summary` + React 19 |
| **2. Pre-Declaración Mensual** | Matriz de 12 meses, pagos provisionales ISR (Art. 106) y arrastre de IVA (Art. 5/6). | Motor fiscal de flujo de efectivo |
| **3. Pre-Declaración Anual** | Cascada de 5 pasos conforme al Art. 152 LISR y tasas efectivas. | Tarifa progresiva oficial multianual |
| **4. Egresos Operativos** | Clasificación en 8 rubros de 52,547 claves SAT y auditoría de bancarización. | Catálogo `c_ClaveProdServ` SAT |
| **5. Deducciones Personales** | Termómetro del Art. 151 LISR (15% vs 5 UMAs) y subtope PPR (10%). | Validador de topes y constancias |
| **6. Sueldos y Salarios** | Percepciones gravadas/exentas (Art. 93) y recibos de nómina 1.2. | Complemento Nómina CFDI 1.2 |
| **7. Honorarios y PFAE** | Facturación emitida, retenciones del 10% ISR y 10.6667% IVA. | CFDI 3.3/4.0 de Ingresos y REP |
| **8. Auditoría SAT** | Conciliación 1 a 1 de declaraciones anuales, pagos y acuses bancarios. | Parser de PDFs oficiales del SAT |

---

## 3. Principios de Diseño del Sistema

* **Determinismo Puro:** Mismas entradas (CFDIs y PDFs) producen invariablemente los mismos resultados fiscales al centavo, sin redondeos arbitrarios.
* **Flujo de Efectivo Estricto:** La causación de ISR e IVA se computa por fecha efectiva de pago (`fecha_pago`), respetando la legislación aplicable a personas físicas.
* **Privacidad Local:** El procesamiento y la persistencia residen exclusivamente en la máquina del usuario (`backend/tributacos.db`), garantizando la soberanía de la información financiera.
* **Interoperabilidad:** Exportación instantánea en formatos abiertos estándar (CSV con UTF-8 BOM y PDF).
