# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules

SPECDIR = Path(SPECPATH).resolve()
ROOT = SPECDIR.parent.parent

hidden = [
    "lxml",
    "lxml._elementpath",
    "lxml.etree",
    "pdfplumber",
    "pypdfium2",
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "sqlalchemy",
    "sqlalchemy.sql.default_comparator",
    "pydantic",
    "email_validator",
    "multipart",
    "dotenv",
    "passlib",
    "passlib.handlers",
    "passlib.handlers.bcrypt",
    "bcrypt",
    "jose",
    "jose.jwt",
    "jose.backends",
    "jose.backends.cryptography_backend",
    "cryptography",
    "app",
    "app.main",
    "app.cli",
    "app.config",
    "app.auth",
    "app.auth.router",
    "app.auth.service",
    "app.cfdis",
    "app.cfdis.router",
    "app.cfdis.engine",
    "app.sat_docs",
    "app.sat_docs.router",
    "app.catalogos",
    "app.catalogos.router",
    "tkinter",
    "tkinter.ttk",
    "runtime",
    "tributacos",
    "tributacos_gui",
    "frozen_bootstrap",
]
hidden += collect_submodules("app")
hidden += collect_submodules("passlib")
hidden += collect_submodules("uvicorn")

datas = [
    (str(ROOT / "VERSION"), "."),
    (str(ROOT / "backend" / "app"), "app"),
    (str(ROOT / "scripts" / "runtime.py"), "."),
    (str(ROOT / "scripts" / "tributacos.py"), "."),
    (str(ROOT / "scripts" / "tributacos_gui.py"), "."),
]

static_dir = ROOT / "backend" / "static"
if static_dir.exists():
    datas.append((str(static_dir), "static"))
out_dir = ROOT / "frontend" / "out"
if out_dir.exists() and not static_dir.exists():
    datas.append((str(out_dir), "static"))
user_pdf = ROOT / "manual_usuario" / "tribuTACOS_manual_usuario.pdf"
tech_pdf = ROOT / "docs" / "tribuTACOS_documentacion_tecnica.pdf"
install_pdf = ROOT / "docs" / "tribuTACOS_instalacion_usuario.pdf"
if user_pdf.is_file():
    datas.append((str(user_pdf), "manuals"))
if tech_pdf.is_file():
    datas.append((str(tech_pdf), "manuals"))
if install_pdf.is_file():
    datas.append((str(install_pdf), "manuals"))

a = Analysis(
    [str(ROOT / "packaging" / "launcher.py")],
    pathex=[str(ROOT / "backend"), str(ROOT / "scripts"), str(ROOT / "packaging")],
    binaries=[],
    datas=datas,
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="tributacos",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="tributacos",
)
