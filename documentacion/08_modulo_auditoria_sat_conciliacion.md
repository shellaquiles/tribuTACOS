# tribuTACOS — Manual de Usuario

# Capítulo 08: Módulo de Auditoría SAT y Conciliación Oficial

Conciliación 1 a 1 de declaraciones anuales, pagos provisionales de 12 meses y acuses bancarios de pago extraídos de los PDFs oficiales del SAT.

---

## 1. Visión General de la Auditoría Bidireccional

Este módulo permite contrastar la realidad contable obtenida de los comprobantes digitales timbrados (**XMLs**) contra las cifras registradas formalmente ante la autoridad tributaria (**PDFs oficiales del SAT**).

![Módulo de Auditoría SAT Oficial](img/12_auditoria_sat_oficial.png)

---

## 2. Componentes de Auditoría

### 2.1 Declaración Anual Oficial:
* **Número de Operación:** Código oficial de recepción del SAT (ej. `261572124966`).
* **Fecha y Hora de Presentación:** Marca de tiempo oficial del timbrado de la declaración.
* **Tipo de Declaración:** Normal o Complementaria.
* **Cuenta CLABE Registrada:** Identificación de la cuenta bancaria para la devolución del saldo a favor (`012180000000000000` - BBVA México).

### 2.2 Matriz de Cumplimiento de Pagos Provisionales (12 Meses):
* **Tabla Comparativa Mensual:** Desglose mes a mes de los ingresos acumulados declarados ante el SAT, retenciones de ISR y montos de IVA reportados.
* **Verificación de Acuses Bancarios:** Validación de comprobantes bancarios emitidos por la institución financiera con su respectiva línea de captura y sello digital.

### 2.3 Utilidad Contable y Preventiva:
* Detección de discrepancias fiscales o diferencias entre lo timbrado por los clientes/proveedores y lo presentado en el portal del SAT.
* Prevención de cartas invitación, requerimientos o diferencias en declaraciones complementarias.
