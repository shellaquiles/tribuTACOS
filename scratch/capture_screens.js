import puppeteer from '/tmp/puppeteer-tool/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import path from 'path';

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,950'],
    defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Helper to click tab by text or ID
  const clickTab = async (label) => {
    const el = await page.evaluateHandle((text) => {
      const btns = Array.from(document.querySelectorAll('button, .sat-tab-btn, .tab-item'));
      return btns.find(b => b.textContent.includes(text));
    }, label);
    if (el && el.asElement()) {
      await el.asElement().click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.warn(`Tab with label "${label}" not found!`);
    }
  };

  // 1. Dashboard Global
  console.log('Capturing 01_dashboard_global.png...');
  await page.screenshot({ path: path.join(outDir, '01_dashboard_global.png') });

  // 2. Upload Modal
  console.log('Capturing 02_upload_modal.png...');
  const uploadBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Desmenuzar XMLs'));
  });
  if (uploadBtn && uploadBtn.asElement()) {
    await uploadBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, '02_upload_modal.png') });
    // Close modal by pressing Escape or clicking close button
    await page.keyboard.press('Escape');
    const closeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.trim() === '✕' || b.textContent.includes('Cancelar'));
    });
    if (closeBtn && closeBtn.asElement()) {
      try { await closeBtn.asElement().click(); } catch(e) {}
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // 3. Pre-Declaración Mensual
  console.log('Capturing 03_predeclaracion_mensual.png...');
  await clickTab('Pre-Declaración Mensual');
  await page.screenshot({ path: path.join(outDir, '03_predeclaracion_mensual.png') });

  // 4. Modal Borrador SAT
  console.log('Capturing 04_borrador_sat_modal.png...');
  const borradorBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Borrador SAT'));
  });
  if (borradorBtn && borradorBtn.asElement()) {
    await borradorBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, '04_borrador_sat_modal.png') });
    const closeBorrador = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.trim() === '✕');
    });
    if (closeBorrador && closeBorrador.asElement()) {
      try { await closeBorrador.asElement().click(); } catch(e) {}
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // 5. Pre-Declaración Anual
  console.log('Capturing 05_predeclaracion_anual.png...');
  await clickTab('Pre-Declaración Anual');
  await page.screenshot({ path: path.join(outDir, '05_predeclaracion_anual.png') });

  // 6. Gastos y Compras
  console.log('Capturing 06_gastos_y_compras.png...');
  await clickTab('Gastos y Compras');
  await page.screenshot({ path: path.join(outDir, '06_gastos_y_compras.png') });

  // 7. Deducciones Personales
  console.log('Capturing 07_deducciones_personales.png...');
  await clickTab('Deducciones Personales');
  await page.screenshot({ path: path.join(outDir, '07_deducciones_personales.png') });

  // 8. Sueldos y Salarios
  console.log('Capturing 08_sueldos_y_salarios.png...');
  await clickTab('Sueldos y Salarios');
  await page.screenshot({ path: path.join(outDir, '08_sueldos_y_salarios.png') });

  // 9. Detalle de Recibos
  console.log('Capturing 09_recibos_nomina_detalle.png...');
  await clickTab('Detalle de Recibos');
  await page.screenshot({ path: path.join(outDir, '09_recibos_nomina_detalle.png') });

  // 10. Honorarios Emitidos
  console.log('Capturing 10_honorarios_emitidos.png...');
  await clickTab('Honorarios Emitidos');
  await page.screenshot({ path: path.join(outDir, '10_honorarios_emitidos.png') });

  // 11. Facturas Clientes
  console.log('Capturing 11_facturas_clientes.png...');
  await clickTab('Facturas Clientes');
  await page.screenshot({ path: path.join(outDir, '11_facturas_clientes.png') });

  // 12. Auditoría SAT (PDFs)
  console.log('Capturing 12_auditoria_sat_oficial.png...');
  await clickTab('Auditoría SAT');
  await page.screenshot({ path: path.join(outDir, '12_auditoria_sat_oficial.png') });

  // 13. Modal Detalle SAT
  console.log('Capturing 13_auditoria_sat_modal.png...');
  const detalleSatBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Ver Detalle SAT') || b.textContent.includes('Ver Desglose Oficial SAT'));
  });
  if (detalleSatBtn && detalleSatBtn.asElement()) {
    await detalleSatBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, '13_auditoria_sat_modal.png') });
  }

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
