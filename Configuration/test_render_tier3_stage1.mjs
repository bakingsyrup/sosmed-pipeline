import playwright from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates/instagram';
const TIER2_TEMPLATES_DIR = path.join(BASE_DIR, 'body_cards/tier2_standard');
const OUTPUT_DIR = path.join(BASE_DIR, 'previews/tier3_gallery');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Stage 1 Max Tier 3 Copy (140-300+ chars per item)
const STAGE1_TIER3_DATA = [
  {
    slideNumber: 2,
    templateFile: 'Format_1_BulletSOP_T2.html',
    outputFile: 'Slide_2_Format_1_BulletSOP_T3_Stage1.png',
    headline: 'SOP Manajemen Portofolio High-Risk Crypto 2026',
    accentColor: '#10B981',
    bodyHtml: `
      <div class="bullet-item">
        <div class="bullet-icon">●</div>
        <div class="bullet-text">
          <span class="bullet-lead">DCA Terstruktur:</span> Melakukan pembelian bertahap setiap minggu pada aset tier 1 seperti Bitcoin dan Ethereum tanpa menggunakan leverage berlebih. Langkah ini efektif meminimalkan dampak psikologis akibat fluktuasi pasar ekstrem dalam jangka panjang.
        </div>
      </div>
      <div class="bullet-item">
        <div class="bullet-icon">●</div>
        <div class="bullet-text">
          <span class="bullet-lead">Distribusi Margin Netral:</span> Menempatkan 50% modal di aset spot utama dan 50% sisanya pada posisi short hedging saat terjadi pembalikan tren harga. Strategi ini menjaga nilai total portofolio tetap 100% stabil di tengah fase crash.
        </div>
      </div>
      <div class="bullet-item">
        <div class="bullet-icon">●</div>
        <div class="bullet-text">
          <span class="bullet-lead">Disiplin Cut-Loss Parsial:</span> Memasang perintah stop-loss otomatis di 3% tepat di bawah garis indikator MA-50 jam. Jika harga menembus level tersebut, sistem akan langsung mengeksekusi likuidasi parsial demi mengamankan sisa modal dingin.
        </div>
      </div>
    `
  },
  {
    slideNumber: 3,
    templateFile: 'Format_2_KeyValueTable_T2.html',
    outputFile: 'Slide_3_Format_2_KeyValueTable_T3_Stage1.png',
    headline: 'Analisis Perbandingan Strategi Spot vs Futures Market',
    accentColor: '#10B981',
    bodyHtml: `
      <div class="comparison-grid">
        <div class="card-positive">
          <div class="card-badge-pos">✓ REKOMENDASI SPOT DCA</div>
          <div class="card-desc">Membeli aset crypto secara berkala tanpa leverage berisiko tinggi. Strategi ini sangat aman, bebas dari beban biaya funding rate harian bursa, dan secara historis terbukti mampu menghasilkan imbal hasil konsisten bagi investor jangka panjang.</div>
        </div>
        <div class="card-negative">
          <div class="card-badge-neg">✗ RISIKO HIGH-LEVERAGE FUTURES</div>
          <div class="card-desc">Membuka posisi leverage tinggi 20x hingga 50x saat tren pasar tidak menentu. Memiliki risiko likuidasi total 100% modal jika pergerakan harga berlawanan 2% saja, serta dibebani biaya bunga overnight yang terus membengkak.</div>
        </div>
      </div>
    `
  },
  {
    slideNumber: 4,
    templateFile: 'Format_3_ArrowFlow_T2.html',
    outputFile: 'Slide_4_Format_3_ArrowFlow_T3_Stage1.png',
    headline: 'Alur 3 Langkah Konfirmasi Sinyal Reversal Trend',
    accentColor: '#10B981',
    bodyHtml: `
      <div class="step-flow-container">
        <div class="step-card">
          <div class="step-number-badge">01</div>
          <div class="step-content">
            <div class="step-title">Deteksi Divergence RSI</div>
            <div class="step-desc">Perhatikan grafik timeframe 4 jam dengan teliti. Jika pergerakan harga terus membentuk Lower Low baru namun indikator RSI justru menunjukkan kenaikan Higher Low, ini merupakan sinyal awal akumulasi instansi besar.</div>
          </div>
        </div>
        <div class="arrow-divider">↓</div>
        <div class="step-card">
          <div class="step-number-badge">02</div>
          <div class="step-content">
            <div class="step-title">Konfirmasi Breakout Volume</div>
            <div class="step-desc">Tunggu batang candlestick harian menembus garis resistance utama dengan lonjakan volume transaksi minimal 200% di atas rata-rata bulanan untuk memastikan breakout bukan merupakan pergerakan jebakan (fakeout).</div>
          </div>
        </div>
        <div class="arrow-divider">↓</div>
        <div class="step-card">
          <div class="step-number-badge">03</div>
          <div class="step-content">
            <div class="step-title">Entry Re-test Resistance</div>
            <div class="step-desc">Buka posisi buy hanya saat harga melakukan penurunan kembali untuk menguji area bekas resistance yang kini resmi berubah menjadi garis support baru, dengan batas stop-loss 1.5% di bawah candle konfirmasi.</div>
          </div>
        </div>
      </div>
    `
  },
  {
    slideNumber: 5,
    templateFile: 'Format_4_QASplit_T2.html',
    outputFile: 'Slide_5_Format_4_QASplit_T3_Stage1.png',
    headline: 'Tanya Jawab SOP Manajemen Risiko Trading Crypto',
    accentColor: '#10B981',
    bodyHtml: `
      <div class="qa-stack">
        <div class="qa-pair-container">
          <div class="question-text-mini">Apakah aman menahan posisi futures overnight tanpa batas waktu?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Sangat berisiko jika kamu tidak memasang perintah Stop Loss yang ketat. Selain risiko lonjakan volatilitas mendadak saat tidur, akumulasi biaya funding rate harian bursa akan terus menggerus modal portofolio kamu secara perlahan.</div>
          </div>
        </div>
        <div class="qa-pair-container">
          <div class="question-text-mini">Kapan waktu terbaik mengambil eksekusi Take Profit posisi short?</div>
          <div class="answer-row">
            <div class="answer-text-mini">Lakukan eksekusi parsial sebesar 50% saat harga menyentuh garis support kuat pertama di timeframe harian. Biarkan 50% posisi sisanya tetap berjalan dengan memanfaatkan sistem trailing stop mengikuti arah pergerakan tren utama.</div>
          </div>
        </div>
      </div>
    `
  },
  {
    slideNumber: 6,
    templateFile: 'Format_5_NarrativeBlock_T2.html',
    outputFile: 'Slide_6_Format_5_NarrativeBlock_T3_Stage1.png',
    headline: 'Prinsip Utama Manajemen Modal Trader Profesional',
    accentColor: '#10B981',
    bodyHtml: `
      <div class="narrative-card">
        <div class="quote-icon">“</div>
        <div class="narrative-box">
          <div class="narrative-lead">"Pasar crypto tidak pernah peduli dengan analisis teknikal kamu, tetapi pasar selalu menghargai trader yang disiplin mengendalikan batas risiko kerugian modal."</div>
          <div class="narrative-body">Sebagian besar trader pemula mengalami kegagalan total bukan karena analisis teknikal yang buruk, melainkan akibat keserakahan menggunakan posisi leverage tinggi tanpa pernah menghitung batas risiko kerugian maksimal per transaksi. Disiplin posisi size adalah kunci bertahan hidup di pasar finansial.</div>
        </div>
      </div>
    `
  }
];

async function runStage1() {
  console.log('======================================================');
  console.log('🚀 STAGE 1: TIER 3 STRESS TEST RENDERING (140-300+ Chars)');
  console.log('======================================================\n');

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  for (const item of STAGE1_TIER3_DATA) {
    const templatePath = path.join(TIER2_TEMPLATES_DIR, item.templateFile);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{HEADLINE_TEXT}}/g, item.headline)
      .replace(/{{ACCENT_HEX}}/g, item.accentColor)
      .replace(/{{BODY_CONTENT_HTML}}/g, item.bodyHtml);

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const outputPath = path.join(OUTPUT_DIR, item.outputFile);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Slide ${item.slideNumber} (${item.templateFile}): ${outputPath}`);
  }

  await browser.close();
  console.log('\n======================================================');
  console.log(`✅ STAGE 1 COMPLETE. Outputs saved to: ${OUTPUT_DIR}`);
  console.log('======================================================\n');
}

runStage1().catch(err => {
  console.error('❌ Error during Stage 1 rendering:', err);
  process.exit(1);
});
