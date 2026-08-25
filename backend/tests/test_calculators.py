"""
Tests unitarios para las calculadoras fiscales de Declara Pro / tributacos.
"""

import pytest
from app.cfdis.calculators.tarifas import calcular_isr_tarifa_anual, UMA_5_ANUAL
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
    # 75,984.56 a 133,536.00: 4461.94 + (100000 - 75984.56) * 0.1088 = 4461.94 + 2612.879 = 7074.82
    assert 7000 < isr_100k < 7200


def test_uma_valores_historicos():
    """Valida que los factores UMA estén definidos correctamente."""
    assert UMA_5_ANUAL["2024"] == 198031.80
    assert UMA_5_ANUAL["2025"] > UMA_5_ANUAL["2024"]


def test_calcular_nomina():
    """Prueba el cálculo y desglose de nóminas."""
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
            'uuid': 'UUID-NOMINA-1'
        }
    ]
    res = calcular_nomina(mock_cfdis, "2024")
    assert res['total_gravado'] == 25000.0
    assert res['total_exento'] == 5000.0
    assert res['total_ingresos'] == 30000.0
    assert res['isr_retenido'] == 3500.0
    assert 'PATR900101XYZ' in res['by_employer']
    assert res['detalle_exento']['ptu'] == 5000.0


def test_calcular_honorarios():
    """Prueba el cálculo de facturas emitidas por honorarios."""
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
            'conceptos': [{'desc': 'CONSULTORÍA DE SOFTWARE', 'imp': 50000.0}]
        }
    ]
    res = calcular_honorarios(mock_cfdis, "2024", "USER850101XYZ")
    assert res['total_ingresos'] == 50000.0
    assert res['total_isr_ret'] == 5000.0
    assert res['mensual_pfae'][3]['ingresos'] == 50000.0
    assert len(res['lista_honorarios']) == 1


def test_calcular_deducciones_personales():
    """Prueba la validación y topes de deducciones personales."""
    mock_cfdis = [
        {
            'uso_cfdi': 'D01',
            'fecha': '2024-06-15',
            'emisor_nombre': 'DR JUAN PEREZ',
            'emisor_rfc': 'PEJU800101XYZ',
            'subtotal': 15000.0,
            'forma_pago': '03',  # Transferencia
            'metodo_pago': 'PUE',
            'uuid': 'UUID-DED-1'
        },
        {
            'uso_cfdi': 'D01',
            'fecha': '2024-07-20',
            'emisor_nombre': 'FARMACIA DEL AHORRO',
            'emisor_rfc': 'FAHO800101XYZ',
            'subtotal': 2000.0,
            'forma_pago': '03',
            'metodo_pago': 'PUE',
            'uuid': 'UUID-DED-2'
        }
    ]
    res = calcular_deducciones_personales(mock_cfdis, "2024", total_ingresos_ejercicio=600000.0)
    # DR JUAN PEREZ debe ser válida ($15,000)
    # FARMACIA debe ser observada ($2,000)
    assert res['total_valido_bruto'] == 15000.0
    assert res['total_observado'] == 2000.0
    assert len(res['detalle']) == 1
    assert len(res['observadas']) == 1
