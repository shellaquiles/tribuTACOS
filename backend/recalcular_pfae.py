#!/usr/bin/env python3
"""
Generador y Distribuidor Realista de Ingresos PFAE ($200,000 – $500,000 / año)
Distribuye facturas de honorarios y servicios profesionales emitidos por el
contribuyente con estacionalidad de meses buenos, medios y bajos, con cálculo
preciso de IVA (16%), Retención ISR (10%) y Retención IVA (10.67%) Art. 106 LISR.
"""

import os
import sys
import json
import uuid
import random
from datetime import datetime
from typing import List, Dict

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.models import Cfdi, Client, SummaryCache

CLIENTES_PFAE = [
    ("INNOVACION DIGITAL DEL NORTE SA DE CV", "IDN190412AA1"),
    ("GRUPO COMERCIAL Y FINANCIERO SA DE CV", "GCF160820BB2"),
    ("SOLUCIONES LOGISTICAS DE OCCIDENTE SA DE CV", "SLO180515CC3"),
    ("CONSULTORES EN GESTION EMPRESARIAL SC", "CGE170210DD4"),
]

CONCEPTOS_PFAE = [
    ("81111508", "Desarrollo de software y backend en Python"),
    ("80101500", "Consultoría técnica y arquitectura de software"),
    ("81112000", "Servicios de DevOps, automatización y despliegue cloud"),
    ("81112306", "Mantenimiento y reparación de equipo de cómputo"),
    ("81112105", "Renta y hospedaje de servidores dedicados"),
]

# Distribución mensual con meses en CERO ($0.00) para reflejar intermitencia real
# Meses con proyectos: Picos de $35k a $95k
# Meses sin proyectos ($0.00): Enero, Abril, Junio, Septiembre, etc.
PATRON_MESES = {
    "2022": [0, 35, 65, 0, 0, 0, 75, 0, 0, 85, 90, 45], # 6 meses con $0.00 | Total: $395k
    "2023": [0, 0, 70, 0, 45, 0, 80, 40, 0, 95, 75, 30], # 5 meses con $0.00 | Total: $435k
    "2024": [0, 40, 65, 0, 0, 0, 70, 0, 0, 80, 75, 0],  # 7 meses con $0.00 | Total: $330k
    "2025": [0, 50, 80, 0, 60, 0, 90, 0, 0, 95, 85, 0],  # 6 meses con $0.00 | Total: $460k
    "2026": [0, 45, 0, 60, 0, 75, 60, 0, 0, 0, 0, 0],     # 4 meses activos, 4 meses en $0.00 | Total: $240k
}


def recalcular_pfae():
    print("=" * 65)
    print("📈 Distribuyendo Ingresos PFAE ($200k – $500k/año) por Estacionalidad")
    print("=" * 65)

    db = SessionLocal()
    client = db.query(Client).first()
    user_rfc = client.rfc
    user_nom = client.name

    # 1. Eliminar facturas de ingreso previas para regenerar con distribución perfecta
    print(f"🗑️ Eliminando ingresos PFAE anteriores emitidos por {user_rfc}...")
    db.query(Cfdi).filter(Cfdi.categoria == "ingreso", Cfdi.emisor_rfc == user_rfc).delete()
    db.commit()

    nuevas_facturas = []
    random.seed(42) # Reproducibilidad determinista

    for anio, montos_mensuales in PATRON_MESES.items():
        subtotal_anio = 0.0
        facturas_anio = 0

        for mes_idx, monto_k in enumerate(montos_mensuales, start=1):
            if monto_k <= 0:
                continue

            # Determinar si se emite 1 o 2 facturas en el mes
            num_facturas = 2 if monto_k >= 35 else 1
            montos = [monto_k * 1000.0] if num_facturas == 1 else [monto_k * 550.0, monto_k * 450.0]

            for f_idx, base in enumerate(montos):
                # Generar fecha dentro del mes
                dia = random.randint(5, 27)
                hora = random.randint(9, 18)
                minuto = random.randint(10, 50)
                fecha_iso = f"{anio}-{mes_idx:02d}-{dia:02d}T{hora:02d}:{minuto:02d}:00"

                # Cliente receptor
                cliente_nom, cliente_rfc = CLIENTES_PFAE[(mes_idx + f_idx) % len(CLIENTES_PFAE)]
                clave_sat, desc_concepto = CONCEPTOS_PFAE[(mes_idx + f_idx) % len(CONCEPTOS_PFAE)]

                # Cálculos fiscales (Art. 106 LISR / Art. 1-A LIVA)
                subtotal = round(base, 2)
                iva = round(subtotal * 0.16, 2)
                ret_isr = round(subtotal * 0.10, 2)
                ret_iva = round(subtotal * 0.106667, 2)
                total = round(subtotal + iva - ret_isr - ret_iva, 2)

                cfdi_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"PFAE_{user_rfc}_{fecha_iso}_{f_idx}")).upper()

                parsed_data = {
                    "uuid": cfdi_uuid,
                    "fecha": fecha_iso,
                    "emisor_rfc": user_rfc,
                    "emisor_nombre": user_nom,
                    "receptor_rfc": cliente_rfc,
                    "receptor_nombre": cliente_nom,
                    "uso_cfdi": "G03",
                    "tipo": "I",
                    "metodo_pago": "PUE",
                    "forma_pago": "03", # Transferencia electrónica
                    "subtotal": subtotal,
                    "descuento": 0.0,
                    "iva": iva,
                    "retencion_isr": ret_isr,
                    "retencion_iva": ret_iva,
                    "total": total,
                    "conceptos": [{
                        "clave": clave_sat,
                        "desc": desc_concepto,
                        "imp": subtotal,
                        "cant": 1,
                        "unidad": "E48"
                    }]
                }

                cfdi_obj = Cfdi(
                    id=cfdi_uuid,
                    client_id=client.id,
                    filename=f"CFDI_I_{anio}_{mes_idx:02d}_{f_idx+1}.xml",
                    categoria="ingreso",
                    tipo="I",
                    fecha=fecha_iso,
                    year=str(anio),
                    emisor_rfc=user_rfc,
                    emisor_nombre=user_nom,
                    receptor_rfc=cliente_rfc,
                    receptor_nombre=cliente_nom,
                    uso_cfdi="G03",
                    metodo_pago="PUE",
                    forma_pago="03",
                    subtotal=subtotal,
                    descuento=0.0,
                    iva=iva,
                    retencion_isr=ret_isr,
                    retencion_iva=ret_iva,
                    total=total,
                    es_interes=False,
                    parsed_data=json.dumps(parsed_data, ensure_ascii=False)
                )

                nuevas_facturas.append(cfdi_obj)
                subtotal_anio += subtotal
                facturas_anio += 1

        print(f"   ✓ Año {anio}: {facturas_anio} facturas emitidas | Subtotal: ${subtotal_anio:,.2f}")

    db.bulk_save_objects(nuevas_facturas)
    db.commit()
    print(f"\n✅ Total facturas de ingreso PFAE creadas: {len(nuevas_facturas)}")

    # Purgar caché para regeneración instantánea
    print("🧹 Purgando cachés de resumen...")
    db.query(SummaryCache).delete()
    db.commit()

    db.close()
    print("🎉 Ingresos PFAE actualizados con éxito.")


if __name__ == "__main__":
    recalcular_pfae()
