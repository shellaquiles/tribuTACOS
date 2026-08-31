#!/usr/bin/env python3
"""Deteccion de entorno de ejecucion (dev, Docker, instalado)."""

from __future__ import annotations

import json
import os
import shutil
import socket
import sqlite3
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Literal

DistributionMode = Literal["installed", "docker", "dev"]

STANDALONE_PORT = 8080
DEV_FRONTEND_PORT = 3000
DEV_BACKEND_PORT = 8010


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"))


def bundled_root() -> Path:
    if is_frozen():
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent.parent


def project_root() -> Path:
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def read_version() -> str:
    for path in (bundled_root() / "VERSION", project_root() / "VERSION"):
        try:
            if path.is_file():
                return path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
    return "0.0.0"


def user_data_dir() -> Path:
    override = os.getenv("DATA_DIR")
    if override:
        return Path(override).expanduser().resolve()

    if is_frozen() or os.getenv("ENVIRONMENT", "development") == "production":
        if sys.platform == "win32":
            base = Path(os.getenv("APPDATA", Path.home() / "AppData" / "Roaming"))
            return (base / "tributacos").resolve()
        if sys.platform == "darwin":
            return (Path.home() / "Library" / "Application Support" / "tributacos").resolve()
        return (Path.home() / ".local" / "share" / "tributacos").resolve()

    return project_root()


def backup_dir() -> Path:
    path = user_data_dir() / "respaldos"
    path.mkdir(parents=True, exist_ok=True)
    return path


def distribution_mode() -> DistributionMode:
    explicit = os.getenv("TRIBUTACOS_MODE", "").strip().lower()
    if explicit in ("installed", "docker", "dev"):
        return explicit  # type: ignore[return-value]
    if is_frozen():
        return "installed"

    compose = project_root() / "docker-compose.yml"
    if compose.exists():
        try:
            text = compose.read_text(encoding="utf-8", errors="replace")
            if "ghcr.io/shellaquiles/tributacos" in text:
                return "docker"
        except OSError:
            pass
    return "dev"


def get_app_url() -> str:
    mode = distribution_mode()
    if mode == "docker":
        return f"http://localhost:{DEV_FRONTEND_PORT}"
    return f"http://127.0.0.1:{STANDALONE_PORT}"


def open_path(path: Path) -> None:
    path = path.resolve()
    if sys.platform == "win32":
        os.startfile(path)  # type: ignore[attr-defined]
    elif sys.platform == "darwin":
        subprocess.run(["open", str(path)], check=False)
    else:
        subprocess.run(["xdg-open", str(path)], check=False)


def ingest_root() -> Path:
    """Padre de cfdi_emitidos/, cfdi_recibidos/ y descargados/."""
    if is_frozen() or os.getenv("ENVIRONMENT", "development") == "production":
        return user_data_dir()
    return project_root()


def ingest_folders() -> dict[str, Path]:
    root = ingest_root()
    folders = {
        "recibidos": root / "cfdi_recibidos",
        "emitidos": root / "cfdi_emitidos",
        "descargados": root / "descargados",
    }
    for path in folders.values():
        path.mkdir(parents=True, exist_ok=True)
    desc = folders["descargados"]
    (desc / "Declaraciones_Anuales").mkdir(exist_ok=True)
    (desc / "Pagos_Provisionales").mkdir(exist_ok=True)
    (desc / "Acuses_Pagos").mkdir(exist_ok=True)
    return folders


def open_ingest_folder(kind: str) -> Path:
    path = ingest_folders()[kind]
    open_path(path)
    return path


def open_data_folder() -> None:
    ingest_folders()
    open_path(ingest_root())


def manual_pdfs() -> dict[str, Path]:
    """Rutas de los PDFs oficiales (repo o bundle PyInstaller)."""
    roots = [bundled_root(), project_root()]
    names = {
        "user": "tribuTACOS_manual_usuario.pdf",
        "tech": "tribuTACOS_documentacion_tecnica.pdf",
        "install": "tribuTACOS_instalacion_usuario.pdf",
    }
    found: dict[str, Path] = {}
    for key, filename in names.items():
        candidates = []
        for root in roots:
            candidates.extend(
                [
                    root / "manuals" / filename,
                    root / "manual_usuario" / filename,
                    root / "docs" / filename,
                ]
            )
        for path in candidates:
            if path.is_file():
                found[key] = path
                break
    return found


def sqlite_path() -> Path:
    url = os.getenv("DATABASE_URL", "").strip()
    if url.startswith("sqlite"):
        raw = url.split("sqlite:///", 1)[-1]
        path = Path(raw)
        return path if path.is_absolute() else (project_root() / path).resolve()
    if is_frozen() or os.getenv("ENVIRONMENT", "development") == "production":
        return (user_data_dir() / "tributacos.db").resolve()
    return (project_root() / "backend" / "tributacos.db").resolve()


