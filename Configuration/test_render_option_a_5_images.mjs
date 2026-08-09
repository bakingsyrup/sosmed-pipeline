import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const OUTPUT_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'option_a_test');

const TEST_IMAGES = [
  { id: 'img1_portrait', path: '/home/silvester/Downloads/ig_examples/0c9deea8f2e042bd37aaf4cdcc3fe156.jpg' },
  { id: 'img2_youngman', path: '/home/silvester/Downloads/ig_examples/6a6b937ea62e6e00bc5388e3.jpeg' },
  { id: 'img3_headshot', path: '/home/silvester/Downloads/ig_examples/b2cc026519b1ed13bb768283c789e3f3.jpeg' },
  { id: 'img4_crypto_eth', path: '/home/silvester/Downloads/ig_examples/bitmine-adds-317-000-eth-takes-its-treasury-near-5-b-featured-image-6899edcf7cc1e90001c48621.webp' },
  { id: 'img5_bezos', path: '/home/silvester/Downloads/ig_examples/SEI_307274412.jpg' }
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

async function renderOptionASandbox() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('--- RENDERING OPTION A STRUCTURAL SPLIT CONTAINER TEST FOR 5 IMAGES ---');

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const item = TEST_IMAGES[i];
    console.log(`\n[Option A Test ${i + 1}/5] Processing: ${item.id} (${path.basename(item.path)})...`);

    const base64Img = getBase64DataUri(item.path);
    if (!base64Img) continue;

    // Render Left Split (Text Left, Image Right Window)
    let htmlLeft = rawTemplate
      .replace(/{{TEXT_PLACEMENT}}/g, 'left-split')
      .replace(/{{IMAGE_SRC}}/g, base64Img)
      .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
      .replace(/{{ACCENT_HEX}}/g, '#10B981');

    const outPathLeft = path.join(OUTPUT_DIR, `OptionA_${i + 1}_${item.id}_LeftSplit.png`);
    await page.setContent(htmlLeft, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPathLeft, type: 'png' });
    console.log(`  ✓ Saved Left-Split: ${outPathLeft}`);

    // Render Right Split (Text Right, Image Left Window)
    let htmlRight = rawTemplate
      .replace(/{{TEXT_PLACEMENT}}/g, 'right-split')
      .replace(/{{IMAGE_SRC}}/g, base64Img)
      .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
      .replace(/{{ACCENT_HEX}}/g, '#10B981');

    const outPathRight = path.join(OUTPUT_DIR, `OptionA_${i + 1}_${item.id}_RightSplit.png`);
    await page.setContent(htmlRight, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPathRight, type: 'png' });
    console.log(`  ✓ Saved Right-Split: ${outPathRight}`);
  }

  await browser.close();

  // Mirror files to brain artifact directory for display
  const ARTIFACT_DIR = path.join('/home/silvester/.gemini/antigravity-cli/brain/3b407fbe-1782-4857-ad6e-2b93a6bd9026', 'option_a_test');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.readdirSync(OUTPUT_DIR).forEach(file => {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(OUTPUT_DIR, file), path.join(ARTIFACT_DIR, file));
    }
  });

  console.log('\n[Option A Sandbox] ✅ All 10 Option A Test Render Outputs Saved to Artifact Gallery!');
}

renderOptionASandbox().catch(console.error);
