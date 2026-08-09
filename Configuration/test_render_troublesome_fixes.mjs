import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const TARGET_GALLERY_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'tier1_gallery');

const TROUBLESOME_CASES = [
  {
    fileName: 'Slide_1_img5_trump_bezos_Cover_RightSplit.png',
    imgPath: '/home/silvester/Downloads/ig_examples/SEI_307274412.jpg',
    placement: 'right-split',
    objectPosition: '35% center'
  }
];

function getBase64DataUri(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  if (ext === '.webp') mimeType = 'image/webp';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderTroublesomeFixes() {
  if (!fs.existsSync(TARGET_GALLERY_DIR)) fs.mkdirSync(TARGET_GALLERY_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  for (let i = 0; i < TROUBLESOME_CASES.length; i++) {
    const item = TROUBLESOME_CASES[i];
    const base64Img = getBase64DataUri(item.imgPath);
    if (!base64Img) continue;

    let html = rawTemplate
      .replace(/{{TEXT_PLACEMENT}}/g, item.placement)
      .replace(/{{IMAGE_SRC}}/g, base64Img)
      .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
      .replace(/{{ACCENT_HEX}}/g, '#10B981')
      .replace(/{{OBJECT_POSITION}}/g, item.objectPosition);

    const outputPath = path.join(TARGET_GALLERY_DIR, item.fileName);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputPath, type: 'png' });
  }

  await browser.close();

  const ARTIFACT_DIR = path.join('/home/silvester/.gemini/antigravity-cli/brain/3b407fbe-1782-4857-ad6e-2b93a6bd9026', 'tier1_gallery');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  TROUBLESOME_CASES.forEach(item => {
    const srcFile = path.join(TARGET_GALLERY_DIR, item.fileName);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(ARTIFACT_DIR, item.fileName));
    }
  });
}

renderTroublesomeFixes().catch(console.error);
