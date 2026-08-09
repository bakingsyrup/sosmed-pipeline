import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImageSaliency, selectUniversalLayout } from './services/vision_analyzer.mjs';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const OUTPUT_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'universal_test');

const TEST_IMAGES = [
  {
    name: 'Person_Portrait_1',
    path: '/home/silvester/Downloads/ig_examples/20180308000946_0.jpg'
  },
  {
    name: 'Putin_Portrait_2',
    path: '/home/silvester/Downloads/ig_examples/67589fe0-24fa-11ef-b2d2-6f1141c943b0.jpg'
  },
  {
    name: 'Altman_CloseUp_3',
    path: '/home/silvester/Downloads/ig_examples/6a667e40548c9c486b310bc2.jpeg'
  },
  {
    name: 'Getty_Leader_4',
    path: '/home/silvester/Downloads/ig_examples/GettyImages-2287523731-e1785497513314.jpg'
  },
  {
    name: 'Sunglasses_Person_5',
    path: '/home/silvester/Downloads/ig_examples/d9faeec305aa9369a2b700322dc79b7e.jpg'
  },
  {
    name: 'Zooko_Wilcox_6',
    path: '/home/silvester/Downloads/ig_examples/zooko_wilcox-min.webp'
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

async function runUniversalTest() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log(`\n======================================================`);
  console.log(`🚀 STARTING UNIVERSAL AI VISION & LAYOUT ENGINE TEST`);
  console.log(`======================================================\n`);

  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const item = TEST_IMAGES[i];
    console.log(`[${i + 1}/${TEST_IMAGES.length}] Analyzing: ${item.name} (${path.basename(item.path)})`);

    const visionData = await analyzeImageSaliency(item.path);
    const layout = selectUniversalLayout(visionData);

    console.log(`   ➜ Vision Result: Type: "${visionData.subject_type}", Saliency Center: (${visionData.saliency_x_percent}%, ${visionData.saliency_y_percent}%), Width Ratio: ${visionData.subject_width_ratio}`);
    console.log(`   ➜ Layout Choice: Placement: "${layout.placement}", Pos: "${layout.objectPosition}", Fit: "${layout.objectFit || 'cover'}", Accent: "${visionData.recommended_accent_hex}"\n`);

    const base64Img = getBase64DataUri(item.path);
    let html = rawTemplate
      .replace(/\{\{TEXT_PLACEMENT\}\}/g, layout.placement)
      .replace(/\{\{OBJECT_POSITION\}\}/g, layout.objectPosition)
      .replace(/\{\{OBJECT_FIT\}\}/g, layout.objectFit || 'cover')
      .replace(/\{\{ACCENT_HEX\}\}/g, visionData.recommended_accent_hex || '#10B981')
      .replace(/\{\{IMAGE_SRC\}\}/g, base64Img)
      .replace(/\{\{HEADLINE_HTML\}\}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/\{\{SUBHEADLINE_TEXT\}\}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`);

    const outPath = path.join(OUTPUT_DIR, `Cover_AI_Auto_${item.name}.png`);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Saved rendered cover: ${outPath}\n`);
  }

  await browser.close();
  console.log(`======================================================`);
  console.log(`✅ UNIVERSAL AI TEST COMPLETE. Files saved to: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);
}

runUniversalTest().catch(console.error);
