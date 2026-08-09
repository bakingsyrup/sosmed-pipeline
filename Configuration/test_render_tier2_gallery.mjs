import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_BASE = path.join(__dirname, 'templates', 'instagram');
const COVER_DIR = path.join(TEMPLATES_BASE, 'covers');
const TIER2_DIR = path.join(TEMPLATES_BASE, 'body_cards', 'tier2_standard');
const OUTRO_DIR = path.join(TEMPLATES_BASE, 'outro');
const OUTPUT_DIR = path.join(TEMPLATES_BASE, 'previews', 'tier2_gallery');

const TEST_IMAGE_PATH = '/home/silvester/Downloads/ig_examples/GettyImages-2221816314-1920x1280.jpg';

function getBase64DataUri(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
}

async function renderTier2Gallery() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('--- RENDERING TIER 2 (STANDARD DENSITY 50-140 CHARS) GALLERY ---');

  const base64Img = getBase64DataUri(TEST_IMAGE_PATH);
  const bgImgHtml = `<img class="background-img" src="${base64Img}" alt="Background" />`;

  // 1. COVER CARD (Slide 1) - layout-left-split
  const coverTemplatePath = path.join(COVER_DIR, 'Cover_Card_Hook.html');
  const rawCoverHtml = fs.readFileSync(coverTemplatePath, 'utf8');
  let coverHtml = rawCoverHtml
    .replace(/{{TEXT_PLACEMENT}}/g, 'left-split')
    .replace(/{{BACKGROUND_IMG_HTML}}/g, bgImgHtml)
    .replace(/{{HEADLINE_HTML}}/g, `Strategi Hedging <span class="highlight-emerald">Standard Tier 2</span> Untuk Portofolio`)
    .replace(/{{SUBHEADLINE_TEXT}}/g, `Panduan menengah mengamankan aset spot saat volatility spike terjadi di pasar global.`)
    .replace(/{{ACCENT_HEX}}/g, '#10B981');

  await page.setContent(coverHtml, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'Slide_1_Cover.png'), type: 'png' });
  console.log('[Slide 1 Done] Saved Tier 2 Cover');

  // 2. TIER 2 BODY CARDS (Slides 2-6) - Benchmarked at 120-140 Chars Max Capacity
  const formats = [
    {
      slideNum: 2,
      file: 'Format_1_BulletSOP_T2.html',
      output: 'Slide_2_Format_1_BulletSOP_T2.png',
      headline: 'SOP Manajemen Risiko Saat Indikator Volatilitas Melonjak Tinggi',
      body: `<div class="bullet-item">
          <span class="bullet-icon">•</span>
          <div class="bullet-text"><span class="bullet-lead">Analisis Konfirmasi Signal:</span> Apabila indikator RSI daily menembus area oversold dan volume transaksi spot menurun drastis dalam kurun waktu 24 jam terakhir.</div>
        </div>
        <div class="bullet-item">
          <span class="bullet-icon">•</span>
          <div class="bullet-text"><span class="bullet-lead">Prosedur Eksekusi Hedging:</span> Buka posisi short futures sebesar 100% dari total nilai portfolio spot kamu untuk mengunci saldo fiat secara otomatis.</div>
        </div>
        <div class="bullet-item">
          <span class="bullet-icon">•</span>
          <div class="bullet-text"><span class="bullet-lead">Evaluasi Pemulihan Trend:</span> Lakukan pembukaan posisi hedge secara bertahap saat candle konfirmasi weekly kembali berada di atas MA-50.</div>
        </div>`
    },
    {
      slideNum: 3,
      file: 'Format_2_KeyValueTable_T2.html',
      output: 'Slide_3_Format_2_KeyValueTable_T2.png',
      headline: 'Perbandingan Dampak Risiko Antara Holding Pasif vs Hedging Aktif',
      body: `<div class="card-positive">
          <div class="card-badge-pos">📌 EKSEKUSI STRATEGI HEDGING AKTIF</div>
          <div class="card-desc">Mengamankan modal bersih 100% dari drawdown parah saat pasar mengalami tren penurunan tajam, serta memberikan keleluasaan untuk akumulasi di harga bawah.</div>
        </div>
        <div class="card-negative">
          <div class="card-badge-neg">❌ MENAHAN POSISI SPOT TANPA PROTEKSI</div>
          <div class="card-desc">Membiarkan portofolio tergerus hingga 60% selama siklus bear market tanpa adanya perlindungan nilai, yang menyebabkan depresi psikologis dan kerugian fatal.</div>
        </div>`
    },
    {
      slideNum: 4,
      file: 'Format_3_ArrowFlow_T2.html',
      output: 'Slide_4_Format_3_ArrowFlow_T2.png',
      headline: 'Workflow 3 Langkah Taktis Mengamankan Nilai Aset Kripto Kamu',
      body: `<div class="step-card">
          <div class="step-number-badge">01</div>
          <div class="step-content">
            <div class="step-title">Identifikasi Struktur Breakdown Support</div>
            <div class="step-desc">Perhatikan konfirmasi penutupan harga harian di bawah level support utama yang disertai dengan peningkatan volume penjualan yang sangat signifikan.</div>
          </div>
        </div>
        <div class="arrow-divider">↓</div>
        <div class="step-card">
          <div class="step-number-badge">02</div>
          <div class="step-content">
            <div class="step-title">Perhitungan Ukuran Posisi Short Futures</div>
            <div class="step-desc">Hitung secara akurat nominal ekuitas spot kamu lalu buka posisi delta-neutral short pada futures tanpa menggunakan leverage berlebihan.</div>
          </div>
        </div>
        <div class="arrow-divider">↓</div>
        <div class="step-card">
          <div class="step-number-badge">03</div>
          <div class="step-content">
            <div class="step-title">Monitoring Dan Unhedging Kuantitatif</div>
            <div class="step-desc">Tutup posisi short secara bertahap saat grafik harga menunjukkan konversi pola pembalikan arah bullish atau pola konsolidasi akumulasi baru.</div>
          </div>
        </div>`
    },
    {
      slideNum: 5,
      file: 'Format_4_QASplit_T2.html',
      output: 'Slide_5_Format_4_QASplit_T2.png',
      headline: 'Tanya Jawab Seputar Parameter Eksekusi Proteksi Portofolio',
      body: `<div class="qa-pair-container">
          <div class="question-text-mini">Apakah biaya perpindahan posisi dan funding rate futures tidak memakan profit?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Biaya funding rate jauh lebih kecil dibanding risiko kehabisan ekuitas hingga 50% saat skenario pasar mengalami penurunan liar secara mendadak.</div>
          </div>
        </div>
        <div class="qa-pair-container">
          <div class="question-text-mini">Kapan waktu paling tepat untuk melepas posisi lindung nilai hedging ini?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Lepas posisi short secara bertahap ketika indikator teknis mengonfirmasi pembentukan pola higher low baru dengan lonjakan volume beli yang valid.</div>
          </div>
        </div>`
    },
    {
      slideNum: 6,
      file: 'Format_5_NarrativeBlock_T2.html',
      output: 'Slide_6_Format_5_NarrativeBlock_T2.png',
      headline: 'Prinsip Dasar Pengelolaan Risiko Untuk Investor Jangka Panjang',
      body: `<div class="narrative-lead">Tujuan utama dari mekanisme hedging bukanlah mencari keuntungan spekulatif belaka.</div>
<div class="narrative-body">Mekanisme ini dirancang sebagai jaring pengaman agar modal utama kamu tidak pernah musnah tergerus oleh siklus gelombang bear market yang panjang dan tidak menentu. Investor profesional selalu memprioritaskan proteksi modal sebelum memikirkan potensi imbal hasil.</div>`
    }
  ];

  for (const fmt of formats) {
    console.log(`[Slide ${fmt.slideNum}] Rendering Tier 2 Format: ${fmt.file}...`);
    const templatePath = path.join(TIER2_DIR, fmt.file);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{HEADLINE_TEXT}}/g, fmt.headline)
      .replace(/{{BODY_CONTENT_HTML}}/g, fmt.body)
      .replace(/{{ACCENT_HEX}}/g, '#10B981');

    const outputFilePath = path.join(OUTPUT_DIR, fmt.output);
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputFilePath, type: 'png' });
    console.log(`[Slide ${fmt.slideNum} Done] Saved to: ${outputFilePath}`);
  }

  // 3. OUTRO CTA CARD (Slide 7)
  console.log('[Slide 7] Rendering Outro CTA Card...');
  const outroTemplatePath = path.join(OUTRO_DIR, 'Outro_Card_CTA.html');
  let outroHtml = fs.readFileSync(outroTemplatePath, 'utf8');
  outroHtml = outroHtml
    .replace(/{{OUTRO_HEADLINE}}/g, `Amankan Portofolio Kripto Kamu Sekarang!`)
    .replace(/{{OUTRO_SUBTEXT}}/g, `Simpan postingan ini sebagai panduan cepat saat pasar mengalami penurunan tajam.`);
  
  const outroOutPath = path.join(OUTPUT_DIR, 'Slide_7_Outro_CTA.png');
  await page.setContent(outroHtml, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outroOutPath, type: 'png' });
  console.log(`[Slide 7 Done] Saved to: ${outroOutPath}`);

  await browser.close();

  // Mirror files to brain artifact directory for display
  const ARTIFACT_DIR = path.join('/home/silvester/.gemini/antigravity-cli/brain/3b407fbe-1782-4857-ad6e-2b93a6bd9026', 'tier2_gallery');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.readdirSync(OUTPUT_DIR).forEach(file => {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(OUTPUT_DIR, file), path.join(ARTIFACT_DIR, file));
    }
  });

  console.log('\n[Tier 2 Gallery Engine] ✅ Tier 2 Standard Density Gallery Rendered Successfully!');
}

renderTier2Gallery().catch(console.error);
