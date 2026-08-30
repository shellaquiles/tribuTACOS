#!/usr/bin/env python3
"""
Panel de Operaciones de tribuTACOS.
Wrapper visual de acciones que no estan en la interfaz web.
"""

from __future__ import annotations

import os
import queue
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from tkinter import BOTH, END, LEFT, RIGHT, X, Y, filedialog, font as tkfont, messagebox, ttk
from tkinter.scrolledtext import ScrolledText
import tkinter as tk

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from runtime import (  # noqa: E402
    backup_dir,
    diagnostic_report,
    distribution_mode,
    get_app_url,
    is_frozen,
    manual_pdfs,
    open_data_folder,
    open_ingest_folder,
    open_path,
    project_root,
    read_version,
    user_data_dir,
)
from tributacos import run_command, venv_python  # noqa: E402

RUNNER = project_root() / "scripts" / "tributacos.py"

# Paleta alineada con la web fiscal (slate / acentos institucionales).
BG = "#f8fafc"
SURFACE = "#ffffff"
BORDER = "#e2e8f0"
TEXT = "#0f172a"
MUTED = "#64748b"
SUBTLE = "#94a3b8"
BRAND = "#0f172a"
BLUE = "#1d4ed8"
SUCCESS = "#15803d"
SUCCESS_BG = "#dcfce7"
WARNING = "#b45309"
WARNING_BG = "#fef3c7"
DANGER = "#b91c1c"
DANGER_BG = "#fef2f2"
HEADER_BG = "#0f172a"
HEADER_FG = "#f8fafc"
GITHUB_URL = "https://github.com/shellaquiles/tributacos"
ISSUES_URL = f"{GITHUB_URL}/issues"
SITE_URL = "https://shellaquiles.org"
CONTACT_EMAIL = "tributacos@shellaquiles.org"

DISCLAIMER = (
    "Aviso legal: tribuTACOS es una plataforma de analisis, proyeccion y "
    "simulacion fiscal basada en la interpretacion algoritmica de comprobantes "
    "digitales (CFDI) y la legislacion mexicana (LISR y LIVA). Los calculos, "
    "proyecciones y determinaciones son estrictamente estimativos e informativos; "
    "no constituyen asesoria fiscal, contable o legal vinculante, y no sustituyen "
    "las declaraciones ni obligaciones presentadas ante el SAT."
)


@dataclass(frozen=True)
class TaskAction:
    command: str
    label: str
    description: str
    confirm: str | None = None
    long_running: bool = False
    variant: str = "default"
    visible_in: tuple[str, ...] = ("installed", "docker", "dev")


def _channel(version: str) -> str:
    if "-" in version:
        return version.split("-", 1)[1].split(".")[0].upper()
    return "STABLE"


