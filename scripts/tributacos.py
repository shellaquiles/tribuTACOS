#!/usr/bin/env python3
"""
Cross-platform task runner for tribuTACOS.
Mirrors the core Makefile workflow on Windows, macOS, and Linux.
"""

from __future__ import annotations

import argparse
import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from runtime import (  # noqa: E402
    STANDALONE_PORT,
    is_frozen,
    project_root,
)

ROOT = project_root()
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV = BACKEND / "venv"
DB_FILE = BACKEND / "tributacos.db"
DEFAULT_PORT = 8010
FRONTEND_PORT = 3000
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

DOWNLOAD_LINKS = {
    "python": "https://www.python.org/downloads/",
    "node": "https://nodejs.org/",
    "docker": "https://www.docker.com/products/docker-desktop/",
}


def _print_install_hint(tool: str, extra: str = "") -> None:
    url = DOWNLOAD_LINKS.get(tool, "")
    if url:
        print(f"     Descarga: {url}")
    if extra:
        print(f"     {extra}")


def _is_windows() -> bool:
    return sys.platform == "win32"


def _python_cmd() -> str:
    for candidate in ("python", "python3", "py"):
        if shutil.which(candidate):
            return candidate
    return "python"


def venv_python() -> Path:
    if _is_windows():
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def venv_executable(name: str) -> Path:
    if _is_windows():
        return VENV / "Scripts" / f"{name}.exe"
    return VENV / "bin" / name


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess:
    display = " ".join(str(part) for part in cmd)
    print(f"$ {display}")
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    result = subprocess.run(cmd, cwd=cwd or ROOT, env=merged_env)
    if check and result.returncode != 0:
        raise SystemExit(result.returncode)
    return result


def backend_env() -> dict[str, str]:
    return {"PYTHONPATH": str(BACKEND)}


def ensure_venv() -> None:
    if venv_python().exists():
        return

    print("Creando entorno virtual Python...")
    run([_python_cmd(), "-m", "venv", str(VENV)])
    run([str(venv_executable("pip")), "install", "--upgrade", "pip"])
    run([str(venv_executable("pip")), "install", "-r", str(BACKEND / "requirements.txt")])


def npm_cmd(*args: str) -> list[str]:
    npm = shutil.which("npm")
    if not npm:
        print("npm no encontrado. Instala Node.js 18+ desde https://nodejs.org")
        raise SystemExit(1)
    return [npm, *args]


def _cli_ns(**kwargs):
    from argparse import Namespace

    values = {
        "client_id": "default",
        "path": None,
        "fixture": True,
        "output": None,
        "input": None,
    }
    values.update(kwargs)
    return Namespace(**values)


def _run_app_cli(*cli_args: str, extra: dict | None = None) -> None:
    if is_frozen():
        from app.cli import (
            cmd_export_demo,
            cmd_import_demo,
            cmd_init_db,
            cmd_seed_demo,
            cmd_seed_sat,
            cmd_sync,
            cmd_sync_sat_docs,
        )
        mapping = {
            "init-db": cmd_init_db,
            "seed-sat": cmd_seed_sat,
            "seed-demo": cmd_seed_demo,
            "sync": cmd_sync,
            "sync-sat-docs": cmd_sync_sat_docs,
            "export-demo": cmd_export_demo,
            "import-demo": cmd_import_demo,
        }
        mapping[cli_args[0]](_cli_ns(**(extra or {})))
        return
    run(
        [str(venv_python()), "-m", "app.cli", *cli_args],
        cwd=BACKEND,
        env=backend_env(),
    )


def kill_ports(ports: list[int]) -> None:
    for port in ports:
        if _is_windows():
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                check=False,
            )
            for line in result.stdout.splitlines():
                if f":{port}" not in line or "LISTENING" not in line.upper():
                    continue
                pid = line.split()[-1]
                if pid.isdigit():
                    subprocess.run(
                        ["taskkill", "/F", "/PID", pid],
                        capture_output=True,
                        check=False,
                    )
        elif sys.platform == "darwin":
            result = subprocess.run(
                ["lsof", "-ti", f"tcp:{port}"],
                capture_output=True,
                text=True,
                check=False,
            )
            for pid in result.stdout.split():
                if pid.isdigit():
                    subprocess.run(["kill", pid], capture_output=True, check=False)
        else:
            subprocess.run(
                ["fuser", "-k", f"{port}/tcp"],
                capture_output=True,
                check=False,
            )


