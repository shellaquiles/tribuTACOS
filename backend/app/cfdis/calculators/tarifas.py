"""
Módulo de Tarifas Fiscales y Factores de Ley del SAT (LISR / UMA).
Implementa la Tarifa Anual del Artículo 152 de la LISR y valores históricos de UMA.
"""

from typing import Dict, List, Tuple

# UMA anualizada x 5 (Tope legal de Deducciones Personales Art. 151 LISR)
UMA_5_ANUAL: Dict[str, float] = {
    "2021": 163467.00,
    "2022": 175597.70,
    "2023": 189222.00,
    "2024": 198031.80,
    "2025": 206367.06,
    "2026": 215350.00,
}

# Nombres canónicos de los 12 meses
MES_NAMES: Dict[int, str] = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre'
}

# ─── TABLA DE TARIFA ANUAL DE ISR (ART. 152 LISR) ───
# Formato: (Límite Inferior, Límite Superior, Cuota Fija, % Sobre Excedente)
TARIFA_ANUAL_ISR: List[Tuple[float, float, float, float]] = [
    (0.01, 8952.49, 0.00, 0.0192),
    (8952.50, 75984.55, 171.88, 0.0640),
    (75984.56, 133536.00, 4461.94, 0.1088),
    (133536.01, 155229.80, 10723.55, 0.1600),
    (155229.81, 185852.57, 14194.54, 0.1792),
    (185852.58, 374837.88, 19682.13, 0.2136),
    (374837.89, 590796.00, 60049.40, 0.2352),
    (590796.01, 1127926.84, 110842.74, 0.3000),
    (1127926.85, 1503902.46, 271981.99, 0.3200),
    (1503902.47, 4511707.37, 392294.17, 0.3400),
    (4511707.38, float('inf'), 1414947.85, 0.3500)
]


def calcular_isr_tarifa_anual(base_gravable: float) -> float:
    """
    Calcula el impuesto sobre la renta según la tarifa progresiva del Art. 152 LISR.
    Aplica la fórmula: Cuota Fija + ((Base Gravable - Límite Inferior) * Porcentaje)
    """
    if base_gravable <= 0:
        return 0.0
    for lim_inf, lim_sup, cuota_fija, pct in TARIFA_ANUAL_ISR:
        if lim_inf <= base_gravable <= lim_sup:
            excedente = base_gravable - lim_inf
            impuesto_marginal = excedente * pct
            return round(cuota_fija + impuesto_marginal, 2)
    return 0.0
