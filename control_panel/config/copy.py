"""Textos, URLs y definiciones de tareas (sin logica)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from control_panel.config.constants import Cmd, DistributionMode, ManualKey, StatusKind, TabId


@dataclass(frozen=True, slots=True)
class Brand:
    name: str = "tribuTACOS"
    panel_title: str = "Panel de Operaciones"
    site: str = "https://shellaquiles.org"
    github: str = "https://github.com/shellaquiles/tributacos"
    email: str = "tributacos@shellaquiles.org"

    @property
    def issues(self) -> str:
        return f"{self.github}/issues"

    @property
    def window_title(self) -> str:
        return f"{self.name} — {self.panel_title}"

    @property
    def about_title(self) -> str:
        return f"Acerca de {self.name}"


@dataclass(frozen=True, slots=True)
class TaskCopy:
    label: str
    description: str
    tooltip: str = ""
    confirm: str | None = None
    icon: str = ""


BRAND = Brand()

DISCLAIMER = (
    "Aviso legal: tribuTACOS es una plataforma de analisis, proyeccion y "
    "simulacion fiscal basada en la interpretacion algoritmica de comprobantes "
    "digitales (CFDI) y la legislacion mexicana (LISR y LIVA). Los calculos, "
    "proyecciones y determinaciones son estrictamente estimativos e informativos; "
    "no constituyen asesoria fiscal, contable o legal vinculante, y no sustituyen "
    "las declaraciones ni obligaciones presentadas ante el SAT."
)

DISTRIBUTION_MODE_LABELS: Final[dict[str, str]] = {
    DistributionMode.INSTALLED: "Instalado",
    DistributionMode.DOCKER: "Docker",
    DistributionMode.DEV: "Desarrollo",
}

TAB_LABELS: Final[dict[str, str]] = {
    TabId.INICIO: "Inicio",
    TabId.SISTEMA: "Sistema",
    TabId.ARCHIVOS: "Tus archivos",
    TabId.DATOS: "Respaldo",
    TabId.AYUDA: "Ayuda",
}

TAB_HINTS: Final[dict[str, str]] = {
    TabId.INICIO: "Arranca tribuTACOS y abre la interfaz fiscal en el navegador.",
    TabId.SISTEMA: "Solo desarrollo: comprueba herramientas e instala dependencias.",
    TabId.ARCHIVOS: "1) Pega archivos  ·  2) Procesa XML o PDF locales  ·  3) Ve a Inicio",
    TabId.DATOS: "Exporta antes de limpiar. Las acciones en rojo son irreversibles.",
    TabId.AYUDA: "Manuales PDF, carpeta de datos y contacto de soporte.",
}

STATUS_LABELS: Final[dict[str, str]] = {
    StatusKind.STOPPED: "Detenido",
    StatusKind.ONLINE: "En ejecucion",
    StatusKind.STARTING: "Arrancando...",
    StatusKind.ERROR: "Error",
    StatusKind.BUSY: "En ejecucion...",
}

STATUS_BUSY_LABELS: Final[dict[str, str]] = {
    "browser": "Navegador abierto",
    "url": "URL copiada",
    "folder": "Carpeta abierta",
    "manual": "Manual abierto",
}

ACTION_BUTTON_LABELS: Final[dict[str, str]] = {
    "open": "Abrir",
    Cmd.DB_IMPORT_XML: "Procesar XML",
    Cmd.DB_IMPORT_SAT: "Procesar PDFs",
    "default": "Ejecutar",
}

HERO_BUTTON_LABELS: Final[dict[str, str]] = {
    Cmd.OPEN_BROWSER: "Abrir navegador",
    Cmd.STANDALONE: "Iniciar",
    Cmd.DOCKER_UP: "Iniciar",
    Cmd.STOP: "Detener",
    Cmd.DOCKER_DOWN: "Detener",
}

MANUAL_LABELS: Final[dict[str, str]] = {
    ManualKey.USER: "Manual de usuario",
    ManualKey.TECH: "Documentacion tecnica",
    ManualKey.INSTALL: "Guia de instalacion",
}

MANUAL_COMMAND_KEYS: Final[dict[str, str]] = {
    Cmd.OPEN_MANUAL_USER: ManualKey.USER,
    Cmd.OPEN_MANUAL_TECH: ManualKey.TECH,
    Cmd.OPEN_MANUAL_INSTALL: ManualKey.INSTALL,
}

INGEST_COMMAND_KEYS: Final[dict[str, str]] = {
    Cmd.OPEN_XML_RECIBIDOS: "recibidos",
    Cmd.OPEN_XML_EMITIDOS: "emitidos",
    Cmd.OPEN_PDF_SAT: "descargados",
}

RELEASE_CHANNEL_STABLE = "STABLE"

STEP_LABEL_TEMPLATE = "PASO {step}"

class ShellCopy:
    about_link = "Acerca de"
    log_heading = "REGISTRO DE ACTIVIDAD"
    log_clear = "Limpiar"
    footer = "shellaquiles.org  ·  La interfaz fiscal vive en el navegador"


class InicioCopy:
    section = "Servidor local"
    title = "Interfaz fiscal en el navegador"
    description = (
        "Este panel prepara el entorno. Dashboard, declaracion, XML y CSV se usan en el navegador."
    )
    url_heading = "Direccion local"
    copy_url = "Copiar"
    guide_ready = "Listo: abre el navegador para trabajar la declaracion y el dashboard."
    guide_busy = "Espera a que termine la tarea en curso..."
    guide_idle = "Pulsa Iniciar. Cuando el estado diga En ejecucion, abre el navegador."
    start_label_default = "Iniciar tribuTACOS"
    start_label_docker = "Iniciar con Docker"
    start_desc_default = "Servidor unico en el puerto 8080 y abre el navegador"
    start_desc_docker = "Levanta los contenedores y abre el navegador"
    stop_label = "Detener tribuTACOS"
    stop_desc = "Cierra el servidor y libera el puerto 8080"
    browser_label = "Abrir declaracion en el navegador"
    browser_desc = "Dashboard, XML, CSV y conciliacion SAT"


class ArchivosCopy:
    step_one = "PASO 1"
    step_title = "Coloca tus archivos"
    step_description = (
        "Abre la carpeta que corresponda, pega ahi tus archivos y cierra el explorador."
    )
    open_folder = "Abrir carpeta"
    path_hint_template = "{tooltip}\n\nRuta: {path}"


class DatosCopy:
    safe_section = "Operaciones seguras"
    danger_section = "Zona de riesgo"


class AboutCopy:
    close = "Cerrar"
    copy_diagnostic = "Copiar ficha tecnica"
    copy_disclaimer = "Copiar aviso legal"
    open_web = "Abrir web"
    send_email = "Enviar correo"
    open_issues = "Abrir issues"
    diagnostic_copied = "Ficha tecnica copiada"
    disclaimer_copied = "Aviso legal copiado"
    subtitle_template = "v{version}  {channel}  ·  {panel_title}"
    privacy_note = (
        "Los datos fiscales no salen de esta computadora. No envies XML, RFC, "
        "UUID ni montos en un ticket publico."
    )
    ticket_heading = "Para un ticket o reporte de error"
    ticket_steps = (
        "  1. Reproduce el fallo. Luego pulsa Copiar ficha tecnica.\n"
        "     Trae version, puertos, SQLite, conteos (sin RFC) y el registro.\n"
        "  2. {screenshot}\n"
        "  3. Abre un issue en GitHub o escribe a {email}.\n"
        "  4. Pega la ficha, describe que esperabas y adjunta las capturas.\n"
    )
    contact_heading = "Contacto\n"
    contact_web = "  Web     {url}\n"
    contact_email = "  Correo  {email}\n"
    contact_code = "  Codigo  {url}\n"
    contact_issues = "  Issues  {url}\n"
    legal_heading = "\nAviso legal\n  {disclaimer}\n"


class DialogCopy:
    confirm_title = "Confirmar"
    busy_title = "Ocupado"
    busy_message = "Espera a que termine la tarea actual."
    manual_missing_title = "Manual no encontrado"
    manual_missing_body = (
        "No esta el PDF en el proyecto. Compilalo con:\n\n"
        "  make pdf-manual, make pdf-tecnica o make pdf-instalacion"
    )
    backup_created_title = "Respaldo creado"
    backup_created_body = (
        "El archivo se guardo en:\n\n{path}\n\nSe abrira la carpeta en el explorador."
    )
    backup_restore_title = "Respaldo restaurado"
    backup_restore_body = (
        "La base de datos se reemplazo con el archivo seleccionado.\n"
        "Inicia tribuTACOS para ver los datos en la web."
    )
    backup_restore_confirm = (
        "Se reemplazara la base de datos actual por este respaldo.\n"
        "Esta accion no se puede deshacer.\n\n¿Continuar?"
    )
    backup_pick_title = "Selecciona un respaldo de tribuTACOS"


class LogCopy:
    welcome_1 = f"{BRAND.panel_title} de {BRAND.name}."
    welcome_2 = "Pestaña Inicio: arranca el servidor. Tus archivos: carga XML y PDFs."
    welcome_url = "URL fiscal: {url}"
    browser_opened = "Navegador abierto."
    url_copied = "URL copiada: {url}"
    data_folder_opened = "Carpeta de datos abierta."
    ingest_folder_opened = "Carpeta abierta: {path}"
    manual_opened = "Abierto: {name}"
    manual_missing = "{label}: PDF no encontrado."
    task_start = ">>> {label}"
    task_done = "Finalizado (codigo {code})"
    task_error = "Error: {error}"
    backup_path = "Respaldo: {path}"
    db_stop_for_restore = "Deteniendo el servidor para poder reemplazar la base de datos..."
    db_restart = "Reiniciando el servidor para actualizar la pagina..."
    db_ready = "Base lista. Inicia tribuTACOS para ver los cambios en la web."
    backup_missing = "No se selecciono un archivo de respaldo."
    status_ready = "Listo"
    status_error_code = "Error {code}"
    status_start_failed = "Error al iniciar"
    status_no_response = "Sin respuesta"
    status_cancelled = "Cancelado"


class ServerCopy:
    already_running = "La aplicacion ya esta en ejecucion."
    port_in_use = "Ya hay un servidor en el puerto. Se abre el navegador."
    venv_missing = (
        "No esta el entorno Python (backend/venv). "
        "Usa «Instalar y preparar» en la seccion Sistema."
    )
    cmd_prefix = "$ {cmd}"
    ready_at = "Listo en {url}"
    died_early = "El servidor termino antes de abrir el puerto. Revisa el registro."
    timeout = "El servidor no respondio a tiempo. Revisa el registro."
    stopped = "Servidor detenido (codigo {code})"


SCREENSHOT_HINTS: Final[dict[str, str]] = {
    "win32": (
        "Windows: Win + Mayus + S (recorte) o Alt + Impr Pant (esta ventana).\n"
        "Si el fallo esta en la declaracion, captura tambien el navegador."
    ),
    "darwin": (
        "macOS: Cmd + Mayus + 4 (recorte) o Cmd + Mayus + 3 (pantalla).\n"
        "Si el fallo esta en la declaracion, captura tambien el navegador."
    ),
    "default": (
        "Linux: Impr Pant o la herramienta de recorte del escritorio.\n"
        "Si el fallo esta en la declaracion, captura tambien el navegador."
    ),
}

TASKS: Final[dict[str, TaskCopy]] = {
    Cmd.OPEN_XML_RECIBIDOS: TaskCopy(
        label="Facturas que te emitieron",
        description="Nominas y facturas de proveedores, patrones y terceros",
        tooltip=(
            "Abre la carpeta de XML recibidos, pega tus .xml y vuelve "
            "para pulsar «Procesar XML»."
        ),
    ),
    Cmd.OPEN_XML_EMITIDOS: TaskCopy(
        label="Facturas que tu emitiste",
        description="Lo que facturaste a clientes y terceros",
        tooltip=(
            "Abre la carpeta de XML emitidos, pega tus .xml y vuelve "
            "para pulsar «Procesar XML»."
        ),
    ),
    Cmd.OPEN_PDF_SAT: TaskCopy(
        label="PDFs generados por el SAT",
        description="Declaracion anual, pagos provisionales de ISR/IVA y acuses de pago",
        tooltip=(
            "Abre la carpeta donde pegas los PDF que tu descargaste en "
            "sat.gob.mx (no se conecta al portal). Tipos: declaracion anual, "
            "declaraciones mensuales/provisionales y acuses con linea de captura. "
            "Despues usa «Procesar PDFs»."
        ),
    ),
    Cmd.DB_IMPORT_XML: TaskCopy(
        label="Procesar facturas XML",
        description="Incorpora a la app los .xml que pegaste en emitidos y recibidos",
        tooltip=(
            "Escanea las carpetas locales y guarda los CFDI en tu base. "
            "Solo archivos en tu PC; no descarga nada de internet."
        ),
    ),
    Cmd.DB_IMPORT_SAT: TaskCopy(
        label="Procesar PDFs descargados",
        description="Extrae cifras de PDFs que ya pegaste (sin conexion al portal del SAT)",
        tooltip=(
            "Lee en tu computadora declaraciones anuales, pagos provisionales "
            "y acuses en PDF. tribuTACOS no abre sesion en el SAT ni descarga "
            "nada en linea."
        ),
    ),
    Cmd.DB_EXPORT: TaskCopy(
        label="Exportar respaldo",
        description="Copia fechada en respaldos/ (recomendado antes de limpiar)",
        icon="+",
    ),
    Cmd.DB_IMPORT_BACKUP: TaskCopy(
        label="Restaurar respaldo",
        description="Elige un .json.gz y reemplaza la base actual",
        icon="←",
    ),
    Cmd.CLEAR_CACHE: TaskCopy(
        label="Limpiar cache de calculos",
        description="Fuerza recalculo de ISR e IVA en la web",
        confirm="¿Limpiar la cache de calculos fiscales?",
        icon="×",
    ),
    Cmd.DB_RESET: TaskCopy(
        label="Limpiar base de datos",
        description="Borra CFDIs y deja solo catalogos SAT",
        confirm=(
            "Se eliminara la base de datos actual.\n"
            "Esta accion no se puede deshacer.\n\n¿Continuar?"
        ),
        icon="!",
    ),
    Cmd.DB_SEED: TaskCopy(
        label="Cargar datos demo",
        description="139 CFDIs de ejemplo para probar la app",
        confirm="Se reemplazara tu base de datos por el dataset demo.\n\n¿Continuar?",
        icon="!",
    ),
    Cmd.OPEN_DATA: TaskCopy(
        label="Ver datos de la app",
        description="Base local, respaldos y configuracion en tu equipo",
        tooltip="Abre la carpeta donde tribuTACOS guarda la base SQLite y los respaldos.",
    ),
    Cmd.OPEN_MANUAL_INSTALL: TaskCopy(
        label="Guia de instalacion",
        description="Windows, Docker y este panel",
        icon="?",
    ),
    Cmd.OPEN_MANUAL_USER: TaskCopy(
        label="Manual de usuario",
        description="Interfaz fiscal en el navegador",
        icon="?",
    ),
    Cmd.OPEN_MANUAL_TECH: TaskCopy(
        label="Documentacion tecnica",
        description="Arquitectura, API y motor fiscal",
        icon="?",
    ),
    Cmd.ABOUT: TaskCopy(
        label="Acerca de y soporte",
        description="Contacto, aviso legal y ficha para reportar errores",
        icon="i",
    ),
    Cmd.DOCTOR: TaskCopy(
        label="Verificar requisitos",
        description="Python, Node.js y Docker",
        icon="✓",
    ),
    Cmd.SETUP: TaskCopy(
        label="Instalar dependencias (primera vez)",
        description="venv, npm y datos demo",
        icon="*",
    ),
}


def release_channel(version: str) -> str:
    if "-" in version:
        return version.split("-", 1)[1].split(".")[0].upper()
    return RELEASE_CHANNEL_STABLE


def action_button_label(command: str) -> str:
    if command.startswith("open-"):
        return ACTION_BUTTON_LABELS["open"]
    return ACTION_BUTTON_LABELS.get(command, ACTION_BUTTON_LABELS["default"])


def hero_button_label(command: str, fallback: str) -> str:
    return HERO_BUTTON_LABELS.get(command, fallback)


def step_label(step: int) -> str:
    return STEP_LABEL_TEMPLATE.format(step=step)


def about_body(version: str, screenshot: str) -> str:
    channel = release_channel(version)
    contact = (
        AboutCopy.contact_heading
        + AboutCopy.contact_web.format(url=BRAND.site)
        + AboutCopy.contact_email.format(email=BRAND.email)
        + AboutCopy.contact_code.format(url=BRAND.github)
        + AboutCopy.contact_issues.format(url=BRAND.issues)
        + AboutCopy.legal_heading.format(disclaimer=DISCLAIMER)
        + f"\n{AboutCopy.privacy_note}\n\n"
        + f"{AboutCopy.ticket_heading}\n"
        + AboutCopy.ticket_steps.format(screenshot=screenshot, email=BRAND.email)
    )
    return contact


def about_subtitle(version: str) -> str:
    return AboutCopy.subtitle_template.format(
        version=version,
        channel=release_channel(version),
        panel_title=BRAND.panel_title,
    )