def diagnostic_report(*, log_tail: str = "", server_up: bool | None = None) -> str:
    """Ficha anonima para tickets: entorno, rutas, conteos. Sin RFC, UUID ni montos."""
    version = read_version()
    mode = distribution_mode()
    channel = version.split("-", 1)[1].split(".")[0].upper() if "-" in version else "STABLE"
    now = datetime.now().astimezone()
    lines = [
        f"tribuTACOS {version}  canal={channel}",
        f"Modo: {_mode_label(mode)}",
        f"Congelado (.exe): {'si' if is_frozen() else 'no'}",
        f"Python: {sys.version.split()[0]}  {_bits()}  {sys.executable}",
        f"Tk: {_tk_version()}",
        f"SO: {sys.platform}  {_os_release()}",
        f"Arch: {_arch()}",
        f"Locale: {_locale()}",
        f"Zona: {now.tzname() or 'n/a'}  {now.isoformat(timespec='seconds')}",
        "",
        "--- Proceso ---",
        f"argv: {' '.join(sys.argv)}",
        f"cwd: {Path.cwd()}",
        "",
        "--- Red ---",
        f"URL panel: {get_app_url()}",
        f"Health: {_health_line(server_up)}",
        f"puerto {STANDALONE_PORT} (standalone): {_port_state(STANDALONE_PORT)}",
        f"puerto {DEV_BACKEND_PORT} (API dev): {_port_state(DEV_BACKEND_PORT)}",
        f"puerto {DEV_FRONTEND_PORT} (Next/Docker): {_port_state(DEV_FRONTEND_PORT)}",
        "",
        "--- Entorno ---",
        *_env_lines(),
        "",
        "--- Rutas ---",
        f"proyecto: {project_root()}",
        f"datos: {user_data_dir()}",
        f"ingesta: {ingest_root()}",
        f"bd: {_db_line()}",
        "",
        "--- Volumen (sin RFC/UUID/montos) ---",
        *_volume_lines(),
        "",
        "--- Git ---",
        _git_line(),
        "",
        "--- Node ---",
        _node_line(),
    ]
    if log_tail.strip():
        lines.extend(["", "--- Registro del panel ---", log_tail.strip()])
    return "\n".join(lines) + "\n"


def _mode_label(mode: str) -> str:
    return {"installed": "instalado", "docker": "Docker", "dev": "desarrollo"}.get(mode, mode)


def _bits() -> str:
    return "64-bit" if sys.maxsize > 2**32 else "32-bit"


def _arch() -> str:
    extra = []
    machine = platform_machine()
    if machine:
        extra.append(machine)
    libc, libc_ver = _libc()
    if libc:
        extra.append(f"{libc} {libc_ver}".strip())
    return "  ".join(extra) or "n/a"


def platform_machine() -> str:
    try:
        import platform

        return platform.machine() or ""
    except Exception:
        return ""


def _os_release() -> str:
    try:
        import platform

        return platform.release()
    except Exception:
        return ""


def _libc() -> tuple[str, str]:
    try:
        import platform

        name, ver = platform.libc_ver()
        return name or "", ver or ""
    except Exception:
        return "", ""


def _locale() -> str:
    lang = os.getenv("LANG") or os.getenv("LC_ALL") or ""
    try:
        import locale

        loc = locale.getlocale()
        joined = ".".join(part for part in loc if part) if loc else ""
        return joined or lang or "n/a"
    except Exception:
        return lang or "n/a"


def _tk_version() -> str:
    try:
        import tkinter

        return str(tkinter.Tcl().eval("info patchlevel"))
    except Exception:
        return "n/a"


def _port_state(port: int) -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(0.25)
    try:
        sock.connect(("127.0.0.1", port))
        return "abierto"
    except OSError:
        return "cerrado"
    finally:
        sock.close()


def _health_line(server_up: bool | None) -> str:
    url = f"{get_app_url().rstrip('/')}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=0.8) as resp:
            body = resp.read(2048).decode("utf-8", errors="replace")
            api_ver = ""
            try:
                data = json.loads(body)
                api_ver = str(data.get("version") or "")
            except json.JSONDecodeError:
                pass
            extra = f"  api={api_ver}" if api_ver else ""
            return f"en linea  HTTP {resp.status}{extra}"
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        hint = "arriba" if server_up else "abajo"
        return f"sin respuesta ({hint} segun panel)  {type(exc).__name__}"


def _env_lines() -> list[str]:
    keys = (
        "ENVIRONMENT",
        "TRIBUTACOS_MODE",
        "BUILD_MODE",
        "DATA_DIR",
        "DATABASE_URL",
        "PORT",
        "BACKEND_URL",
    )
    rows = []
    for key in keys:
        raw = os.getenv(key)
        if raw is None or raw == "":
            rows.append(f"{key}=(no definido)")
            continue
        if key == "DATABASE_URL" and "://" in raw:
            scheme, _, rest = raw.partition("://")
            if "sqlite" in scheme:
                rows.append(f"{key}={raw}")
            else:
                rows.append(f"{key}={scheme}://***")
            continue
        rows.append(f"{key}={raw}")
    return rows


