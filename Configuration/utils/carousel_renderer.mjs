import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'carousel_template.html');

/**
 * Renders an array of slide objects into 1080x1350 PNG images and a combined PDF carousel.
 * @param {Array<{tag: string, headline: string, subtext: string, comparison?: {posTitle: string, posVal: string, negTitle: string, negVal: string}}>} slides 
 * @param {string} outputDir 
 * @param {string} baseName 
 */
export async function renderCarousel(slides, outputDir, baseName) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rawHtmlTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  console.log(`[Carousel Renderer] Launching Playwright Chromium headless browser...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2 // High retina crispness
  });

  const page = await context.newPage();
  const generatedImagePaths = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideNum = i + 1;

    let bodyHtml = `
      <h1 class="headline">${slide.headline}</h1>
      <p class="subtext">${slide.subtext}</p>
    `;

    if (slide.comparison) {
      bodyHtml += `
        <div class="comparison-grid">
          <div class="compare-card positive">
            <div class="card-title positive">${slide.comparison.posTitle}</div>
            <div class="card-value">${slide.comparison.posVal}</div>
          </div>
          <div class="compare-card negative">
            <div class="card-title negative">${slide.comparison.negTitle}</div>
            <div class="card-value">${slide.comparison.negVal}</div>
          </div>
        </div>
      `;
    }

    let slideHtml = rawHtmlTemplate
      .replace('<div class="slide-tag" id="slideTag">GUIDE</div>', `<div class="slide-tag" id="slideTag">${slide.tag || `SLIDE ${slideNum}/${slides.length}`}</div>`)
      .replace('<div class="slide-body" id="slideBody">', `<div class="slide-body" id="slideBody">${bodyHtml}`);

    await page.setContent(slideHtml, { waitUntil: 'networkidle' });

    const pngFilename = `${baseName}_slide_${slideNum}.png`;
    const pngPath = path.join(outputDir, pngFilename);
    await page.screenshot({ path: pngPath, type: 'png' });
    generatedImagePaths.push(pngPath);
    console.log(`[Carousel Renderer] Rendered Slide ${slideNum}/${slides.length} ➔ ${pngFilename}`);
  }

  // Generate combined PDF Carousel
  const pdfFilename = `${baseName}_carousel.pdf`;
  const pdfPath = path.join(outputDir, pdfFilename);
  await page.pdf({
    path: pdfPath,
    width: '1080px',
    height: '1350px',
    printBackground: true
  });

  await browser.close();
  console.log(`[Carousel Renderer] Success! PDF Carousel exported to ➔ ${pdfFilename}`);
  return { pdfPath, imagePaths: generatedImagePaths };
}
