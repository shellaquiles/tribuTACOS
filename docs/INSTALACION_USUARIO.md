# tribuTACOS — Guía de instalación para usuario final

[![Versión](https://img.shields.io/badge/Versión-v1.1.0--rc.1%20RC-blue.svg?style=flat-square)](#)

> **Versión de Referencia:** Esta guía corresponde a **tribuTACOS v1.1.0-rc.1 RC**.

Esta guía es para contadores, personas físicas y usuarios que **no quieren usar la terminal**.

Hay tres caminos. Elige uno:

| Camino | Requisitos | Mejor para |
| :--- | :--- | :--- |
| **Instalador Windows (.exe)** | Windows 10/11 | Uso diario sin Docker |
| **Docker Desktop** | Docker Desktop | Cualquier sistema, o si el .exe no esta listo |
| **Panel de Operaciones + Python** | Python 3.11+ | Quien ya tiene Python y no quiere Docker |

---

## 1. Instalador Windows (cuando exista en GitHub Releases)

1. Descarga `TributacosSetup-X.Y.Z.exe` (por ejemplo `TributacosSetup-1.1.0-rc.1.exe`) desde [Releases](https://github.com/shellaquiles/tributacos/releases)
2. Instala con las opciones por defecto
3. En el escritorio:
   - **tribuTACOS** — abre la aplicacion en el navegador (`http://127.0.0.1:8080`). Un segundo clic no duplica el servidor: reabre el navegador.
   - **Operaciones tribuTACOS** — Panel de Operaciones (iniciar/detener, PDFs SAT, respaldos, carpetas)
4. Los datos quedan en `%APPDATA%\tributacos\` (no se borra al actualizar)

La **interfaz fiscal** (dashboard, subir XML, CSV) es siempre el navegador. El panel solo cubre lo que no esta en la web.

---

## 2. Panel de Operaciones (con Python)

1. Doble clic en **`Centro-de-Control-Tributacos.pyw`** (el Panel de Operaciones; `make gui` hace lo mismo)
2. **Verificar requisitos** (si el modo lo muestra)
3. **Instalar y preparar** (solo la primera vez, modo desarrollo)
4. **Iniciar tribuTACOS** — se abre el navegador

Otras acciones del panel: escanear carpetas XML, importar PDFs del SAT, exportar o importar un respaldo, limpiar BD o cache, abrir los **manuales PDF** y **Acerca de** (contacto, aviso legal y ficha para reportar errores).

---

## 3. Docker Desktop (sin Python ni Node)

### Una sola vez

1. Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Abre Docker Desktop y espera a que diga **Running**

### Cada dia

1. Doble clic en `Iniciar-Tributacos.bat` (Windows)
   - macOS: `scripts/macos/iniciar-docker.command`
   - Linux: `scripts/linux/iniciar-docker.sh`
2. Navegador: **http://localhost:3000**
3. Para detener: `Detener-Tributacos.bat`

Si descargaste el ZIP de Release (`tributacos-docker-vX.Y.Z.zip`), usa el `docker-compose.yml` incluido (imagenes de GHCR, sin compilar).

Datos Docker: volumen `tributacos-data`.

---

## Si falta una herramienta

| Situacion | Que hacer |
| :--- | :--- |
| No tienes Docker | El `.bat` abre la pagina de descarga de Docker Desktop |
| Docker instalado pero apagado | Abre Docker Desktop y reintenta |
| Quieres evitar Docker y el .exe | Python 3.11+ y el Panel de Operaciones, o `python scripts/tributacos.py standalone` |

---

## Modo desarrollador (terminal)

`make <comando>` y `python scripts/tributacos.py <comando>` son equivalentes.

```powershell
make doctor
make setup
make dev
# o un solo puerto:
make standalone
# Docker (igual que Iniciar-Tributacos.bat):
make docker-up
```

---

## Preguntas frecuentes

**¿Necesito internet?**  
La primera vez si (instalador, Docker o dependencias). El procesamiento de CFDIs es local.

**¿Mis datos salen de mi computadora?**  
No.

**¿macOS y Linux?**  
Hoy: Docker o `python scripts/tributacos.py`. Instaladores nativos (.dmg / AppImage) vienen despues del .exe de Windows.

**¿Si abro el .exe dos veces?**  
No se duplica. El segundo clic reabre el navegador en `http://127.0.0.1:8080`.

**¿Diferencia entre Sincronizar en la web y Escanear XML en el panel?**  
La web sincroniza con la aplicacion ya abierta. El panel escanea las carpetas locales aunque no tengas el navegador abierto.
