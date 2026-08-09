import playwright from 'playwright';
import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates';
const OUTPUT_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/ig-pipeline/03-Ready/rendered-carousels';

async function renderOutroCTA() {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 }
  });

  console.log('[Outro Test Engine] Reading Outro_CTA_Card.html...');
  let rawHtml = fs.readFileSync(path.join(TEMPLATE_DIR, 'Outro_CTA_Card.html'), 'utf8');

  let filledHtml = rawHtml
    .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
    .replace(/\{\{SLIDE_NUM\}\}/g, '7')
    .replace(/\{\{TOTAL_SLIDES\}\}/g, '7');

  await page.setContent(filledHtml, { waitUntil: 'networkidle' });
  
  const outputPath = path.join(OUTPUT_DIR, 'OUTRO_CTA_CARD.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`[Outro Done] Saved to: ${outputPath}`);

  await browser.close();
}

renderOutroCTA().catch(err => {
  console.error('Error rendering Outro CTA:', err);
  process.exit(1);
});
