const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Capturing rich Gastos and Egresos detailed views...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

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

  const scrollContainer = async (scrollTop) => {
    await page.evaluate((top) => {
      const el = document.querySelector('.sat-main-content');
      if (el) el.scrollTop = top;
      window.scrollTo(0, top);
    }, scrollTop);
    await new Promise(r => setTimeout(r, 800));
  };

  // Navigate to Gastos y Compras
  await clickTab('Gastos y Compras');
  await scrollContainer(0);

  // 1. Selector de Meses Pills y KPIs
  console.log('Capturing 06_gastos_01_pills_meses_y_kpis.png...');
  await page.screenshot({ path: path.join(outDir, '06_gastos_01_pills_meses_y_kpis.png') });

  // 2. Gráfica de Evolución Mensual y Promedio
  console.log('Capturing 06_gastos_02_grafica_flujo_mensual.png...');
  await scrollContainer(350);
  await page.screenshot({ path: path.join(outDir, '06_gastos_02_grafica_flujo_mensual.png') });

  // 3. Mix de Deducibilidad y Top Proveedores
  console.log('Capturing 06_gastos_03_mix_deducibilidad_y_top_proveedores.png...');
  await scrollContainer(700);
  await page.screenshot({ path: path.join(outDir, '06_gastos_03_mix_deducibilidad_y_top_proveedores.png') });

  // 4. Vista por Categoría Expandida
  console.log('Capturing 06_gastos_04_vista_categorias_acordeon.png...');
  await scrollContainer(1150);
  // Expand first category
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, div[style*="cursor: pointer"]'));
    const catBtn = btns.find(b => b.textContent && (b.textContent.includes('Ver partidas') || b.textContent.includes('Software') || b.textContent.includes('Servicios')));
    if (catBtn) catBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_gastos_04_vista_categorias_acordeon.png') });

  // 5. Vista por Proveedor
  console.log('Capturing 06_gastos_05_vista_por_proveedores.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const provTab = btns.find(b => b.textContent && b.textContent.includes('Por Proveedor'));
    if (provTab) provTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_gastos_05_vista_por_proveedores.png') });

  // 6. Sub-pestaña Notas de Crédito / Devoluciones
  console.log('Capturing 06_gastos_06_notas_de_credito_reembolsos.png...');
  await scrollContainer(0);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ncTab = btns.find(b => b.textContent && (b.textContent.includes('Devoluciones') || b.textContent.includes('Notas de Crédito') || b.textContent.includes('Reembolsos')));
    if (ncTab) ncTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_gastos_06_notas_de_credito_reembolsos.png') });

  console.log('Rich Gastos captures finished!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during rich gastos capture:', err);
  process.exit(1);
});
