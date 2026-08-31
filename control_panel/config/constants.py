"""Identificadores, tiempos y parametros tecnicos (sin copy de usuario)."""

from __future__ import annotations

from typing import Final


class Cmd:
    STANDALONE = "standalone"
    DOCKER_UP = "docker-up"
    STOP = "stop"
    DOCKER_DOWN = "docker-down"
    OPEN_BROWSER = "open-browser"
    OPEN_XML_RECIBIDOS = "open-xml-recibidos"
    OPEN_XML_EMITIDOS = "open-xml-emitidos"
    OPEN_PDF_SAT = "open-pdf-sat"
    DB_IMPORT_XML = "db-import-xml"
    DB_IMPORT_SAT = "db-import-sat"
    DB_EXPORT = "db-export"
    DB_IMPORT_BACKUP = "db-import-backup"
    CLEAR_CACHE = "clear-cache"
    DB_RESET = "db-reset"
    DB_SEED = "db-seed"
    OPEN_DATA = "open-data"
    OPEN_MANUAL_INSTALL = "open-manual-install"
    OPEN_MANUAL_USER = "open-manual-user"
    OPEN_MANUAL_TECH = "open-manual-tech"
    ABOUT = "about"
    DOCTOR = "doctor"
    SETUP = "setup"


class TabId:
    INICIO = "inicio"
    SISTEMA = "sistema"
    ARCHIVOS = "archivos"
    DATOS = "datos"
    AYUDA = "ayuda"


class StatusKind:
    STOPPED = "detenido"
    ONLINE = "en_linea"
    STARTING = "arrancando"
    ERROR = "error"
    BUSY = "ocupado"


class DistributionMode:
    INSTALLED = "installed"
    DOCKER = "docker"
    DEV = "dev"


class IngestKey:
    RECIBIDOS = "recibidos"
    EMITIDOS = "emitidos"
    DESCARGADOS = "descargados"


class ManualKey:
    USER = "user"
    TECH = "tech"
    INSTALL = "install"


class Layout:
    WINDOW_GEOMETRY = "840x900"
    WINDOW_MIN_WIDTH = 720
    WINDOW_MIN_HEIGHT = 680
    ABOUT_GEOMETRY = "620x640"
    ABOUT_MIN_WIDTH = 520
    ABOUT_MIN_HEIGHT = 480
    LOG_HEIGHT = 6
    HINT_WRAP = 740
    HERO_WRAP = 760
    CARD_DESC_WRAP = 520
    ARCHIVOS_DESC_WRAP = 720
    BUSY_BAR_HEIGHT = 3
    HEADER_ACCENT_HEIGHT = 2
    STATUS_DOT_SIZE = 10


class Timing:
    LOG_DRAIN_MS = 100
    HEALTH_POLL_MS = 2000
    HEALTH_CHECK_TIMEOUT_S = 0.35
    HEALTH_WAIT_TIMEOUT_S = 1.0
    HEALTH_WAIT_RETRIES = 60
    HEALTH_WAIT_SLEEP_S = 0.5
    BROWSER_OPEN_DELAY_MS = 2000
    SERVER_STOP_TIMEOUT_S = 5
    SERVER_KILL_TIMEOUT_S = 3


class ServerConfig:
    HEALTH_PATH = "/api/health"
    NO_BROWSER_ENV = "TRIBUTACOS_NO_BROWSER"
    NO_BROWSER_VALUE = "1"
    FROZEN_EXE = "tributacos.exe"
    STANDALONE_ARG = "standalone"


class BackupConfig:
    GLOB = "tributacos-respaldo-*.json.gz"
    FILETYPES: Final[list[tuple[str, str]]] = [
        ("Respaldos tribuTACOS", "*.json.gz"),
        ("JSON comprimido", "*.gz"),
        ("Todos los archivos", "*.*"),
    ]


UI_FONT_CANDIDATES: Final[tuple[str, ...]] = (
    "Segoe UI",
    "SF Pro Text",
    "Helvetica Neue",
    "Ubuntu",
    "Cantarell",
    "DejaVu Sans",
)

MONO_FONT_WIN = "Consolas"
MONO_FONT_UNIX = "DejaVu Sans Mono"
DEFAULT_UI_FONT = "TkDefaultFont"

TTK_THEME = "clam"

BUSY_ALLOWED_COMMANDS: Final[frozenset[str]] = frozenset(
    {Cmd.STOP, Cmd.DOCKER_DOWN, Cmd.ABOUT}
)

RESTART_DB_COMMANDS: Final[frozenset[str]] = frozenset(
    {Cmd.DB_RESET, Cmd.DB_SEED, Cmd.DB_IMPORT_BACKUP}
)

STOP_COMMANDS: Final[frozenset[str]] = frozenset({Cmd.STOP, Cmd.DOCKER_DOWN})

START_COMMANDS: Final[frozenset[str]] = frozenset({Cmd.STANDALONE, Cmd.DOCKER_UP})

PRIMARY_COMMANDS: Final[frozenset[str]] = frozenset({Cmd.STANDALONE, Cmd.DOCKER_UP, Cmd.SETUP})

SECONDARY_COMMANDS: Final[frozenset[str]] = frozenset({Cmd.STOP, Cmd.DOCKER_DOWN})

OPEN_COMMAND_PREFIX = "open-"
OPEN_MANUAL_PREFIX = "open-manual-"

LOG_SKIP_TOKENS: Final[tuple[str, ...]] = (
    "Ficha tecnica copiada",
    "Aviso legal copiado",
    "URL copiada",
)

LOG_EMPTY_TAIL = "(sin registro de acciones)"
LOG_TAIL_LINES = 50
