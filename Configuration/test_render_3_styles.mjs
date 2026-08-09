import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { createCutout } from './utils/auto_cutout.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const REF_DESIGNS_DIR = path.join(TEMPLATES_DIR, 'reference_designs');
const OUTPUT_DIR = path.join(__dirname, '..', 'ig-pipeline', '03-Ready', 'rendered-carousels');

const imageMap = {
  styleA: path.join(REF_DESIGNS_DIR, 'GettyImages-2221816314-1920x1280.jpg'),
  styleB: path.join(REF_DESIGNS_DIR, 'SEI_307274412.jpg'),
  styleC_raw: path.join(REF_DESIGNS_DIR, 'bitmine-adds-317-000-eth-takes-its-treasury-near-5-b-featured-image-6899edcf7cc1e90001c48621.webp'),
  styleC_cutout: path.join(REF_DESIGNS_DIR, 'tom_lee_cutout.png')
};

function getBase64DataUri(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderStyles() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Run Auto-Cutout on Tom Lee Image for Style C
  console.log('[Auto-Cutout Engine] Removing background for Style C...');
  await createCutout(imageMap.styleC_raw, imageMap.styleC_cutout);

  console.log('\n[Style Test Engine] Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2 // High retina resolution
  });
  const page = await context.newPage();

  // Render Style A (Bezos)
  console.log('[Style Test Engine] Rendering Polished Style A (Bezos Photo)...');
  const templateA = fs.readFileSync(path.join(TEMPLATES_DIR, 'Style_A_FullBleed.html'), 'utf8');
  const base64A_Bezos = getBase64DataUri(imageMap.styleA);
  const htmlA_Bezos = templateA.replace('{{IMAGE_PATH}}', base64A_Bezos);
  await page.setContent(htmlA_Bezos, { waitUntil: 'networkidle' });
  const outPathA_Bezos = path.join(OUTPUT_DIR, 'TEST_STYLE_A_FullBleed_Bezos.png');
  await page.screenshot({ path: outPathA_Bezos, type: 'png' });
  console.log(`[Style A Bezos Done] Saved to: ${outPathA_Bezos}`);

  // Render Style A (Reference Photo - Jokowi & Susi)
  console.log('[Style Test Engine] Rendering Polished Style A (Reference Photo - Jokowi & Susi)...');
  const base64A_Jokowi = getBase64DataUri(path.join(REF_DESIGNS_DIR, 'photo_2026-08-08_11-42-03.jpg'));
  const htmlA_Jokowi = templateA
    .replace('{{IMAGE_PATH}}', base64A_Jokowi)
    .replace("Strategi Alokasi Modal $200B: Bagaimana Jeff Bezos Menguasai <span class=\"highlight-yellow\">'Cashflow Amazon'</span>", "Bu Susi Jadi Menteri Andalan Jokowi yang <span class=\"highlight-yellow\">Sengaja Ditunjuk</span> Buat Bikin 'Keributan'")
    .replace("Langkah-langkah taktis alokasi modal dan reinvestasi agresif yang membangun imperium e-commerce terbesar dunia.", "Langkah-langkah Revolusioner Susi Pudjiastuti yang Merubah Wajah Kelautan Indonesia");
  await page.setContent(htmlA_Jokowi, { waitUntil: 'networkidle' });
  const outPathA_Jokowi = path.join(OUTPUT_DIR, 'TEST_STYLE_A_FullBleed_Jokowi.png');
  await page.screenshot({ path: outPathA_Jokowi, type: 'png' });
  console.log(`[Style A Jokowi Done] Saved to: ${outPathA_Jokowi}`);

  // Render Style B
  console.log('[Style Test Engine] Rendering Polished Style B (White Card Overlay on Hero Portrait)...');
  const templateB = fs.readFileSync(path.join(TEMPLATES_DIR, 'Style_B_WhiteCard.html'), 'utf8');
  const base64B = getBase64DataUri(imageMap.styleB);
  const htmlB = templateB.replace('{{IMAGE_PATH}}', base64B);
  await page.setContent(htmlB, { waitUntil: 'networkidle' });
  const outPathB = path.join(OUTPUT_DIR, 'TEST_STYLE_B_WhiteCard_Trump.png');
  await page.screenshot({ path: outPathB, type: 'png' });
  console.log(`[Style B Done] Saved to: ${outPathB}`);

  // Render Style C with Transparent Cutout
  console.log('[Style Test Engine] Rendering Polished Style C (Hero Subject Cutout & Light Canvas)...');
  const templateC = fs.readFileSync(path.join(TEMPLATES_DIR, 'Style_C_CutoutSplit.html'), 'utf8');
  const base64C = getBase64DataUri(imageMap.styleC_cutout);
  const htmlC = templateC.replace('{{IMAGE_PATH}}', base64C);
  await page.setContent(htmlC, { waitUntil: 'networkidle' });
  const outPathC = path.join(OUTPUT_DIR, 'TEST_STYLE_C_CutoutSplit_TomLee.png');
  await page.screenshot({ path: outPathC, type: 'png' });
  console.log(`[Style C Done] Saved to: ${outPathC}`);

  await browser.close();
  console.log('\n========================================');
  console.log('[Style Test Engine] All 3 Polished Style Covers Rendered Successfully!');
}

renderStyles().catch(console.error);
