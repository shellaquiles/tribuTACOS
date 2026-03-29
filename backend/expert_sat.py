
import os
import uvicorn
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from parser import process_directory, USER_RFC

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EMITIDOS_DIR = "/home/kubrick/www/declara/cfdi_emitidos"
RECIBIDOS_DIR = "/home/kubrick/www/declara/cfdi_recibidos"

@app.get("/api/summary")
def get_summary():
    emitidos = process_directory(EMITIDOS_DIR)
    recibidos = process_directory(RECIBIDOS_DIR)

    all_cfdis = emitidos + recibidos

    # --- SECTION: SUELDOS (SALARIES) ---
    nomina_items = [item for item in all_cfdis if item['categoria'] == 'nomina']
    total_nomina_gravado = sum(item.get('nomina_gravado', 0) for item in nomina_items)
    total_nomina_exento = sum(item.get('nomina_exento', 0) for item in nomina_items)
    retencion_isr_nomina = sum(item['retencion_isr'] for item in nomina_items)

    by_employer = {}
    for item in nomina_items:
        emp = item['emisor_nombre'] or item['emisor_rfc']
        if emp not in by_employer:
            by_employer[emp] = {'gravado': 0, 'exento': 0, 'isr': 0}
        by_employer[emp]['gravado'] += item.get('nomina_gravado', 0)
        by_employer[emp]['exento'] += item.get('nomina_exento', 0)
        by_employer[emp]['isr'] += item['retencion_isr']

    # --- SECTION: HONORARIOS (BUSINESS ACTIVITY) ---
    honorarios_items = [item for item in all_cfdis if item['categoria'] == 'ingreso']
    nc_emited = [item for item in all_cfdis if item['categoria'] == 'egreso_ingreso']

    monthly_honorarios = {m: 0.0 for m in range(1, 13)}
    for item in honorarios_items:
        if item['fecha']:
            try:
                m = int(item['fecha'].split('-')[1])
                monthly_honorarios[m] += item['subtotal']
            except: pass
    for item in nc_emited:
        if item['fecha']:
            try:
                m = int(item['fecha'].split('-')[1])
                monthly_honorarios[m] -= item['subtotal']
            except: pass

    total_honorarios_ingresos = sum(monthly_honorarios.values())
    retencion_isr_honorarios = sum(item['retencion_isr'] for item in honorarios_items)

    egreso_items = [item for item in all_cfdis if item['categoria'] == 'egreso' and not (item.get('uso_cfdi') or '').startswith('D')]
    egreso_received_nc = sum(item['subtotal'] for item in all_cfdis if item['categoria'] == 'egreso_egreso')
    total_deducciones_autorizadas = sum(item['subtotal'] for item in egreso_items) - egreso_received_nc

    # --- SECTION: INTERESES (INTERESTS) ---
    interes_items = [item for item in all_cfdis if item.get('es_interes')]
    total_interes_nominal = sum(item.get('intereses_nominal', 0) for item in interes_items)
    total_interes_gravado = sum(item.get('intereses_gravado', 0) for item in interes_items)

    # --- SECTION: DEDUCCIONES PERSONALES ---
    personal_deductions = 0.0
    for item in all_cfdis:
        if item['categoria'] == 'egreso':
            uso = item.get('uso_cfdi', '')
            if uso and uso.startswith('D'):
                personal_deductions += item['subtotal']

    by_bank = {}
    for item in interes_items:
        bank = item['emisor_nombre'] or item['emisor_rfc']
        if bank not in by_bank:
            by_bank[bank] = {'nominal': 0, 'isr': 0}
        by_bank[bank]['nominal'] += item.get('intereses_nominal', 0) + item.get('intereses_gravado', 0)
        by_bank[bank]['isr'] += item['retencion_isr']

    # --- Taxes: IVA (keep existing summary logic) ---
    iva_trasladado = sum(item['iva'] for item in honorarios_items) - sum(item['iva'] for item in nc_emited)
    iva_acreditable = sum(item['iva'] for item in egreso_items)
    iva_por_pagar = iva_trasladado - iva_acreditable

    return {
        "sections": {
            "sueldos": {
                "total_ingresos": round(total_nomina_gravado + total_nomina_exento, 2),
                "gravado": round(total_nomina_gravado, 2),
                "exento": round(total_nomina_exento, 2),
                "isr_retenido": round(retencion_isr_nomina, 2),
                "detalle": [{**v, "nombre": k} for k, v in by_employer.items()]
            },
            "honorarios": {
                "ingresos": round(total_honorarios_ingresos, 2),
                "deducciones_autorizadas": round(total_deducciones_autorizadas, 2),
                "isr_retenido": round(retencion_isr_honorarios, 2),
                "utilidad": round(total_honorarios_ingresos - total_deducciones_autorizadas, 2),
                "mensual": [{"mes": m, "monto": round(a, 2)} for m, a in monthly_honorarios.items()]
            },
            "intereses": {
                "nominal": round(total_interes_nominal + total_interes_gravado, 2),
                "isr_retenido": round(sum(item['retencion_isr'] for item in interes_items), 2),
                "detalle": [{**v, "nombre": k} for k, v in by_bank.items()]
            },
            "deducciones_personales": {
                "total": round(personal_deductions, 2)
            }
        },
        "summary": {
            "total_ingresos_acumulables": round(total_nomina_gravado + (total_honorarios_ingresos - total_deducciones_autorizadas) + total_interes_gravado, 2),
            "total_deducciones_personales": round(personal_deductions, 2),
            "iva_por_pagar": round(iva_por_pagar, 2)
        }
    }

@app.get("/api/cfdis")
def get_cfdis():
    emitidos = process_directory(EMITIDOS_DIR)
    recibidos = process_directory(RECIBIDOS_DIR)
    return {"emitidos": emitidos, "recibidos": recibidos}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
