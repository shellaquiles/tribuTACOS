const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Capturing Explorador y Agrupación de Gastos section...');
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
  
  // Scroll down to Explorador y Agrupación de Gastos
  console.log('Capturing 06_gastos_07_explorador_maestro_detalle.png...');
  await scrollContainer(1150);
  await page.screenshot({ path: path.join(outDir, '06_gastos_07_explorador_maestro_detalle.png') });

  // Select a specific category on the left panel to show detailed items on the right
  console.log('Capturing 06_gastos_08_tabla_partidas_articulos.png...');
  await page.evaluate(() => {
    const catCards = Array.from(document.querySelectorAll('div[style*="cursor: pointer"]'));
    // Click on the second or third category card
    if (catCards.length > 2) catCards[2].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_gastos_08_tabla_partidas_articulos.png') });

  // Switch to Lista Cronológica view mode
  console.log('Capturing 06_gastos_09_vista_lista_cronologica.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const listBtn = btns.find(b => b.textContent && b.textContent.includes('Lista Cronológica'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_gastos_09_vista_lista_cronologica.png') });

  console.log('Explorador screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during explorer capture:', err);
  process.exit(1);
});
