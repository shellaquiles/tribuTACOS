"""
Módulo de Tarifas Fiscales y Factores de Ley del SAT (LISR / UMA).
Implementa la Tarifa Anual del Artículo 152 de la LISR y valores de UMA.
Permite inyección de tarifas desde base de datos con fallback histórico seguro.
"""

from typing import Dict, List, Tuple, Optional, Any

# Fallback canónico de UMA anualizada x 5 (Tope legal de Deducciones Personales Art. 151 LISR)
UMA_5_ANUAL_FALLBACK: Dict[str, float] = {
    "2021": 163467.00,
    "2022": 175505.40,
    "2023": 189222.00,
    "2024": 198031.80,
    "2025": 206367.60,
    "2026": 215232.00,
}
UMA_5_ANUAL = UMA_5_ANUAL_FALLBACK

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

# ─── TABLA DE TARIFA ANUAL DE ISR POR DEFECTO (ART. 152 LISR) ───
TARIFA_ANUAL_ISR_FALLBACK: List[Tuple[float, float, float, float]] = [
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
TARIFA_ANUAL_ISR = TARIFA_ANUAL_ISR_FALLBACK


def calcular_isr_tarifa_anual(
    base_gravable: float,
    tarifa: Optional[List[Tuple[float, float, float, float]]] = None
) -> float:
    """
    Calcula el impuesto sobre la renta según la tarifa progresiva del Art. 152 LISR.
    Aplica la fórmula: Cuota Fija + ((Base Gravable - Límite Inferior) * Porcentaje)
    """
    res = calcular_detalle_isr_tarifa_anual(base_gravable, tarifa)
    return res["isr"]


def calcular_detalle_isr_tarifa_anual(
    base_gravable: float,
    tarifa: Optional[List[Tuple[float, float, float, float]]] = None
) -> Dict[str, Any]:
    """
    Calcula el desglose completo del ISR anual (tramo, cuota fija, impuesto marginal y total).
    """
    if base_gravable <= 0:
        return {
            "isr": 0.0,
            "limite_inferior": 0.0,
            "limite_superior": 0.0,
            "cuota_fija": 0.0,
            "porcentaje_excedente": 0.0,
            "excedente": 0.0,
            "impuesto_marginal": 0.0,
            "tasa_efectiva": 0.0,
            "tramo_orden": 0
        }

    t_actual = tarifa if tarifa and len(tarifa) > 0 else TARIFA_ANUAL_ISR_FALLBACK

    for idx, (lim_inf, lim_sup, cuota_fija, pct) in enumerate(t_actual):
        if lim_inf <= base_gravable <= lim_sup:
            excedente = base_gravable - lim_inf
            impuesto_marginal = excedente * pct
            isr_total = round(cuota_fija + impuesto_marginal, 2)
            return {
                "isr": isr_total,
                "limite_inferior": lim_inf,
                "limite_superior": lim_sup if lim_sup != float('inf') and lim_sup < 999999999 else None,
                "cuota_fija": cuota_fija,
                "porcentaje_excedente": pct,
                "excedente": round(excedente, 2),
                "impuesto_marginal": round(impuesto_marginal, 2),
                "tasa_efectiva": round((isr_total / base_gravable) * 100, 2) if base_gravable > 0 else 0.0,
                "tramo_orden": idx
            }

    # Fallback al último tramo
    lim_inf, lim_sup, cuota_fija, pct = t_actual[-1]
    excedente = base_gravable - lim_inf
    impuesto_marginal = excedente * pct
    isr_total = round(cuota_fija + impuesto_marginal, 2)
    return {
        "isr": isr_total,
        "limite_inferior": lim_inf,
        "limite_superior": None,
        "cuota_fija": cuota_fija,
        "porcentaje_excedente": pct,
        "excedente": round(excedente, 2),
        "impuesto_marginal": round(impuesto_marginal, 2),
        "tasa_efectiva": round((isr_total / base_gravable) * 100, 2) if base_gravable > 0 else 0.0,
        "tramo_orden": len(t_actual) - 1
    }
