"""Ventana principal del Panel de Operaciones."""

from __future__ import annotations

import queue
import threading
import webbrowser
from datetime import datetime
from pathlib import Path
from tkinter import END, filedialog, messagebox, ttk
import tkinter as tk

from control_panel.ui.about import AboutDialog
from control_panel.infra.bootstrap import ensure_import_paths
from control_panel.config.catalog import INGEST_COMMAND_KEYS, MANUAL_COMMAND_KEYS, MANUAL_LABELS
from control_panel.config.constants import (
    BackupConfig,
    BUSY_ALLOWED_COMMANDS,
    Cmd,
    Layout,
    LOG_EMPTY_TAIL,
    LOG_SKIP_TOKENS,
    LOG_TAIL_LINES,
    OPEN_COMMAND_PREFIX,
    OPEN_MANUAL_PREFIX,
    RESTART_DB_COMMANDS,
    STOP_COMMANDS,
    StatusKind,
    Timing,
    DistributionMode,
)
from control_panel.config.copy import (
    BRAND,
    DialogCopy,
    InicioCopy,
    LogCopy,
    STATUS_BUSY_LABELS,
    STATUS_LABELS,
)
from control_panel.domain.models import TaskAction
from control_panel.domain.server import ServerManager
from control_panel.config.theme import Theme, THEME, apply_ttk_theme, mono_font, pick_ui_font
from control_panel.ui.views import PanelViewBuilder

ensure_import_paths()

from tributacos_core.runtime import (  # noqa: E402
    backup_dir,
    diagnostic_report,
    distribution_mode,
    get_app_url,
    manual_pdfs,
    open_data_folder,
    open_ingest_folder,
    open_path,
    read_version,
)
from tributacos import run_command  # noqa: E402