def _fmt_size(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


def _db_line() -> str:
    path = sqlite_path()
    if not path.exists():
        return f"{path}  (no existe)"
    st = path.stat()
    mtime = datetime.fromtimestamp(st.st_mtime).isoformat(timespec="seconds")
    return f"{path}  {_fmt_size(st.st_size)}  mtime={mtime}"


def _count_files(folder: Path, suffixes: tuple[str, ...]) -> int:
    if not folder.is_dir():
        return 0
    n = 0
    for item in folder.rglob("*"):
        if item.is_file() and item.suffix.lower() in suffixes:
            n += 1
            if n >= 10000:
                break
    return n


def _volume_lines() -> list[str]:
    root = ingest_root()
    xml_in = _count_files(root / "cfdi_recibidos", (".xml",))
    xml_out = _count_files(root / "cfdi_emitidos", (".xml",))
    pdfs = _count_files(root / "descargados", (".pdf",))
    backup_root = user_data_dir() / "respaldos"
    backups = (
        len(list(backup_root.glob("tributacos-respaldo-*.json.gz")))
        if backup_root.is_dir()
        else 0
    )
    rows = [
        f"XML recibidos: {xml_in}",
        f"XML emitidos: {xml_out}",
        f"PDF SAT: {pdfs}",
        f"respaldos: {backups}",
    ]
    rows.extend(_sqlite_counts())
    return rows


def _sqlite_counts() -> list[str]:
    path = sqlite_path()
    if not path.exists():
        return ["BD: no hay archivo sqlite"]
    try:
        uri = f"file:{path.as_posix()}?mode=ro"
        con = sqlite3.connect(uri, uri=True, timeout=0.4)
        con.execute("PRAGMA query_only=ON")
        tables = {
            row[0]
            for row in con.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }

        def count(table: str) -> int | None:
            if table not in tables:
                return None
            return int(con.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0])

        rows: list[str] = []
        clients = count("clients")
        cfdis = count("cfdis")
        if clients is not None:
            rows.append(f"BD clientes: {clients}")
        if cfdis is not None:
            detail = ""
            if "cfdis" in tables:
                parts = []
                for cat, n in con.execute(
                    "SELECT COALESCE(categoria, '?'), COUNT(*) FROM cfdis GROUP BY categoria"
                ):
                    parts.append(f"{cat}={n}")
                years = [
                    str(y)
                    for (y,) in con.execute(
                        "SELECT DISTINCT year FROM cfdis WHERE year IS NOT NULL AND year != '' ORDER BY year"
                    )
                ]
                if parts:
                    detail = f"  ({', '.join(parts)})"
                if years:
                    rows.append(f"BD cfdis: {cfdis}{detail}")
                    rows.append(f"BD anios: {', '.join(years)}")
                else:
                    rows.append(f"BD cfdis: {cfdis}{detail}")
            else:
                rows.append(f"BD cfdis: {cfdis}")
        for label, table in (
            ("BD cache", "summary_caches"),
            ("BD SAT anual", "declaraciones_anuales_sat"),
            ("BD SAT provisional", "pagos_provisionales_sat"),
            ("BD SAT acuses", "acuses_pagos_sat"),
            ("BD exclusiones", "cfdi_exclusions"),
        ):
            n = count(table)
            if n is not None:
                rows.append(f"{label}: {n}")
        con.close()
        return rows or ["BD: sin tablas reconocidas"]
    except sqlite3.Error as exc:
        return [f"BD: no se pudo leer ({type(exc).__name__})"]


def _git_line() -> str:
    if is_frozen():
        return "n/a (instalado)"
    git_dir = project_root() / ".git"
    if not git_dir.exists():
        return "n/a"
    try:
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=project_root(),
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        ).stdout.strip()
        commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=project_root(),
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        ).stdout.strip()
        dirty = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=project_root(),
            capture_output=True,
            text=True,
            timeout=1.5,
            check=False,
        )
        sucio = "si" if dirty.stdout.strip() else "no"
        if not commit:
            return "n/a"
        return f"{branch or '?'}  {commit}  sucio={sucio}"
    except (OSError, subprocess.TimeoutExpired):
        return "n/a"


def _node_line() -> str:
    if is_frozen():
        return "n/a (instalado)"
    node = shutil.which("node")
    npm = shutil.which("npm")
    parts = []
    if node:
        try:
            ver = subprocess.run(
                [node, "-v"], capture_output=True, text=True, timeout=1, check=False
            ).stdout.strip()
            parts.append(ver or "node")
        except (OSError, subprocess.TimeoutExpired):
            parts.append("node")
    if npm:
        try:
            ver = subprocess.run(
                [npm, "-v"], capture_output=True, text=True, timeout=1, check=False
            ).stdout.strip()
            parts.append(f"npm {ver}" if ver else "npm")
        except (OSError, subprocess.TimeoutExpired):
            parts.append("npm")
    pkg = project_root() / "frontend" / "package.json"
    if pkg.is_file():
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
            parts.append(f"frontend {data.get('version', '?')}")
        except (OSError, json.JSONDecodeError):
            pass
    return "  /  ".join(parts) if parts else "n/a"
