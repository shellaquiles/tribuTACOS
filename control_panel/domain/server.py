"""Ciclo de vida del servidor local (standalone / health check)."""

from __future__ import annotations

import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from control_panel.infra.bootstrap import RUNNER, ensure_import_paths
from control_panel.config.constants import ServerConfig, StatusKind, Timing
from control_panel.config.copy import LogCopy, ServerCopy

ensure_import_paths()

from tributacos_core.runtime import get_app_url, is_frozen, project_root  # noqa: E402
from tributacos import run_command, venv_python  # noqa: E402

LogFn = Callable[[str], None]
StatusFn = Callable[[str, str | None], None]
BusyFn = Callable[[bool], None]
ScheduleFn = Callable[[Callable[[], None], int], None]


@dataclass
class ServerManager:
    """Arranca, vigila y detiene el servidor tribuTACOS en un subproceso."""

    log: LogFn
    set_status: StatusFn
    set_busy: BusyFn
    schedule: ScheduleFn
    process: subprocess.Popen[str] | None = field(default=None, init=False)

    def health_url(self) -> str:
        return f"{get_app_url().rstrip('/')}{ServerConfig.HEALTH_PATH}"

    def is_up(self) -> bool:
        if self.process is not None and self.process.poll() is None:
            return True
        try:
            urllib.request.urlopen(self.health_url(), timeout=Timing.HEALTH_CHECK_TIMEOUT_S)
            return True
        except (urllib.error.URLError, TimeoutError, OSError):
            return False

    def stop_spawned(self) -> None:
        proc = self.process
        self.process = None
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=Timing.SERVER_STOP_TIMEOUT_S)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=Timing.SERVER_KILL_TIMEOUT_S)
        run_command("stop")

    def spawn_standalone(self) -> None:
        if self.process and self.process.poll() is None:
            self.log(ServerCopy.already_running)
            self.schedule(lambda: self.set_status(StatusKind.ONLINE, None), 0)
            self.schedule(lambda: self.set_busy(False), 0)
            webbrowser.open(get_app_url())
            return
        if self.is_up():
            self.log(ServerCopy.port_in_use)
            self.schedule(lambda: self.set_status(StatusKind.ONLINE, None), 0)
            self.schedule(lambda: self.set_busy(False), 0)
            webbrowser.open(get_app_url())
            return
        if is_frozen():
            sibling = Path(sys.executable).resolve().parent / ServerConfig.FROZEN_EXE
            cmd = [str(sibling)] if sibling.exists() else [sys.executable]
        else:
            py = venv_python()
            if not py.exists():
                self.log(ServerCopy.venv_missing)
                self.schedule(lambda: self.set_status(StatusKind.ERROR, None), 0)
                self.schedule(lambda: self.set_busy(False), 0)
                return
            cmd = [str(py), str(RUNNER), ServerConfig.STANDALONE_ARG]
        self.log(ServerCopy.cmd_prefix.format(cmd=" ".join(cmd)))
        env = os.environ.copy()
        env[ServerConfig.NO_BROWSER_ENV] = ServerConfig.NO_BROWSER_VALUE
        self.process = subprocess.Popen(
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
        assert self.process.stdout is not None
        threading.Thread(target=self._stream_output, args=(self.process,), daemon=True).start()
        threading.Thread(target=self._wait_and_open_browser, args=(True,), daemon=True).start()
        self.schedule(lambda: self.set_status(StatusKind.STARTING, None), 0)
        self.schedule(lambda: self.set_busy(False), 0)

    def _wait_and_open_browser(self, reload_page: bool = False) -> None:
        url = get_app_url().rstrip("/")
        health = f"{url}{ServerConfig.HEALTH_PATH}"
        for _ in range(Timing.HEALTH_WAIT_RETRIES):
            proc = self.process
            if proc is not None and proc.poll() is not None:
                self.schedule(
                    lambda: self.set_status(StatusKind.ERROR, LogCopy.status_start_failed),
                    0,
                )
                self.log(ServerCopy.died_early)
                return
            try:
                urllib.request.urlopen(health, timeout=Timing.HEALTH_WAIT_TIMEOUT_S)
                open_url = f"{url}/?t={int(time.time())}" if reload_page else url
                webbrowser.open(open_url)
                self.schedule(lambda: self.set_status(StatusKind.ONLINE, None), 0)
                self.log(ServerCopy.ready_at.format(url=url))
                return
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(Timing.HEALTH_WAIT_SLEEP_S)
        self.log(ServerCopy.timeout)
        self.schedule(
            lambda: self.set_status(StatusKind.ERROR, LogCopy.status_no_response),
            0,
        )

    def _stream_output(self, proc: subprocess.Popen[str]) -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            text = line.rstrip()
            if text:
                self.log(text)
        code = proc.wait()
        if proc is not self.process:
            return
        self.log(ServerCopy.stopped.format(code=code))
        self.schedule(lambda: self.set_status(StatusKind.STOPPED, None), 0)