def cmd_doctor(_: argparse.Namespace) -> None:
    print("\n  tribuTACOS — Verificacion de requisitos\n")
    dev_ready = True

    if sys.version_info >= (3, 11):
        print(f"  OK  Python {sys.version_info.major}.{sys.version_info.minor}")
    else:
        dev_ready = False
        print(
            f"  FALTA  Python 3.11+ (detectado {sys.version_info.major}.{sys.version_info.minor})"
        )
        _print_install_hint("python", "En Windows marca 'Add Python to PATH' al instalar.")

    node = shutil.which("node")
    npm = shutil.which("npm")
    if node and npm:
        try:
            node_ver = subprocess.run(
                [node, "-v"], capture_output=True, text=True, check=False
            ).stdout.strip()
            npm_ver = subprocess.run(
                [npm, "-v"], capture_output=True, text=True, check=False
            ).stdout.strip()
            print(f"  OK  Node.js {node_ver} / npm {npm_ver}")
        except OSError:
            print("  OK  Node.js / npm")
    else:
        dev_ready = False
        print("  FALTA  Node.js 18+ con npm")
        _print_install_hint("node")

    docker = shutil.which("docker")
    if docker:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            print("  OK  Docker (modo empaquetado listo)")
        else:
            print("  AVISO  Docker instalado pero no esta en ejecucion")
            print("     Abre Docker Desktop y espera a que diga 'Running'.")
    else:
        print("  OPCIONAL  Docker Desktop (recomendado para usuarios finales)")
        _print_install_hint("docker")

    print("\n  Como iniciar segun tu perfil:\n")
    print("  Usuario final (sin instalar Python/Node):")
    print("    Windows -> doble clic en Iniciar-Tributacos.bat")
    print("    Requiere Docker Desktop instalado y activo.\n")
    print("  Panel de Operaciones (requiere Python):")
    print("    Centro-de-Control-Tributacos.pyw")
    print("    o: python scripts/tributacos.py gui  (equivalente: make gui)\n")
    print("  Desarrollador / instalacion manual:")
    print("    python scripts/tributacos.py setup   (equivalente: make setup)")
    print("    python scripts/tributacos.py dev     (equivalente: make dev)\n")

    if not dev_ready:
        print("  Faltan herramientas para el modo desarrollador.")
        print("  Si eres usuario final, usa Iniciar-Tributacos.bat con Docker.\n")
        raise SystemExit(1)

    print("  Entorno de desarrollo listo.\n")


def cmd_setup(args: argparse.Namespace) -> None:
    cmd_doctor(args)
    ensure_venv()
    print("Instalando dependencias de Frontend...")
    run(npm_cmd("install"), cwd=FRONTEND)
    cmd_db_seed(args)


def cmd_install(_: argparse.Namespace) -> None:
    ensure_venv()
    print("Instalando dependencias de Frontend...")
    run(npm_cmd("install"), cwd=FRONTEND)


def cmd_stop(_: argparse.Namespace) -> None:
    kill_ports([DEFAULT_PORT, FRONTEND_PORT, STANDALONE_PORT])


def cmd_dev(args: argparse.Namespace) -> None:
    ensure_venv()
    cmd_stop(args)

    port = args.port
    host = args.host
    env = backend_env()

    print(f"Iniciando tribuTACOS (Backend :{port} + Frontend :{FRONTEND_PORT})...")
    backend = subprocess.Popen(
        [
            str(venv_executable("uvicorn")),
            "app.main:app",
            "--reload",
            "--host",
            host,
            "--port",
            str(port),
        ],
        cwd=BACKEND,
        env={**os.environ, **env},
    )
    frontend = subprocess.Popen(
        npm_cmd("run", "dev"),
        cwd=FRONTEND,
    )

    def cleanup(*_args: object) -> None:
        print("\nDeteniendo servidores...")
        for proc in (backend, frontend):
            if proc.poll() is None:
                proc.terminate()
        for proc in (backend, frontend):
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

    if hasattr(signal, "SIGINT"):
        signal.signal(signal.SIGINT, cleanup)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, cleanup)

    try:
        backend.wait()
    except KeyboardInterrupt:
        cleanup()
    finally:
        cleanup()