def _sections_for(mode: str) -> list[tuple[str, list[TaskAction]]]:
    start_cmd = "standalone" if mode == "installed" else ("docker-up" if mode == "docker" else "standalone")
    start_label = "Iniciar tribuTACOS" if mode != "docker" else "Iniciar con Docker"
    start_desc = (
        "Levanta los contenedores y abre el navegador"
        if mode == "docker"
        else "Servidor unico en el puerto 8080 y abre el navegador"
    )
    stop_cmd = "docker-down" if mode == "docker" else "stop"

    sections: list[tuple[str, list[TaskAction]]] = [
        (
            "Aplicacion",
            [
                TaskAction(start_cmd, start_label, start_desc, long_running=True, variant="primary"),
                TaskAction(stop_cmd, "Detener", "Libera puertos y apaga los servidores", variant="secondary"),
                TaskAction(
                    "open-browser",
                    "Abrir en el navegador",
                    "La declaracion, el dashboard y los XML se trabajan aqui",
                ),
            ],
        ),
        (
            "Carpetas e ingesta",
            [
                TaskAction(
                    "open-xml-recibidos",
                    "XML recibidos",
                    "Pega facturas y nominas que te emitieron",
                ),
                TaskAction(
                    "open-xml-emitidos",
                    "XML emitidos",
                    "Pega lo que tu facturaste",
                ),
                TaskAction(
                    "open-pdf-sat",
                    "PDFs del SAT",
                    "Anuales, provisionales y acuses de pago",
                ),
                TaskAction(
                    "db-import-xml",
                    "Escanear carpetas XML",
                    "Lee cfdi_emitidos/ y cfdi_recibidos/ hacia la base",
                ),
                TaskAction(
                    "db-import-sat",
                    "Importar PDFs del SAT",
                    "Declaraciones y acuses en descargados/",
                ),
            ],
        ),
        (
            "Base de datos",
            [
                TaskAction(
                    "db-export",
                    "Exportar respaldo",
                    "Copia fechada en respaldos/ y abre la carpeta",
                ),
                TaskAction(
                    "db-import-backup",
                    "Importar respaldo",
                    "Carga un .json.gz, reemplaza la base y recarga la web",
                ),
                TaskAction(
                    "db-reset",
                    "Limpiar base de datos",
                    "Solo catalogos SAT; reinicia el servidor y recarga la web",
                    confirm=(
                        "Se eliminara la base de datos actual.\n"
                        "Esta accion no se puede deshacer.\n\n¿Continuar?"
                    ),
                    variant="danger",
                ),
                TaskAction(
                    "db-seed",
                    "Restaurar datos demo",
                    "139 CFDIs de ejemplo; reinicia el servidor y recarga la web",
                    confirm="Se reemplazara tu base de datos por el dataset demo.\n\n¿Continuar?",
                    variant="danger",
                ),
                TaskAction(
                    "clear-cache",
                    "Limpiar cache de calculos",
                    "Recalcula ISR e IVA la proxima vez que abras la web",
                    confirm="¿Limpiar la cache de calculos fiscales?",
                ),
            ],
        ),
        (
            "Manuales PDF",
            [
                TaskAction(
                    "open-manual-install",
                    "Guia de instalacion",
                    "Windows, Docker y este panel",
                ),
                TaskAction(
                    "open-manual-user",
                    "Manual de usuario",
                    "Guia de la interfaz fiscal en el navegador",
                ),
                TaskAction(
                    "open-manual-tech",
                    "Documentacion tecnica",
                    "Arquitectura, API y motor fiscal",
                ),
                TaskAction(
                    "about",
                    "Acerca de",
                    "Contacto, aviso legal y ficha para tickets de error",
                ),
            ],
        ),
    ]
    if mode in ("dev", "docker"):
        system_tasks = [
            TaskAction("doctor", "Verificar requisitos", "Python, Node.js y Docker"),
        ]
        if mode == "dev":
            system_tasks.append(
                TaskAction(
                    "setup",
                    "Instalar y preparar",
                    "Dependencias y datos demo (solo la primera vez)",
                    variant="primary",
                )
            )
        sections.append(("Sistema", system_tasks))
    return sections


