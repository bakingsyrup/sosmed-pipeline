import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const REF_DESIGNS_DIR = path.join(TEMPLATES_DIR, 'reference_designs');
const OUTPUT_DIR = path.join(__dirname, '..', 'ig-pipeline', '03-Ready', 'rendered-carousels');

const imageBezos = path.join(REF_DESIGNS_DIR, 'GettyImages-2221816314-1920x1280.jpg');

function getBase64DataUri(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderPlacements() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  const base64Img = getBase64DataUri(imageBezos);
  const templateStr = fs.readFileSync(path.join(TEMPLATES_DIR, 'Style_A_FullBleed.html'), 'utf8');

  // Option A: Top-Left Anchored Column
  console.log('[Placement Test Engine] Rendering Option A: Top-Left Anchored Column...');
  const htmlOptionA = templateStr
    .replace('{{TEXT_PLACEMENT}}', 'left-top')
    .replace('{{IMAGE_PATH}}', base64Img)
    .replace(/{{HEADLINE_HTML}}/g, 'Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class="highlight-emerald">\'Cashflow Amazon\'</span>')
    .replace(/{{SUBHEADLINE_TEXT}}/g, 'Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.')
    .replace(/{{ACCENT_HEX}}/g, '#10B981');
  await page.setContent(htmlOptionA, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'OPTION_A_TopLeft_Anchored.png'), type: 'png' });

  // Option B: Split Vertical Stack (Headline Top-Left, Subtext Bottom-Left)
  console.log('[Placement Test Engine] Rendering Option B: Split Vertical Stack...');
  const htmlOptionB = templateStr
    .replace('{{TEXT_PLACEMENT}}', 'left-split')
    .replace('{{IMAGE_PATH}}', base64Img)
    .replace(/{{HEADLINE_HTML}}/g, 'Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class="highlight-emerald">\'Cashflow Amazon\'</span>')
    .replace(/{{SUBHEADLINE_TEXT}}/g, 'Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.')
    .replace(/{{ACCENT_HEX}}/g, '#10B981');
  await page.setContent(htmlOptionB, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'OPTION_B_Split_Vertical_Stack.png'), type: 'png' });

  await browser.close();
  console.log('\n[Placement Test Engine] Option A and Option B Rendered Successfully!');
}

renderPlacements();