def cmd_dev_backend(args: argparse.Namespace) -> None:
    ensure_venv()
    run(
        [
            str(venv_executable("uvicorn")),
            "app.main:app",
            "--reload",
            "--host",
            args.host,
            "--port",
            str(args.port),
        ],
        cwd=BACKEND,
        env=backend_env(),
        check=False,
    )


def cmd_dev_frontend(_: argparse.Namespace) -> None:
    run(npm_cmd("run", "dev"), cwd=FRONTEND, check=False)


def cmd_db_reset(_: argparse.Namespace) -> None:
    if not is_frozen():
        ensure_venv()
    if DB_FILE.exists():
        DB_FILE.unlink()
    try:
        from runtime import user_data_dir

        user_db = user_data_dir() / "tributacos.db"
        if user_db.exists() and user_db != DB_FILE:
            user_db.unlink()
    except Exception:
        pass
    _run_app_cli("init-db")
    _run_app_cli("seed-sat")
    print("Base de datos limpia con catalogos SAT lista.")


def cmd_db_seed(_: argparse.Namespace) -> None:
    cmd_db_reset(_)
    extra = {"fixture": True}
    if is_frozen():
        _run_app_cli("seed-demo", extra=extra)
    else:
        run(
            [str(venv_python()), "-m", "app.cli", "seed-demo", "--fixture"],
            cwd=BACKEND,
            env=backend_env(),
        )
    print("Base de datos poblada con dataset demo completo (139 CFDIs).")


def cmd_db_import_xml(_: argparse.Namespace) -> None:
    if not is_frozen():
        ensure_venv()
    print("Sincronizando comprobantes XML locales...")
    _run_app_cli("sync")


def cmd_db_import_sat(_: argparse.Namespace) -> None:
    if not is_frozen():
        ensure_venv()
    print("Sincronizando declaraciones oficiales SAT en PDF...")
    _run_app_cli("sync-sat-docs")


def cmd_db_export(_: argparse.Namespace) -> None:
    if not is_frozen():
        ensure_venv()
    from datetime import datetime

    from runtime import backup_dir

    dest = backup_dir() / f"tributacos-respaldo-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json.gz"
    dest.parent.mkdir(parents=True, exist_ok=True)

    if is_frozen():
        _run_app_cli("export-demo", extra={"output": dest})
    else:
        run(
            [str(venv_python()), "-m", "app.cli", "export-demo", "--output", str(dest)],
            cwd=BACKEND,
            env=backend_env(),
        )
    size_kb = dest.stat().st_size / 1024
    print(f"Respaldo guardado en:\n  {dest.resolve()}\n  ({size_kb:.1f} KB)")


def _assert_backup_fixture(source: Path) -> None:
    """Valida el JSON antes de borrar la base actual."""
    import gzip
    import json

    try:
        if str(source).endswith(".gz"):
            with gzip.open(source, "rt", encoding="utf-8") as handle:
                data = json.load(handle)
        else:
            with source.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
    except Exception as exc:
        print(f"El archivo no es un respaldo valido: {exc}")
        raise SystemExit(1) from exc
    if not isinstance(data, dict) or "cfdis" not in data:
        print("El archivo no tiene el formato de respaldo de tribuTACOS.")
        raise SystemExit(1)


def cmd_db_import_backup(args: argparse.Namespace) -> None:
    raw = getattr(args, "backup_path", None) or os.getenv("TRIBUTACOS_BACKUP_IMPORT") or ""
    source = Path(str(raw)).expanduser()
    if not source.is_file():
        print(
            "Selecciona un archivo de respaldo (.json.gz).\n"
            "Uso: python scripts/tributacos.py db-import-backup "
            "--input respaldos/tributacos-respaldo-YYYYMMDD-HHMMSS.json.gz"
        )
        raise SystemExit(1)
    _assert_backup_fixture(source)
    if not is_frozen():
        ensure_venv()
    print(f"Restaurando respaldo:\n  {source.resolve()}")
    cmd_db_reset(args)
    extra = {"input": source}
    if is_frozen():
        _run_app_cli("import-demo", extra=extra)
    else:
        run(
            [
                str(venv_python()),
                "-m",
                "app.cli",
                "import-demo",
                "--input",
                str(source),
            ],
            cwd=BACKEND,
            env=backend_env(),
        )
    print("Base de datos restaurada desde el respaldo.")


