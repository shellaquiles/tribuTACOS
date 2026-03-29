from parser import process_directory, parse_cfdi
import os

cfdi_dir = "/home/kubrick/www/declara/cfdi_recibidos"
nomina_files = []
for root, _, files in os.walk(cfdi_dir):
    for f in files:
        if f.endswith('.xml'):
            nomina_files.append(os.path.join(root, f))

# Find the first one that is category nomina
for f in nomina_files:
    data = parse_cfdi(f)
    if data and data.get('categoria') == 'nomina':
        print(f"File: {f}")
        print(f"UUID: {data.get('uuid')}")
        print(f"Fecha Pago: {data.get('fecha_pago_nomina')}")
        print(f"Percepciones Detalle ({len(data.get('percepciones_detalle', []))}): {data.get('percepciones_detalle')}")
        print(f"Deducciones Detalle ({len(data.get('deducciones_detalle', []))}): {data.get('deducciones_detalle')}")
        print("==========")
        break
