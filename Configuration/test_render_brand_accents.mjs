import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const REF_DESIGNS_DIR = path.join(TEMPLATES_DIR, 'reference_designs');
const OUTPUT_DIR = path.join(__dirname, '..', 'ig-pipeline', '03-Ready', 'rendered-carousels');

const imagePath = path.join(REF_DESIGNS_DIR, 'GettyImages-2221816314-1920x1280.jpg');

function getBase64DataUri(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderMinimalistVariants() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  const base64Img = getBase64DataUri(imagePath);
  const templateStr = fs.readFileSync(path.join(TEMPLATES_DIR, 'Style_A_FullBleed.html'), 'utf8');

  // Variant 1: Executive Emerald (#10B981) - Minimalist
  console.log('[Minimalist Test Engine] Rendering Variant 1: Executive Emerald (Clean Minimalist)...');
  const htmlVariant1 = templateStr
    .replace('{{IMAGE_PATH}}', base64Img)
    .replace('{{HEADLINE_HTML}}', 'Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class="highlight-emerald">\'Cashflow Amazon\'</span>')
    .replace('{{SUBHEADLINE_TEXT}}', 'Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.')
    .replace('{{ACCENT_HEX}}', '#10B981');
  await page.setContent(htmlVariant1, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'MINIMALIST_1_Executive_Emerald.png'), type: 'png' });

  // Variant 2: Cyber Gold (#F59E0B) - Minimalist
  console.log('[Minimalist Test Engine] Rendering Variant 2: Cyber Gold (Clean Minimalist)...');
  const htmlVariant2 = templateStr
    .replace('{{IMAGE_PATH}}', base64Img)
    .replace('{{HEADLINE_HTML}}', 'Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class="highlight-gold">\'Cashflow Amazon\'</span>')
    .replace('{{SUBHEADLINE_TEXT}}', 'Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.')
    .replace('{{ACCENT_HEX}}', '#F59E0B');
  await page.setContent(htmlVariant2, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'MINIMALIST_2_Cyber_Gold.png'), type: 'png' });

  // Variant 3: Tech Cyan (#06B6D4) - Minimalist
  console.log('[Minimalist Test Engine] Rendering Variant 3: Tech Cyan (Clean Minimalist)...');
  const htmlVariant3 = templateStr
    .replace('{{IMAGE_PATH}}', base64Img)
    .replace('{{HEADLINE_HTML}}', 'Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class="highlight-cyan">\'Cashflow Amazon\'</span>')
    .replace('{{SUBHEADLINE_TEXT}}', 'Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.')
    .replace('{{ACCENT_HEX}}', '#06B6D4');
  await page.setContent(htmlVariant3, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'MINIMALIST_3_Tech_Cyan.png'), type: 'png' });

  await browser.close();
  console.log('\n[Minimalist Test Engine] All 3 Minimalist Alternating Variants Rendered Successfully!');
}

renderMinimalistVariants();
