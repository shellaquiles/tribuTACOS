# tributacos_core

Utilidades compartidas entre el runner CLI (`scripts/tributacos.py`), el panel Tkinter (`control_panel/`) y el `.exe` empaquetado.

## Contenido

| Módulo | Responsabilidad |
|--------|-----------------|
| `runtime.py` | Rutas del proyecto, datos de usuario, ingesta, modo de distribución, ficha técnica |

## Import

```python
from tributacos_core.runtime import project_root, distribution_mode, ingest_folders
```

Compatibilidad legacy (runner y PyInstaller):

```python
import runtime  # scripts/runtime.py → reexporta tributacos_core.runtime
```

## Dependencias

Sin dependencias de Tkinter ni FastAPI. Solo stdlib + rutas del filesystem.
