import playwright from 'playwright';
import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates';
const OUTPUT_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/ig-pipeline/03-Ready/rendered-carousels';
const JEFF_IMAGE = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates/reference_designs/GettyImages-2221816314-1920x1280.jpg';

function getBase64DataUri(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderCard1Pillars() {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 }
  });

  console.log('[Card 1 Test Engine] Reading Style_A_FullBleed.html...');
  let rawHtml = fs.readFileSync(path.join(TEMPLATE_DIR, 'Style_A_FullBleed.html'), 'utf8');

  const base64Image = getBase64DataUri(JEFF_IMAGE);

  let filledHtml = rawHtml
    .replace(/\{\{TEXT_PLACEMENT\}\}/g, 'left-split')
    .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
    .replace(/\{\{IMAGE_PATH\}\}/g, base64Image)
    .replace(/\{\{HEADLINE_HTML\}\}/g, 'Strategi Rahasia <span class="highlight-emerald">Amazon Monopoli Market</span>')
    .replace(/\{\{SUBHEADLINE_TEXT\}\}/g, 'Bagaimana Jeff Bezos mengnolkan profitabilitas 20 tahun untuk membangun parit logistik tak tertandingi.');

  await page.setContent(filledHtml, { waitUntil: 'networkidle' });
  
  const outputPath = path.join(OUTPUT_DIR, 'CARD_1_COVER_PILLARS.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`[Card 1 Done] Saved to: ${outputPath}`);

  await browser.close();
}

renderCard1Pillars().catch(err => {
  console.error('Error rendering Card 1:', err);
  process.exit(1);
});
