import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BODY_TEMPLATES_DIR = path.join(__dirname, 'templates', 'body_cards');
const OUTPUT_DIR = path.join(__dirname, '..', 'ig-pipeline', '03-Ready', 'rendered-carousels');

async function render5BodyFormats() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const formats = [
    { num: 1, file: 'Format_1_BulletSOP.html', name: 'BODY_FORMAT_1_BulletSOP.png', headline: '3 Prinsip Alokasi Modal Amazon', accent: '#10B981' },
    { num: 2, file: 'Format_2_KeyValueTable.html', name: 'BODY_FORMAT_2_KeyValueTable.png', headline: 'Reinvestasi vs Dividen Tradisional', accent: '#10B981' },
    { num: 3, file: 'Format_3_ArrowFlow.html', name: 'BODY_FORMAT_3_ArrowFlow.png', headline: 'Framework Eksekusi 3 Langkah', accent: '#10B981' },
    { num: 4, file: 'Format_4_QASplit.html', name: 'BODY_FORMAT_4_QASplit.png', headline: 'Mitos Murni vs Fakta Instruksi', accent: '#10B981' },
    { num: 5, file: 'Format_5_NarrativeBlock.html', name: 'BODY_FORMAT_5_NarrativeBlock.png', headline: 'Filosofi Jangka Panjang Bezos', accent: '#10B981' }
  ];

  for (const fmt of formats) {
    console.log(`[Body Test Engine] Rendering Format ${fmt.num}: ${fmt.file}...`);
    const templatePath = path.join(BODY_TEMPLATES_DIR, fmt.file);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{SLIDE_NUM}}/g, fmt.num + 1)
      .replace(/{{TOTAL_SLIDES}}/g, '7')
      .replace(/{{CATEGORY_TAG}}/g, 'EXECUTIVE STRATEGY')
      .replace(/{{HEADLINE_TEXT}}/g, fmt.headline)
      .replace(/{{ACCENT_HEX}}/g, fmt.accent);

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    const outPath = path.join(OUTPUT_DIR, fmt.name);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`[Format ${fmt.num} Done] Saved to: ${outPath}`);
  }

  await browser.close();
  console.log('\n[Body Test Engine] All 5 Body Card Formats Rendered Successfully!');
}

render5BodyFormats();
