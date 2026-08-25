"""
Paquete de calculadoras fiscales del motor de tributacos.
"""

from app.cfdis.calculators.tarifas import UMA_5_ANUAL, TARIFA_ANUAL_ISR, MES_NAMES, calcular_isr_tarifa_anual
from app.cfdis.calculators.nomina import calcular_nomina
from app.cfdis.calculators.honorarios import calcular_honorarios, calcular_notas_credito
from app.cfdis.calculators.gastos import calcular_gastos, clasificar_gasto, clasificar_concepto_individual
from app.cfdis.calculators.deducciones import calcular_deducciones_personales, CAT_DEDUCCIONES
from app.cfdis.calculators.intereses import calcular_intereses
from app.cfdis.calculators.simulador_sat import simular_pagos_provisionales, simular_declaracion_anual

__all__ = [
    "UMA_5_ANUAL",
    "TARIFA_ANUAL_ISR",
    "MES_NAMES",
    "calcular_isr_tarifa_anual",
    "calcular_nomina",
    "calcular_honorarios",
    "calcular_notas_credito",
    "calcular_gastos",
    "clasificar_gasto",
    "clasificar_concepto_individual",
    "calcular_deducciones_personales",
    "CAT_DEDUCCIONES",
    "calcular_intereses",
    "simular_pagos_provisionales",
    "simular_declaracion_anual",
]
