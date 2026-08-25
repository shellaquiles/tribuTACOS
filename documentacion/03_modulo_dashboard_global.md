# Capítulo 3: Módulo 1 — Dashboard Global

## 🌟 Propósito de la Pantalla

El **Dashboard Global** es la vista de mando integral de tributacos. Su función principal es ofrecer una **radiografía ejecutiva del estado fiscal** del contribuyente para el ejercicio seleccionado, consolidando en un solo lugar los tres pilares tributarios:
1. **Sueldos y Salarios** (Ingresos recibidos de patrones).
2. **Actividad Empresarial y Servicios Profesionales** (Honorarios y facturación emitida).
3. **Intereses y Rendimientos Financieros** (Ganancias bancarias y de inversión).

---

## 🖥️ Anatomía y Secciones Detalladas

---

### 1. Gran Hero Card y 4 KPIs Financieros Clave

![Hero Card con Semáforo Fiscal y Cuatro KPIs Ejecutivos](img/03_dashboard_01_hero_y_kpis.png)

#### Componentes del Bloque Superior:
- **Hero Card con Semáforo Fiscal:** Indica con fondo dinámico el resultado anual estimado:
  - **Fondo Verde / Esmeralda:** Si el contribuyente tiene **Saldo a Favor Estimado (🟢)** para devolución del SAT.
  - **Fondo Rojo / Borgoña:** Si el contribuyente tiene **Impuesto Anual a Cargo (🔴)**.
- **Monto Gigante:** Importe estimado a favor o a cargo.
- **4 Tarjetas de Métricas Clave (KPIs):**
  1. *Ingresos Totales Brutos:* Sueldos brutos + Honorarios cobrados + Intereses nominales.
  2. *Deducciones Totales:* Gastos operativos + Deducciones personales aplicables.
  3. *Retenciones de ISR:* ISR retenido en nómina, honorarios (10%) y bancos.
  4. *Balance ISR Anual:* Resultado matemático definitivo conforme a la tarifa del Art. 152.

---

### 2. Desglose y Distribución por Régimen Tributario

![Tarjetas de Distribución por Régimen: Sueldos, Honorarios e Intereses](img/03_dashboard_02_distribucion_regimenes.png)

Al desplazarse hacia abajo en la pantalla, se despliegan las tres tarjetas de regímenes fiscales:
- **👔 Sueldos y Salarios:** Muestra el ingreso bruto, el ingreso gravado acumulable, los ingresos exentos (Art. 93), el ISR retenido por patrones y el número de empleadores timbrados.
- **💼 Honorarios / Actividad Empresarial:** Despliega la facturación efectivamente cobrada (flujo de efectivo), las deducciones autorizadas pagadas, la utilidad neta y las retenciones del 10%.
- **📈 Intereses Financieros:** Presenta los intereses nominales, el interés real acumulable descontando la inflación y el ISR retenido por las instituciones financieras.

---

### 3. Cascada Fiscal de Determinación (Waterfall)

![Cascada de Determinación Fiscal Art. 152 LISR y Tabla de Acreditamientos](img/03_dashboard_03_cascada_determinacion.png)

En la sección inferior del Dashboard se detalla el viaje del dinero paso a paso:
```
[ + Ingresos Acumulables Totales ]
        │
        ▼ ( - Deducciones Personales Aplicadas )
[ = Base Gravable del Ejercicio ]
        │
        ▼ ( x Tarifa Progresiva Art. 152 LISR )
[ = ISR Anual Causado ]
        │
        ▼ ( - Retenciones Totales de Nómina, Honorarios y Bancos )
        ▼ ( - Pagos Provisionales Acreditables )
[ = 🎉 SALDO A FAVOR ESTIMADO / ⚠️ IMPUESTO A CARGO ]
```

Esta cascada garantiza transparencia absoluta: cualquier cifra puede ser explicada al centavo tanto al contribuyente como a auditores fiscales.
