"""
Generador Maestro y Recalibrador Determinista del Dataset Fiscal para tribuTACOS.

Configura y genera:
1. Sueldos y Salarios a $30,000.00 MXN mensuales ($15,000 quincenal) con prestaciones de ley (Aguinaldo, Prima Vacacional, Vales, IMSS, ISR Art. 96).
2. Ingresos PFAE anuales del 30% al 55% de nómina, con meses activos e inactivos ($0.00).
3. Conceptos de PFAE en DevOps, Desarrollo de Software, APIs, Hosting de Servidores Cloud e Infraestructura.
4. Gastos operativos típicos de consultor/desarrollador de software (Cloud, fibra óptica, hardware, contabilidad).
5. Deducciones personales (Art. 151 LISR) y parámetros fiscales oficiales.
6. Sincronización completa de declaraciones anuales oficiales del SAT, pagos provisionales y acuses bancarios.
7. Reconstrucción de la caché de resúmenes fiscales y exportación al fixture comprimido.
"""

import os
import sys
import json
import uuid
import random
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Any

# Asegurar path de importación
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal, engine, Base
from app.models import (
    Client, Cfdi, SummaryCache, DeclaracionAnualSAT,
    PagoProvisionalSAT, AcusePagoSAT, CfdiExclusion,
    ConstanciaFiscalExterna, TarifaIsrAnual, ParametroSat
)
from app.catalogos.seed_fiscal import asegurar_parametros_fiscales, PARAMETROS_SAT_DATOS, TARIFAS_ANUALES_DATOS
from app.cfdis.engine import build_fiscal_summary
from app.seeds.seed_demo import export_demo_fixture

CLIENT_RFC = "SHLL250825XYZ"
CLIENT_NAME = "Sheila Shellaquiles Ortega"
CLIENT_EMAIL = "tributacos@shellaquiles.org"

PATRONES = [
    {
        "rfc": "ITN150420AA1",
        "nombre": "INNOVACION TECNOLOGICA DEL NORTE SA DE CV",
        "registro_patronal": "Y5482010943"
    },
    {
        "rfc": "SEM160815BB2",
        "nombre": "SERVICIOS EMPRESARIALES DE MEXICO SA DE CV",
        "registro_patronal": "Z6291040851"
    }
]

CLIENTES_PFAE = [
    {"rfc": "CFF170925DD4", "nombre": "CONSULTORES FISCALES Y FINANCIEROS SC"},
    {"rfc": "LEE181112EE5", "nombre": "LOGISTICA Y ENVIOS EXPRESS SA DE CV"},
    {"rfc": "SDN190530FF6", "nombre": "SOLUCIONES DIGITALES EN LA NUBE SA DE CV"},
    {"rfc": "CHR210419JJ0", "nombre": "COMERCIALIZADORA DE HARDWARE Y REDES SA DE CV"}
]

PROVEEDORES_GASTOS = [
    {"rfc": "SDN190530FF6", "nombre": "SOLUCIONES DIGITALES EN LA NUBE SA DE CV", "cat": "servidores_cloud", "clave": "81112106", "desc": "Servicio de infraestructura Cloud, VPS Dedicado y almacenamiento en la nube"},
    {"rfc": "TEL820315AA1", "nombre": "TELECOMUNICACIONES DE MEXICO SA DE CV", "cat": "telecom_internet", "clave": "81161700", "desc": "Servicio empresarial de Internet Fibra Óptica simétrica de alta velocidad"},
    {"rfc": "CHR210419JJ0", "nombre": "COMERCIALIZADORA DE HARDWARE Y REDES SA DE CV", "cat": "equipo_computo", "clave": "43211503", "desc": "Monitor profesional 4K UltraWide y componentes de hardware para desarrollo"},
    {"rfc": "CFF170925DD4", "nombre": "CONSULTORES FISCALES Y FINANCIEROS SC", "cat": "servicios_contables", "clave": "84111500", "desc": "Honorarios por servicios de asesoría contable, fiscal y auditoría mensual"},
    {"rfc": "PEC130708GG7", "nombre": "PROVEEDORA DE EQUIPOS Y CABLES SA DE CV", "cat": "accesorios_red", "clave": "43222600", "desc": "Cables ethernet categoría 6A, hubs USB-C y adaptadores de red"},
    {"rfc": "MIE200115HH8", "nombre": "MANTENIMIENTO INTEGRAL DE EDIFICIOS SA DE CV", "cat": "coworking_oficina", "clave": "80131500", "desc": "Renta de espacio coworking y sala de juntas para reuniones de clientes"},
]

CONCEPTOS_PFAE_CATALOG = [
    {"clave": "81111811", "desc_sat": "Servicios de arquitectura cloud y automatización DevOps", "desc": "Servicios de despliegue de infraestructura cloud, pipelines CI/CD y Kubernetes"},
    {"clave": "43232408", "desc_sat": "Software de desarrollo de plataformas web", "desc": "Desarrollo de API backend en FastAPI y microservicios de alto rendimiento"},
    {"clave": "81111508", "desc_sat": "Servicios de programación de aplicaciones", "desc": "Desarrollo de interfaces frontend React/Next.js y módulos de analítica"},
    {"clave": "81112106", "desc_sat": "Servicios de hospedaje de servidores web y bases de datos", "desc": "Administración, monitoreo y soporte 24/7 de clúster de servidores productivos"},
    {"clave": "81111812", "desc_sat": "Consultoría en seguridad de sistemas de información", "desc": "Auditoría de ciberseguridad, hardening de servidores y cifrado de datos"}
]

