import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImageSaliency, selectUniversalLayout } from './services/vision_analyzer.mjs';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'instagram', 'covers', 'Option_A_SplitContainer.html');
const INPUT_DIR = '/home/silvester/Downloads/ig_examples';
const OUTPUT_DIR = '/home/silvester/Downloads/ig_examples';

function getBase64DataUri(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  if (ext === '.webp') mimeType = 'image/webp';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function generateNewCovers() {
  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Collect image files (exclude generated output PNGs)
  const imageFiles = [];
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && !item.startsWith('Cover_Slide1_')) {
          imageFiles.push(fullPath);
        }
      }
    }
  }

  scanDir(INPUT_DIR);

  console.log(`\n======================================================`);
  console.log(`🚀 AI VISION & LAYOUT PIPELINE: GENERATING SLIDE 1 COVERS`);
  console.log(`Found ${imageFiles.length} target input images in: ${INPUT_DIR}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  for (let i = 0; i < imageFiles.length; i++) {
    const imgPath = imageFiles[i];
    const baseName = path.basename(imgPath, path.extname(imgPath)).replace(/[^a-zA-Z0-9_-]/g, '_');
    console.log(`[${i + 1}/${imageFiles.length}] Processing input image: ${path.basename(imgPath)}`);

    const visionData = await analyzeImageSaliency(imgPath);
    const layout = selectUniversalLayout(visionData);

    console.log(`   ➜ Subject Type: "${visionData.subject_type}", Description: "${visionData.primary_subject_description || 'N/A'}"`);
    console.log(`   ➜ Vision Metrics: Center (${visionData.saliency_x_percent}%, ${visionData.saliency_y_percent}%), Width Ratio: ${visionData.subject_width_ratio}`);
    console.log(`   ➜ AI Layout Choice: Placement: "${layout.placement}", Pos: "${layout.objectPosition}", Fit: "${layout.objectFit || 'cover'}", Accent: "${visionData.recommended_accent_hex}"\n`);

    const base64Img = getBase64DataUri(imgPath);
    let html = rawTemplate
      .replace(/\{\{TEXT_PLACEMENT\}\}/g, layout.placement)
      .replace(/\{\{OBJECT_POSITION\}\}/g, layout.objectPosition)
      .replace(/\{\{OBJECT_FIT\}\}/g, layout.objectFit || 'cover')
      .replace(/\{\{ACCENT_HEX\}\}/g, visionData.recommended_accent_hex || '#10B981')
      .replace(/\{\{IMAGE_SRC\}\}/g, base64Img)
      .replace(/\{\{HEADLINE_HTML\}\}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/\{\{SUBHEADLINE_TEXT\}\}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`);

    const outFileName = `Cover_Slide1_AI_Auto_${baseName}.png`;
    const outPath = path.join(OUTPUT_DIR, outFileName);

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Saved generated cover to: ${outPath}\n`);
  }

  await browser.close();

  console.log(`======================================================`);
  console.log(`✅ SUCCESS! All Slide 1 covers generated directly to: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);
}

generateNewCovers().catch(console.error);
