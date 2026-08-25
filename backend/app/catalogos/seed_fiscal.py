"""
Seeder de Parámetros Fiscales y Tarifas Oficiales del SAT (Art. 152 LISR y UMAs).
Siembra y asegura que la base de datos contenga las tablas de referencia y excepciones de clientes.
"""

from sqlalchemy.orm import Session
from app.models import TarifaIsrAnual, ParametroSat, CfdiExclusion, ConstanciaFiscalExterna

# ─── TABLAS HISTÓRICAS Y VIGENTES DEL ART. 152 LISR ───
TARIFAS_ANUALES_DATOS = {
    "2021": [
        (0.01, 7735.00, 0.00, 0.0192),
        (7735.01, 65651.07, 148.51, 0.0640),
        (65651.08, 115375.90, 4004.99, 0.1088),
        (115375.91, 134119.41, 8933.72, 0.1600),
        (134119.42, 160577.65, 11828.32, 0.1792),
        (160577.66, 323862.60, 16396.69, 0.2136),
        (323862.61, 510487.62, 49233.00, 0.2352),
        (510487.63, 971114.30, 88141.16, 0.3000),
        (971114.31, 1294819.06, 239715.11, 0.3200),
        (1294819.07, 3884457.19, 344617.43, 0.3400),
        (3884457.20, float('inf'), 1173195.42, 0.3500)
    ],
    "2022": [
        (0.01, 7735.00, 0.00, 0.0192),
        (7735.01, 65651.07, 148.51, 0.0640),
        (65651.08, 115375.90, 4004.99, 0.1088),
        (115375.91, 134119.41, 8933.72, 0.1600),
        (134119.42, 160577.65, 11828.32, 0.1792),
        (160577.66, 323862.60, 16396.69, 0.2136),
        (323862.61, 510487.62, 49233.00, 0.2352),
        (510487.63, 971114.30, 88141.16, 0.3000),
        (971114.31, 1294819.06, 239715.11, 0.3200),
        (1294819.07, 3884457.19, 344617.43, 0.3400),
        (3884457.20, float('inf'), 1173195.42, 0.3500)
    ],
    "2023": [
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
    ],
    "2024": [
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
    ],
    "2025": [
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
    ],
    "2026": [
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
}

PARAMETROS_SAT_DATOS = [
    {"year": "2021", "uma_diaria": 89.62, "uma_mensual": 2724.45, "uma_anual": 32693.40, "uma_5_anual": 163467.00},
    {"year": "2022", "uma_diaria": 96.22, "uma_mensual": 2925.09, "uma_anual": 35101.08, "uma_5_anual": 175505.40},
    {"year": "2023", "uma_diaria": 103.74, "uma_mensual": 3153.70, "uma_anual": 37844.40, "uma_5_anual": 189222.00},
    {"year": "2024", "uma_diaria": 108.57, "uma_mensual": 3300.53, "uma_anual": 39606.36, "uma_5_anual": 198031.80},
    {"year": "2025", "uma_diaria": 113.14, "uma_mensual": 3439.46, "uma_anual": 41273.52, "uma_5_anual": 206367.60},
    {"year": "2026", "uma_diaria": 118.00, "uma_mensual": 3587.20, "uma_anual": 43046.40, "uma_5_anual": 215232.00},
]


def asegurar_parametros_fiscales(db: Session) -> None:
    """Siembra tarifas del Art. 152 y parámetros UMA en la base de datos si no existen."""
    # 1. Sembrar Tarifas Anuales ISR
    for year, rows in TARIFAS_ANUALES_DATOS.items():
        count = db.query(TarifaIsrAnual).filter(TarifaIsrAnual.year == year).count()
        if count == 0:
            for idx, (li, ls, cuota, tasa) in enumerate(rows):
                lim_sup = 999999999.0 if ls == float('inf') else ls
                db.add(TarifaIsrAnual(
                    year=year,
                    limite_inferior=li,
                    limite_superior=lim_sup,
                    cuota_fija=cuota,
                    porcentaje_excedente=tasa,
                    orden=idx
                ))

    # 2. Sembrar Parámetros SAT (UMAs)
    for p in PARAMETROS_SAT_DATOS:
        exist = db.query(ParametroSat).filter(ParametroSat.year == p["year"]).first()
        if not exist:
            db.add(ParametroSat(
                year=p["year"],
                uma_diaria=p["uma_diaria"],
                uma_mensual=p["uma_mensual"],
                uma_anual=p["uma_anual"],
                uma_5_anual=p["uma_5_anual"],
                tope_deducciones_pct=15.0
            ))

    # 3. Sembrar excepciones iniciales conocidas para cliente default
    # Exclusión de Mattilda (nómina cancelada reemplazada por finiquito)
    mattilda_uuid = '9CA1819A-BA40-4179-84A2-AFCBF5E885F3'
    exclusion = db.query(CfdiExclusion).filter(
        CfdiExclusion.client_id == 'default',
        CfdiExclusion.uuid == mattilda_uuid
    ).first()
    if not exclusion:
        db.add(CfdiExclusion(
            client_id='default',
            uuid=mattilda_uuid,
            motivo='CFDI de nómina Mattilda cancelado y sustituido por finiquito',
            tipo='ignorar'
        ))

    # Constancia física externa de PPR Insignia Life (2024)
    insignia_id = 'ILI-CONSTANCIA-ANUAL-2024'
    constancia = db.query(ConstanciaFiscalExterna).filter(
        ConstanciaFiscalExterna.client_id == 'default',
        ConstanciaFiscalExterna.id == insignia_id
    ).first()
    if not constancia:
        db.add(ConstanciaFiscalExterna(
            id=insignia_id,
            client_id='default',
            year='2024',
            uso_cfdi='D06',
            emisor_rfc='ILI0805169R6',
            emisor_nombre='INSIGNIA LIFE (PLAN PERSONAL DE RETIRO)',
            fecha='2024-12-31',
            monto=7578.00,
            descripcion='Aportaciones complementarias a planes personales de retiro (Art. 151 Fracc. V)'
        ))

    db.commit()