MONTH_NAMES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]


def calcular_isr_ret_nomina(sueldo_quincenal_bruto: float) -> float:
    """Aproximación precisa del Art. 96 LISR para sueldo quincenal de $15,000."""
    # Para $15,000 quincenales ($30,000 mensuales), el ISR retenido quincenal ronda ~$2,150 - $2,300
    base = sueldo_quincenal_bruto
    if base <= 15000:
        return 2180.00
    else:
        # Si incluye aguinaldo o primas
        excedente = base - 15000
        return round(2180.00 + (excedente * 0.2136), 2)


def recalibrate_all():
    print("=" * 70)
    print("🚀 RECALIBRANDO DATASET FISCAL DETERMINISTA (2021 - 2026)")
    print("   • Contribuyente:", CLIENT_NAME, f"({CLIENT_RFC})")
    print("   • Nómina: $30,000 MXN mensuales con prestaciones")
    print("   • PFAE: 30% a 55% de nómina con meses activos e inactivos")
    print("   • Rubros PFAE: DevOps, Software, Servidores e Infraestructura")
    print("=" * 70)

    # Recrear tablas
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Asegurar Parámetros Fiscales
    asegurar_parametros_fiscales(db)

    # 2. Crear Cliente Principal
    client = Client(
        id="default",
        name=CLIENT_NAME,
        rfc=CLIENT_RFC,
        email=CLIENT_EMAIL,
        plan="pro"
    )
    db.add(client)
    db.commit()

    all_years = ["2021", "2022", "2023", "2024", "2025", "2026"]

    # Diccionario de acúmulo por año para la auditoría SAT
    anual_sat_accumulator = {}

    for year_str in all_years:
        year_int = int(year_str)
        random.seed(year_int * 42)

        # Seleccionar patrón principal para este año
        patron = PATRONES[year_int % len(PATRONES)]

        print(f"\n📅 Generando Ejercicio {year_str}...")

        # ─── A. NÓMINA: $30,000.00 mensuales ($15,000 quincenal) ───
        sueldo_quincenal = 15000.00
        vales_quincenales = 1000.00
        imss_quincenal = 385.50

        year_sueldos_gravado = 0.0
        year_sueldos_exento = 0.0
        year_isr_retenido_nomina = 0.0

        for mes in range(1, 13):
            dias_mes = 30 if mes in [4, 6, 9, 11] else (28 if mes == 2 else 31)

            # Quincena 1 (Día 15)
            f1 = f"{year_str}-{mes:02d}-15"
            isr_q1 = calcular_isr_ret_nomina(sueldo_quincenal)
            neto_q1 = sueldo_quincenal + vales_quincenales - isr_q1 - imss_quincenal

            p1 = [
                {"tipo": "001", "concepto": "SUELDO BASE", "gravado": sueldo_quincenal, "exento": 0.0, "total": sueldo_quincenal},
                {"tipo": "029", "concepto": "VALES DE DESPENSA", "gravado": 0.0, "exento": vales_quincenales, "total": vales_quincenales}
            ]
            d1 = [
                {"tipo": "002", "concepto": "ISR RETENIDO ART. 96", "importe": isr_q1},
                {"tipo": "001", "concepto": "CUOTA OBRERA IMSS", "importe": imss_quincenal}
            ]

            cfdi_q1_dict = {
                "uuid": str(uuid.uuid4()).upper(),
                "fecha": f1,
                "fecha_pago_nomina": f1,
                "fecha_inicial": f"{year_str}-{mes:02d}-01",
                "fecha_inicial_pago": f"{year_str}-{mes:02d}-01",
                "fecha_final": f1,
                "fecha_final_pago": f1,
                "dias_pagados": 15,
                "num_dias_pagados": 15,
                "total_bruto": sueldo_quincenal + vales_quincenales,
                "subtotal": sueldo_quincenal + vales_quincenales,
                "total_deducciones": isr_q1 + imss_quincenal,
                "descuento": isr_q1 + imss_quincenal,
                "vales": vales_quincenales,
                "neto": neto_q1,
                "isr_retenido": isr_q1,
                "retencion_isr": isr_q1,
                "gravado": sueldo_quincenal,
                "nomina_gravado": sueldo_quincenal,
                "exento": vales_quincenales,
                "nomina_exento": vales_quincenales,
                "percepciones": p1,
                "percepciones_detalle": p1,
                "deducciones": d1,
                "deducciones_detalle": d1,
                "salario_base_cot_apor": 1050.00,
                "salario_diario_integrado": 1050.00,
                "emisor_rfc": patron["rfc"],
                "emisor_nombre": patron["nombre"],
                "receptor_rfc": CLIENT_RFC,
                "receptor_nombre": CLIENT_NAME,
                "categoria": "nomina",
                "tipo": "N"
            }

            db.add(Cfdi(
                id=cfdi_q1_dict['uuid'],
                client_id=client.id,
                filename=f"Nomina_{year_str}_{mes:02d}_Q1_{cfdi_q1_dict['uuid'][:8]}.xml",
                filepath=f"/demo/cfdis/nomina/{year_str}/Nomina_{year_str}_{mes:02d}_Q1.xml",
                categoria="nomina",
                tipo="N",
                fecha=f1,
                year=year_str,
                emisor_rfc=patron["rfc"],
                emisor_nombre=patron["nombre"],
                receptor_rfc=CLIENT_RFC,
                receptor_nombre=CLIENT_NAME,
                subtotal=sueldo_quincenal + vales_quincenales,
                descuento=0.0,
                iva=0.0,
                retencion_isr=isr_q1,
                retencion_iva=0.0,
                total=neto_q1,
                parsed_data=json.dumps(cfdi_q1_dict)
            ))

            year_sueldos_gravado += sueldo_quincenal
            year_sueldos_exento += vales_quincenales
            year_isr_retenido_nomina += isr_q1

            # Quincena 2 (Fin de mes) - Incluye Prima en Julio y Aguinaldo en Diciembre
            f2 = f"{year_str}-{mes:02d}-{dias_mes:02d}"
            bruto_q2 = sueldo_quincenal
            grav_q2 = sueldo_quincenal
            ex_q2 = vales_quincenales

            p2 = [
                {"tipo": "001", "concepto": "SUELDO BASE", "gravado": sueldo_quincenal, "exento": 0.0, "total": sueldo_quincenal},
                {"tipo": "029", "concepto": "VALES DE DESPENSA", "gravado": 0.0, "exento": vales_quincenales, "total": vales_quincenales}
            ]

            det_ex_q2 = {}
            if mes == 7:
                prima_total = 3000.00
                prima_exenta = 1600.00
                prima_gravada = 1400.00
                p2.append({"tipo": "021", "concepto": "PRIMA VACACIONAL", "gravado": prima_gravada, "exento": prima_exenta, "total": prima_total})
                bruto_q2 += prima_total
                grav_q2 += prima_gravada
                ex_q2 += prima_exenta
                det_ex_q2["prima_vacacional"] = prima_exenta

            if mes == 12:
                ag_total = 15000.00
                ag_exento = 3250.00
                ag_gravado = 11750.00
                p2.append({"tipo": "002", "concepto": "GRATIFICACION ANUAL (AGUINALDO)", "gravado": ag_gravado, "exento": ag_exento, "total": ag_total})
                bruto_q2 += ag_total
                grav_q2 += ag_gravado
                ex_q2 += ag_exento
                det_ex_q2["aguinaldo"] = ag_exento

            isr_q2 = calcular_isr_ret_nomina(grav_q2)
            neto_q2 = bruto_q2 + vales_quincenales - isr_q2 - imss_quincenal

            d2 = [
                {"tipo": "002", "concepto": "ISR RETENIDO ART. 96", "importe": isr_q2},
                {"tipo": "001", "concepto": "CUOTA OBRERA IMSS", "importe": imss_quincenal}
            ]

            cfdi_q2_dict = {
                "uuid": str(uuid.uuid4()).upper(),
                "fecha": f2,
                "fecha_pago_nomina": f2,
                "fecha_inicial": f"{year_str}-{mes:02d}-16",
                "fecha_inicial_pago": f"{year_str}-{mes:02d}-16",
                "fecha_final": f2,
                "fecha_final_pago": f2,
                "dias_pagados": dias_mes - 15,
                "num_dias_pagados": dias_mes - 15,
                "total_bruto": bruto_q2 + vales_quincenales,
                "subtotal": bruto_q2 + vales_quincenales,
                "total_deducciones": isr_q2 + imss_quincenal,
                "descuento": isr_q2 + imss_quincenal,
                "vales": vales_quincenales,
                "neto": neto_q2,
                "isr_retenido": isr_q2,
                "retencion_isr": isr_q2,
                "gravado": grav_q2,
                "nomina_gravado": grav_q2,
                "exento": ex_q2,
                "nomina_exento": ex_q2,
                "nomina_detalle_exento": det_ex_q2,
                "percepciones": p2,
                "percepciones_detalle": p2,
                "deducciones": d2,
                "deducciones_detalle": d2,
                "salario_base_cot_apor": 1050.00,
                "salario_diario_integrado": 1050.00,
                "emisor_rfc": patron["rfc"],
                "emisor_nombre": patron["nombre"],
                "receptor_rfc": CLIENT_RFC,
                "receptor_nombre": CLIENT_NAME,
                "categoria": "nomina",
                "tipo": "N"
            }

            db.add(Cfdi(
                id=cfdi_q2_dict['uuid'],
                client_id=client.id,
                filename=f"Nomina_{year_str}_{mes:02d}_Q2_{cfdi_q2_dict['uuid'][:8]}.xml",
                filepath=f"/demo/cfdis/nomina/{year_str}/Nomina_{year_str}_{mes:02d}_Q2.xml",
                categoria="nomina",
                tipo="N",
                fecha=f2,
                year=year_str,
                emisor_rfc=patron["rfc"],
                emisor_nombre=patron["nombre"],
                receptor_rfc=CLIENT_RFC,
                receptor_nombre=CLIENT_NAME,
                subtotal=bruto_q2 + vales_quincenales,
                descuento=0.0,
                iva=0.0,
                retencion_isr=isr_q2,
                retencion_iva=0.0,
                total=neto_q2,
                parsed_data=json.dumps(cfdi_q2_dict)
            ))

            year_sueldos_gravado += grav_q2
            year_sueldos_exento += ex_q2
            year_isr_retenido_nomina += isr_q2

        total_nomina_anual = year_sueldos_gravado + year_sueldos_exento
        print(f"   • Nómina {year_str}: Bruta ${total_nomina_anual:,.2f} | Gravada: ${year_sueldos_gravado:,.2f} | ISR Ret: ${year_isr_retenido_nomina:,.2f}")

        # ─── B. INGRESOS PFAE (30% a 55% de Nómina Anual con importes variados) ───
        # Tipos de entregables con precios de mercado realistas y variados
        SERVICIOS_PRECIOS = [
            {"clave": "81111811", "desc": "Servicios de despliegue de infraestructura cloud, pipelines CI/CD y clúster Kubernetes", "desc_sat": "Servicios de arquitectura cloud y automatización DevOps", "rango": (12500.0, 24000.0)},
            {"clave": "43232408", "desc": "Desarrollo de API backend en FastAPI, microservicios y arquitectura de base de datos", "desc_sat": "Software de desarrollo de plataformas web", "rango": (18000.0, 32000.0)},
            {"clave": "81111508", "desc": "Desarrollo de interfaces frontend React/Next.js, componentes y módulo de analítica", "desc_sat": "Servicios de programación de aplicaciones", "rango": (11000.0, 21500.0)},
            {"clave": "81112106", "desc": "Servicio mensual de administración, monitoreo y soporte 24/7 de clúster productivo", "desc_sat": "Servicios de hospedaje de servidores web y bases de datos", "rango": (7500.0, 14500.0)},
            {"clave": "81111812", "desc": "Auditoría de ciberseguridad, pruebas de penetración y hardening de servidores cloud", "desc_sat": "Consultoría en seguridad de sistemas de información", "rango": (15000.0, 27500.0)}
        ]

        # Seleccionar entre 6 y 8 meses activos (el resto con $0.0)
        num_meses_activos = random.randint(6, 8)
        meses_activos = sorted(random.sample(range(1, 13), num_meses_activos))

        monthly_pfae_ingresos = {m: 0.0 for m in range(1, 13)}
        monthly_pfae_iva_cobrado = {m: 0.0 for m in range(1, 13)}
        monthly_pfae_isr_ret = {m: 0.0 for m in range(1, 13)}
        monthly_pfae_iva_ret = {m: 0.0 for m in range(1, 13)}

        for mes in meses_activos:
            # 1 o 2 facturas en este mes activo
            num_facturas_mes = 2 if random.random() < 0.35 else 1

            for f_idx in range(num_facturas_mes):
                dia_factura = random.randint(3, 14) if f_idx == 0 else random.randint(16, 28)
                f_pfae = f"{year_str}-{mes:02d}-{dia_factura:02d}"
                cli = random.choice(CLIENTES_PFAE)
                srv = random.choice(SERVICIOS_PRECIOS)

                # Monto variado realista (redondeado a múltiplos de 50 o 100)
                sub_f = round(random.uniform(srv["rango"][0], srv["rango"][1]) / 50.0) * 50.0
                iva_f = round(sub_f * 0.16, 2)
                ret_isr_f = round(sub_f * 0.10, 2)
                ret_iva_f = round(sub_f * (0.16 * 2 / 3), 2) # 10.6667%
                total_f = round(sub_f + iva_f - ret_isr_f - ret_iva_f, 2)

                cfdi_pfae_dict = {
                    "uuid": str(uuid.uuid4()).upper(),
                    "fecha": f_pfae,
                    "emisor_rfc": CLIENT_RFC,
                    "emisor_nombre": CLIENT_NAME,
                    "receptor_rfc": cli["rfc"],
                    "receptor_nombre": cli["nombre"],
                    "cliente": cli["nombre"],
                    "subtotal": sub_f,
                    "iva": iva_f,
                    "ret_isr": ret_isr_f,
                    "ret_iva": ret_iva_f,
                    "isr_ret": ret_isr_f,
                    "iva_ret": ret_iva_f,
                    "total": total_f,
                    "metodo_pago": "PUE",
                    "forma_pago": "03", # Transferencia electrónica
                    "uso_cfdi": "G03",
                    "categoria": "ingreso",
                    "tipo": "I",
                    "conceptos": [
                        {
                            "clave": srv["clave"],
                            "desc": srv["desc"],
                            "desc_sat": srv["desc_sat"],
                            "imp": sub_f
                        }
                    ]
                }

                db.add(Cfdi(
                    id=cfdi_pfae_dict['uuid'],
                    client_id=client.id,
                    filename=f"Ingreso_{year_str}_{mes:02d}_{f_idx+1}_{cfdi_pfae_dict['uuid'][:8]}.xml",
                    filepath=f"/demo/cfdis/emitidos/{year_str}/Factura_{year_str}_{mes:02d}_{f_idx+1}.xml",
                    categoria="ingreso",
                    tipo="I",
                    fecha=f_pfae,
                    year=year_str,
                    emisor_rfc=CLIENT_RFC,
                    emisor_nombre=CLIENT_NAME,
                    receptor_rfc=cli["rfc"],
                    receptor_nombre=cli["nombre"],
                    subtotal=sub_f,
                    descuento=0.0,
                    iva=iva_f,
                    retencion_isr=ret_isr_f,
                    retencion_iva=ret_iva_f,
                    total=total_f,
                    parsed_data=json.dumps(cfdi_pfae_dict)
                ))

                monthly_pfae_ingresos[mes] += sub_f
                monthly_pfae_iva_cobrado[mes] += iva_f
                monthly_pfae_isr_ret[mes] += ret_isr_f
                monthly_pfae_iva_ret[mes] += ret_iva_f

        total_pfae_facturado = sum(monthly_pfae_ingresos.values())
        print(f"   • PFAE {year_str}: ${total_pfae_facturado:,.2f} ({len(meses_activos)} meses con ventas, {12 - len(meses_activos)} meses en $0) [{total_pfae_facturado/total_nomina_anual*100:.1f}% de nómina]")

        # ─── C. GASTOS Y DEDUCCIONES AUTORIZADAS PFAE (3 a 5 facturas por mes) ───
        monthly_gastos_deducibles = {m: 0.0 for m in range(1, 13)}
        monthly_iva_acreditable = {m: 0.0 for m in range(1, 13)}

        for mes in range(1, 13):
            # Gastos recurrentes (Internet + Cloud)
            for prov in PROVEEDORES_GASTOS[:2]:
                dia_g = random.randint(3, 18)
                f_g = f"{year_str}-{mes:02d}-{dia_g:02d}"
                sub_g = round(random.uniform(900.00, 2400.00), 2)
                iva_g = round(sub_g * 0.16, 2)
                tot_g = round(sub_g + iva_g, 2)

                cfdi_g_dict = {
                    "uuid": str(uuid.uuid4()).upper(),
                    "fecha": f_g,
                    "emisor_rfc": prov["rfc"],
                    "emisor_nombre": prov["nombre"],
                    "receptor_rfc": CLIENT_RFC,
                    "receptor_nombre": CLIENT_NAME,
                    "emisor": prov["nombre"],
                    "subtotal": sub_g,
                    "iva": iva_g,
                    "total": tot_g,
                    "metodo_pago": "PUE",
                    "forma_pago": "04", # Tarjeta de Crédito
                    "uso_cfdi": "G03",
                    "categoria": "egreso",
                    "tipo": "I",
                    "es_deducible_fiscal": True,
                    "categoria_gasto": {"id": prov["cat"], "nombre": prov["cat"].replace("_", " ").title()},
                    "conceptos": [
                        {
                            "clave": prov["clave"],
                            "desc": prov["desc"],
                            "imp": sub_g
                        }
                    ]
                }

                db.add(Cfdi(
                    id=cfdi_g_dict['uuid'],
                    client_id=client.id,
                    filename=f"Gasto_{year_str}_{mes:02d}_{cfdi_g_dict['uuid'][:8]}.xml",
                    filepath=f"/demo/cfdis/recibidos/{year_str}/Gasto_{year_str}_{mes:02d}.xml",
                    categoria="egreso",
                    tipo="I",
                    fecha=f_g,
                    year=year_str,
                    emisor_rfc=prov["rfc"],
                    emisor_nombre=prov["nombre"],
                    receptor_rfc=CLIENT_RFC,
                    receptor_nombre=CLIENT_NAME,
                    subtotal=sub_g,
                    descuento=0.0,
                    iva=iva_g,
                    retencion_isr=0.0,
                    retencion_iva=0.0,
                    total=tot_g,
                    parsed_data=json.dumps(cfdi_g_dict)
                ))

                monthly_gastos_deducibles[mes] += sub_g
                monthly_iva_acreditable[mes] += iva_g

            # Gasto esporádico (Hardware o Servicios Contables cada 2 meses)
            if mes % 2 == 0:
                prov_esp = random.choice(PROVEEDORES_GASTOS[2:])
                dia_ge = random.randint(15, 27)
                f_ge = f"{year_str}-{mes:02d}-{dia_ge:02d}"
                sub_ge = round(random.uniform(1800.00, 5200.00), 2)
                iva_ge = round(sub_ge * 0.16, 2)
                tot_ge = round(sub_ge + iva_ge, 2)

                cfdi_ge_dict = {
                    "uuid": str(uuid.uuid4()).upper(),
                    "fecha": f_ge,
                    "emisor_rfc": prov_esp["rfc"],
                    "emisor_nombre": prov_esp["nombre"],
                    "receptor_rfc": CLIENT_RFC,
                    "receptor_nombre": CLIENT_NAME,
                    "emisor": prov_esp["nombre"],
                    "subtotal": sub_ge,
                    "iva": iva_ge,
                    "total": tot_ge,
                    "metodo_pago": "PUE",
                    "forma_pago": "03",
                    "uso_cfdi": "G03",
                    "categoria": "egreso",
                    "tipo": "I",
                    "es_deducible_fiscal": True,
                    "categoria_gasto": {"id": prov_esp["cat"], "nombre": prov_esp["cat"].replace("_", " ").title()},
                    "conceptos": [
                        {
                            "clave": prov_esp["clave"],
                            "desc": prov_esp["desc"],
                            "imp": sub_ge
                        }
                    ]
                }

                db.add(Cfdi(
                    id=cfdi_ge_dict['uuid'],
                    client_id=client.id,
                    filename=f"GastoEsp_{year_str}_{mes:02d}_{cfdi_ge_dict['uuid'][:8]}.xml",
                    filepath=f"/demo/cfdis/recibidos/{year_str}/GastoEsp_{year_str}_{mes:02d}.xml",
                    categoria="egreso",
                    tipo="I",
                    fecha=f_ge,
                    year=year_str,
                    emisor_rfc=prov_esp["rfc"],
                    emisor_nombre=prov_esp["nombre"],
                    receptor_rfc=CLIENT_RFC,
                    receptor_nombre=CLIENT_NAME,
                    subtotal=sub_ge,
                    descuento=0.0,
                    iva=iva_ge,
                    retencion_isr=0.0,
                    retencion_iva=0.0,
                    total=tot_ge,
                    parsed_data=json.dumps(cfdi_ge_dict)
                ))

                monthly_gastos_deducibles[mes] += sub_ge
                monthly_iva_acreditable[mes] += iva_ge

        total_gastos_anuales = sum(monthly_gastos_deducibles.values())
        print(f"   • Gastos PFAE {year_str}: ${total_gastos_anuales:,.2f} deducibles")

        # ─── D. DEDUCCIONES PERSONALES ART. 151 (Médicos, PPR, SGMM, Lentes) ───
        # En 2021-2022: Deducciones básicas (sin estrategia fiscal)
        # En 2023-2026: Estrategia integral con PPR (Art. 151 Fracc. V) y SGMM (Fracc. VI) -> Genera Saldo a Favor
        deds_personales_list = [
            ("D01", "DR. ROBERTO MARTINEZ MORALES", "MAMR761018EB0", 2200.00, "Consulta médica y tratamiento odontológico especializado"),
            ("D01", "LABORATORIOS CLINICOS INTEGRALES SA DE CV", "LCI150312AA1", 3100.00, "Estudios clínicos de laboratorio y checkup preventivo"),
            ("D02", "OPTICA Y LENTES DE PRECISION SA DE CV", "OLP180905BB2", 3000.00, "Lentes oftálmicos graduados con filtro antirreflejante y fotocromático"),
        ]

        if year_int >= 2023:
            # Plan Personal de Retiro (PPR) D06 y Seguro de Gastos Médicos Mayores (SGMM) D07
            ppr_monto = 38000.00 if year_int == 2023 else (46000.00 if year_int == 2024 else (49000.00 if year_int == 2025 else 52000.00))
            sgmm_monto = 14500.00 if year_int == 2023 else (16800.00 if year_int == 2024 else (17500.00 if year_int == 2025 else 18500.00))

            deds_personales_list.append(
                ("D06", "SEGUROS Y PENSIONES DEL NORTE SA DE CV", "SPN1805169R6", ppr_monto, "Aportaciones complementarias a Planes Personales de Retiro (Art. 151 Fracc. V LISR)")
            )
            deds_personales_list.append(
                ("D07", "SEGUROS Y PENSIONES DEL NORTE SA DE CV", "SPN1805169R6", sgmm_monto, "Póliza anual de Seguro de Gastos Médicos Mayores cobertura nacional (Art. 151 Fracc. VI LISR)")
            )

        total_ded_personales_val = 0.0
        for uso_d, nom_d, rfc_d, monto_d, desc_d in deds_personales_list:
            f_dp = f"{year_str}-{random.randint(2, 11):02d}-{random.randint(5, 25):02d}"
            cfdi_dp_dict = {
                "uuid": str(uuid.uuid4()).upper(),
                "fecha": f_dp,
                "emisor_rfc": rfc_d,
                "emisor_nombre": nom_d,
                "receptor_rfc": CLIENT_RFC,
                "receptor_nombre": CLIENT_NAME,
                "subtotal": monto_d,
                "iva": 0.0,
                "total": monto_d,
                "metodo_pago": "PUE",
                "forma_pago": "03" if uso_d in ("D06", "D07") else "04", # Transferencia o TDC
                "uso_cfdi": uso_d,
                "categoria": "egreso",
                "tipo": "I",
                "conceptos": [{"clave": "85121600" if uso_d == "D01" else "84131500", "desc": desc_d, "imp": monto_d}]
            }

            db.add(Cfdi(
                id=cfdi_dp_dict['uuid'],
                client_id=client.id,
                filename=f"DedPersonal_{year_str}_{cfdi_dp_dict['uuid'][:8]}.xml",
                filepath=f"/demo/cfdis/deducciones/{year_str}/DedPersonal_{uso_d}.xml",
                categoria="egreso",
                tipo="I",
                fecha=f_dp,
                year=year_str,
                emisor_rfc=rfc_d,
                emisor_nombre=nom_d,
                receptor_rfc=CLIENT_RFC,
                receptor_nombre=CLIENT_NAME,
                uso_cfdi=uso_d,
                subtotal=monto_d,
                descuento=0.0,
                iva=0.0,
                retencion_isr=0.0,
                retencion_iva=0.0,
                total=monto_d,
                parsed_data=json.dumps(cfdi_dp_dict)
            ))
            total_ded_personales_val += monto_d

        # ─── E. TABLAS DE AUDITORÍA SAT OFICIALES (12 Meses de Pagos Provisionales) ───
        acum_ing_pfae = 0.0
        acum_gastos_pfae = 0.0
        acum_ret_isr = 0.0
        acum_pagos_prov_isr = 0.0
        total_pagado_efectivo_anual = 0.0

        for mes in range(1, 13):
            ing_mes = monthly_pfae_ingresos[mes]
            gast_mes = monthly_gastos_deducibles[mes]
            ret_isr_mes = monthly_pfae_isr_ret[mes]

            acum_ing_pfae += ing_mes
            acum_gastos_pfae += gast_mes
            acum_ret_isr += ret_isr_mes

            base_mes = max(0.0, acum_ing_pfae - acum_gastos_pfae)
            
            # Tarifa acumulada mensual provisional
            tarifa_pct = 0.1088 if base_mes > 50000 else (0.064 if base_mes > 10000 else 0.0192)
            isr_causado_acum = round(base_mes * tarifa_pct, 2)
            isr_a_cargo = max(0.0, round(isr_causado_acum - acum_ret_isr - acum_pagos_prov_isr, 2))

            # IVA del mes
            iva_cob = monthly_pfae_iva_cobrado[mes]
            iva_acred = monthly_iva_acreditable[mes]
            iva_ret = monthly_pfae_iva_ret[mes]
            iva_a_cargo = max(0.0, round(iva_cob - iva_acred - iva_ret, 2))

            total_pago_mes = round(isr_a_cargo + iva_a_cargo, 2)
            acum_pagos_prov_isr += isr_a_cargo
            total_pagado_efectivo_anual += total_pago_mes

            num_op = f"{year_str[2:]}{mes:02d}{random.randint(100000, 999999)}"
            f_pres = f"{year_str}-{mes:02d}-17" if mes < 12 else f"{year_int+1}-01-17"

            tiene_acuse = total_pago_mes > 0

            pago_prov_sat = PagoProvisionalSAT(
                id=f"{CLIENT_RFC}_{year_str}_{mes:02d}_{num_op}",
                client_id=client.id,
                rfc=CLIENT_RFC,
                year=year_str,
                mes_numero=mes,
                mes_nombre=MONTH_NAMES_ES[mes - 1],
                tipo_declaracion="Normal",
                num_operacion=num_op,
                fecha_presentacion=f_pres,
                isr_ingresos_periodo=ing_mes,
                isr_ingresos_acumulados=acum_ing_pfae,
                isr_deducciones_autorizadas=acum_gastos_pfae,
                isr_base_gravable=base_mes,
                isr_causado=isr_causado_acum,
                isr_retenido_periodo=ret_isr_mes,
                isr_a_cargo=isr_a_cargo,
                iva_base_gravada_16=ing_mes,
                iva_cobrado_16=iva_cob,
                iva_acreditable_gastos=iva_acred,
                iva_retenido=iva_ret,
                iva_a_cargo=iva_a_cargo,
                total_pagado=total_pago_mes,
                tiene_acuse_pago=tiene_acuse,
                total_pagado_acuse=total_pago_mes if tiene_acuse else 0.0,
                raw_pdf_path=f"/demo/sat/pagos_provisionales/Pago_Provisional_{year_str}_{mes:02d}_{num_op}.pdf",
                parsed_json=json.dumps({
                    "rfc": CLIENT_RFC,
                    "nombre": CLIENT_NAME,
                    "ejercicio": year_str,
                    "mes_numero": mes,
                    "num_operacion": num_op,
                    "total_pago_efectivo": total_pago_mes,
                    "isr_a_cargo": isr_a_cargo,
                    "iva_a_cargo": iva_a_cargo
                })
            )
            db.add(pago_prov_sat)

            if tiene_acuse:
                db.add(AcusePagoSAT(
                    id=f"{CLIENT_RFC}_{year_str}_{mes:02d}_Acuse_{num_op}",
                    client_id=client.id,
                    rfc=CLIENT_RFC,
                    year=year_str,
                    mes_numero=mes,
                    num_operacion=num_op,
                    fecha_presentacion=f_pres,
                    monto_isr_pagado=isr_a_cargo,
                    monto_iva_pagado=iva_a_cargo,
                    total_pagado=total_pago_mes,
                    raw_pdf_path=f"/demo/sat/acuses/Acuse_{year_str}_{mes:02d}_{num_op}.pdf"
                ))

        # ─── F. DECLARACIÓN ANUAL OFICIAL SAT ───
        utilidad_pfae_anual = max(0.0, total_pfae_facturado - total_gastos_anuales)
        ingresos_acumulables_totales = round(year_sueldos_gravado + utilidad_pfae_anual, 2)
        base_gravable_anual = max(0.0, round(ingresos_acumulables_totales - total_ded_personales_val, 2))

        # Cálculo ISR Anual Art. 152
        isr_anual_causado = 0.0
        tarifas_anio = TARIFAS_ANUALES_DATOS.get(year_str, TARIFAS_ANUALES_DATOS["2024"])
        for li, ls, cuota, tasa in tarifas_anio:
            if base_gravable_anual >= li and (base_gravable_anual <= ls or ls == float('inf')):
                isr_anual_causado = round(cuota + (base_gravable_anual - li) * tasa, 2)
                break

        retenciones_totales_acreditables = round(year_isr_retenido_nomina + sum(monthly_pfae_isr_ret.values()), 2)
        pagos_prov_acreditables = round(acum_pagos_prov_isr, 2)

        saldo_neto = round(isr_anual_causado - retenciones_totales_acreditables - pagos_prov_acreditables, 2)
        saldo_favor = abs(saldo_neto) if saldo_neto < 0 else 0.0
        saldo_cargo = saldo_neto if saldo_neto > 0 else 0.0

        num_op_anual = f"{year_str[2:]}{random.randint(1000000000, 9999999999)}"
        f_pres_anual = f"25/04/{year_int + 1} 17:30"

        decl_anual_sat = DeclaracionAnualSAT(
            id=f"{CLIENT_RFC}_{year_str}_{num_op_anual}",
            client_id=client.id,
            rfc=CLIENT_RFC,
            year=year_str,
            tipo_declaracion="Normal",
            num_operacion=num_op_anual,
            fecha_presentacion=f_pres_anual,
            ingresos_acumulables=ingresos_acumulables_totales,
            deducciones_personales=total_ded_personales_val,
            base_gravable=base_gravable_anual,
            isr_tarifa=isr_anual_causado,
            pagos_provisionales_acreditados=pagos_prov_acreditables,
            isr_retenido=retenciones_totales_acreditables,
            saldo_a_favor=saldo_favor,
            saldo_a_cargo=saldo_cargo,
            parcialidades=0,
            clabe="012180000000000000" if saldo_favor > 0 else "",
            banco="INSTITUCION BANCARIA MULTIPLE S.A." if saldo_favor > 0 else "",
            raw_pdf_path=f"/demo/sat/anuales/Declaracion_Anual_{year_str}_{num_op_anual}.pdf",
            parsed_json=json.dumps({
                "archivo": f"Declaracion_Anual_{year_str}_{num_op_anual}.pdf",
                "tipo": "Declaracion_Anual",
                "rfc": CLIENT_RFC,
                "nombre": CLIENT_NAME,
                "ejercicio": year_str,
                "num_operacion": num_op_anual,
                "fecha_presentacion": f_pres_anual,
                "tipo_declaracion": "Normal",
                "ingresos_acumulables_totales": ingresos_acumulables_totales,
                "deducciones_personales": total_ded_personales_val,
                "base_gravable": base_gravable_anual,
                "isr_tarifa": isr_anual_causado,
                "pagos_provisionales_acreditados": pagos_prov_acreditables,
                "isr_retenido_total": retenciones_totales_acreditables,
                "saldo_a_favor": saldo_favor,
                "saldo_a_cargo": saldo_cargo,
                "clabe": "012180000000000000" if saldo_favor > 0 else "",
                "banco": "INSTITUCION BANCARIA MULTIPLE S.A." if saldo_favor > 0 else ""
            })
        )
        db.add(decl_anual_sat)

        print(f"   • Anual SAT {year_str}: Ingresos Acum ${ingresos_acumulables_totales:,.2f} | ISR Causado ${isr_anual_causado:,.2f} | " +
              (f"🟢 Saldo a Favor: ${saldo_favor:,.2f}" if saldo_favor > 0 else f"🔴 Saldo a Cargo: ${saldo_cargo:,.2f}"))

    db.commit()

    # ─── G. RECONSTRUIR SUMMARY CACHE Y EXPORTAR FIXTURE ───
    print("\n📦 Reconstruyendo SummaryCache para todos los ejercicios...")
    db.query(SummaryCache).delete()
    db.commit()

    for y in all_years:
        build_fiscal_summary(client, y, db, use_cache=False)
        print(f"   ✓ Resumen {y} precalculado y guardado en caché.")

    print("\n💾 Exportando dataset maestro comprimido (demo_dataset.json.gz)...")
    export_demo_fixture(db)
    print("✅ Recalibración completa finalizada exitosamente!")


if __name__ == "__main__":
    recalibrate_all()
