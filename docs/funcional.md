# Documentación Funcional - Simulador de Pre-Declaración Anual ISR

## Propósito
El Simulador de Pre-Declaración Anual es una herramienta diseñada para Personas Físicas con Actividad Empresarial (PFAE) y Sueldos y Salarios. Su objetivo principal es adelantarse a la propuesta oficial del SAT, permitiendo a los contribuyentes previsualizar el cálculo de su ISR y conocer si tendrán saldo a favor o a cargo.

## Módulos Principales

### 1. Panel de Ingresos (Dashboard)
Este módulo agrupa la información procesada a partir de los CFDI (recibidos y emitidos) categorizada por regímenes fiscales.
*   **Sueldos, Salarios y Asimilados:**
    *   Muestra los ingresos anuales gravados y exentos.
    *   Detalla los ingresos por cada empleador.
    *   Presenta un desglose detallado de los ingresos exentos según el Art. 93 LISR (Aguinaldo, Prima Vacacional, PTU, etc.).
*   **Actividad Empresarial y Servicios Profesionales (Honorarios):**
    *   Calcula y muestra los ingresos cobrados y las deducciones autorizadas pagadas bajo la regla de Flujo de Efectivo del SAT (facturas PUE + complementos).
    *   Integra un resumen mensual de los pagos provisionales, mostrando si hubieron ingresos y la utilidad o pérdida de cada mes.
*   **Intereses:**
    *   Resume el total de intereses nominales reportados por instituciones financieras y el ISR que estas retuvieron.

### 2. Deducciones Personales
*   Sección destinada a agrupar los gastos personales del ejercicio fiscal (Art. 151 LISR) que pueden disminuir la base gravable.

### 3. Determinación del ISR
Es la "calculadora" principal que simula el proceso oficial del SAT. Contiene el papel de trabajo anual detallado paso a paso:
1.  **Ingresos Acumulables:** Suma de ingresos gravados de todos los regímenes.
2.  **Base Gravable:** Ingresos Acumulables menos Deducciones Personales.
3.  **Cálculo del ISR:** Aplicación de la Tarifa Anual (Art. 152 LISR) correspondiente al año seleccionado (2024 o 2025). Muestra de forma transparente el Límite Inferior, Excedente, Tasa Marginal y Cuota Fija aplicados.
4.  **Acreditamientos:** Suma del ISR retenido durante el año por patrones o clientes.
5.  **Resultado Definitivo:** El balance final que indica si existe un **Saldo a Favor** (para devolución) o un **ISR a Cargo** (a pagar).

## Navegación y Uso
1.  **Selección de Ejercicio Fiscal:** En la parte superior de la interfaz, el usuario puede intercambiar entre los años fiscales (2024 y 2025). La interfaz y la tarifa aplicada se actualizarán dinámicamente.
2.  **Pestañas (Tabs):** La interfaz utiliza un sistema de pestañas para saltar entre *Ingresos*, *Deducciones Personales* y *Determinación ISR*, manteniendo el foco del usuario.
3.  **Filtrado Inteligente:** El sistema detecta automáticamente duplicados de comprobantes fiscales y aísla correctamente los datos pertenecientes exclusivamente al año consultado.

## Beneficios
*   **Transparencia Total:** A diferencia de la plataforma del SAT que oculta el cálculo aritmético tras bambalinas, el simulador detalla cada operación matemática.
*   **Anticipación Fiscal:** Provee información útil meses antes de abril (mes de declaración para personas físicas).
