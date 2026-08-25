const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Launching browser for comprehensive full-content capture...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1500,1200'],
    defaultViewport: { width: 1500, height: 1200, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Helper to expand layout to capture full scroll height
  const captureFullContent = async (filename) => {
    // Scroll container is .sat-main-content
    const totalHeight = await page.evaluate(() => {
      const main = document.querySelector('.sat-main-content');
      const body = document.querySelector('.sat-content-body');
      return Math.max(
        main ? main.scrollHeight : 1200,
        body ? body.scrollHeight + 250 : 1200,
        document.body.scrollHeight
      );
    });

    await page.setViewport({ width: 1500, height: Math.max(1100, totalHeight + 100), deviceScaleFactor: 2 });
    
    // Inject style temporarily to allow container expansion
    await page.addStyleTag({
      content: `
        .sat-dashboard-app { height: auto !important; min-height: 100vh !important; overflow: visible !important; }
        .sat-main-content { overflow: visible !important; height: auto !important; }
        .sat-sidebar { min-height: 100vh !important; height: auto !important; }
      `
    });

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, filename), fullPage: true });

    // Restore standard viewport
    await page.setViewport({ width: 1500, height: 1100, deviceScaleFactor: 2 });
  };

  // Helper to click tab by text
  const clickTab = async (label) => {
    const el = await page.evaluateHandle((text) => {
      const btns = Array.from(document.querySelectorAll('button, .sat-tab-btn, .tab-item, a'));
      return btns.find(b => b.textContent && b.textContent.includes(text));
    }, label);
    if (el && el.asElement()) {
      await el.asElement().click();
      await new Promise(r => setTimeout(r, 1200));
    } else {
      console.warn(`Tab with label "${label}" not found!`);
    }
  };

  // 1. Dashboard Global (Full page)
  console.log('Capturing 01_dashboard_global.png (full scroll)...');
  await clickTab('Dashboard Global');
  await captureFullContent('01_dashboard_global.png');

  // 2. Upload Modal
  console.log('Capturing 02_upload_modal.png...');
  const uploadBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Desmenuzar XMLs'));
  });
  if (uploadBtn && uploadBtn.asElement()) {
    await uploadBtn.asElement().click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, '02_upload_modal.png') });
    // Close modal
    const closeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && (b.textContent.trim() === '✕' || b.textContent.includes('Cancelar')));
    });
    if (closeBtn && closeBtn.asElement()) {
      try { await closeBtn.asElement().click(); } catch(e) {}
    }
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Pre-Declaración Mensual (Full page)
  console.log('Capturing 03_predeclaracion_mensual.png (full scroll)...');
  await clickTab('Pre-Declaración Mensual');
  await captureFullContent('03_predeclaracion_mensual.png');

  // 4. Modal Borrador SAT
  console.log('Capturing 04_borrador_sat_modal.png...');
  const borradorBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Borrador SAT'));
  });
  if (borradorBtn && borradorBtn.asElement()) {
    await borradorBtn.asElement().click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, '04_borrador_sat_modal.png') });
    const closeBorrador = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.trim() === '✕');
    });
    if (closeBorrador && closeBorrador.asElement()) {
      try { await closeBorrador.asElement().click(); } catch(e) {}
    }
    await new Promise(r => setTimeout(r, 600));
  }

  // 5. Pre-Declaración Anual (Full page)
  console.log('Capturing 05_predeclaracion_anual.png (full scroll)...');
  await clickTab('Pre-Declaración Anual');
  await captureFullContent('05_predeclaracion_anual.png');

  // 6. Gastos y Compras (Full page)
  console.log('Capturing 06_gastos_y_compras.png (full scroll)...');
  await clickTab('Gastos y Compras');
  await captureFullContent('06_gastos_y_compras.png');

  // 7. Deducciones Personales (Full page)
  console.log('Capturing 07_deducciones_personales.png (full scroll)...');
  await clickTab('Deducciones Personales');
  await captureFullContent('07_deducciones_personales.png');

  // 8. Sueldos y Salarios (Full page)
  console.log('Capturing 08_sueldos_y_salarios.png (full scroll)...');
  await clickTab('Sueldos y Salarios');
  await captureFullContent('08_sueldos_y_salarios.png');

  // 9. Detalle de Recibos (Full page)
  console.log('Capturing 09_recibos_nomina_detalle.png (full scroll)...');
  await clickTab('Detalle de Recibos');
  await captureFullContent('09_recibos_nomina_detalle.png');

  // 10. Honorarios Emitidos (Full page)
  console.log('Capturing 10_honorarios_emitidos.png (full scroll)...');
  await clickTab('Honorarios Emitidos');
  await captureFullContent('10_honorarios_emitidos.png');

  // 11. Facturas Clientes (Full page)
  console.log('Capturing 11_facturas_clientes.png (full scroll)...');
  await clickTab('Facturas Clientes');
  await captureFullContent('11_facturas_clientes.png');

  // 12. Auditoría SAT (PDFs) (Full page)
  console.log('Capturing 12_auditoria_sat_oficial.png (full scroll)...');
  await clickTab('Auditoría SAT');
  await captureFullContent('12_auditoria_sat_oficial.png');

  // 13. Modal Detalle SAT
  console.log('Capturing 13_auditoria_sat_modal.png...');
  const detalleSatBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && (b.textContent.includes('Ver Detalle SAT') || b.textContent.includes('Ver Desglose Oficial SAT')));
  });
  if (detalleSatBtn && detalleSatBtn.asElement()) {
    await detalleSatBtn.asElement().click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, '13_auditoria_sat_modal.png') });
  }

  console.log('All full-page screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error taking full screenshots:', err);
  process.exit(1);
});