class OperationsPanel(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.mode = distribution_mode()
        self.version = read_version()
        self.title(f"tribuTACOS {self.version} — Panel de Operaciones")
        self.geometry("780x860")
        self.minsize(680, 640)
        self.configure(bg=BG)

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.server_process: subprocess.Popen[str] | None = None
        self.busy = False
        self._pending_backup: Path | None = None
        self._action_controls: list[tuple[tk.Button, TaskAction]] = []
        self._about_win: tk.Toplevel | None = None

        self._ui_font = self._pick_font()
        self._configure_style()
        self._build_layout()
        self.after(100, self._drain_log_queue)
        self.after(400, self._poll_health)

    def _pick_font(self) -> str:
        available = {name.lower() for name in tkfont.families(self)}
        for name in ("Segoe UI", "SF Pro Text", "Helvetica Neue", "Ubuntu", "Cantarell", "DejaVu Sans"):
            if name.lower() in available:
                return name
        return "TkDefaultFont"

    def _configure_style(self) -> None:
        style = ttk.Style(self)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("TFrame", background=BG)
        style.configure("Card.TFrame", background=SURFACE)
        style.configure("TScrollbar", background=BORDER, troughcolor=BG)

    def _build_layout(self) -> None:
        self._build_header()

        self._busy_bar = tk.Frame(self, bg=HEADER_BG, height=3)
        self._busy_bar.pack(fill=X)
        self._busy_bar.pack_propagate(False)

        mid = tk.Frame(self, bg=BG)
        mid.pack(fill=BOTH, expand=True)

        canvas = tk.Canvas(mid, bg=BG, highlightthickness=0, bd=0)
        vsb = ttk.Scrollbar(mid, orient="vertical", command=canvas.yview)
        inner = tk.Frame(canvas, bg=BG, padx=16, pady=12)
        inner_id = canvas.create_window((0, 0), window=inner, anchor="nw")
        self._canvas = canvas

        def _on_inner(_event: object) -> None:
            canvas.configure(scrollregion=canvas.bbox("all"))

        def _on_canvas(event: tk.Event) -> None:  # type: ignore[type-arg]
            canvas.itemconfigure(inner_id, width=event.width)

        inner.bind("<Configure>", _on_inner)
        canvas.bind("<Configure>", _on_canvas)
        canvas.configure(yscrollcommand=vsb.set)
        canvas.pack(side=LEFT, fill=BOTH, expand=True)
        vsb.pack(side=RIGHT, fill=Y)

        def _wheel(event: tk.Event) -> None:  # type: ignore[type-arg]
            delta = event.delta if event.delta else 0
            if sys.platform == "darwin":
                canvas.yview_scroll(int(-1 * delta), "units")
            else:
                step = int(-1 * (delta / 120)) if delta else 0
                if step:
                    canvas.yview_scroll(step, "units")

        def _linux_up(_event: tk.Event) -> None:  # type: ignore[type-arg]
            canvas.yview_scroll(-1, "units")

        def _linux_down(_event: tk.Event) -> None:  # type: ignore[type-arg]
            canvas.yview_scroll(1, "units")

        canvas.bind("<Enter>", lambda _e: canvas.bind_all("<MouseWheel>", _wheel))
        canvas.bind("<Leave>", lambda _e: canvas.unbind_all("<MouseWheel>"))
        canvas.bind("<Button-4>", _linux_up)
        canvas.bind("<Button-5>", _linux_down)

        for title, tasks in _sections_for(self.mode):
            self._build_section(inner, title, tasks)

        self._build_log()
        self._build_footer()
        self._welcome()
        self.after(50, lambda: canvas.yview_moveto(0))

    def _build_header(self) -> None:
        header = tk.Frame(self, bg=HEADER_BG, padx=18, pady=12)
        header.pack(fill=X)

        top = tk.Frame(header, bg=HEADER_BG)
        top.pack(fill=X)
        tk.Label(
            top,
            text="tribuTACOS",
            font=(self._ui_font, 16, "bold"),
            fg=HEADER_FG,
            bg=HEADER_BG,
        ).pack(side=LEFT)

        mode_label = {"installed": "instalado", "docker": "Docker", "dev": "desarrollo"}.get(
            self.mode, self.mode
        )
        pill = tk.Frame(top, bg="#1e293b", padx=10, pady=4)
        pill.pack(side=RIGHT)
        self.status_var = tk.StringVar(value="●  Detenido")
        self._status_label = tk.Label(
            pill,
            textvariable=self.status_var,
            font=(self._ui_font, 9, "bold"),
            fg="#94a3b8",
            bg="#1e293b",
        )
        self._status_label.pack(side=LEFT)

        tk.Label(
            top,
            text=f"v{self.version}  {_channel(self.version)}  ·  {mode_label.upper()}",
            font=(self._ui_font, 9, "bold"),
            fg="#94a3b8",
            bg=HEADER_BG,
        ).pack(side=RIGHT, padx=(0, 12))

        tk.Label(
            header,
            text="Panel de Operaciones  ·  la declaracion se trabaja en el navegador",
            font=(self._ui_font, 9),
            fg="#94a3b8",
            bg=HEADER_BG,
            anchor="w",
        ).pack(fill=X, pady=(6, 8))

        url_row = tk.Frame(header, bg=HEADER_BG)
        url_row.pack(fill=X)
        self._url = get_app_url()
        url_btn = tk.Label(
            url_row,
            text=self._url,
            font=(self._ui_font, 9),
            fg="#93c5fd",
            bg=HEADER_BG,
            cursor="hand2",
        )
        url_btn.pack(side=LEFT)
        url_btn.bind("<Button-1>", lambda _e: self._open_browser())
        copy_lbl = tk.Label(
            url_row,
            text="copiar",
            font=(self._ui_font, 8, "bold"),
            fg="#64748b",
            bg=HEADER_BG,
            cursor="hand2",
        )
        copy_lbl.pack(side=LEFT, padx=(12, 0))
        copy_lbl.bind("<Button-1>", lambda _e: self._copy_url())
        about_lbl = tk.Label(
            url_row,
            text="Acerca de",
            font=(self._ui_font, 8, "bold"),
            fg="#93c5fd",
            bg=HEADER_BG,
            cursor="hand2",
        )
        about_lbl.pack(side=RIGHT)
        about_lbl.bind("<Button-1>", lambda _e: self._show_about())

    def _build_log(self) -> None:
        log_wrap = tk.Frame(self, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        log_wrap.pack(fill=X, padx=0)
        log_head = tk.Frame(log_wrap, bg=SURFACE)
        log_head.pack(fill=X, padx=14, pady=(8, 2))
        tk.Label(
            log_head,
            text="REGISTRO",
            font=(self._ui_font, 9, "bold"),
            fg=MUTED,
            bg=SURFACE,
        ).pack(side=LEFT)
        tk.Button(
            log_head,
            text="Limpiar",
            command=self.clear_log,
            font=(self._ui_font, 9),
            fg=BLUE,
            bg=SURFACE,
            activebackground=SURFACE,
            activeforeground=BRAND,
            relief="flat",
            cursor="hand2",
            bd=0,
            highlightthickness=0,
        ).pack(side=RIGHT)

        self.log_text = tk.Text(
            log_wrap,
            wrap="word",
            height=7,
            font=("Consolas", 9) if sys.platform == "win32" else ("DejaVu Sans Mono", 9),
            state="disabled",
            bg="#0f172a",
            fg="#e2e8f0",
            insertbackground="#e2e8f0",
            bd=0,
            highlightthickness=0,
            padx=14,
            pady=8,
        )
        self.log_text.pack(fill=X, padx=1, pady=(0, 1))

    def _build_footer(self) -> None:
        footer = tk.Frame(self, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        footer.pack(fill=X)
        inner = tk.Frame(footer, bg=SURFACE, padx=16, pady=8)
        inner.pack(fill=X)
        about = tk.Label(
            inner,
            text="Acerca de  ·  aviso legal",
            font=(self._ui_font, 8, "bold"),
            fg=BLUE,
            bg=SURFACE,
            cursor="hand2",
        )
        about.pack(side=RIGHT)
        about.bind("<Button-1>", lambda _e: self._show_about())
        tk.Label(
            inner,
            text="shellaquiles.org  ·  este panel no sustituye la interfaz fiscal",
            font=(self._ui_font, 8),
            fg=SUBTLE,
            bg=SURFACE,
        ).pack(side=LEFT)

    def _build_section(self, parent: tk.Misc, title: str, tasks: list[TaskAction]) -> None:
        card = tk.Frame(parent, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        card.pack(fill=X, pady=(0, 10))
        tk.Label(
            card,
            text=title.upper(),
            font=(self._ui_font, 9, "bold"),
            fg=MUTED,
            bg=SURFACE,
            anchor="w",
        ).pack(fill=X, padx=14, pady=(12, 6))
        for task in tasks:
            self._build_row(card, task)
        tk.Frame(card, bg=SURFACE, height=8).pack(fill=X)

    def _build_row(self, parent: tk.Misc, task: TaskAction) -> None:
        row = tk.Frame(parent, bg=SURFACE)
        row.pack(fill=X, padx=12, pady=3)
        btn = tk.Button(
            row,
            text=task.label,
            command=lambda t=task: self.run_task(t),
            font=(self._ui_font, 10, "bold" if task.variant == "primary" else "normal"),
            width=26,
            anchor="w",
            padx=12,
            pady=7,
            cursor="hand2",
            relief="flat",
            bd=0,
            highlightthickness=1,
            takefocus=0,
        )
        self._paint_button(btn, task.variant)
        btn.pack(side=LEFT)
        tk.Label(
            row,
            text=task.description,
            font=(self._ui_font, 9),
            fg=MUTED,
            bg=SURFACE,
            wraplength=400,
            justify="left",
            anchor="w",
        ).pack(side=LEFT, padx=(12, 8), fill=X, expand=True)
        self._action_controls.append((btn, task))

    def _paint_button(self, btn: tk.Button, variant: str) -> None:
        if variant == "primary":
            btn.configure(
                bg=BRAND,
                fg="#ffffff",
                activebackground="#1e293b",
                activeforeground="#ffffff",
                highlightbackground=BRAND,
            )
        elif variant == "danger":
            btn.configure(
                bg=DANGER_BG,
                fg=DANGER,
                activebackground="#fecaca",
                activeforeground=DANGER,
                highlightbackground="#fecaca",
            )
        elif variant == "secondary":
            btn.configure(
                bg="#f1f5f9",
                fg=TEXT,
                activebackground="#e2e8f0",
                activeforeground=TEXT,
                highlightbackground=BORDER,
            )
        else:
            btn.configure(
                bg=SURFACE,
                fg=TEXT,
                activebackground="#f1f5f9",
                activeforeground=TEXT,
                highlightbackground=BORDER,
            )

    def _welcome(self) -> None:
        self.log("Panel de Operaciones de tribuTACOS.")
        self.log("La interfaz fiscal (dashboard, XML, CSV, SAT) se abre en el navegador.")
        self.log(f"URL: {self._url}")

    def _open_browser(self) -> None:
        webbrowser.open(get_app_url())
        self._set_status("ocupado", "Navegador abierto")
        self.log("Navegador abierto.")

    def _copy_url(self) -> None:
        self.clipboard_clear()
        self.clipboard_append(get_app_url())
        self._set_status("ocupado", "URL copiada")
        self.log(f"URL copiada: {get_app_url()}")

    def _set_status(self, kind: str, text: str) -> None:
        self._status_kind = kind
        self.status_var.set(f"●  {text}")
        colors = {
            "detenido": "#94a3b8",
            "en_linea": "#4ade80",
            "arrancando": "#fbbf24",
            "error": "#f87171",
            "ocupado": "#93c5fd",
        }
        self._status_label.configure(fg=colors.get(kind, "#94a3b8"))

    def _set_busy_ui(self, busy: bool) -> None:
        self.busy = busy
        self._busy_bar.configure(bg=BLUE if busy else HEADER_BG)
        for btn, task in self._action_controls:
            always = task.command in ("stop", "docker-down", "about") or task.command.startswith(
                "open-"
            )
            btn.configure(state="normal" if (not busy or always) else "disabled")

    def log(self, message: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert(END, f"{stamp}  {message}\n")
        self.log_text.see(END)
        self.log_text.configure(state="disabled")

    def clear_log(self) -> None:
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", END)
        self.log_text.configure(state="disabled")
        self._welcome()

    def enqueue(self, message: str) -> None:
        self.log_queue.put(message)

    def _drain_log_queue(self) -> None:
        while True:
            try:
                message = self.log_queue.get_nowait()
            except queue.Empty:
                break
            if message:
                self.log(message)
        self.after(100, self._drain_log_queue)

    def _poll_health(self) -> None:
        if not self.busy:
            if self._server_is_up():
                self._set_status("en_linea", "En ejecucion")
            elif self._status_kind == "en_linea":
                self._set_status("detenido", "Detenido")
        self.after(2000, self._poll_health)

    def run_task(self, task: TaskAction) -> None:
        if self.busy and task.command not in ("stop", "docker-down", "about") and not task.command.startswith(
            "open-"
        ):
            messagebox.showwarning("Ocupado", "Espera a que termine la tarea actual.")
            return
        if task.confirm and not messagebox.askyesno("Confirmar", task.confirm, parent=self):
            return
        if task.command == "db-import-backup":
            if not self._pick_backup_file():
                return
        if task.command == "open-browser":
            self._open_browser()
            return
        if task.command == "open-data":
            open_data_folder()
            self.enqueue("Carpeta de datos abierta.")
            return
        ingest_open = {
            "open-xml-recibidos": "recibidos",
            "open-xml-emitidos": "emitidos",
            "open-pdf-sat": "descargados",
        }
        if task.command in ingest_open:
            path = open_ingest_folder(ingest_open[task.command])
            self.enqueue(f"Carpeta abierta: {path}")
            self._set_status("ocupado", "Carpeta abierta")
            return
        if task.command.startswith("open-manual-"):
            key = {
                "open-manual-user": "user",
                "open-manual-tech": "tech",
                "open-manual-install": "install",
            }.get(task.command)
            if key:
                self._open_manual(key)
            return
        if task.command == "about":
            self._show_about()
            return
        threading.Thread(target=self._execute, args=(task,), daemon=True).start()

    def _execute(self, task: TaskAction) -> None:
        self.busy = True
        self.after(0, lambda: self._set_busy_ui(True))
        self.after(0, lambda: self._set_status("ocupado", "En ejecucion..."))
        self.enqueue(f">>> {task.label}")
        try:
            if task.command == "standalone":
                self._spawn_server(task.command)
                return
            restart_web = (
                task.command in ("db-reset", "db-seed", "db-import-backup")
                and self.mode != "docker"
            )
            server_was_up = restart_web and self._server_is_up()
            if restart_web and server_was_up:
                self.enqueue("Deteniendo el servidor para poder reemplazar la base de datos...")
                self._stop_spawned_server()
            extra = {}
            if task.command == "db-import-backup":
                if self._pending_backup is None:
                    self.enqueue("No se selecciono un archivo de respaldo.")
                    self.after(0, lambda: self._set_status("detenido", "Cancelado"))
                    return
                extra["backup_path"] = self._pending_backup
                self._pending_backup = None
            code = run_command(task.command, **extra)
            self.enqueue(f"Finalizado (codigo {code})")
            if task.command in ("stop", "docker-down"):
                self.after(0, lambda: self._set_status("detenido", "Detenido"))
            elif restart_web and server_was_up and code == 0:
                self.enqueue("Reiniciando el servidor para actualizar la pagina...")
                self._spawn_server("standalone")
                return
            elif task.long_running:
                self.after(0, lambda: self._set_status("arrancando", "Arrancando..."))
                self.after(2000, lambda: webbrowser.open(get_app_url()))
            else:
                kind = "en_linea" if self._server_is_up() else ("detenido" if code == 0 else "error")
                label = "Listo" if code == 0 else f"Error {code}"
                self.after(0, lambda: self._set_status(kind, label))
                if restart_web and code == 0:
                    self.enqueue("Base lista. Inicia tribuTACOS para ver los cambios en la web.")
                if task.command == "db-export" and code == 0:
                    self.after(0, self._notify_backup_created)
                if (
                    task.command == "db-import-backup"
                    and code == 0
                    and not (restart_web and server_was_up)
                ):
                    self.after(0, self._notify_backup_imported)
        except Exception as exc:
            self.enqueue(f"Error: {exc}")
            self.after(0, lambda: self._set_status("error", "Error"))
        finally:
            if task.command != "standalone":
                self.after(0, lambda: self._set_busy_ui(False))

    def _server_is_up(self) -> bool:
        if self.server_process is not None and self.server_process.poll() is None:
            return True
        try:
            urllib.request.urlopen(f"{get_app_url().rstrip('/')}/api/health", timeout=0.35)
            return True
        except (urllib.error.URLError, TimeoutError, OSError):
            return False

    def _stop_spawned_server(self) -> None:
        proc = self.server_process
        self.server_process = None
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=3)
        run_command("stop")

    def _spawn_server(self, command: str) -> None:
        if self.server_process and self.server_process.poll() is None:
            self.enqueue("La aplicacion ya esta en ejecucion.")
            self.after(0, lambda: self._set_status("en_linea", "En ejecucion"))
            self.after(0, lambda: self._set_busy_ui(False))
            webbrowser.open(get_app_url())
            return
        if self._server_is_up():
            self.enqueue("Ya hay un servidor en el puerto. Se abre el navegador.")
            self.after(0, lambda: self._set_status("en_linea", "En ejecucion"))
            self.after(0, lambda: self._set_busy_ui(False))
            webbrowser.open(get_app_url())
            return
        if is_frozen():
            sibling = Path(sys.executable).resolve().parent / "tributacos.exe"
            cmd = [str(sibling)] if sibling.exists() else [sys.executable]
        else:
            py = venv_python()
            if not py.exists():
                self.enqueue(
                    "No esta el entorno Python (backend/venv). "
                    "Usa «Instalar y preparar» en la seccion Sistema."
                )
                self.after(0, lambda: self._set_status("error", "Error"))
                self.after(0, lambda: self._set_busy_ui(False))
                return
            cmd = [str(py), str(RUNNER), command]
        self.enqueue(f"$ {' '.join(cmd)}")
        env = os.environ.copy()
        env["TRIBUTACOS_NO_BROWSER"] = "1"
        self.server_process = subprocess.Popen(
            cmd,
            cwd=str(project_root()),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        assert self.server_process.stdout is not None
        threading.Thread(
            target=self._stream_output, args=(self.server_process,), daemon=True
        ).start()
        threading.Thread(
            target=self._wait_and_open_browser, args=(True,), daemon=True
        ).start()
        self.after(0, lambda: self._set_status("arrancando", "Arrancando..."))
        self.after(0, lambda: self._set_busy_ui(False))

    def _wait_and_open_browser(self, reload_page: bool = False) -> None:
        url = get_app_url().rstrip("/")
        health = f"{url}/api/health"
        for _ in range(60):
            proc = self.server_process
            if proc is not None and proc.poll() is not None:
                self.after(0, lambda: self._set_status("error", "Error al iniciar"))
                self.enqueue("El servidor termino antes de abrir el puerto. Revisa el registro.")
                return
            try:
                urllib.request.urlopen(health, timeout=1)
                open_url = f"{url}/?t={int(time.time())}" if reload_page else url
                webbrowser.open(open_url)
                self.after(0, lambda: self._set_status("en_linea", "En ejecucion"))
                self.enqueue(f"Listo en {url}")
                return
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(0.5)
        self.enqueue("El servidor no respondio a tiempo. Revisa el registro.")
        self.after(0, lambda: self._set_status("error", "Sin respuesta"))

    def _stream_output(self, proc: subprocess.Popen[str]) -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            text = line.rstrip()
            if text:
                self.enqueue(text)
        code = proc.wait()
        if proc is not self.server_process:
            return
        self.enqueue(f"Servidor detenido (codigo {code})")
        self.after(0, lambda: self._set_status("detenido", "Detenido"))

    def _open_manual(self, which: str) -> None:
        pdfs = manual_pdfs()
        path = pdfs.get(which)
        labels = {
            "user": "Manual de usuario",
            "tech": "Documentacion tecnica",
            "install": "Guia de instalacion",
        }
        if path is None:
            messagebox.showwarning(
                "Manual no encontrado",
                "No esta el PDF en el proyecto. Compilalo con:\n\n"
                "  make pdf-manual, make pdf-tecnica o make pdf-instalacion",
                parent=self,
            )
            self.enqueue(f"{labels.get(which, which)}: PDF no encontrado.")
            return
        open_path(path)
        self.enqueue(f"Abierto: {path.name}")
        self._set_status("ocupado", "Manual abierto")

    def _screenshot_hint(self) -> str:
        if sys.platform == "win32":
            return (
                "Windows: Win + Mayus + S (recorte) o Alt + Impr Pant (esta ventana).\n"
                "Si el fallo esta en la declaracion, captura tambien el navegador."
            )
        if sys.platform == "darwin":
            return (
                "macOS: Cmd + Mayus + 4 (recorte) o Cmd + Mayus + 3 (pantalla).\n"
                "Si el fallo esta en la declaracion, captura tambien el navegador."
            )
        return (
            "Linux: Impr Pant o la herramienta de recorte del escritorio.\n"
            "Si el fallo esta en la declaracion, captura tambien el navegador."
        )

    def _diagnostic_text(self) -> str:
        log = ""
        try:
            log = self.log_text.get("1.0", END).strip()
        except tk.TclError:
            pass
        skip = ("Ficha tecnica copiada", "Aviso legal copiado", "URL copiada")
        kept = [line for line in log.splitlines() if not any(token in line for token in skip)]
        tail = "\n".join(kept[-50:]) if kept else "(sin registro de acciones)"
        return diagnostic_report(log_tail=tail, server_up=self._server_is_up())

    def _copy_text(self, text: str, ok_msg: str) -> None:
        self.clipboard_clear()
        self.clipboard_append(text)
        self._set_status("ocupado", ok_msg)
        self.log(ok_msg)

    def _show_about(self) -> None:
        if self._about_win is not None and self._about_win.winfo_exists():
            self._about_win.lift()
            self._about_win.focus_force()
            return

        win = tk.Toplevel(self)
        self._about_win = win
        win.title("Acerca de tribuTACOS")
        win.configure(bg=SURFACE)
        win.geometry("620x640")
        win.minsize(520, 480)
        win.transient(self)

        def _on_close() -> None:
            self._about_win = None
            win.destroy()

        win.protocol("WM_DELETE_WINDOW", _on_close)

        pad = tk.Frame(win, bg=SURFACE, padx=18, pady=14)
        pad.pack(fill=BOTH, expand=True)

        tk.Label(
            pad,
            text="tribuTACOS",
            font=(self._ui_font, 16, "bold"),
            fg=TEXT,
            bg=SURFACE,
            anchor="w",
        ).pack(fill=X)
        tk.Label(
            pad,
            text=f"v{self.version}  {_channel(self.version)}  ·  Panel de Operaciones",
            font=(self._ui_font, 9),
            fg=MUTED,
            bg=SURFACE,
            anchor="w",
        ).pack(fill=X, pady=(0, 10))

        body = ScrolledText(
            pad,
            wrap="word",
            height=22,
            font=(self._ui_font, 10),
            bg="#f8fafc",
            fg=TEXT,
            bd=0,
            highlightthickness=1,
            highlightbackground=BORDER,
            padx=10,
            pady=10,
        )
        body.pack(fill=BOTH, expand=True)
        shot = self._screenshot_hint().replace("\n", "\n     ")
        about_text = (
            "Contacto\n"
            f"  Web     {SITE_URL}\n"
            f"  Correo  {CONTACT_EMAIL}\n"
            f"  Codigo  {GITHUB_URL}\n"
            f"  Issues  {ISSUES_URL}\n"
            "\n"
            "Aviso legal\n"
            f"  {DISCLAIMER}\n"
            "\n"
            "Los datos fiscales no salen de esta computadora. No envies XML, RFC, "
            "UUID ni montos en un ticket publico.\n"
            "\n"
            "Para un ticket o reporte de error\n"
            "  1. Reproduce el fallo. Luego pulsa Copiar ficha tecnica.\n"
            "     Trae version, puertos, SQLite, conteos (sin RFC) y el registro.\n"
            f"  2. {shot}\n"
            f"  3. Abre un issue en GitHub o escribe a {CONTACT_EMAIL}.\n"
            "  4. Pega la ficha, describe que esperabas y adjunta las capturas.\n"
        )
        body.insert("1.0", about_text)
        body.configure(state="disabled")

        def _btn(parent, label: str, cmd, primary: bool = False) -> None:
            tk.Button(
                parent,
                text=label,
                command=cmd,
                font=(self._ui_font, 9, "bold" if primary else "normal"),
                bg=BRAND if primary else SURFACE,
                fg="#ffffff" if primary else TEXT,
                activebackground="#1e293b" if primary else "#f1f5f9",
                activeforeground="#ffffff" if primary else TEXT,
                relief="flat",
                bd=0,
                highlightthickness=1,
                highlightbackground=BORDER,
                padx=10,
                pady=6,
                cursor="hand2",
            ).pack(side=LEFT, padx=(0, 8))

        row1 = tk.Frame(pad, bg=SURFACE)
        row1.pack(fill=X, pady=(12, 0))
        _btn(
            row1,
            "Copiar ficha tecnica",
            lambda: self._copy_text(self._diagnostic_text(), "Ficha tecnica copiada"),
            primary=True,
        )
        _btn(
            row1,
            "Copiar aviso legal",
            lambda: self._copy_text(DISCLAIMER, "Aviso legal copiado"),
        )

        row2 = tk.Frame(pad, bg=SURFACE)
        row2.pack(fill=X, pady=(8, 0))
        _btn(row2, "Abrir web", lambda: webbrowser.open(SITE_URL))
        _btn(row2, "Enviar correo", lambda: webbrowser.open(f"mailto:{CONTACT_EMAIL}"))
        _btn(row2, "Abrir issues", lambda: webbrowser.open(ISSUES_URL))
        tk.Button(
            row2,
            text="Cerrar",
            command=_on_close,
            font=(self._ui_font, 9),
            bg=SURFACE,
            fg=MUTED,
            relief="flat",
            bd=0,
            padx=8,
            pady=6,
            cursor="hand2",
        ).pack(side=RIGHT)

    def _notify_backup_created(self) -> None:
        folder = backup_dir()
        files = list(folder.glob("tributacos-respaldo-*.json.gz"))
        newest = max(files, key=lambda p: p.stat().st_mtime) if files else None
        path_str = str(newest.resolve()) if newest else str(folder.resolve())
        self.enqueue(f"Respaldo: {path_str}")
        messagebox.showinfo(
            "Respaldo creado",
            f"El archivo se guardo en:\n\n{path_str}\n\nSe abrira la carpeta en el explorador.",
            parent=self,
        )
        open_path(folder)

    def _pick_backup_file(self) -> bool:
        folder = backup_dir()
        folder.mkdir(parents=True, exist_ok=True)
        chosen = filedialog.askopenfilename(
            parent=self,
            title="Selecciona un respaldo de tribuTACOS",
            initialdir=str(folder),
            filetypes=[
                ("Respaldos tribuTACOS", "*.json.gz"),
                ("JSON comprimido", "*.gz"),
                ("Todos los archivos", "*.*"),
            ],
        )
        if not chosen:
            return False
        if not messagebox.askyesno(
            "Confirmar",
            "Se reemplazara la base de datos actual por este respaldo.\n"
            "Esta accion no se puede deshacer.\n\n¿Continuar?",
            parent=self,
        ):
            return False
        self._pending_backup = Path(chosen)
        return True

    def _notify_backup_imported(self) -> None:
        messagebox.showinfo(
            "Respaldo restaurado",
            "La base de datos se reemplazo con el archivo seleccionado.\n"
            "Inicia tribuTACOS para ver los datos en la web.",
            parent=self,
        )

    def on_close(self) -> None:
        self.destroy()


def main() -> None:
    app = OperationsPanel()
    app.protocol("WM_DELETE_WINDOW", app.on_close)
    app.mainloop()


if __name__ == "__main__":
    main()
