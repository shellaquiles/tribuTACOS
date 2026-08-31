# Panel de Operaciones (`control_panel`)

Paquete Tkinter del **Centro de Control** de tribuTACOS. No replica la interfaz web fiscal; orquesta arranque del servidor, ingesta de archivos, respaldos y utilidades de sistema.

## Arranque

```bash
make gui
python -m control_panel
```

Accesos directos: `Centro-de-Control-Tributacos.pyw`, `scripts/windows/centro-de-control.bat`.

## Estructura

```
control_panel/
  app.py              Punto de entrada (main)
  gui.py              Shim legacy PyInstaller
  domain/             Lógica de negocio
    panel.py          Ventana principal, estado, tareas
    server.py         Subproceso standalone y health check
    models.py         TaskAction
  config/             Datos estáticos (sin lógica de UI)
    copy.py           Textos, diálogos, TASKS
    constants.py      IDs, tiempos, geometría
    catalog.py        Ensamblado de pestañas por modo
    theme.py          Colores y estilos ttk
  ui/                 Interfaz Tkinter
    about.py          Diálogo Acerca de
    widgets.py        ToolTip
    views/            Builders por pestaña
      builder.py      Orquesta layout
      shell.py        Cabecera, log, pie
      tabs.py         Enrutado de pestañas
      inicio.py       Pestaña Inicio
      archivos.py     Pestaña Tus archivos
      components.py   Tarjetas y botones compartidos
  infra/              Arranque e imports
    bootstrap.py      sys.path → repo + scripts
```

## Convenciones

### Dónde va cada cambio

| Quieres cambiar… | Archivo |
|------------------|---------|
| Texto visible | `config/copy.py` |
| ID de comando | `config/constants.py` → `Cmd` |
| Color / estilo ttk | `config/theme.py` |
| Nueva acción | `config/copy.py` (`TASKS`) + `config/catalog.py` |
| Layout de pestaña | `ui/views/<pestaña>.py` |
| Lógica al ejecutar | `domain/panel.py` |
| Servidor local | `domain/server.py` |
| Tiempos / tamaños | `config/constants.py` |

### Regla principal

**El código solo contiene lógica.** Textos en `config/copy.py`, identificadores en `config/constants.py`.

### Dependencias externas

| Paquete | Uso |
|---------|-----|
| `tributacos_core` | Rutas, ingesta, modo, ficha técnica |
| `scripts/tributacos` | `run_command`, `venv_python` |

`infra/bootstrap.ensure_import_paths()` antes de importar módulos del runner o del core.

## Modos de distribución

| Modo | Origen | Pestaña Sistema |
|------|--------|-----------------|
| `installed` | PyInstaller | No |
| `docker` | docker-compose | Doctor |
| `dev` | checkout + make | Doctor + Setup |

Definido en `tributacos_core.runtime.distribution_mode()`.

## Empaquetado Windows

PyInstaller incluye el paquete completo (`packaging/windows/tributacos.spec`). El shim `gui.py` mantiene `from control_panel.gui import main`.

## Tests

```bash
make test                              # backend + control_panel
pytest control_panel/tests -v          # solo panel
pytest control_panel/tests -m gui -v   # smoke Tkinter
```

- `test_config.py`: catálogo, copy y modelos (sin display).
- `test_gui_smoke.py`: instancia el panel, verifica layout y destruye (`@pytest.mark.gui`).

En CI se usa `xvfb-run` para Tkinter headless.

## Capturas para documentación

```bash
make screenshots-gui
# Linux headless:
xvfb-run -a python control_panel/scripts/capture_screenshots.py
```

Genera `docs/img/panel_01_inicio.png` … `panel_04_ayuda.png` y copias en `manual_usuario/img/` (modo `installed`, 4 pestañas). Tras cambios en `ui/` o `config/copy.py`, regenerar capturas y `make pdf-instalacion` / `make pdf-manual`.

## Próximos pasos opcionales

- Dividir `config/copy.py` en submódulos si crece mucho.
- Ampliar tests GUI (pestañas, diálogos, ServerManager mockeado).
