const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Capturing distinct explorador views with accurate interactions...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1450,950'],
    defaultViewport: { width: 1450, height: 950, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
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

  // Helper to scroll
  const scrollContainer = async (scrollTop) => {
    await page.evaluate((top) => {
      const el = document.querySelector('.sat-main-content');
      if (el) el.scrollTop = top;
    }, scrollTop);
    await new Promise(r => setTimeout(r, 800));
  };

  // 1. Go to Gastos y Compras
  await clickTab('Gastos y Compras');

  // Scroll directly to "Explorador y Agrupación de Gastos" section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, .section-title, .sat-card-title, div'));
    const target = headers.find(h => h.textContent && h.textContent.includes('Explorador y Agrupación de Gastos'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // ── CAPTURE 1: 06_gastos_07_explorador_maestro_detalle.png (Vista General con "Todos los Artículos" seleccionado) ──
  console.log('Capturing 06_gastos_07_explorador_maestro_detalle.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const catViewBtn = btns.find(b => b.textContent && b.textContent.includes('Por Rubro'));
    if (catViewBtn) catViewBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '06_gastos_07_explorador_maestro_detalle.png') });

  // ── CAPTURE 2: 06_gastos_08_tabla_partidas_articulos.png (Seleccionando una Categoría Específica como Servicios o Software o Telecomunicaciones) ──
  console.log('Capturing 06_gastos_08_tabla_partidas_articulos.png...');
  const clickedCategory = await page.evaluate(() => {
    // Look for category list items in the left panel
    const items = Array.from(document.querySelectorAll('div'));
    const catItem = items.find(el => {
      const text = el.textContent || '';
      return (text.includes('partidas') || text.includes('facturas')) && 
             (text.includes('Software') || text.includes('Servicios') || text.includes('Hardware') || text.includes('Telecom') || text.includes('Papelería')) &&
             el.style.cursor === 'pointer';
    });
    if (catItem) {
      catItem.click();
      return catItem.textContent.trim().slice(0, 30);
    }
    return null;
  });
  console.log('Clicked category:', clickedCategory);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_gastos_08_tabla_partidas_articulos.png') });

  // ── CAPTURE 3: 06_gastos_09_vista_lista_cronologica.png (Modo Lista Cronológica con buscador y ordenamiento) ──
  console.log('Capturing 06_gastos_09_vista_lista_cronologica.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const listBtn = btns.find(b => b.textContent && b.textContent.includes('Lista Cronológica'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_gastos_09_vista_lista_cronologica.png') });

  // ── CAPTURE 4: 06_gastos_05_vista_por_proveedores.png (Modo Por Proveedor) ──
  console.log('Capturing 06_gastos_05_vista_por_proveedores.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const provBtn = btns.find(b => b.textContent && b.textContent.includes('Por Proveedor'));
    if (provBtn) provBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_gastos_05_vista_por_proveedores.png') });

  console.log('Distinct screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
