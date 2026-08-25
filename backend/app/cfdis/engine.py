"""
Orquestador Fiscal Principal (Fachada del Motor de CFDIs).
Coordina las calculadoras de dominio y estructura el resultado para la API y la UI.
"""

import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models import Cfdi, Client, SummaryCache, DeclaracionAnualSAT
from app.cfdis.calculators import (
    calcular_nomina,
    calcular_honorarios,
    calcular_notas_credito,
    calcular_gastos,
    calcular_deducciones_personales,
    calcular_intereses,
    simular_pagos_provisionales,
    simular_declaracion_anual
)


def build_fiscal_summary(
    client: Client,
    year: str,
    db: Session,
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Construye la radiografía fiscal completa para el cliente y ejercicio fiscal solicitado:
    1. Si use_cache está activo y existe resumen en BD, lo retorna en < 1ms.
    2. Procesa nóminas, honorarios, notas de crédito, egresos bancarizados, deducciones e intereses.
    3. Simula pagos provisionales mensuales de ISR e IVA y declaración anual.
    4. Cruza contra la declaración anual oficial del SAT si existe en BD.
    5. Actualiza la caché en BD.
    """
    if use_cache:
        cached = db.query(SummaryCache).filter(
            SummaryCache.client_id == client.id,
            SummaryCache.year == year
        ).first()
        if cached:
            try:
                return json.loads(cached.summary_json)
            except Exception:
                pass

    cfdis_query = db.query(Cfdi).filter(Cfdi.client_id == client.id).all()
    all_cfdis = [c.to_dict() for c in cfdis_query]

    ejercicio = str(year)
    user_rfc = client.rfc.upper()

    # 1. Sueldos y Salarios (Nómina)
    res_nomina = calcular_nomina(all_cfdis, ejercicio)
    tg = res_nomina['total_gravado']
    te = res_nomina['total_exento']
    isr_n = res_nomina['isr_retenido']
    det_ex = res_nomina['detalle_exento']
    by_emp = res_nomina['by_employer']

    # 2. Honorarios y Actividad Empresarial (PFAE)
    res_honorarios = calcular_honorarios(all_cfdis, ejercicio, user_rfc)
    mensual_pfae = res_honorarios['mensual_pfae']
    lista_honorarios = res_honorarios['lista_honorarios']
    lista_hon_conceptos = res_honorarios['lista_conceptos']
    total_ing = res_honorarios['total_ingresos']
    total_isr_ret = res_honorarios['total_isr_ret']
    total_iva_ret = res_honorarios['total_iva_ret']

    # 3. Notas de Crédito / Descuentos Recibidos
    res_nc = calcular_notas_credito(all_cfdis, ejercicio)
    total_otros_ingresos = res_nc['total']
    lista_otros_ingresos = res_nc['detalle']

    # 4. Gastos, Compras y Deducciones Autorizadas (Actualiza mensual_pfae con egresos)
    res_gastos = calcular_gastos(all_cfdis, ejercicio, user_rfc, mensual_pfae)
    lista_gastos = res_gastos['lista_gastos']
    total_egr = res_gastos['total_egresos_deducibles']

    # 5. Intereses Financieros
    res_intereses = calcular_intereses(all_cfdis, ejercicio)
    nom_i = res_intereses['nominal']
    real_i = res_intereses['real']
    isr_i = res_intereses['isr_retenido']

    # 6. Deducciones Personales (Art. 151 LISR)
    total_ingresos_ejercicio = tg + te + total_ing + total_otros_ingresos + real_i
    res_deducciones = calcular_deducciones_personales(all_cfdis, ejercicio, total_ingresos_ejercicio)
    monto_deducible_efectivo = res_deducciones['total']
    pers_d_total_valido = res_deducciones['total_valido_bruto']
    tope_legal = res_deducciones['tope']['tope_aplicable']

    # 7. Simulador de Pagos Provisionales Mensuales
    simulacion_provisionales = simular_pagos_provisionales(mensual_pfae)
    total_pagos_prov_isr = sum(m['isr_a_cargo_mes'] for m in simulacion_provisionales)

    # 8. Simulador de Declaración Anual
    utilidad_honorarios_anual = max(0.0, total_ing - total_egr)
    total_retenciones_anuales = isr_n + total_isr_ret + isr_i

    simulacion_anual = simular_declaracion_anual(
        ingresos_sueldos_gravados=tg,
        utilidad_honorarios_anual=utilidad_honorarios_anual,
        ingresos_intereses_reales=real_i,
        monto_deducible_efectivo=monto_deducible_efectivo,
        pers_d_total_valido=pers_d_total_valido,
        tope_legal=tope_legal,
        total_pagos_provisionales_calculados=total_pagos_prov_isr,
        total_retenciones_anuales=total_retenciones_anuales
    )

    # 9. Declaración Oficial del SAT en BD (si existe)
    sat_rec = db.query(DeclaracionAnualSAT).filter(
        DeclaracionAnualSAT.client_id == client.id,
        DeclaracionAnualSAT.year == ejercicio
    ).first()

    sat_anual = None
    if sat_rec:
        sat_anual = {
            'tipo_declaracion': sat_rec.tipo_declaracion,
            'num_operacion': sat_rec.num_operacion,
            'fecha_presentacion': sat_rec.fecha_presentacion,
            'ingresos_acumulables_totales': sat_rec.ingresos_acumulables,
            'deducciones_personales': sat_rec.deducciones_personales,
            'base_gravable': sat_rec.base_gravable,
            'isr_tarifa': sat_rec.isr_tarifa,
            'pagos_provisionales_acreditados': sat_rec.pagos_provisionales_acreditados,
            'isr_retenido_total': sat_rec.isr_retenido,
            'saldo_a_favor': sat_rec.saldo_a_favor,
            'saldo_a_cargo': sat_rec.saldo_a_cargo,
            'clabe': sat_rec.clabe,
            'banco': sat_rec.banco
        }

    resumen_regimenes = [
        {
            "regimen": "Sueldos y Salarios",
            "ingresos": round(tg + te, 2),
            "deducciones": 0.0,
            "retenciones": round(isr_n, 2),
            "status": "Activo" if (tg + te) > 0 else "Inactivo",
            "icono": "👔"
        },
        {
            "regimen": "Actividad Empresarial / Honorarios",
            "ingresos": round(total_ing, 2),
            "deducciones": round(total_egr, 2),
            "retenciones": round(total_isr_ret, 2),
            "status": "Activo" if total_ing > 0 else "Inactivo",
            "icono": "💼"
        },
        {
            "regimen": "Intereses Financieros",
            "ingresos": round(real_i, 2),
            "deducciones": 0.0,
            "retenciones": round(isr_i, 2),
            "status": "Activo" if real_i > 0 else "Inactivo",
            "icono": "📈"
        }
    ]

    result = {
        "year": ejercicio,
        "ejercicio": ejercicio,
        "client": {
            "id": client.id,
            "name": client.name,
            "rfc": client.rfc,
        },
        "oficial_sat": sat_anual,
        "simulacion_anual": simulacion_anual,
        "simulacion_provisional_mensual": simulacion_provisionales,
        "resumen_regimenes": resumen_regimenes,
        "sections": {
            "sueldos": {
                "total_ingresos": round(tg + te, 2),
                "gravado": round(tg, 2),
                "exento": round(te, 2),
                "isr_retenido": round(isr_n, 2),
                "detalle_exento": det_ex,
                "detalle": [{**v, "nombre": v.get('nombre_display', k)} for k, v in by_emp.items()],
                "resumen_conceptos": []
            },
            "honorarios": {
                "ingresos": round(total_ing, 2),
                "deducciones_autorizadas": round(total_egr, 2),
                "isr_retenido": round(total_isr_ret, 2),
                "iva_retenido": round(total_iva_ret, 2),
                "utilidad": round(total_ing - total_egr, 2),
                "mensual": [{"mes": m, "datos": v} for m, v in mensual_pfae.items()],
                "detalle": lista_honorarios,
                "resumen_conceptos": lista_hon_conceptos
            },
            "intereses": {
                "nominal": round(nom_i, 2),
                "real": round(real_i, 2),
                "isr_retenido": round(isr_i, 2),
                "detalle": []
            },
            "reporte_gastos": lista_gastos,
            "otros_ingresos": {
                "total": round(total_otros_ingresos, 2),
                "detalle": lista_otros_ingresos,
                "resumen_conceptos": []
            },
            "deducciones_personales": res_deducciones
        },
        "summary": {
            "ingresos_totales_cobrados": round(total_ing, 2),
            "egresos_totales_pagados": round(total_egr, 2),
            "utilidad_fiscal": max(0.0, round(total_ing - total_egr, 2)),
            "isr_retenido": round(total_isr_ret + isr_n + isr_i, 2),
            "iva_favor_cargo": round(sum(v['iva_tras'] - v['iva_acred_fiscal'] - v['iva_ret'] for v in mensual_pfae.values()), 2)
        }
    }

    # Guardar en cache
    try:
        cache_entry = db.query(SummaryCache).filter(
            SummaryCache.client_id == client.id,
            SummaryCache.year == ejercicio
        ).first()
        if not cache_entry:
            cache_entry = SummaryCache(client_id=client.id, year=ejercicio)
            db.add(cache_entry)
        cache_entry.summary_json = json.dumps(result, ensure_ascii=False)
        db.commit()
    except Exception as e:
        print(f"[Summary Engine] Error guardando caché de resumen: {e}")
        db.rollback()

    return result
