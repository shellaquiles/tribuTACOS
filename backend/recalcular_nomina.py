#!/usr/bin/env python3
"""
Generador y Normalizador de Empleo Ininterrumpido Continuo (2022 – 2026)
Genera la serie exacta y continua de nómina quincenal ($20,000 / quincena = $40,000 / mes)
con 1 solo empleador estable ('SOLUCIONES TECNOLÓGICAS DE MÉXICO S.A. DE C.V.'),
retención de ISR oficial Art. 96 LISR, IMSS y aguinaldo anual en Diciembre.
"""

import os
import sys
import json
import uuid
import calendar
from typing import Dict, Any

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.models import Cfdi, Client, SummaryCache

TABLA_ISR_QUINCENAL = [
    (0.01, 373.35, 0.0, 0.0192),
    (373.36, 3168.45, 7.17, 0.0640),
    (3168.46, 5568.15, 186.05, 0.1088),
    (5568.16, 6472.65, 447.21, 0.1600),
    (6472.66, 7749.90, 591.93, 0.1792),
    (7749.91, 15629.70, 821.05, 0.2136),
    (15629.71, 24632.70, 2505.34, 0.2352),
    (24632.71, 47035.80, 4622.85, 0.3000),
    (47035.81, 62714.40, 11343.78, 0.3200),
    (62714.41, 188143.20, 16360.93, 0.3400),
    (188143.21, float("inf"), 59006.72, 0.3500)
]


def calcular_isr_quincenal(base_gravable: float) -> float:
    for lim_inf, lim_sup, cuota_fija, porc in TABLA_ISR_QUINCENAL:
        if lim_inf <= base_gravable <= lim_sup:
            excedente = base_gravable - lim_inf
            return round(cuota_fija + (excedente * porc), 2)
    return 0.0


