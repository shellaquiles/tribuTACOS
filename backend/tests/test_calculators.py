"""
Tests unitarios para las calculadoras fiscales de Declara Pro / tributacos.
"""

import pytest
from app.cfdis.calculators.tarifas import (
    calcular_isr_tarifa_anual,
    calcular_detalle_isr_tarifa_anual,
    UMA_5_ANUAL
)
from app.cfdis.calculators.nomina import calcular_nomina
from app.cfdis.calculators.honorarios import calcular_honorarios, calcular_notas_credito
from app.cfdis.calculators.deducciones import calcular_deducciones_personales
from app.cfdis.calculators.intereses import calcular_intereses
from app.cfdis.calculators.simulador_sat import simular_pagos_provisionales, simular_declaracion_anual


def test_tarifa_anual_isr_limites():
    """Valida los tramos de la tarifa progresiva de ISR Art. 152."""
    assert calcular_isr_tarifa_anual(0) == 0.0
    assert calcular_isr_tarifa_anual(-100) == 0.0
    # Tramo 1: 5000 -> 5000 * 0.0192 = 96.00
    assert calcular_isr_tarifa_anual(5000) == 96.00
    # Tramo intermedio
    isr_100k = calcular_isr_tarifa_anual(100000.0)
    assert 7000 < isr_100k < 7200

    # Desglose detallado
    det = calcular_detalle_isr_tarifa_anual(100000.0)
    assert det["cuota_fija"] == 4461.94
    assert det["porcentaje_excedente"] == 0.1088


def test_uma_valores_historicos():
    """Valida que los factores UMA estén definidos correctamente."""
    assert UMA_5_ANUAL["2024"] == 198031.80
    assert UMA_5_ANUAL["2025"] > UMA_5_ANUAL["2024"]


def test_calcular_nomina_con_exclusiones():
    """Prueba el cálculo de nómina y el filtrado dinámico de exclusiones de UUID."""
    mock_cfdis = [
        {
            'categoria': 'nomina',
            'fecha': '2024-05-15',
            'emisor_rfc': 'PATR900101XYZ',
            'emisor_nombre': 'EMPRESA DEMO SA DE CV',
            'nomina_gravado': 25000.0,
            'nomina_exento': 5000.0,
            'retencion_isr': 3500.0,
            'nomina_detalle_exento': {'aguinaldo': 0, 'ptu': 5000.0, 'prima_vacacional': 0, 'prima_dominical': 0, 'otros': 0},
            'subtotal': 30000.0,
            'descuento': 3500.0,
            'total': 26500.0,
            'uuid': 'UUID-NOMINA-VALIDO'
        },
        {
            'categoria': 'nomina',
            'fecha': '2024-05-31',
            'emisor_rfc': 'PATR900101XYZ',
            'emisor_nombre': 'EMPRESA DEMO SA DE CV',
            'nomina_gravado': 10000.0,
            'nomina_exento': 0.0,
            'retencion_isr': 1500.0,
            'subtotal': 10000.0,
            'total': 8500.0,
            'uuid': 'UUID-NOMINA-CANCELADO'
        }
    ]

    # Sin exclusión
    res_full = calcular_nomina(mock_cfdis, "2024")
    assert res_full['total_gravado'] == 35000.0

    # Con exclusión dinámica
    res_filtered = calcular_nomina(mock_cfdis, "2024", ignored_uuids={'UUID-NOMINA-CANCELADO'})
    assert res_filtered['total_gravado'] == 25000.0
    assert len(res_filtered['nomina_mensual_resumen']) == 12


def test_calcular_honorarios_analytics():
    """Prueba el cálculo de honorarios y las series analíticas precalculadas."""
    mock_cfdis = [
        {
            'categoria': 'ingreso',
            'fecha': '2024-03-10',
            'emisor_rfc': 'USER850101XYZ',
            'receptor_rfc': 'CLIE900101ABC',
            'receptor_nombre': 'CLIENTE PRINCIPAL',
            'subtotal': 50000.0,
            'iva': 8000.0,
            'retencion_isr': 5000.0,
            'retencion_iva': 5333.33,
            'total': 47666.67,
            'uuid': 'UUID-HON-1',
            'conceptos': [{'clave': '80101500', 'desc': 'CONSULTORÍA DE SOFTWARE', 'imp': 50000.0}]
        }
    ]
    res = calcular_honorarios(mock_cfdis, "2024", "USER850101XYZ")
    assert res['total_ingresos'] == 50000.0
    assert res['total_isr_ret'] == 5000.0
    assert len(res['analitica_mensual']) == 12
    assert res['analitica_mensual'][2]['Subtotal'] == 50000.0
    assert len(res['top_clientes']) == 1
    assert res['top_clientes'][0]['porcentaje'] == 100.0
    assert len(res['mix_conceptos']) == 1


def test_calcular_deducciones_personales_con_constancias():
    """Prueba la validación y suma de constancias externas inyectadas de BD."""
    mock_cfdis = [
        {
            'uso_cfdi': 'D01',
            'fecha': '2024-06-15',
            'emisor_nombre': 'DR JUAN PEREZ',
            'emisor_rfc': 'PEJU800101XYZ',
            'subtotal': 15000.0,
            'forma_pago': '03',
            'metodo_pago': 'PUE',
            'uuid': 'UUID-DED-1'
        }
    ]
    constancias = [
        {
            'id': 'CONST-PPR-2024',
            'emisor_rfc': 'PPR900101XYZ',
            'emisor_nombre': 'PLAN PERSONAL DE RETIRO',
            'fecha': '2024-12-31',
            'uso_cfdi': 'D06',
            'monto': 10000.0,
            'descripcion': 'Aportaciones voluntarias PPR'
        }
    ]
    res = calcular_deducciones_personales(
        mock_cfdis,
        "2024",
        total_ingresos_ejercicio=600000.0,
        constancias_externas=constancias,
        uma_5_anual=198031.80
    )
    assert res['total_valido_bruto'] == 25000.0
    assert res['total'] == 25000.0
    assert len(res['detalle']) == 2


def test_simular_declaracion_anual_waterfall():
    """Prueba la generación de la cascada (waterfall) y métricas de eficiencia."""
    sim = simular_declaracion_anual(
        ingresos_sueldos_gravados=400000.0,
        utilidad_honorarios_anual=200000.0,
        ingresos_intereses_reales=10000.0,
        monto_deducible_efectivo=50000.0,
        pers_d_total_valido=50000.0,
        tope_legal=198031.80,
        total_pagos_provisionales_calculados=20000.0,
        total_retenciones_anuales=90000.0
    )
    assert sim['ingresos_acumulables_totales'] == 610000.0
    assert sim['base_gravable_anual'] == 560000.0
    assert len(sim['waterfall_pasos']) == 5
    assert sim['tasa_efectiva'] > 0
    assert sim['tasa_marginal'] > 0
