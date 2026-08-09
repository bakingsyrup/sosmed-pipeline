import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const TARGET_GALLERY_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'tier1_gallery');
const INPUT_DIR = '/home/silvester/Downloads/ig_examples/ig template example';

function getBase64DataUri(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  if (ext === '.webp') mimeType = 'image/webp';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderSubfolderExamples() {
  if (!fs.existsSync(TARGET_GALLERY_DIR)) fs.mkdirSync(TARGET_GALLERY_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const placements = [
    { name: 'LeftSplit', class: 'left-split' },
    { name: 'RightSplit', class: 'right-split' },
    { name: 'Bottom', class: 'bottom' },
    { name: 'Top', class: 'top' }
  ];

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const imgPath = path.join(INPUT_DIR, file);
    const base64Img = getBase64DataUri(imgPath);
    if (!base64Img) continue;

    const baseName = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9_-]/g, '_');

    for (const p of placements) {
      const fileName = `Slide_1_sub_img${idx+1}_${baseName}_Cover_${p.name}.png`;
      let html = rawTemplate
        .replace(/{{TEXT_PLACEMENT}}/g, p.class)
        .replace(/{{IMAGE_SRC}}/g, base64Img)
        .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
        .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
        .replace(/{{ACCENT_HEX}}/g, '#10B981')
        .replace(/{{OBJECT_POSITION}}/g, 'center center');

      const outputPath = path.join(TARGET_GALLERY_DIR, fileName);
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, type: 'png' });
    }
  }

  await browser.close();
}

renderSubfolderExamples().catch(console.error);
