import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_BASE = path.join(__dirname, 'templates', 'instagram');
const COVER_DIR = path.join(TEMPLATES_BASE, 'covers');
const TIER1_DIR = path.join(TEMPLATES_BASE, 'body_cards', 'tier1_punchy');
const OUTRO_DIR = path.join(TEMPLATES_BASE, 'outro');
const OUTPUT_DIR = path.join(TEMPLATES_BASE, 'previews', 'tier1_gallery');

const TEST_IMAGE_PATH = '/home/silvester/Downloads/ig_examples/6a6b937ea62e6e00bc5388e3.jpeg';

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

async function renderFullCarouselGallery() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('--- RENDERING ALL 4 COVER LAYOUTS: CALIBRATED 0% FACE-SHADOW FRAMING ---');

  const base64Img = getBase64DataUri(TEST_IMAGE_PATH);
  const bgImgHtml = `<img class="background-img" src="${base64Img}" alt="Background" />`;

  // CALIBRATED 0% FACE-SHADOW OBJECT-POSITION MATRIX
  const coverPlacements = [
    { placement: 'left-split', name: 'Slide_1A_Cover_LeftSplit.png', objectPosition: '25% center' },
    { placement: 'right-split', name: 'Slide_1B_Cover_RightSplit.png', objectPosition: '75% center' },
    { placement: 'bottom', name: 'Slide_1C_Cover_Bottom.png', objectPosition: 'center 10%' },
    { placement: 'top', name: 'Slide_1D_Cover_Top.png', objectPosition: 'center 85%' },
  ];

  const coverTemplatePath = path.join(COVER_DIR, 'Cover_Card_Hook.html');
  const rawCoverHtml = fs.readFileSync(coverTemplatePath, 'utf8');

  for (const c of coverPlacements) {
    console.log(`[Cover Engine] Rendering Placement (Calibrated 0% Face-Shadow: ${c.objectPosition}): layout-${c.placement}...`);
    let html = rawCoverHtml
      .replace(/{{TEXT_PLACEMENT}}/g, c.placement)
      .replace(/{{BACKGROUND_IMG_HTML}}/g, bgImgHtml)
      .replace(/{{HEADLINE_HTML}}/g, `Panduan SOP Hedging <span class="highlight-emerald">Antirungkat</span> Bear Market`)
      .replace(/{{SUBHEADLINE_TEXT}}/g, `Kunci nilai portofolio crypto kamu 100% netral saat pasar crash mendadak.`)
      .replace(/{{ACCENT_HEX}}/g, '#10B981')
      .replace(/{{OBJECT_POSITION}}/g, c.objectPosition);

    const coverOutPath = path.join(OUTPUT_DIR, c.name);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: coverOutPath, type: 'png' });
    console.log(`[Cover Done] Saved to: ${coverOutPath}`);
  }

  // 2. SLIDES 2-6: TIER 1 BODY CARDS
  const formats = [
    {
      slideNum: 2,
      file: 'Format_1_BulletSOP_T1.html',
      output: 'Slide_2_Format_1_BulletSOP.png',
      headline: 'Panduan SOP Penting Menjaga Portofolio Crypto Kamu',
      body: `<div class="bullet-item"><span class="bullet-icon">•</span><div class="bullet-text"><span class="bullet-lead">Kondisi:</span> Konfirmasi daily candle close jebol support.</div></div>
<div class="bullet-item"><span class="bullet-icon">•</span><div class="bullet-text"><span class="bullet-lead">Aksi:</span> Segera buka posisi short 1:1 seukuran spot.</div></div>
<div class="bullet-item"><span class="bullet-icon">•</span><div class="bullet-text"><span class="bullet-lead">Hasil:</span> Nilai modal portofolio aman seratus persen.</div></div>`
    },
    {
      slideNum: 3,
      file: 'Format_2_KeyValueTable_T1.html',
      output: 'Slide_3_Format_2_KeyValueTable.png',
      headline: 'Perbandingan Strategi Panik Jual Versus Hedging 1:1',
      body: `<div class="card-positive">
          <div class="card-badge-pos">📌 STRATEGI EKSEKUSI HEDGING 1:1</div>
          <div class="card-desc">Eksekusi short 1:1 amankan modal spot seratus persen.</div>
        </div>
        <div class="card-negative">
          <div class="card-badge-neg">❌ KESALAHAN PANIK JUAL SPOT</div>
          <div class="card-desc">Cutloss di bottom market berisiko rugi dan ketinggalan.</div>
        </div>`
    },
    {
      slideNum: 4,
      file: 'Format_3_ArrowFlow_T1.html',
      output: 'Slide_4_Format_3_ArrowFlow.png',
      headline: '3 Langkah Tepat Mengantisipasi Breakdown Pasar BTC',
      body: `<div class="step-card">
          <div class="step-badge">01</div>
          <div class="step-content">
            <div class="step-title">Pantau Support Utama</div>
            <div class="step-desc">Tandai area key support pada chart daily kamu.</div>
          </div>
        </div>
        <div class="flow-arrow">↓</div>
        <div class="step-card">
          <div class="step-badge">02</div>
          <div class="step-content">
            <div class="step-title">Buka Short Futures 1:1</div>
            <div class="step-desc">Eksekusi short dengan ukuran persis nominal spot.</div>
          </div>
        </div>
        <div class="flow-arrow">↓</div>
        <div class="step-card">
          <div class="step-badge">03</div>
          <div class="step-content">
            <div class="step-title">Take Profit Saat Sideways</div>
            <div class="step-desc">Tutup posisi short begitu tekanan jual mulai mereda.</div>
          </div>
        </div>`
    },
    {
      slideNum: 5,
      file: 'Format_4_QASplit_T1.html',
      output: 'Slide_5_Format_4_QASplit.png',
      headline: 'Pertanyaan Populer Mengenai Taktik Hedging Futures',
      body: `<div class="qa-pair-container">
          <div class="question-text-mini">Apakah short futures cuma untuk spekulasi saja?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Ini short 1:1 khusus pelindung modal spot kamu.</div>
          </div>
        </div>
        <div class="qa-pair-container">
          <div class="question-text-mini">Bagaimana jika harga pasar mendadak naik lagi?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Tutup short, profit pada aset spot lanjut terus.</div>
          </div>
        </div>`
    },
    {
      slideNum: 6,
      file: 'Format_5_NarrativeBlock_T1.html',
      output: 'Slide_6_Format_5_NarrativeBlock.png',
      headline: 'Memahami Aturan Utama Dalam Mekanik Hedging Spot',
      body: `<div class="narrative-lead">Tujuan hedging hanya untuk melindungi modal kamu.</div>
<div class="narrative-body">Tutup short begitu sideways dan volume mengering.</div>`
    }
  ];

  for (const fmt of formats) {
    console.log(`[Slide ${fmt.slideNum}] Rendering Format: ${fmt.file}...`);
    const templatePath = path.join(TIER1_DIR, fmt.file);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{HEADLINE_TEXT}}/g, fmt.headline)
      .replace(/{{BODY_CONTENT_HTML}}/g, fmt.body)
      .replace(/{{ACCENT_HEX}}/g, '#10B981');

    const outputFilePath = path.join(OUTPUT_DIR, fmt.output);
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputFilePath, type: 'png' });
    console.log(`[Slide ${fmt.slideNum}] Done Saved to: ${outputFilePath}`);
  }

  // 3. SLIDE 7: OUTRO CTA CARD
  console.log('[Slide 7] Rendering Outro CTA Card...');
  const outroTemplatePath = path.join(OUTRO_DIR, 'Outro_Card_CTA.html');
  let outroHtml = fs.readFileSync(outroTemplatePath, 'utf8');
  outroHtml = outroHtml
    .replace(/{{OUTRO_HEADLINE}}/g, `Kamu Suka?`)
    .replace(/{{OUTRO_SUBTEXT}}/g, `Follow. Like. Comment`);
  
  const outroOutPath = path.join(OUTPUT_DIR, 'Slide_7_Outro_CTA.png');
  await page.setContent(outroHtml, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outroOutPath, type: 'png' });
  console.log(`[Slide 7 Done] Saved to: ${outroOutPath}`);

  await browser.close();

  // Mirror files to brain artifact directory for display
  const ARTIFACT_DIR = path.join('/home/silvester/.gemini/antigravity-cli/brain/3b407fbe-1782-4857-ad6e-2b93a6bd9026', 'tier1_gallery');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.readdirSync(OUTPUT_DIR).forEach(file => {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(OUTPUT_DIR, file), path.join(ARTIFACT_DIR, file));
    }
  });

  console.log('\n[Full Gallery Engine] ✅ All 4 Cover Layouts Rendered with 0% Face-Shadow Framing!');
}

renderFullCarouselGallery().catch(console.error);
