"""
Simulador de Pagos Provisionales Mensuales (Art. 106 LISR / Art. 5-6 LIVA)
y Simulador de Declaración Anual de Personas Físicas (Art. 152 LISR).
"""

from typing import Dict, List, Any
from app.cfdis.calculators.tarifas import calcular_isr_tarifa_anual, MES_NAMES


def simular_pagos_provisionales(
    mensual_pfae: Dict[int, Dict[str, float]]
) -> List[Dict[str, Any]]:
    """
    Simula mes con mes los pagos provisionales de ISR e IVA:
    - Acumulación de ingresos y deducciones autorizadas bancarizadas
    - Cálculo de ISR causado y acreditamiento de retenciones y pagos anteriores
    - Cálculo de IVA mensual con acreditamiento y arrastre de saldos a favor (Art. 6 LIVA)
    """
    simulacion_provisionales = []
    acum_ingresos_pfae = 0.0
    acum_gastos_pfae = 0.0
    acum_isr_ret_pfae = 0.0
    acum_pagos_prov_isr = 0.0
    acum_iva_favor_anterior = 0.0

    for m in range(1, 13):
        m_datos = mensual_pfae[m]
        ing_mes = m_datos['ingresos']
        gas_ded_mes = m_datos['egresos_deducibles']
        gas_no_ded_mes = m_datos['egresos_no_deducibles']
        isr_ret_mes = m_datos['isr_ret']

        acum_ingresos_pfae += ing_mes
        acum_gastos_pfae += gas_ded_mes
        acum_isr_ret_pfae += isr_ret_mes

        base_prov = max(0.0, acum_ingresos_pfae - acum_gastos_pfae)

        # Tarifa mensual acumulada anualizada
        isr_causado_acum = 0.0
        if base_prov > 0:
            base_anualizada = base_prov * (12.0 / m)
            isr_anual_est = calcular_isr_tarifa_anual(base_anualizada)
            isr_causado_acum = round(isr_anual_est * (m / 12.0), 2)

        # Acreditamientos provisionales de ISR
        isr_cargo_mes = max(0.0, isr_causado_acum - acum_pagos_prov_isr - acum_isr_ret_pfae)
        acum_pagos_prov_isr += isr_cargo_mes

        # IVA del mes (Definitivo Art. 5 y Arrastre de Saldo a Favor Art. 6 LIVA)
        iva_cobrado = m_datos['iva_tras']
        iva_acred = m_datos['iva_acred_fiscal']
        iva_ret = m_datos['iva_ret']

        iva_bruto_cargo = max(0.0, round(iva_cobrado - iva_acred - iva_ret, 2))
        iva_favor_generado_mes = max(0.0, round((iva_acred + iva_ret) - iva_cobrado, 2)) if (iva_acred + iva_ret) > iva_cobrado else 0.0

        # Acreditamiento de IVA a favor de meses anteriores
        iva_acreditamiento_favor_ant = min(iva_bruto_cargo, acum_iva_favor_anterior)
        iva_cargo_mes = max(0.0, round(iva_bruto_cargo - iva_acreditamiento_favor_ant, 2))

        # Actualizar remanente de IVA a favor disponible para meses futuros
        acum_iva_favor_anterior = round(acum_iva_favor_anterior - iva_acreditamiento_favor_ant + iva_favor_generado_mes, 2)

        total_pagar_mes = round(isr_cargo_mes + iva_cargo_mes, 2)

        simulacion_provisionales.append({
            'mes_numero': m,
            'mes_nombre': MES_NAMES[m],
            'ingresos_periodo': round(ing_mes, 2),
            'ingresos_acumulados': round(acum_ingresos_pfae, 2),
            'deducciones_bancarizadas_periodo': round(gas_ded_mes, 2),
            'deducciones_bancarizadas_acumuladas': round(acum_gastos_pfae, 2),
            'deducciones_no_deducibles_efectivo': round(gas_no_ded_mes, 2),
            'base_gravable_provisional': round(base_prov, 2),
            'isr_causado_acumulado': round(isr_causado_acum, 2),
            'isr_retenido_periodo': round(isr_ret_mes, 2),
            'isr_retenido_acumulado': round(acum_isr_ret_pfae, 2),
            'isr_a_cargo_mes': round(isr_cargo_mes, 2),
            'iva_cobrado_16': round(iva_cobrado, 2),
            'iva_acreditable_gastos': round(iva_acred, 2),
            'iva_retenido': round(iva_ret, 2),
            'iva_a_cargo_mes': round(iva_cargo_mes, 2),
            'iva_a_favor_mes': round(iva_favor_generado_mes, 2),
            'iva_a_favor_acreditado_periodos_ant': round(iva_acreditamiento_favor_ant, 2),
            'iva_a_favor_remanente_acumulado': round(acum_iva_favor_anterior, 2),
            'total_a_pagar_mes': total_pagar_mes
        })

    return simulacion_provisionales


def simular_declaracion_anual(
    ingresos_sueldos_gravados: float,
    utilidad_honorarios_anual: float,
    ingresos_intereses_reales: float,
    monto_deducible_efectivo: float,
    pers_d_total_valido: float,
    tope_legal: float,
    total_pagos_provisionales_calculados: float,
    total_retenciones_anuales: float
) -> Dict[str, Any]:
    """
    Calcula la liquidación anual de ISR conforme al Art. 152 LISR.
    """
    ingresos_acumulables_totales = ingresos_sueldos_gravados + utilidad_honorarios_anual + ingresos_intereses_reales
    base_gravable_anual = max(0.0, ingresos_acumulables_totales - monto_deducible_efectivo)
    isr_anual_causado = calcular_isr_tarifa_anual(base_gravable_anual)

    impuestos_ya_pagados_totales = total_pagos_provisionales_calculados + total_retenciones_anuales
    saldo_a_favor_proyectado = 0.0
    saldo_a_cargo_proyectado = 0.0

    if impuestos_ya_pagados_totales >= isr_anual_causado:
        saldo_a_favor_proyectado = round(impuestos_ya_pagados_totales - isr_anual_causado, 2)
    else:
        saldo_a_cargo_proyectado = round(isr_anual_causado - impuestos_ya_pagados_totales, 2)

    return {
        'ingresos_sueldos_gravados': round(ingresos_sueldos_gravados, 2),
        'ingresos_honorarios_utilidad': round(utilidad_honorarios_anual, 2),
        'ingresos_intereses_reales': round(ingresos_intereses_reales, 2),
        'ingresos_acumulables_totales': round(ingresos_acumulables_totales, 2),
        'deducciones_personales_aplicadas': round(monto_deducible_efectivo, 2),
        'deducciones_personales_brutas': round(pers_d_total_valido, 2),
        'tope_legal_deducciones': round(tope_legal, 2),
        'remanente_deducciones': max(0.0, round(tope_legal - pers_d_total_valido, 2)),
        'base_gravable_anual': round(base_gravable_anual, 2),
        'isr_anual_causado': round(isr_anual_causado, 2),
        'pagos_provisionales_acreditables': round(total_pagos_provisionales_calculados, 2),
        'retenciones_totales_acreditables': round(total_retenciones_anuales, 2),
        'saldo_a_favor_proyectado': saldo_a_favor_proyectado,
        'saldo_a_cargo_proyectado': saldo_a_cargo_proyectado
    }
