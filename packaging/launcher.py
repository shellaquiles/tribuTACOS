#!/usr/bin/env python3
"""Arranca FastAPI en un solo puerto y abre el navegador."""

from __future__ import annotations

import os
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser

from frozen_bootstrap import is_frozen, prepare_frozen_runtime, uvicorn_log_config

STANDALONE_HOST = os.getenv("HOST", "127.0.0.1")
STANDALONE_PORT = int(os.getenv("PORT", "8080"))


def _prepare_environment() -> None:
    # Servir la UI estatica en un solo puerto. La carpeta de datos de usuario
    # (APPDATA / Application Support) solo aplica al .exe congelado; en un
    # checkout se usa backend/tributacos.db como make dev.
    if is_frozen():
        prepare_frozen_runtime()
        os.environ.setdefault("ENVIRONMENT", "production")
    else:
        os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("HOST", STANDALONE_HOST)
    os.environ.setdefault("PORT", str(STANDALONE_PORT))
    os.environ.setdefault("SERVE_STATIC", "1")

    here = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(here)
    backend = os.path.join(repo_root, "backend")
    if is_frozen():
        meipass = getattr(sys, "_MEIPASS", "")
        if meipass and meipass not in sys.path:
            sys.path.insert(0, meipass)
    elif backend not in sys.path:
        sys.path.insert(0, backend)


def _app_url() -> str:
    return f"http://{STANDALONE_HOST}:{STANDALONE_PORT}"


def _health_url() -> str:
    return f"{_app_url()}/api/health"


def _app_is_up() -> bool:
    try:
        urllib.request.urlopen(_health_url(), timeout=0.6)
        return True
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def _open_existing() -> None:
    webbrowser.open(_app_url())


def _show_port_error() -> None:
    try:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(
            "tribuTACOS",
            f"No se pudo usar el puerto {STANDALONE_PORT}.\n"
            "Cierra el otro programa que lo este usando o reinicia el equipo.",
        )
        root.destroy()
    except Exception:
        print(
            f"No se pudo usar el puerto {STANDALONE_PORT}.",
            file=sys.stderr,
        )


def wait_and_open_browser() -> None:
    if os.getenv("TRIBUTACOS_NO_BROWSER", "").lower() in ("1", "true", "yes"):
        return
    for _ in range(50):
        try:
            urllib.request.urlopen(_health_url(), timeout=1)
            webbrowser.open(_app_url())
            return
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.3)


def main() -> None:
    if "--gui" in sys.argv:
        _prepare_environment()
        scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts")
        scripts_dir = os.path.normpath(scripts_dir)
        if is_frozen():
            meipass = getattr(sys, "_MEIPASS", "")
            if meipass:
                sys.path.insert(0, meipass)
                sys.path.insert(0, os.path.join(meipass, "scripts"))
        elif scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        from tributacos_gui import main as gui_main

        gui_main()
        return

    _prepare_environment()
    if _app_is_up():
        _open_existing()
        return

    import uvicorn
    from app.config import DATABASE_URL
    from app.main import app

    print(f"Base de datos: {DATABASE_URL}")
    threading.Thread(target=wait_and_open_browser, daemon=True).start()
    try:
        uvicorn.run(
            app,
            host=STANDALONE_HOST,
            port=STANDALONE_PORT,
            log_level="info",
            log_config=uvicorn_log_config() if is_frozen() else None,
        )
    except OSError:
        if _app_is_up():
            _open_existing()
            return
        _show_port_error()
        raise SystemExit(1)


if __name__ == "__main__":
    main()
