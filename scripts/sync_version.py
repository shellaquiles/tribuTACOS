#!/usr/bin/env python3
"""Lee VERSION y sincroniza copias derivadas (package.json, badges, Inno Setup)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "VERSION"

# SemVer X.Y.Z o pre-release X.Y.Z-rc.N / -beta.N / -alpha.N
VERSION_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-(?P<pre>rc|alpha|beta)\.(?P<pre_n>0|[1-9]\d*))?$"
)

_VER_CORE = r"[0-9]+\.[0-9]+\.[0-9]+(?:--(?:rc|alpha|beta)\.[0-9]+)?"
_VER_TEXT = r"[0-9]+\.[0-9]+\.[0-9]+(?:-(?:rc|alpha|beta)\.[0-9]+)?"
_CHANNEL = r"(?:STABLE|RC|ALPHA|BETA)"


def read_version(root: Path | None = None) -> str:
    base = root or ROOT
    path = base / "VERSION"
    if path.is_file():
        return path.read_text(encoding="utf-8").strip()
    return "0.0.0"


def is_prerelease(version: str) -> bool:
    match = VERSION_RE.fullmatch(version)
    return bool(match and match.group("pre"))


def channel_label(version: str) -> str:
    match = VERSION_RE.fullmatch(version)
    if match and match.group("pre"):
        return match.group("pre").upper()
    return "STABLE"


def shields_version(version: str) -> str:
    """Guion literal en shields.io se escribe como --."""
    return version.replace("-", "--")


def _replace_file(path: Path, pattern: str, replacement: str) -> bool:
    if not path.is_file():
        return False
    original = path.read_text(encoding="utf-8")
    updated = re.sub(pattern, replacement, original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def sync(version: str) -> list[str]:
    changed: list[str] = []
    channel = channel_label(version)
    badge = shields_version(version)

    pkg = ROOT / "frontend" / "package.json"
    if pkg.is_file():
        data = json.loads(pkg.read_text(encoding="utf-8"))
        if data.get("version") != version:
            data["version"] = version
            pkg.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            changed.append(str(pkg.relative_to(ROOT)))

    replacements = [
        (
            ROOT / "README.md",
            rf"badge/version-{_VER_CORE}",
            f"badge/version-{badge}",
        ),
        (
            ROOT / "docs" / "01_arquitectura_general.md",
            rf"v{_VER_CORE}%20{_CHANNEL}",
            f"v{badge}%20{channel}",
        ),
        (
            ROOT / "docs" / "01_arquitectura_general.md",
            rf"tribuTACOS v{_VER_TEXT} {_CHANNEL}",
            f"tribuTACOS v{version} {channel}",
        ),
        (
            ROOT / "docs" / "INSTALACION_USUARIO.md",
            rf"v{_VER_CORE}%20{_CHANNEL}",
            f"v{badge}%20{channel}",
        ),
        (
            ROOT / "docs" / "INSTALACION_USUARIO.md",
            rf"tribuTACOS v{_VER_TEXT} {_CHANNEL}",
            f"tribuTACOS v{version} {channel}",
        ),
        (
            ROOT / "manual_usuario" / "01_introduccion_y_propuesta_de_valor.md",
            rf"v{_VER_CORE}%20{_CHANNEL}",
            f"v{badge}%20{channel}",
        ),
        (
            ROOT / "manual_usuario" / "01_introduccion_y_propuesta_de_valor.md",
            rf"tribuTACOS v{_VER_TEXT} {_CHANNEL}",
            f"tribuTACOS v{version} {channel}",
        ),
        (
            ROOT / "manual_usuario" / "MANUAL_DE_USUARIO_COMPLETO.md",
            rf"v{_VER_CORE}%20{_CHANNEL}",
            f"v{badge}%20{channel}",
        ),
        (
            ROOT / "manual_usuario" / "MANUAL_DE_USUARIO_COMPLETO.md",
            rf"tribuTACOS v{_VER_TEXT} {_CHANNEL}",
            f"tribuTACOS v{version} {channel}",
        ),
        (
            ROOT / ".agent" / "workflows" / "declara_context.md",
            rf"`{_VER_TEXT} {_CHANNEL}`",
            f"`{version} {channel}`",
        ),
        (
            ROOT / "packaging" / "windows" / "tributacos.iss",
            r'#define MyAppVersion "[^"]+"',
            f'#define MyAppVersion "{version}"',
        ),
        (
            ROOT / ".agent" / "workflows" / "documentation_style_guide.md",
            rf"v{_VER_CORE}%20{_CHANNEL}",
            f"v{badge}%20{channel}",
        ),
    ]
    for path, pattern, repl in replacements:
        if _replace_file(path, pattern, repl):
            changed.append(str(path.relative_to(ROOT)))
    return changed


def main() -> None:
    version = read_version()
    if not VERSION_RE.fullmatch(version):
        print(f"VERSION invalida: {version!r}", file=sys.stderr)
        print("Usa X.Y.Z o X.Y.Z-rc.N (tambien -beta.N / -alpha.N).", file=sys.stderr)
        raise SystemExit(1)
    changed = sync(version)
    print(f"Version {version} ({channel_label(version)})")
    if changed:
        print("Actualizado:")
        for item in changed:
            print(f"  - {item}")
    else:
        print("Copias derivadas ya estaban al dia.")


if __name__ == "__main__":
    main()
