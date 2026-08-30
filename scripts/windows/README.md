# Scripts de Windows

Launchers y utilidades especificas de Windows para tribuTACOS.

## Uso directo

Desde la raiz del proyecto tambien existen accesos directos (`Iniciar-Tributacos.bat`, etc.) que delegan aqui.

| Script | Proposito |
| :--- | :--- |
| `iniciar-docker.bat` / `.ps1` | Inicia tribuTACOS con Docker Compose |
| `detener-docker.bat` / `.ps1` | Detiene contenedores Docker |
| `centro-de-control.bat` / `.pyw` | Abre el Panel de Operaciones |
| `tributacos.cmd` / `.ps1` | CLI multiplataforma (`scripts/tributacos.py`) |

Los mismos comandos existen en GNU Make (`make docker-up`, `make gui`, `make db-export`, …).

## Requisitos

- **Docker:** `iniciar-docker` y `detener-docker`
- **Python 3.11+:** `centro-de-control` y `tributacos`
