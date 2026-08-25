"""
Interfaz de Línea de Comandos (CLI) unificada para Declara Pro / tributacos.
Permite sincronizar XMLs, sembrar catálogos, sincronizar PDFs del SAT e inicializar la base de datos.
"""

import sys
import argparse
from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models import Client
from app.cfdis.storage import ensure_default_client, scan_local_paths, invalidate_client_cache
from app.catalogos.seed import asegurar_catalogo_sat, sembrar_catalogo_sat
from app.sat_docs.importer import sync_all_sat_documents_to_db


def cmd_init_db(args):
    """Inicializa las tablas y el cliente por defecto en la base de datos."""
    print("🌮 Inicializando base de datos...")
    init_db()
    db: Session = SessionLocal()
    try:
        client = ensure_default_client(db)
        print(f"✅ Base de datos inicializada con éxito. Cliente por defecto: {client.rfc} ({client.name})")
    finally:
        db.close()


def cmd_sync(args):
    """Escanea las carpetas de CFDIs locales e ingesta los XMLs en la base de datos."""
    print("🔄 Sincronizando CFDIs desde almacenamiento local...")
    db: Session = SessionLocal()
    try:
        client_id = args.client_id or "default"
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            client = ensure_default_client(db)

        res = scan_local_paths(client, db)
        invalidate_client_cache(client.id, db)
        print(f"✅ Sincronización completada para {client.rfc}: {res['scanned']} escaneados, {res['ingested']} nuevos ingestados.")
    finally:
        db.close()


def cmd_seed_sat(args):
    """Siembra el catálogo de claves del SAT en la base de datos."""
    print("🌱 Sembrando catálogo oficial del SAT...")
    db: Session = SessionLocal()
    try:
        count = sembrar_catalogo_sat(db, force=args.force)
        print(f"✅ Catálogo del SAT sembrado con éxito ({count} registros procesados).")
    finally:
        db.close()


def cmd_sync_sat_docs(args):
    """Sincroniza y parsea los PDFs oficiales del SAT (Anuales, Provisionales, Acuses)."""
    print("🏛️ Sincronizando documentos oficiales SAT en PDF...")
    db: Session = SessionLocal()
    try:
        client_id = args.client_id or "default"
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            client = ensure_default_client(db)

        stats = sync_all_sat_documents_to_db(db, client, descargados_path=args.path)
        print(f"✅ Sincronización de PDFs completada: {stats['anuales']} anuales, {stats['provisionales']} provisionales, {stats['acuses']} acuses.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        prog="tributacos-cli",
        description="🌮 Declara Pro / tributacos CLI - Herramientas de gestión fiscal"
    )
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")

    # init-db
    subparsers.add_parser("init-db", help="Inicializa el esquema de la base de datos")

    # sync
    sync_p = subparsers.add_parser("sync", help="Sincroniza XMLs locales a la BD")
    sync_p.add_argument("--client-id", default="default", help="ID del cliente a sincronizar")

    # seed-sat
    seed_p = subparsers.add_parser("seed-sat", help="Siembra catálogo de claves SAT")
    seed_p.add_argument("--force", action="store_true", help="Forzar re-sembrado completo")

    # sync-sat-docs
    docs_p = subparsers.add_parser("sync-sat-docs", help="Sincroniza PDFs oficiales del SAT")
    docs_p.add_argument("--client-id", default="default", help="ID del cliente")
    docs_p.add_argument("--path", default=None, help="Ruta de carpeta descargados")

    args = parser.parse_args()

    commands = {
        "init-db": cmd_init_db,
        "sync": cmd_sync,
        "seed-sat": cmd_seed_sat,
        "sync-sat-docs": cmd_sync_sat_docs,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