def _open_ingest(kind: str) -> None:
    from runtime import open_ingest_folder

    path = open_ingest_folder(kind)
    print(f"Carpeta abierta:\n  {path.resolve()}")


def cmd_open_xml_recibidos(_: argparse.Namespace) -> None:
    _open_ingest("recibidos")


def cmd_open_xml_emitidos(_: argparse.Namespace) -> None:
    _open_ingest("emitidos")


def cmd_open_pdf_sat(_: argparse.Namespace) -> None:
    _open_ingest("descargados")


def cmd_open_backups(_: argparse.Namespace) -> None:
    from runtime import backup_dir, open_path

    folder = backup_dir()
    folder.mkdir(parents=True, exist_ok=True)
    open_path(folder)
    print(f"Carpeta abierta:\n  {folder.resolve()}")


def cmd_clear_cache(_: argparse.Namespace) -> None:
    import urllib.error
    import urllib.request

    for port in (STANDALONE_PORT, DEFAULT_PORT, FRONTEND_PORT):
        try:
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}/api/cache", method="DELETE"
            )
            urllib.request.urlopen(req, timeout=3)
            print(f"Cache de calculos limpiada via API (:{port}).")
            return
        except (urllib.error.URLError, TimeoutError, OSError):
            continue

    if not is_frozen():
        ensure_venv()
    from app.cfdis.storage import ensure_default_client, invalidate_client_cache
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        client = ensure_default_client(db)
        invalidate_client_cache(client.id, db)
        print("Cache de calculos limpiada en la base de datos.")
    finally:
        db.close()


def cmd_standalone(args: argparse.Namespace) -> None:
    os.environ.setdefault("SERVE_STATIC", "1")
    os.environ.setdefault("HOST", "127.0.0.1")
    os.environ["PORT"] = str(getattr(args, "standalone_port", STANDALONE_PORT) or STANDALONE_PORT)
    if is_frozen():
        os.environ.setdefault("ENVIRONMENT", "production")

    if not is_frozen():
        ensure_venv()
        out_dir = FRONTEND / "out"
        static_dir = BACKEND / "static"
        if not out_dir.exists() and not (static_dir / "index.html").exists():
            print("Compilando frontend en modo standalone...")
            env = {**os.environ, "BUILD_MODE": "standalone"}
            run(npm_cmd("run", "build"), cwd=FRONTEND, env=env)
        if out_dir.exists() and not (static_dir / "index.html").exists():
            if static_dir.exists():
                shutil.rmtree(static_dir)
            shutil.copytree(out_dir, static_dir)

    cmd_stop(args)
    port = os.environ["PORT"]
    print(f"Iniciando tribuTACOS en http://127.0.0.1:{port} ...")
    launcher = ROOT / "packaging" / "launcher.py"
    if is_frozen() or not launcher.exists():
        sys.path.insert(0, str(ROOT / "packaging"))
        from launcher import main as launch_main

        launch_main()
        return
    run([str(venv_python()), str(launcher)], check=False)


def cmd_test(_: argparse.Namespace) -> None:
    ensure_venv()
    run([str(venv_executable("pytest")), "-v"], cwd=BACKEND, env=backend_env())


def cmd_lint(_: argparse.Namespace) -> None:
    run(npm_cmd("run", "lint"), cwd=FRONTEND)


def cmd_build(_: argparse.Namespace) -> None:
    run(npm_cmd("run", "build"), cwd=FRONTEND)


def cmd_clean(_: argparse.Namespace) -> None:
    for path in ROOT.rglob("__pycache__"):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
    for path in ROOT.rglob("*.pyc"):
        path.unlink(missing_ok=True)
    for path in ROOT.rglob(".pytest_cache"):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)

    for rel in (
        FRONTEND / "dist",
        FRONTEND / ".next",
        ROOT / ".tmp",
        ROOT / "utils" / "pandocquiles" / "documentacion",
        ROOT / "docs" / "tribuTACOS_documentacion_tecnica.pdf",
        ROOT / "docs" / "tribuTACOS_instalacion_usuario.pdf",
        ROOT / "manual_usuario" / "tribuTACOS_manual_usuario.pdf",
    ):
        if rel.is_dir():
            shutil.rmtree(rel, ignore_errors=True)
        elif rel.exists():
            rel.unlink(missing_ok=True)

    print("Limpieza completada.")


