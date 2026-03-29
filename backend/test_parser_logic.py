import sys
import os

# Add the current directory to sys.path to handle imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from parser import process_directory

EMITIDOS_DIR = "/home/kubrick/www/declara/cfdi_emitidos"
RECIBIDOS_DIR = "/home/kubrick/www/declara/cfdi_recibidos"

def test_parsing():
    print("Testing Emitidos...")
    emitidos = process_directory(EMITIDOS_DIR)
    print(f"Parsed {len(emitidos)} emitidos.")
    for e in emitidos[:2]:
        print(f"  - {e['filename']}: Category={e['categoria']}, Total={e['total']}")

    print("\nTesting Recibidos...")
    recibidos = process_directory(RECIBIDOS_DIR)
    print(f"Parsed {len(recibidos)} recibidos.")
    for r in recibidos[:2]:
        print(f"  - {r['filename']}: Category={r['categoria']}, Total={r['total']}")

if __name__ == "__main__":
    test_parsing()
