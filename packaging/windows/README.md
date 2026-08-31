# Empaquetado Windows

Artefactos para generar el instalador nativo:

| Archivo | Uso |
| :--- | :--- |
| `tributacos.spec` | PyInstaller (onedir): `tributacos.exe` |
| `tributacos.iss` | Inno Setup: `TributacosSetup-X.Y.Z.exe` |

## Accesos directos

- **tribuTACOS** → `tributacos.exe` (servidor + navegador). Un segundo clic reabre el navegador; no duplica el puerto 8080.
- **Operaciones tribuTACOS** → `tributacos.exe --gui` (Panel de Operaciones)

## Build local (Windows)

```bat
packaging\build-standalone.bat
pip install pyinstaller
pyinstaller packaging\windows\tributacos.spec
powershell -File packaging\windows\smoke-frozen.ps1
```

Luego compilar `tributacos.iss` con Inno Setup.
Los launchers del dia a dia viven en `scripts/windows/`.

### Evitar sorpresas en el .exe

- **CI**: `release.yml` ejecuta `packaging/test_frozen_boot.py` (imports/logging) y `smoke-frozen.ps1` (arranca el .exe y llama `/api/health`).
- **Log local**: si falla sin consola, revisa `%APPDATA%\\tributacos\\logs\\tributacos.log`.
- **Spec**: `collect_submodules('app')` reduce `ModuleNotFoundError` de PyInstaller.