class OperationsPanel(tk.Tk):
    """Panel Tkinter: acciones de sistema fuera de la interfaz web fiscal."""

    def __init__(self, theme: Theme = THEME) -> None:
        super().__init__()
        self._theme = theme
        self.mode = distribution_mode()
        self.version = read_version()
        self.title(BRAND.window_title)
        self.geometry(Layout.WINDOW_GEOMETRY)
        self.minsize(Layout.WINDOW_MIN_WIDTH, Layout.WINDOW_MIN_HEIGHT)
        self.configure(bg=theme.bg)

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.busy = False
        self._pending_backup: Path | None = None
        self._action_controls: list[tuple[ttk.Button, TaskAction]] = []
        self._status_kind = StatusKind.STOPPED
        self._browser_btn: ttk.Button | None = None
        self._start_btn: ttk.Button | None = None
        self._guide_var: tk.StringVar | None = None
        self._url = get_app_url()
        self._status_dot: tk.Canvas | None = None
        self._dot_id: int | None = None
        self._busy_bar: tk.Frame | None = None
        self.status_var: tk.StringVar | None = None
        self.log_text: tk.Text | None = None
        self._notebook: ttk.Notebook | None = None

        self._ui_font = pick_ui_font(self)
        self._mono_font = mono_font()
        self._style = ttk.Style(self)
        apply_ttk_theme(self._style, self._ui_font, theme)

        self._server = ServerManager(
            log=self.enqueue,
            set_status=self._set_status,
            set_busy=self._set_busy_ui,
            schedule=lambda fn, ms: self.after(ms, fn),
        )
        self._about = AboutDialog(
            self,
            version=self.version,
            ui_font=self._ui_font,
            diagnostic_text=self._diagnostic_text,
            on_copy=self._copy_text,
            theme=theme,
        )
        self._views = PanelViewBuilder(self)

        self._views.build_layout()
        self._welcome()
        self._refresh_context_actions()
        self.after(Timing.LOG_DRAIN_MS, self._drain_log_queue)
        self.after(Timing.HEALTH_POLL_MS, self._poll_health)

    def _welcome(self) -> None:
        self.log(LogCopy.welcome_1)
        self.log(LogCopy.welcome_2)
        self.log(LogCopy.welcome_url.format(url=self._url))

    def _refresh_context_actions(self) -> None:
        up = self._server.is_up()
        if self._guide_var is not None:
            if up:
                self._guide_var.set(InicioCopy.guide_ready)
            elif self.busy:
                self._guide_var.set(InicioCopy.guide_busy)
            else:
                self._guide_var.set(InicioCopy.guide_idle)
        if self._browser_btn is not None:
            state = "normal" if up and not self.busy else "disabled"
            self._browser_btn.configure(state=state)
            self._browser_btn.configure(
                style="Accent.TButton" if up and not self.busy else "Secondary.TButton"
            )
        if self._start_btn is not None:
            if up and not self.busy:
                self._start_btn.configure(state="disabled")
            elif not self.busy:
                self._start_btn.configure(state="normal")

    def _set_status(self, kind: str, text: str | None = None) -> None:
        self._status_kind = kind
        label = text if text is not None else STATUS_LABELS.get(kind, kind)
        if self.status_var is not None:
            self.status_var.set(label)
        if self._status_dot is not None and self._dot_id is not None:
            self._status_dot.itemconfigure(self._dot_id, fill=self._theme.status_color(kind))
        self.after(0, self._refresh_context_actions)

    def _set_busy_ui(self, busy: bool) -> None:
        self.busy = busy
        if self._busy_bar is not None:
            self._busy_bar.configure(bg=self._theme.blue if busy else self._theme.header_bg)
        for btn, task in self._action_controls:
            always = task.command in BUSY_ALLOWED_COMMANDS or task.command.startswith(OPEN_COMMAND_PREFIX)
            btn.configure(state="normal" if (not busy or always) else "disabled")
        self._refresh_context_actions()

    def log(self, message: str) -> None:
        assert self.log_text is not None
        stamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert(END, f"{stamp}  {message}\n")
        self.log_text.see(END)
        self.log_text.configure(state="disabled")

    def clear_log(self) -> None:
        assert self.log_text is not None
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
        self.after(Timing.LOG_DRAIN_MS, self._drain_log_queue)

    def _poll_health(self) -> None:
        if not self.busy:
            if self._server.is_up():
                if self._status_kind != StatusKind.ONLINE:
                    self._set_status(StatusKind.ONLINE)
            elif self._status_kind == StatusKind.ONLINE:
                self._set_status(StatusKind.STOPPED)
            else:
                self._refresh_context_actions()
        self.after(Timing.HEALTH_POLL_MS, self._poll_health)

    def _open_browser(self) -> None:
        webbrowser.open(get_app_url())
        self._set_status(StatusKind.BUSY, STATUS_BUSY_LABELS["browser"])
        self.log(LogCopy.browser_opened)

    def _copy_url(self) -> None:
        url = get_app_url()
        self.clipboard_clear()
        self.clipboard_append(url)
        self._set_status(StatusKind.BUSY, STATUS_BUSY_LABELS["url"])
        self.log(LogCopy.url_copied.format(url=url))

    def _copy_text(self, text: str, ok_msg: str) -> None:
        self.clipboard_clear()
        self.clipboard_append(text)
        self._set_status(StatusKind.BUSY, ok_msg)
        self.log(ok_msg)

    def _diagnostic_text(self) -> str:
        log = ""
        if self.log_text is not None:
            try:
                log = self.log_text.get("1.0", END).strip()
            except tk.TclError:
                pass
        kept = [line for line in log.splitlines() if not any(token in line for token in LOG_SKIP_TOKENS)]
        tail = "\n".join(kept[-LOG_TAIL_LINES:]) if kept else LOG_EMPTY_TAIL
        return diagnostic_report(log_tail=tail, server_up=self._server.is_up())

    def run_task(self, task: TaskAction) -> None:
        if (
            self.busy
            and task.command not in BUSY_ALLOWED_COMMANDS
            and not task.command.startswith(OPEN_COMMAND_PREFIX)
        ):
            messagebox.showwarning(DialogCopy.busy_title, DialogCopy.busy_message, parent=self)
            return
        if task.confirm and not messagebox.askyesno(DialogCopy.confirm_title, task.confirm, parent=self):
            return
        if task.command == Cmd.DB_IMPORT_BACKUP and not self._pick_backup_file():
            return
        if task.command == Cmd.OPEN_BROWSER:
            self._open_browser()
            return
        if task.command == Cmd.OPEN_DATA:
            open_data_folder()
            self.enqueue(LogCopy.data_folder_opened)
            return
        if task.command in INGEST_COMMAND_KEYS:
            path = open_ingest_folder(INGEST_COMMAND_KEYS[task.command])
            self.enqueue(LogCopy.ingest_folder_opened.format(path=path))
            self._set_status(StatusKind.BUSY, STATUS_BUSY_LABELS["folder"])
            return
        if task.command.startswith(OPEN_MANUAL_PREFIX):
            key = MANUAL_COMMAND_KEYS.get(task.command)
            if key:
                self._open_manual(key)
            return
        if task.command == Cmd.ABOUT:
            self._about.show()
            return
        threading.Thread(target=self._execute, args=(task,), daemon=True).start()

    def _execute(self, task: TaskAction) -> None:
        self.busy = True
        self.after(0, lambda: self._set_busy_ui(True))
        self.after(0, lambda: self._set_status(StatusKind.BUSY))
        self.enqueue(LogCopy.task_start.format(label=task.label))
        try:
            if task.command == Cmd.STANDALONE:
                self._server.spawn_standalone()
                return
            restart_web = task.command in RESTART_DB_COMMANDS and self.mode != DistributionMode.DOCKER
            server_was_up = restart_web and self._server.is_up()
            if restart_web and server_was_up:
                self.enqueue(LogCopy.db_stop_for_restore)
                self._server.stop_spawned()
            extra: dict[str, Path] = {}
            if task.command == Cmd.DB_IMPORT_BACKUP:
                if self._pending_backup is None:
                    self.enqueue(LogCopy.backup_missing)
                    self.after(0, lambda: self._set_status(StatusKind.STOPPED, LogCopy.status_cancelled))
                    return
                extra["backup_path"] = self._pending_backup
                self._pending_backup = None
            code = run_command(task.command, **extra)
            self.enqueue(LogCopy.task_done.format(code=code))
            if task.command in STOP_COMMANDS:
                self.after(0, lambda: self._set_status(StatusKind.STOPPED))
            elif restart_web and server_was_up and code == 0:
                self.enqueue(LogCopy.db_restart)
                self._server.spawn_standalone()
                return
            elif task.long_running:
                self.after(0, lambda: self._set_status(StatusKind.STARTING))
                self.after(Timing.BROWSER_OPEN_DELAY_MS, lambda: webbrowser.open(get_app_url()))
            else:
                if self._server.is_up():
                    kind = StatusKind.ONLINE
                elif code == 0:
                    kind = StatusKind.STOPPED
                else:
                    kind = StatusKind.ERROR
                label = LogCopy.status_ready if code == 0 else LogCopy.status_error_code.format(code=code)
                self.after(0, lambda k=kind, l=label: self._set_status(k, l))
                if restart_web and code == 0:
                    self.enqueue(LogCopy.db_ready)
                if task.command == Cmd.DB_EXPORT and code == 0:
                    self.after(0, self._notify_backup_created)
                if task.command == Cmd.DB_IMPORT_BACKUP and code == 0 and not (restart_web and server_was_up):
                    self.after(0, self._notify_backup_imported)
        except Exception as exc:
            self.enqueue(LogCopy.task_error.format(error=exc))
            self.after(0, lambda: self._set_status(StatusKind.ERROR))
        finally:
            if task.command != Cmd.STANDALONE:
                self.after(0, lambda: self._set_busy_ui(False))

    def _open_manual(self, which: str) -> None:
        pdfs = manual_pdfs()
        path = pdfs.get(which)
        label = MANUAL_LABELS.get(which, which)
        if path is None:
            messagebox.showwarning(
                DialogCopy.manual_missing_title,
                DialogCopy.manual_missing_body,
                parent=self,
            )
            self.enqueue(LogCopy.manual_missing.format(label=label))
            return
        open_path(path)
        self.enqueue(LogCopy.manual_opened.format(name=path.name))
        self._set_status(StatusKind.BUSY, STATUS_BUSY_LABELS["manual"])

    def _notify_backup_created(self) -> None:
        folder = backup_dir()
        files = list(folder.glob(BackupConfig.GLOB))
        newest = max(files, key=lambda p: p.stat().st_mtime) if files else None
        path_str = str(newest.resolve()) if newest else str(folder.resolve())
        self.enqueue(LogCopy.backup_path.format(path=path_str))
        messagebox.showinfo(
            DialogCopy.backup_created_title,
            DialogCopy.backup_created_body.format(path=path_str),
            parent=self,
        )
        open_path(folder)

    def _pick_backup_file(self) -> bool:
        folder = backup_dir()
        folder.mkdir(parents=True, exist_ok=True)
        chosen = filedialog.askopenfilename(
            parent=self,
            title=DialogCopy.backup_pick_title,
            initialdir=str(folder),
            filetypes=BackupConfig.FILETYPES,
        )
        if not chosen:
            return False
        if not messagebox.askyesno(
            DialogCopy.confirm_title,
            DialogCopy.backup_restore_confirm,
            parent=self,
        ):
            return False
        self._pending_backup = Path(chosen)
        return True

    def _notify_backup_imported(self) -> None:
        messagebox.showinfo(
            DialogCopy.backup_restore_title,
            DialogCopy.backup_restore_body,
            parent=self,
        )

    def on_close(self) -> None:
        self.destroy()
