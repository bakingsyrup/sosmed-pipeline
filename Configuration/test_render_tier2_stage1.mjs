import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, 'templates', 'instagram', 'body_cards', 'tier1_punchy');
const OUTPUT_DIR = path.join(__dirname, 'templates', 'instagram', 'previews', 'tier2_gallery', 'stage1_stresstest');

async function runStage1StressTest() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log(`\n======================================================`);
  console.log(`🚀 STAGE 1: TIER 2 MAX COPY STRESS TEST (USING TIER 1 TEMPLATES)`);
  console.log(`======================================================\n`);

  // Format 1: Bullet SOP (Max Tier 2 copy: 3 long items, 100-140 chars each)
  {
    const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Format_1_BulletSOP_T1.html'), 'utf8');
    const headline = "SOP Eksekusi Hedging Futures di Bear Market";
    const bodyHtml = `
      <div class="bullet-item">
        <div class="bullet-icon">•</div>
        <div class="bullet-text"><span class="bullet-lead">Trailing Stop Ratio:</span> Pasang trailing stop di 2.5% tepat di bawah indikator MA-50 untuk mengunci profit otomatis saat volatilitas pasar naik secara mendadak.</div>
      </div>
      <div class="bullet-item">
        <div class="bullet-icon">•</div>
        <div class="bullet-text"><span class="bullet-lead">Manajemen Leverage:</span> Gunakan posisi leverage maksimal 3x hingga 5x. Jangan pernah melebihi 5x agar terhindar dari kaskade likuidasi paksa di bursa crypto.</div>
      </div>
      <div class="bullet-item">
        <div class="bullet-icon">•</div>
        <div class="bullet-text"><span class="bullet-lead">Alokasi Modal Netral:</span> Bagi portofolio menjadi 50% aset spot utama dan 50% posisi short futures untuk menjaga nilai portofolio 100% netral saat pasar crash.</div>
      </div>
    `;
    let html = tpl
      .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
      .replace(/\{\{HEADLINE_TEXT\}\}/g, headline)
      .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtml);
    
    const outPath = path.join(OUTPUT_DIR, 'Stage1_Format_1_BulletSOP.png');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Format 1: ${outPath}`);
  }

  // Format 2: Key-Value Table (Max Tier 2 copy: 2 cards, 120 chars each)
  {
    const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Format_2_KeyValueTable_T1.html'), 'utf8');
    const headline = "Perbandingan Strategi Spot vs Futures Market";
    const bodyHtml = `
      <div class="card-positive">
        <div class="card-badge-pos">✓ REKOMENDASI SPOT</div>
        <div class="card-desc">Membeli aset crypto secara konsisten setiap minggu tanpa leverage. Berisiko rendah, bebas biaya pendanaan mingguan, dan cocok untuk simpanan jangka panjang.</div>
      </div>
      <div class="card-negative">
        <div class="card-badge-neg">✗ RISIKO FUTURES</div>
        <div class="card-desc">Membuka posisi lonjakan tinggi saat tren tidak menentu. Memiliki risiko likuidasi total 100% modal jika pasar bergerak berlawanan 2% saja.</div>
      </div>
    `;
    let html = tpl
      .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
      .replace(/\{\{HEADLINE_TEXT\}\}/g, headline)
      .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtml);
    
    const outPath = path.join(OUTPUT_DIR, 'Stage1_Format_2_KeyValueTable.png');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Format 2: ${outPath}`);
  }

  // Format 3: Arrow Flow (Max Tier 2 copy: 3 steps, 130 chars each)
  {
    const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Format_3_ArrowFlow_T1.html'), 'utf8');
    const headline = "Alur 3 Langkah Konfirmasi Reversal Trend";
    const bodyHtml = `
      <div class="step-card">
        <div class="step-number-badge">01</div>
        <div class="step-content">
          <div class="step-title">Deteksi Divergence RSI</div>
          <div class="step-desc">Perhatikan grafik timeframe 4 jam. Jika harga membuat Lower Low tetapi RSI membentuk Higher Low, ini sinyal awal akumulasi.</div>
        </div>
      </div>
      <div class="arrow-divider">↓</div>
      <div class="step-card">
        <div class="step-number-badge">02</div>
        <div class="step-content">
          <div class="step-title">Konfirmasi Breakout Volume</div>
          <div class="step-desc">Tunggu batang candlestick harian menembus garis resistance utama dengan lonjakan volume transaksi 200% di atas rata-rata.</div>
        </div>
      </div>
      <div class="arrow-divider">↓</div>
      <div class="step-card">
        <div class="step-number-badge">03</div>
        <div class="step-content">
          <div class="step-title">Entry Re-test Resistance</div>
          <div class="step-desc">Buka posisi buy hanya saat harga melakukan re-test ke area bekas resistance yang kini berubah menjadi garis support baru.</div>
        </div>
      </div>
    `;
    let html = tpl
      .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
      .replace(/\{\{HEADLINE_TEXT\}\}/g, headline)
      .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtml);
    
    const outPath = path.join(OUTPUT_DIR, 'Stage1_Format_3_ArrowFlow.png');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Format 3: ${outPath}`);
  }

  // Format 4: Q&A Split (Max Tier 2 copy: 2 pairs, 130 chars each)
  {
    const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Format_4_QASplit_T1.html'), 'utf8');
    const headline = "Tanya Jawab SOP Manajemen Risiko Crypto";
    const bodyHtml = `
      <div class="qa-pair-container">
        <div class="question-text-mini">Apakah aman menahan posisi futures overnight?</div>
        <div class="answer-row">
          <div class="answer-text-mini">Sangat berisiko jika tidak memasang Stop Loss. Biaya funding rate harian dapat menggerus margin portofolio kamu secara perlahan.</div>
        </div>
      </div>
      <div class="qa-pair-container">
        <div class="question-text-mini">Kapan waktu terbaik Take Profit posisi short?</div>
        <div class="answer-row">
          <div class="answer-text-mini">Lakukan eksekusi parsial 50% saat harga menyentuh support kuat pertama, dan biarkan 50% sisanya berjalan dengan trailing stop.</div>
        </div>
      </div>
    `;
    let html = tpl
      .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
      .replace(/\{\{HEADLINE_TEXT\}\}/g, headline)
      .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtml);
    
    const outPath = path.join(OUTPUT_DIR, 'Stage1_Format_4_QASplit.png');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Format 4: ${outPath}`);
  }

  // Format 5: Narrative Block (Max Tier 2 copy: 200 chars total)
  {
    const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Format_5_NarrativeBlock_T1.html'), 'utf8');
    const headline = "Prinsip Utama Manajemen Modal Trader";
    const bodyHtml = `
      <div class="narrative-lead">"Pasar crypto tidak pernah peduli dengan analisis kamu, tetapi pasar selalu menghargai trader yang disiplin mengendalikan risiko."</div>
      <div class="narrative-body">Sebagian besar trader pemula kehilangan seluruh modalnya bukan karena analisis teknikal yang buruk, melainkan karena keserakahan menggunakan leverage tinggi tanpa menghitung batas risiko.</div>
    `;
    let html = tpl
      .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
      .replace(/\{\{HEADLINE_TEXT\}\}/g, headline)
      .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtml);
    
    const outPath = path.join(OUTPUT_DIR, 'Stage1_Format_5_NarrativeBlock.png');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`   ✓ Rendered Stage 1 Format 5: ${outPath}`);
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`✅ STAGE 1 COMPLETE. Output files saved to: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);
}

runStage1StressTest().catch(console.error);
