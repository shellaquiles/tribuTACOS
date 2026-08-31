"""Captura automatizada del Panel de Operaciones para docs/img/."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

os.environ.setdefault("TRIBUTACOS_MODE", "installed")

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
OUTPUT_DIR = ROOT / "docs" / "img"
RENDER_DELAY_S = 0.3

CAPTURES: dict[str, str] = {
    "inicio": "panel_01_inicio.png",
    "archivos": "panel_02_archivos.png",
    "datos": "panel_03_respaldo.png",
    "ayuda": "panel_04_ayuda.png",
}


def main() -> int:
    try:
        from PIL import ImageGrab
    except ImportError:
        print("Pillow requerido: pip install Pillow", file=sys.stderr)
        return 1

    from control_panel.config.catalog import build_sections
    from control_panel.domain.panel import OperationsPanel

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (ROOT / "manual_usuario" / "img").mkdir(parents=True, exist_ok=True)

    app = OperationsPanel()
    try:
        app.deiconify()
        app.update_idletasks()
        time.sleep(0.5)

        notebook = app._notebook
        if notebook is None:
            print("Error: notebook no encontrado en OperationsPanel", file=sys.stderr)
            return 1

        sections = build_sections(app.mode)
        for index, (tab_id, _) in enumerate(sections):
            filename = CAPTURES.get(tab_id)
            if filename is None:
                continue
            notebook.select(index)
            app.update_idletasks()
            time.sleep(RENDER_DELAY_S)

            x = app.winfo_rootx()
            y = app.winfo_rooty()
            w = app.winfo_width()
            h = app.winfo_height()
            img = ImageGrab.grab(bbox=(x, y, x + w, y + h))
            for out_dir in (OUTPUT_DIR, ROOT / "manual_usuario" / "img"):
                out_dir.mkdir(parents=True, exist_ok=True)
                path = out_dir / filename
                img.save(path)
                print(f"  {path.relative_to(ROOT)}")
    finally:
        app.destroy()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
