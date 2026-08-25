const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Launching browser for granular section-by-section screenshot capture...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Helper to click tab
  const clickTab = async (label) => {
    const el = await page.evaluateHandle((text) => {
      const btns = Array.from(document.querySelectorAll('button, .sat-tab-btn, .tab-item, a'));
      return btns.find(b => b.textContent && b.textContent.includes(text));
    }, label);
    if (el && el.asElement()) {
      await el.asElement().click();
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  // Helper to scroll the main content container
  const scrollContainer = async (scrollTop) => {
    await page.evaluate((top) => {
      const el = document.querySelector('.sat-main-content');
      if (el) el.scrollTop = top;
      window.scrollTo(0, top);
    }, scrollTop);
    await new Promise(r => setTimeout(r, 800));
  };

  // Helper to capture current viewport
  const captureViewport = async (filename) => {
    await page.screenshot({ path: path.join(outDir, filename) });
    console.log(`Captured: ${filename}`);
  };

  // ── 0. SIDEBAR & INGESTA ──
  console.log('--- 0. SIDEBAR & CONTROLES ---');
  await scrollContainer(0);
  await captureViewport('01_sidebar_y_controles.png');

  // Modal Ingesta
  const uploadBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Desmenuzar XMLs'));
  });
  if (uploadBtn && uploadBtn.asElement()) {
    await uploadBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await captureViewport('02_modal_desmenuzar_xmls.png');
    const closeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && (b.textContent.trim() === '✕' || b.textContent.includes('Cancelar')));
    });
    if (closeBtn && closeBtn.asElement()) try { await closeBtn.asElement().click(); } catch(e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  // ── 1. DASHBOARD GLOBAL ──
  console.log('--- 1. DASHBOARD GLOBAL ---');
  await clickTab('Dashboard Global');
  await scrollContainer(0);
  await captureViewport('03_dashboard_01_hero_y_kpis.png');
  await scrollContainer(450);
  await captureViewport('03_dashboard_02_distribucion_regimenes.png');
  await scrollContainer(900);
  await captureViewport('03_dashboard_03_cascada_determinacion.png');

  // ── 2. PRE-DECLARACIÓN MENSUAL ──
  console.log('--- 2. PRE-DECLARACIÓN MENSUAL ---');
  await clickTab('Pre-Declaración Mensual');
  await scrollContainer(0);
  await captureViewport('04_mensual_01_header_y_kpis.png');
  await scrollContainer(380);
  await captureViewport('04_mensual_02_matriz_12meses.png');
  await scrollContainer(750);
  await captureViewport('04_mensual_03_matriz_segundo_semestre.png');

  // Modal Borrador SAT
  const borradorBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Borrador SAT'));
  });
  if (borradorBtn && borradorBtn.asElement()) {
    await borradorBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await captureViewport('04_mensual_04_modal_borrador_sat_isr.png');
    // Scroll modal down to show IVA section
    await page.evaluate(() => {
      const modals = document.querySelectorAll('div[style*="max-height: 90vh"], div[style*="maxHeight: 90vh"]');
      if (modals.length > 0) modals[0].scrollTop = 450;
    });
    await new Promise(r => setTimeout(r, 600));
    await captureViewport('04_mensual_05_modal_borrador_sat_iva.png');

    const closeBorrador = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent && b.textContent.trim() === '✕');
    });
    if (closeBorrador && closeBorrador.asElement()) try { await closeBorrador.asElement().click(); } catch(e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  // ── 3. PRE-DECLARACIÓN ANUAL ──
  console.log('--- 3. PRE-DECLARACIÓN ANUAL ---');
  await clickTab('Pre-Declaración Anual');
  await scrollContainer(0);
  await captureViewport('05_anual_01_hero_saldo_proyectado.png');
  await scrollContainer(400);
  await captureViewport('05_anual_02_origen_ingresos_y_patrones.png');
  await scrollContainer(850);
  await captureViewport('05_anual_03_optimizador_deducciones_personales.png');

  // ── 4. GASTOS Y COMPRAS ──
  console.log('--- 4. GASTOS Y COMPRAS ---');
  await clickTab('Gastos y Compras');
  await scrollContainer(0);
  await captureViewport('06_gastos_01_resumen_y_filtros.png');
  await scrollContainer(450);
  await captureViewport('06_gastos_02_auditoria_bancarizacion_comprobantes.png');

  // ── 5. DEDUCCIONES PERSONALES ──
  console.log('--- 5. DEDUCCIONES PERSONALES ---');
  await clickTab('Deducciones Personales');
  await scrollContainer(0);
  await captureViewport('07_deducciones_01_termometro_tope_legal.png');
  await scrollContainer(500);
  await captureViewport('07_deducciones_02_desglose_por_tipo.png');
  await scrollContainer(1000);
  await captureViewport('07_deducciones_03_facturas_deducibles_auditadas.png');

  // ── 6. SUELDOS Y SALARIOS ──
  console.log('--- 6. SUELDOS Y SALARIOS ---');
  await clickTab('Sueldos y Salarios');
  await scrollContainer(0);
  await captureViewport('08_sueldos_01_resumen_gravado_exento.png');
  await scrollContainer(450);
  await captureViewport('08_sueldos_02_exentos_art93_desglose.png');
  await scrollContainer(900);
  await captureViewport('08_sueldos_03_lista_empleadores.png');

  // ── 7. DETALLE DE RECIBOS DE NÓMINA ──
  console.log('--- 7. DETALLE DE RECIBOS DE NÓMINA ---');
  await clickTab('Detalle de Recibos');
  await scrollContainer(0);
  await captureViewport('09_recibos_01_vista_quincenal.png');
  await scrollContainer(500);
  await captureViewport('09_recibos_02_desglose_percepciones_deducciones.png');

  // ── 8. HONORARIOS EMITIDOS ──
  console.log('--- 8. HONORARIOS EMITIDOS ---');
  await clickTab('Honorarios Emitidos');
  await scrollContainer(0);
  await captureViewport('10_honorarios_01_kpis_y_selector_clientes.png');
  await scrollContainer(450);
  await captureViewport('10_honorarios_02_conceptos_catalogo_sat.png');

  // ── 9. FACTURAS CLIENTES ──
  console.log('--- 9. FACTURAS CLIENTES ---');
  await clickTab('Facturas Clientes');
  await scrollContainer(0);
  await captureViewport('11_facturas_01_maestro_detalle.png');
  await scrollContainer(450);
  await captureViewport('11_facturas_02_recibo_acciones_xml.png');

  // ── 10. AUDITORÍA OFICIAL SAT ──
  console.log('--- 10. AUDITORÍA OFICIAL SAT ---');
  await clickTab('Auditoría SAT');
  await scrollContainer(0);
  await captureViewport('12_auditoria_01_hero_declaracion_anual_oficial.png');
  await scrollContainer(420);
  await captureViewport('12_auditoria_02_kpis_cumplimiento_y_pagos.png');
  await scrollContainer(850);
  await captureViewport('12_auditoria_03_matriz_12meses_declarados.png');

  // Modal Auditoría SAT
  const detalleSatBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && (b.textContent.includes('Ver Detalle SAT') || b.textContent.includes('Ver Desglose Oficial SAT')));
  });
  if (detalleSatBtn && detalleSatBtn.asElement()) {
    await detalleSatBtn.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    await captureViewport('12_auditoria_04_modal_declaracion_oficial_sat.png');
  }

  console.log('Granular section capture finished successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during granular capture:', err);
  process.exit(1);
});
