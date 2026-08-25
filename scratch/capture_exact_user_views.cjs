const puppeteer = require('puppeteer');
const path = require('path');

const outDir = '/home/kubrick/www/declara/documentacion/img';

async function run() {
  console.log('Capturing exact Explorador views matching user expectation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1500,1000'],
    defaultViewport: { width: 1500, height: 1000, deviceScaleFactor: 2 }
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

  // Click Gastos y Compras
  await clickTab('Gastos y Compras');

  // Scroll so that Explorador is right at the top
  const scrollToExplorador = async () => {
    await page.evaluate(() => {
      const main = document.querySelector('.sat-main-content');
      const cards = Array.from(document.querySelectorAll('.sat-card, .section-card, div'));
      const exploradorCard = cards.find(c => c.textContent && c.textContent.includes('Explorador y Agrupación de Gastos:'));
      if (exploradorCard && main) {
        const offsetTop = exploradorCard.offsetTop - 110;
        main.scrollTop = offsetTop;
      }
    });
    await new Promise(r => setTimeout(r, 800));
  };

  // ── VISTA 1: POR RUBRO / CATEGORÍA ──
  console.log('Capturing 06_gastos_07_explorador_por_rubro.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Por Rubro / Categoría'));
    if (btn) btn.click();
  });
  await scrollToExplorador();
  await page.screenshot({ path: path.join(outDir, '06_gastos_07_explorador_por_rubro.png') });

  // ── VISTA 2: POR PROVEEDOR ──
  console.log('Capturing 06_gastos_08_explorador_por_proveedor.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Por Proveedor'));
    if (btn) btn.click();
  });
  await scrollToExplorador();
  await page.screenshot({ path: path.join(outDir, '06_gastos_08_explorador_por_proveedor.png') });

  // ── VISTA 3: LISTA CRONOLÓGICA ──
  console.log('Capturing 06_gastos_09_explorador_lista_cronologica.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Lista Cronológica'));
    if (btn) btn.click();
  });
  await scrollToExplorador();
  await page.screenshot({ path: path.join(outDir, '06_gastos_09_explorador_lista_cronologica.png') });

  console.log('Exact user views captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
