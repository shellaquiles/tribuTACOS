import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'manual_usuario' / 'img'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1500, 'height': 950},
            device_scale_factor=2
        )
        page = context.new_page()

        print(f"1. Loading application at http://localhost:3000... (Saving to {OUTPUT_DIR})")
        page.goto('http://localhost:3000', wait_until='networkidle')
        time.sleep(2)

        # Select year 2024
        try:
            page.locator('select').last.select_option('2024')
            time.sleep(1.5)
        except Exception as e:
            print("Year select:", e)

        # 1. Dashboard Principal
        print("Capturing 01_dashboard_global.png...")
        page.screenshot(path=str(OUTPUT_DIR / '01_dashboard_global.png'))

        # 2. Upload Modal
        print("Capturing 02_upload_modal.png...")
        try:
            page.locator('button:has-text("CARGAR CFDIs")').click()
            time.sleep(0.8)
            page.screenshot(path=str(OUTPUT_DIR / '02_upload_modal.png'))
            page.locator('div.fixed button:has(svg)').first.click()
            time.sleep(0.8)
        except Exception as e:
            print("Upload modal error:", e)

        # 3. Pre-Declaración Mensual (Pagos Provisionales Mensual)
        print("Capturing 03_predeclaracion_mensual.png...")
        page.locator('button:has-text("Pagos Provisionales (Mensual)")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '03_predeclaracion_mensual.png'))

        # 4. Borrador SAT Modal
        print("Capturing 04_borrador_sat_modal.png...")
        try:
            borrador_btn = page.locator('button:has-text("Borrador")').first
            if borrador_btn.is_visible():
                borrador_btn.click()
                time.sleep(0.8)
                page.screenshot(path=str(OUTPUT_DIR / '04_borrador_sat_modal.png'))
                page.locator('div.fixed button:has(svg)').first.click()
                time.sleep(0.8)
        except Exception as e:
            print("Borrador modal error:", e)

        # 5. Declaración Anual
        print("Capturing 05_predeclaracion_anual.png...")
        page.locator('button:has-text("Declaración Anual")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '05_predeclaracion_anual.png'))

        # 6. Gastos y Facturas Recibidas
        print("Capturing 06_gastos_y_compras.png...")
        page.locator('button:has-text("Gastos y Facturas Recibidas")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '06_gastos_y_compras.png'))

        # 7. Deducciones Personales
        print("Capturing 07_deducciones_personales.png...")
        page.locator('button:has-text("Deducciones Personales")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '07_deducciones_personales.png'))

        # 8. Sueldos y Salarios
        print("Capturing 08_sueldos_y_salarios.png...")
        page.locator('button:has-text("Sueldos y Salarios")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '08_sueldos_y_salarios.png'))

        # 9. Detalle de Recibos
        print("Capturing 09_recibos_nomina_detalle.png...")
        page.locator('button:has-text("Detalle de Recibos")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '09_recibos_nomina_detalle.png'))

        # 10. Honorarios / Act. Prof.
        print("Capturing 10_honorarios_emitidos.png...")
        page.locator('button:has-text("Honorarios / Act. Prof.")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '10_honorarios_emitidos.png'))

        # 11. Facturas Emitidas
        print("Capturing 11_facturas_clientes.png...")
        page.locator('button:has-text("Facturas Emitidas")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '11_facturas_clientes.png'))

        # 12. Conciliación Oficial (PDFs)
        print("Capturing 12_auditoria_sat_oficial.png...")
        page.locator('button:has-text("Conciliación SAT (PDFs)")').click()
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / '12_auditoria_sat_oficial.png'))

        browser.close()
        print("ALL SCREENSHOTS CAPTURED AND UPDATED SUCCESSFULLY!")

if __name__ == '__main__':
    run()