def cmd_clean_deep(_: argparse.Namespace) -> None:
    cmd_clean(_)
    shutil.rmtree(VENV, ignore_errors=True)
    shutil.rmtree(FRONTEND / "node_modules", ignore_errors=True)
    print("Limpieza profunda completada.")


def run_make(target: str) -> None:
    make = shutil.which("make") or shutil.which("gmake")
    if not make:
        print(
            f"El comando '{target}' requiere GNU Make. "
            "En Windows instala Make (Chocolatey/Git Bash) o usa la GUI en modo Docker."
        )
        raise SystemExit(1)
    run([make, target])


def cmd_screenshots(_: argparse.Namespace) -> None:
    node = shutil.which("node")
    if not node:
        print("Node.js requerido para capturas de pantalla.")
        raise SystemExit(1)
    print("Generando capturas automatizadas con Playwright...")
    run([node, str(FRONTEND / "scripts" / "capture_screenshots.js")])


def cmd_docs_sync(_: argparse.Namespace) -> None:
    run_make("docs-sync")


def cmd_pdf_all(_: argparse.Namespace) -> None:
    run_make("pdf-all")


def cmd_pdf_manual(_: argparse.Namespace) -> None:
    run_make("pdf-manual")


def cmd_pdf_tecnica(_: argparse.Namespace) -> None:
    run_make("pdf-tecnica")


def cmd_pdf_instalacion(_: argparse.Namespace) -> None:
    run_make("pdf-instalacion")


def cmd_docs_all(_: argparse.Namespace) -> None:
    run_make("docs-all")


def _docker_bin() -> str:
    docker = shutil.which("docker")
    if not docker:
        print("Docker no encontrado. Instala Docker Desktop.")
        raise SystemExit(1)
    return docker


def docker_compose_cmd() -> list[str]:
    """Preferir el compose local (con Dockerfiles) en un clone; GHCR solo en el ZIP."""
    docker = _docker_bin()
    if (ROOT / "docker" / "Dockerfile.backend").is_file():
        return [docker, "compose"]
    published = ROOT / "docker-compose.published.yml"
    if published.is_file():
        return [docker, "compose", "-f", str(published)]
    return [docker, "compose"]


def cmd_docker_up(_: argparse.Namespace) -> None:
    cmd = docker_compose_cmd()
    print("Iniciando tribuTACOS con Docker...")
    if (ROOT / "docker" / "Dockerfile.backend").is_file():
        run([*cmd, "up", "--build", "-d"])
    else:
        run([*cmd, "up", "-d"])


def cmd_docker_down(_: argparse.Namespace) -> None:
    print("Deteniendo contenedores Docker...")
    run([*docker_compose_cmd(), "down"])


def cmd_gui(_: argparse.Namespace) -> None:
    gui_script = ROOT / "scripts" / "tributacos_gui.py"
    py = venv_python() if venv_python().exists() else Path(sys.executable)
    run([str(py), str(gui_script)], check=False)


def cmd_version_sync(_: argparse.Namespace) -> None:
    run([sys.executable, str(ROOT / "scripts" / "sync_version.py")])