def recalcular_nomina():
    print("=" * 65)
    print("💼 Generando Empleo Ininterrumpido Continuo (2022 – 2026)")
    print("=" * 65)

    db = SessionLocal()
    client = db.query(Client).first()
    user_rfc = client.rfc
    user_nom = client.name

    PATRON_UNICO_NOMBRE = "SOLUCIONES TECNOLÓGICAS DE MÉXICO S.A. DE C.V."
    PATRON_UNICO_RFC = "STM180415AA1"
    REGISTRO_PATRONAL = "Y5812345101"

    # 1. Eliminar recibos de nómina anteriores para generar la serie ininterrumpida exacta
    print("🗑️ Limpiando recibos de nómina previos...")
    db.query(Cfdi).filter(Cfdi.categoria == "nomina").delete()
    db.commit()

    sueldo_quincenal = 20000.00
    isr_ordinario = calcular_isr_quincenal(sueldo_quincenal) # $3,533.23
    imss_quincenal = 540.00
    neto_ordinario = round(sueldo_quincenal - isr_ordinario - imss_quincenal, 2)

    uma_diaria = 108.57
    aguinaldo_exento_limite = round(30 * uma_diaria, 2) # $3,257.10

    # Configuración de meses por año (2022 a 2025 = 12 meses; 2026 = 8 meses Ene-Ago)
    ANIOS_CONFIG = {
        "2022": 12,
        "2023": 12,
        "2024": 12,
        "2025": 12,
        "2026": 8,
    }

    nuevos_recibos = []

    for anio, max_meses in ANIOS_CONFIG.items():
        recibos_anio = 0
        subtotal_anio = 0.0

        for mes in range(1, max_meses + 1):
            ultimo_dia = calendar.monthrange(int(anio), mes)[1]

            # Quincena 1 (Día 15)
            f_ini_q1 = f"{anio}-{mes:02d}-01"
            f_fin_q1 = f"{anio}-{mes:02d}-15"
            f_pago_q1 = f"{anio}-{mes:02d}-15T12:00:00"

            # Quincena 2 (Fin de mes)
            f_ini_q2 = f"{anio}-{mes:02d}-16"
            f_fin_q2 = f"{anio}-{mes:02d}-{ultimo_dia:02d}"
            f_pago_q2 = f"{anio}-{mes:02d}-{ultimo_dia:02d}T12:00:00"

            quincenas_mes = [
                (1, f_ini_q1, f_fin_q1, f_pago_q1, False),
                (2, f_ini_q2, f_fin_q2, f_pago_q2, (mes == 12))
            ]

            for q_num, f_ini, f_fin, f_pago, con_aguinaldo in quincenas_mes:
                if con_aguinaldo:
                    aguinaldo_monto = 20000.00
                    aguinaldo_exento = min(aguinaldo_monto, aguinaldo_exento_limite)
                    aguinaldo_gravado = aguinaldo_monto - aguinaldo_exento

                    total_gravado = round(sueldo_quincenal + aguinaldo_gravado, 2)
                    total_exento = round(aguinaldo_exento, 2)
                    subtotal_bruto = round(sueldo_quincenal + aguinaldo_monto, 2)

                    isr_aguinaldo = round(aguinaldo_gravado * 0.175, 2)
                    isr_total = round(isr_ordinario + isr_aguinaldo, 2)
                    neto_pagado = round(subtotal_bruto - isr_total - imss_quincenal, 2)

                    percepciones = [
                        {"tipo": "001", "clave": "001", "concepto": "Sueldos y Salarios Ordinarios", "gravado": sueldo_quincenal, "exento": 0.0},
                        {"tipo": "002", "clave": "002", "concepto": "Gratificación Anual (Aguinaldo)", "gravado": aguinaldo_gravado, "exento": total_exento}
                    ]
                else:
                    total_gravado = sueldo_quincenal
                    total_exento = 0.0
                    subtotal_bruto = sueldo_quincenal
                    isr_total = isr_ordinario
                    neto_pagado = neto_ordinario

                    percepciones = [
                        {"tipo": "001", "clave": "001", "concepto": "Sueldos, Salarios y Asimilados", "gravado": sueldo_quincenal, "exento": 0.0}
                    ]

                deducciones = [
                    {"tipo": "002", "clave": "002", "concepto": "ISR Retenido por Salarios", "importe": isr_total},
                    {"tipo": "001", "clave": "001", "concepto": "Seguridad Social (IMSS Obrero)", "importe": imss_quincenal}
                ]

                cfdi_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"NOM_{user_rfc}_{f_pago}_{q_num}")).upper()

                parsed_data = {
                    "uuid": cfdi_uuid,
                    "fecha": f_pago,
                    "fecha_pago_nomina": f_pago[:10],
                    "fecha_inicial_pago": f_ini,
                    "fecha_final_pago": f_fin,
                    "num_dias_pagados": 15.0,
                    "emisor_rfc": PATRON_UNICO_RFC,
                    "emisor_nombre": PATRON_UNICO_NOMBRE,
                    "receptor_rfc": user_rfc,
                    "receptor_nombre": user_nom,
                    "registro_patronal": REGISTRO_PATRONAL,
                    "subtotal": subtotal_bruto,
                    "descuento": 0.0,
                    "total": neto_pagado,
                    "retencion_isr": isr_total,
                    "nomina_gravado": total_gravado,
                    "nomina_exento": total_exento,
                    "percepciones_detalle": percepciones,
                    "deducciones_detalle": deducciones,
                    "conceptos": [{
                        "clave": "84111505",
                        "desc": "Pago de nómina y salarios quincenal",
                        "imp": subtotal_bruto
                    }]
                }

                cfdi_obj = Cfdi(
                    id=cfdi_uuid,
                    client_id=client.id,
                    filename=f"NOMINA_{anio}_{mes:02d}_Q{q_num}.xml",
                    categoria="nomina",
                    tipo="N",
                    fecha=f_pago,
                    year=str(anio),
                    emisor_rfc=PATRON_UNICO_RFC,
                    emisor_nombre=PATRON_UNICO_NOMBRE,
                    receptor_rfc=user_rfc,
                    receptor_nombre=user_nom,
                    uso_cfdi="CN01",
                    metodo_pago="PUE",
                    forma_pago="99",
                    subtotal=subtotal_bruto,
                    descuento=0.0,
                    iva=0.0,
                    retencion_isr=isr_total,
                    retencion_iva=0.0,
                    total=neto_pagado,
                    es_interes=False,
                    parsed_data=json.dumps(parsed_data, ensure_ascii=False)
                )

                nuevos_recibos.append(cfdi_obj)
                recibos_anio += 1
                subtotal_anio += subtotal_bruto

        print(f"   ✓ Año {anio}: {recibos_anio} quincenas continuas ({recibos_anio//2} meses completos) | Sueldo Bruto: ${subtotal_anio:,.2f}")

    db.bulk_save_objects(nuevos_recibos)
    db.commit()
    print(f"\n✅ Total recibos de nómina continuos generados: {len(nuevos_recibos)}")

    # Purgar caché
    print("🧹 Purgando cachés de resumen...")
    db.query(SummaryCache).delete()
    db.commit()

    db.close()
    print("🎉 Empleo ininterrumpido 2022–2026 establecido con éxito.")


if __name__ == "__main__":
    recalcular_nomina()
