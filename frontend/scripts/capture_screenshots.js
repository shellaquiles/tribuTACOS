const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../../manual_usuario/img');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1500, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`Iniciando captura de secciones inferiores en http://localhost:3000...`);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Ocultar indicadores flotantes de desarrollo (Next.js badge, overlays)
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      div[class*="nextjs-toast"],
      #__next-build-watcher {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `
  });

  // Seleccionar año fiscal 2024

  try {
    const selects = page.locator('select');
    const count = await selects.count();
    if (count > 0) {
      await selects.last().selectOption('2024');
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('Error año:', e.message);
  }

  const scrollMain = async (topPx) => {
    await page.evaluate((top) => {
      const container = document.querySelector('div.overflow-y-auto');
      if (container) container.scrollTop = top;
    }, topPx);
    await page.waitForTimeout(1000);
  };

  // 1. Dashboard Principal
  console.log('1. Dashboard scroll...');
  await page.locator('button:has-text("Dashboard Principal")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard_global.png') });
  await scrollMain(750);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard_scroll_graficas_y_retenciones.png') });

  // 2. Pre-Declaración Mensual
  console.log('2. Mensual scroll...');
  await page.locator('button:has-text("Pagos Provisionales (Mensual)")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_predeclaracion_mensual.png') });
  await scrollMain(550);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_predeclaracion_mensual_scroll_tabla.png') });

  // 3. Pre-Declaración Anual
  console.log('3. Anual scroll...');
  await page.locator('button:has-text("Declaración Anual")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_predeclaracion_anual.png') });
  await scrollMain(650);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_predeclaracion_anual_scroll_deducciones_y_conciliacion.png') });

  // 4. Gastos y Compras
  console.log('4. Gastos scroll...');
  await page.locator('button:has-text("Gastos y Facturas Recibidas")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_gastos_y_compras.png') });
  await scrollMain(650);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_gastos_scroll_categorias_y_grafica.png') });

  // 5. Deducciones Personales
  console.log('5. Deducciones scroll...');
  await page.locator('button:has-text("Deducciones Personales")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_deducciones_personales.png') });
  await scrollMain(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_deducciones_scroll_tabla_facturas.png') });

  // 6. Sueldos y Salarios
  console.log('6. Sueldos scroll...');
  await page.locator('button:has-text("Sueldos y Salarios")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_sueldos_y_salarios.png') });
  await scrollMain(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_sueldos_scroll_patrones_y_exentos.png') });

  // 7. Detalle de Recibos de Nómina
  console.log('7. Detalle Recibos scroll...');
  await page.locator('button:has-text("Detalle de Recibos")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_recibos_nomina_detalle.png') });
  await scrollMain(650);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_recibos_scroll_tabla_quincenas.png') });

  // 8. Honorarios
  console.log('8. Honorarios scroll...');
  await page.locator('button:has-text("Honorarios / Act. Prof.")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_honorarios_emitidos.png') });
  await scrollMain(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_honorarios_scroll_desglose_clientes.png') });

  // 9. Facturas Emitidas
  console.log('9. Facturas Clientes scroll...');
  await page.locator('button:has-text("Facturas Emitidas")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_facturas_clientes.png') });
  await scrollMain(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_facturas_scroll_tabla_comprobantes.png') });

  // 10. Conciliación SAT Oficial
  console.log('10. Conciliación SAT scroll...');
  await page.locator('button:has-text("Conciliación SAT (PDFs)")').click();
  await scrollMain(0);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_auditoria_sat_oficial.png') });
  await scrollMain(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_auditoria_scroll_matriz_declarada_y_bancos.png') });

  await browser.close();
  console.log('¡TODAS LAS SECCIONES INFERIORES FUERON CAPTURADAS CON ÉXITO!');
}

run().catch(console.error);