def cmd_help(_: argparse.Namespace) -> None:
    print(
        """
  tribuTACOS — Flujo de Trabajo (multiplataforma)

  Uso: python scripts/tributacos.py <comando>
       make <comando>          (mismo codigo; GNU Make es una fachada)

  Comandos principales:
    doctor           Verifica requisitos e indica que instalar
    setup            Instala dependencias y prepara la BD con datos demo
    dev              Inicia Backend (:8010) y Frontend (:3000)
    stop             Detiene servidores en puertos 8010, 3000 y 8080
    test             Ejecuta pruebas unitarias del motor fiscal
    lint             Verifica estandares de codigo en Frontend
    build            Compila el bundle de produccion en Next.js
    version-sync     Propaga VERSION a package.json, badges e instalador

  Datos:
    db-seed          Restaura la BD con el dataset demo completo
    db-reset         Limpia la base de datos (solo catalogos SAT)
    db-import-xml    Procesa XMLs locales
    db-import-sat    Procesa declaraciones SAT en PDF
    db-export        Exporta un respaldo fechado en respaldos/
    db-import-backup Restaura un respaldo .json.gz (reemplaza la BD)
    clear-cache      Limpia cache de calculos fiscales
    open-xml-recibidos  Abre la carpeta de XML recibidos
    open-xml-emitidos   Abre la carpeta de XML emitidos
    open-pdf-sat        Abre la carpeta de PDFs del SAT
    open-backups        Abre la carpeta de respaldos

  Documentacion:
    screenshots      Capturas de pantalla con Playwright
    docs-sync        Pipeline pre-release: capturas + manual + PDFs
    pdf-all          Compila los PDFs oficiales (tecnico, manual e instalacion)
    pdf-manual       Compila Manual de Usuario en PDF
    pdf-tecnica      Compila Documentacion Tecnica en PDF
    pdf-instalacion  Compila Guia de instalacion en PDF
    docs-all         Compila documentacion en PDF, Word y HTML

  Docker (usuario final):
    docker-up        Inicia tribuTACOS con Docker Compose
    docker-down      Detiene contenedores Docker

  Empaquetado:
    standalone       Un solo servidor en :8080 (frontend estatico + API)

  Interfaz grafica:
    gui              Abre el Panel de Operaciones

  Mantenimiento:
    clean            Elimina temporales, caches y PDFs generados
    clean-deep       Elimina venv y node_modules
"""
    )


COMMAND_HANDLERS: dict[str, object] = {
    "help": cmd_help,
    "doctor": cmd_doctor,
    "setup": cmd_setup,
    "install": cmd_install,
    "stop": cmd_stop,
    "dev": cmd_dev,
    "dev-backend": cmd_dev_backend,
    "dev-frontend": cmd_dev_frontend,
    "db-seed": cmd_db_seed,
    "db-reset": cmd_db_reset,
    "db-import-xml": cmd_db_import_xml,
    "db-import-sat": cmd_db_import_sat,
    "db-export": cmd_db_export,
    "db-import-backup": cmd_db_import_backup,
    "clear-cache": cmd_clear_cache,
    "open-xml-recibidos": cmd_open_xml_recibidos,
    "open-xml-emitidos": cmd_open_xml_emitidos,
    "open-pdf-sat": cmd_open_pdf_sat,
    "open-backups": cmd_open_backups,
    "test": cmd_test,
    "lint": cmd_lint,
    "build": cmd_build,
    "screenshots": cmd_screenshots,
    "docs-sync": cmd_docs_sync,
    "pdf-all": cmd_pdf_all,
    "pdf-manual": cmd_pdf_manual,
    "pdf-tecnica": cmd_pdf_tecnica,
    "pdf-instalacion": cmd_pdf_instalacion,
    "docs-all": cmd_docs_all,
    "docker-up": cmd_docker_up,
    "docker-down": cmd_docker_down,
    "standalone": cmd_standalone,
    "gui": cmd_gui,
    "version-sync": cmd_version_sync,
    "clean": cmd_clean,
    "clean-deep": cmd_clean_deep,
}


def run_command(name: str, **kwargs) -> int:
    """API programatica usada por la GUI y el CLI."""
    if name not in COMMAND_HANDLERS:
        print(f"Comando desconocido: {name}")
        return 1
    parser = build_parser()
    argv = [name]
    if "port" in kwargs:
        argv = ["--port", str(kwargs["port"]), name]
    backup_path = kwargs.get("backup_path")
    if name == "db-import-backup" and backup_path:
        argv.extend(["--input", str(backup_path)])
    args = parser.parse_args(argv)
    try:
        COMMAND_HANDLERS[name](args)
        return 0
    except SystemExit as exc:
        code = exc.code
        if code is None or code is True:
            return 0
        if code is False:
            return 1
        return int(code) if isinstance(code, int) else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="tribuTACOS task runner")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--host", default="0.0.0.0")

    sub = parser.add_subparsers(dest="command")

    for name in COMMAND_HANDLERS:
        p = sub.add_parser(name)
        if name == "db-import-backup":
            p.add_argument(
                "--input",
                dest="backup_path",
                default=None,
                help="Archivo .json.gz generado por Exportar respaldo",
            )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        cmd_help(args)
        return

    handler = COMMAND_HANDLERS[args.command]
    try:
        handler(args)
    except SystemExit as exc:
        if isinstance(exc.code, int) and exc.code != 0:
            raise


if __name__ == "__main__":
    main()
