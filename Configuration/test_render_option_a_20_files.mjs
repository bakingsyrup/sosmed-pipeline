import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const TARGET_GALLERY_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'tier1_gallery');

const TEST_IMAGES = [
  { id: 'img1', name: '0c9deea8f2e042bd37aaf4cdcc3fe156', path: '/home/silvester/Downloads/ig_examples/0c9deea8f2e042bd37aaf4cdcc3fe156.jpg' },
  { id: 'img2', name: '6a6b937ea62e6e00bc5388e3', path: '/home/silvester/Downloads/ig_examples/6a6b937ea62e6e00bc5388e3.jpeg' },
  { id: 'img3', name: 'b2cc026519b1ed13bb768283c789e3f3', path: '/home/silvester/Downloads/ig_examples/b2cc026519b1ed13bb768283c789e3f3.jpeg' },
  { id: 'img4', name: 'bitmine_eth', path: '/home/silvester/Downloads/ig_examples/bitmine-adds-317-000-eth-takes-its-treasury-near-5-b-featured-image-6899edcf7cc1e90001c48621.webp' },
  { id: 'img5', name: 'trump_bezos', path: '/home/silvester/Downloads/ig_examples/SEI_307274412.jpg' }
];

const PLACEMENTS = [
  { key: 'LeftSplit', placement: 'left-split' },
  { key: 'RightSplit', placement: 'right-split' },
  { key: 'Bottom', placement: 'bottom' },
  { key: 'Top', placement: 'top' }
];

function getBase64DataUri(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[Warning] Image file not found at: ${filePath}`);
    return '';
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  if (ext === '.webp') mimeType = 'image/webp';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function renderOptionA20Files() {
  if (!fs.existsSync(TARGET_GALLERY_DIR)) fs.mkdirSync(TARGET_GALLERY_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('--- RENDERING ALL 20 OPTION A SPLIT CONTAINER FILES (5 IMAGES X 4 QUADRANTS) ---');
  console.log(`Target Output Folder: ${TARGET_GALLERY_DIR}\n`);

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  let count = 0;
  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const item = TEST_IMAGES[i];
    const base64Img = getBase64DataUri(item.path);
    if (!base64Img) continue;

    for (const p of PLACEMENTS) {
      count++;
      const fileName = `Slide_1_${item.id}_${item.name}_Cover_${p.key}.png`;
      const outputPath = path.join(TARGET_GALLERY_DIR, fileName);

      let html = rawTemplate
        .replace(/{{TEXT_PLACEMENT}}/g, p.placement)
        .replace(/{{IMAGE_SRC}}/g, base64Img)
        .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
        .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
        .replace(/{{ACCENT_HEX}}/g, '#10B981');

      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, type: 'png' });
      console.log(`[${count}/20] Rendered & Saved: ${fileName}`);
    }
  }

  await browser.close();

  // Also mirror to brain artifact gallery
  const ARTIFACT_DIR = path.join('/home/silvester/.gemini/antigravity-cli/brain/3b407fbe-1782-4857-ad6e-2b93a6bd9026', 'tier1_gallery');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.readdirSync(TARGET_GALLERY_DIR).forEach(file => {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(TARGET_GALLERY_DIR, file), path.join(ARTIFACT_DIR, file));
    }
  });

  console.log(`\n[Done] ✅ Successfully rendered all 20 cover files directly to:\n${TARGET_GALLERY_DIR}`);
}

renderOptionA20Files().catch(console.error);
