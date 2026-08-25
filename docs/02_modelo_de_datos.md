# 🗄️ 02. Modelo de Datos Relacional y Esquema SQLAlchemy

> **Diseño de base de datos relacional, diagramas entidad-relación (ERD), modelos SQLAlchemy, índices de rendimiento y diccionario de datos.**

---

## 1. Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    CLIENT ||--o{ CFDI : "posee (Multi-RFC)"
    CLIENT ||--o{ DECLARACION_ANUAL_SAT : "presenta"
    CLIENT ||--o{ PAGO_PROVISIONAL_SAT : "liquida (12 meses)"
    CLIENT ||--o{ ACUSE_PAGO_SAT : "comprueba"
    CLIENT ||--o{ SUMMARY_CACHE : "invalida/consulta"
    
    CFDI }|..|{ CATALOGO_SAT_CLAVE : "clasifica por clave"

    CLIENT {
        string id PK "default / rfc"
        string name "Nombre del Contribuyente"
        string rfc UK "RFC (13 pos)"
        string email "Correo de contacto"
        datetime created_at
    }

    CFDI {
        string id PK "UUID del Timbre Fiscal"
        string client_id FK "Relación al cliente"
        string filename "Nombre del XML origen"
        string filepath "Ruta física en disco"
        string emisor_rfc "RFC Emisor (Indexado)"
        string emisor_nombre "Razón Social Emisor"
        string receptor_rfc "RFC Receptor (Indexado)"
        string receptor_nombre "Razón Social Receptor"
        string fecha "Fecha ISO YYYY-MM-DD"
        string year "Año fiscal YYYY (Indexado)"
        string tipo_comprobante "I, E, N, P"
        string categoria "ingreso, egreso, nomina, pago"
        string uso_cfdi "G01, G03, D01, CP01, etc."
        string forma_pago "01, 03, 04, 99"
        string metodo_pago "PUE / PPD"
        float subtotal "Importe sin impuestos"
        float descuento "Descuentos aplicados"
        float iva "IVA trasladado"
        float ieps "IEPS trasladado"
        float retencion_isr "ISR retenido"
        float retencion_iva "IVA retenido"
        float total "Monto total del CFDI"
        boolean es_deducible "Bandera de deducibilidad"
        boolean es_nomina "Bandera de nómina"
        string parsed_data "JSON con partidas y complementos"
        datetime created_at
    }

    DECLARACION_ANUAL_SAT {
        string id PK "UUID"
        string client_id FK "Relación al cliente"
        string year "Ejercicio YYYY (Indexado)"
        string rfc "RFC Contribuyente"
        string tipo_declaracion "Normal / Complementaria"
        string num_operacion "Número de operación SAT"
        string fecha_presentacion "Fecha de envío SAT"
        float ingresos_acumulables "Total ingresos anuales"
        float deducciones_personales "Deducciones aplicadas"
        float base_gravable "Base para tarifa Art 152"
        float isr_tarifa "ISR determinado anual"
        float pagos_provisionales_acreditados "ISR pagado en provisionales"
        float isr_retenido "ISR retenido en el año"
        float saldo_a_favor "Saldo a favor determinado"
        float saldo_a_cargo "Impuesto a pagar"
        string destino_saldo "Devolución / Compensación"
        string clabe "CLABE interbancaria"
        string banco "Institución bancaria"
        string raw_pdf_path "Ruta al PDF oficial"
    }

    PAGO_PROVISIONAL_SAT {
        string id PK "UUID"
        string client_id FK "Relación al cliente"
        string year "Ejercicio YYYY (Indexado)"
        int mes_numero "1 al 12 (Indexado)"
        string mes_nombre "Enero ... Diciembre"
        string tipo_declaracion "Normal / Complementaria"
        string num_operacion "Número de operación SAT"
        string fecha_presentacion "Fecha de presentación"
        float isr_ingresos_periodo "Ingresos PFAE del mes"
        float isr_ingresos_acumulados "Ingresos acumulados año"
        float isr_deducciones_autorizadas "Gastos deducibles mes"
        float isr_deducciones_acumuladas "Gastos acumulados año"
        float isr_retenido_periodo "ISR retenido en el mes"
        float isr_a_cargo "ISR neto a pagar al SAT"
        float iva_cobrado_16 "IVA cobrado facturas"
        float iva_acreditable_gastos "IVA pagado en gastos"
        float iva_retenido "IVA retenido en el mes"
        float iva_a_cargo "IVA neto a pagar al SAT"
        float total_pagado "Total ISR + IVA pagado"
        boolean tiene_acuse_pago "Si cuenta con acuse bancario"
        float total_pagado_acuse "Monto verificado en acuse"
        string raw_pdf_path "Ruta al PDF de la declaración"
    }

    CATALOGO_SAT_CLAVE {
        string clave PK "Clave SAT de 8 dígitos (Indexado)"
        string descripcion "Descripción oficial SAT"
        string incluye_iva_trasladado "Sí / No"
        string incluye_ieps_trasladado "Sí / No"
        string complemento_concepto "Complementos requeridos"
        string fecha_inicio_vigencia "Fecha vigencia"
        string estimulo_franja_fronteriza "0 / 1"
    }

    SUMMARY_CACHE {
        string id PK "client_id + '_' + year"
        string client_id FK
        string year
        string data "JSON del resumen fiscal compilado"
        datetime updated_at
    }
```

---

## 2. Índices de Alto Rendimiento

Para garantizar tiempos de respuesta menores a **15 ms** en auditorías con miles de CFDIs, se han configurado los siguientes índices en SQLAlchemy:

```python
# Definición en backend/app/models.py
__table_args__ = (
    Index('idx_cfdi_client_year', 'client_id', 'year'),
    Index('idx_cfdi_emisor_fecha', 'emisor_rfc', 'fecha'),
    Index('idx_cfdi_receptor_fecha', 'receptor_rfc', 'fecha'),
    Index('idx_cfdi_categoria', 'categoria'),
)
```

---

## 3. Modelo de Partidas Desestructuradas (`parsed_data`)

Cada CFDI almacena en su columna `parsed_data` un objeto JSON normalizado que contiene:

```json
{
  "uuid": "4A1B2C3D-E4F5-6789-ABCD-EF0123456789",
  "emisor_rfc": "STM180415AA1",
  "emisor_nombre": "SOLUCIONES TECNOLÓGICAS DE MÉXICO S.A. DE C.V.",
  "receptor_rfc": "SHLL250825XYZ",
  "receptor_nombre": "pixelead0 Shellaquiles org",
  "regimen_fiscal_emisor": "601",
  "regimen_fiscal_receptor": "605",
  "conceptos": [
    {
      "clave": "81111508",
      "desc": "Desarrollo de software y backend en Python",
      "imp": 35000.00,
      "subtotal": 35000.00,
      "descuento": 0.00,
      "tasa_iva": 0.16,
      "iva": 5600.00,
      "ret_isr": 3500.00,
      "ret_iva": 3733.33
    }
  ],
  "nomina_detalle": {
    "dias_pagados": 15.0,
    "fecha_inicial_pago": "2024-01-01",
    "fecha_final_pago": "2024-01-15",
    "salario_base_cot_apor": 1350.00,
    "salario_diario_integrado": 1420.50,
    "percepciones": [
      { "tipo": "001", "concepto": "Sueldos y Salarios", "gravado": 20000.00, "exento": 0.00 }
    ],
    "deducciones": [
      { "tipo": "001", "concepto": "Seguridad Social IMSS", "total": 540.00 },
      { "tipo": "002", "concepto": "Retención de ISR", "total": 3533.23 }
    ]
  }
}
```

---

## 4. Estrategia de Invalidación de Caché (`SummaryCache`)

* La tabla `summary_cache` almacena el payload JSON completo del motor fiscal para evitar re-calcular la matriz de 12 meses y los impuestos en cada lectura de la UI.
* **Eventos de Invalidación:**
  * Al subir o eliminar un CFDI (`Cfdi`).
  * Al sincronizar una declaración oficial del SAT (`PagoProvisionalSAT` / `DeclaracionAnualSAT`).
  * Al ejecutar cualquier script de anonimización o recálculo (`anonymize.py`, `recalcular_nomina.py`, `recalcular_pfae.py`).
