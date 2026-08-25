"""
Interfaz de Línea de Comandos (CLI) unificada para tribuTACOS.
Permite inicializar la base de datos, sincronizar carpetas de CFDIs, sembrar catálogos SAT y cargar datos de prueba.
"""

import sys
import argparse
from app.database import SessionLocal, init_db
from app.cfdis.storage import ensure_default_client, scan_local_paths
from app.catalogos.seed import asegurar_catalogo_sat
from app.catalogos.seed_fiscal import asegurar_parametros_fiscales
from app.sat_docs.importer import sync_all_sat_documents_to_db
from app.seeds.seed_demo import cargar_data_prueba_completa, export_demo_fixture
from app.models import Client


def cmd_init_db(args):
    """Inicializa tablas relacionales y siembra catálogos."""
    print("🌮 Inicializando base de datos...")
    init_db()
    db = SessionLocal()
    try:
        client = ensure_default_client(db)
        print(f"✅ Base de datos inicializada con éxito. Cliente por defecto: {client.rfc} ({client.name})")
    finally:
        db.close()


def cmd_sync(args):
    """Escanea e ingesta archivos XML de las carpetas locales del cliente."""
    db = SessionLocal()
    try:
        client_id = args.client_id or "default"
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            client = ensure_default_client(db)

        print(f"🌮 Escaneando CFDIs para {client.name} ({client.rfc})...")
        res = scan_local_paths(client, db)
        print(f"✅ Sincronización completada: {res['scanned']} archivos escaneados, {res['ingested']} nuevos ingestados.")
    finally:
        db.close()


def cmd_seed_sat(args):
    """Siembra el catálogo SAT y las tablas de impuestos Art. 152 / UMA."""
    db = SessionLocal()
    try:
        print("🌮 Sembrando catálogo de claves y parámetros fiscales SAT...")
        asegurar_catalogo_sat(db)
        asegurar_parametros_fiscales(db)
        print("✅ Catálogo SAT y parámetros fiscales sembrados correctamente.")
    finally:
        db.close()


def cmd_sync_sat_docs(args):
    """Importa declaraciones oficiales y acuses de pago en PDF para el cliente."""
    db = SessionLocal()
    try:
        client_id = args.client_id or "default"
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            client = ensure_default_client(db)

        print(f"🌮 Importando PDFs oficiales del SAT para {client.name}...")
        stats = sync_all_sat_documents_to_db(db, client, descargados_path=args.path)
        print(f"✅ Sincronización de PDFs completada: {stats['anuales']} anuales, {stats['provisionales']} provisionales, {stats['acuses']} acuses.")
    finally:
        db.close()


def cmd_seed_demo(args):
    """Carga el dataset completo de prueba (CFDIs, PDFs oficiales y pre-cálculo de resúmenes)."""
    print("🌮 Cargando dataset completo de prueba...")
    init_db()
    db = SessionLocal()
    try:
        res = cargar_data_prueba_completa(db, force_fixture=args.fixture)
        print("✅ Datos de prueba cargados con éxito:")
        print(f"   • Cliente: {res['client_rfc']}")
        print(f"   • Total CFDIs en BD: {res['total_cfdis']}")
        if res.get("scanned_local", {}).get("scanned"):
            print(f"   • Escaneo local: {res['scanned_local']['scanned']} archivos")
        if res.get("sat_documents"):
            print(f"   • Documentos SAT: {res['sat_documents']}")
        if res.get("fixture_loaded"):
            print(f"   • Fixture cargado: {res['fixture_loaded']}")
        print("   • Resúmenes fiscales 2022-2026 precalculados en caché.")
    finally:
        db.close()


def cmd_export_demo(args):
    """Exporta el estado actual de la BD a un fixture .json.gz empaquetado."""
    db = SessionLocal()
    try:
        print("📦 Exportando fixture de prueba comprimido...")
        path = export_demo_fixture(db)
        print(f"✅ Fixture exportado exitosamente: {path} ({path.stat().st_size / 1024:.1f} KB)")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        prog="tributacos-cli",
        description="🌮 tribuTACOS CLI - Herramientas de gestión fiscal"
    )
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")

    # init-db
    subparsers.add_parser("init-db", help="Inicializa el esquema de la base de datos")

    # sync
    sync_p = subparsers.add_parser("sync", help="Sincroniza XMLs locales a la BD")
    sync_p.add_argument("--client-id", default="default", help="ID del cliente a sincronizar")

    # seed-sat
    seed_p = subparsers.add_parser("seed-sat", help="Siembra catálogo de claves SAT")

    # sync-sat-docs
    docs_p = subparsers.add_parser("sync-sat-docs", help="Sincroniza PDFs oficiales del SAT")
    docs_p.add_argument("--client-id", default="default", help="ID del cliente")
    docs_p.add_argument("--path", default=None, help="Ruta de carpeta descargados")

    # seed-demo
    demo_p = subparsers.add_parser("seed-demo", help="Carga datos de prueba completos (CFDIs y PDFs)")
    demo_p.add_argument("--fixture", action="store_true", help="Forzar carga desde fixture empaquetado")

    # export-demo
    subparsers.add_parser("export-demo", help="Exporta la base de datos a un fixture comprimido")

    args = parser.parse_args()

    commands = {
        "init-db": cmd_init_db,
        "sync": cmd_sync,
        "seed-sat": cmd_seed_sat,
        "sync-sat-docs": cmd_sync_sat_docs,
        "seed-demo": cmd_seed_demo,
        "export-demo": cmd_export_demo,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
