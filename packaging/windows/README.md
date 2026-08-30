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
```

Luego compilar `tributacos.iss` con Inno Setup.
Los launchers del dia a dia viven en `scripts/windows/`.
