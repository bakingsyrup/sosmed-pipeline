import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { analyzeImageSaliency, selectUniversalLayout } from './services/vision_analyzer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const PIPELINE_BASE = path.join(__dirname, '..', 'ig-pipeline');
const PROCESSING_DIR = path.join(PIPELINE_BASE, '02-Processing');
const READY_DIR = path.join(PIPELINE_BASE, '03-Ready');
const TEMPLATES_DIR = path.join(__dirname, 'templates', 'instagram');
const BODY_TEMPLATES_DIR = path.join(TEMPLATES_DIR, 'body_cards');
const REF_DESIGNS_DIR = path.join(__dirname, 'templates', 'reference_designs');

const DEFAULT_VISUAL_ASSET = path.join(REF_DESIGNS_DIR, 'GettyImages-2221816314-1920x1280.jpg');

function getBase64DataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    filePath = DEFAULT_VISUAL_ASSET;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '') || 'carousel_post';
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];
  const data = {};

  yamlStr.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (!val.startsWith('"') && !val.startsWith("'")) {
        const commentIdx = val.indexOf('#');
        if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
      }
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    }
  });

  return { data, body };
}

function updateFrontmatterStatus(filePath, newStatus) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^status:\s*.*$/m, `status: ${newStatus}`);
  fs.writeFileSync(filePath, content, 'utf8');
}

function extractCoverImageFromMarkdown(bodyText, fileDir) {
  const VAULT_TOP_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db';

  let imgName = null;

  // 1. Obsidian wiki-link syntax: ![[image.png]]
  const wikiMatch = bodyText.match(/!\[\[(.*?\.(?:jpg|png|webp|jpeg))\]\]/i);
  if (wikiMatch) imgName = wikiMatch[1].trim();

  // 2. Standard markdown link syntax: ![](path/to/image.png)
  if (!imgName) {
    const mdMatch = bodyText.match(/!\[.*?\]\((.*?\.(?:jpg|png|webp|jpeg))\)/i);
    if (mdMatch) imgName = mdMatch[1].trim();
  }

  if (imgName) {
    const baseName = path.basename(imgName);
    const searchCandidates = [
      imgName,
      path.join(fileDir, imgName),
      path.join(fileDir, baseName),
      path.join(VAULT_TOP_DIR, 'Media Assets', baseName),
      path.join(VAULT_TOP_DIR, baseName)
    ];

    for (const cand of searchCandidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        console.log(`[Image Resolution] Found user-attached image: ${cand}`);
        return cand;
      }
    }

    // Recursive vault search fallback
    const foundInVault = findFileRecursively(VAULT_TOP_DIR, baseName);
    if (foundInVault) {
      console.log(`[Image Resolution] Found user-attached image in vault: ${foundInVault}`);
      return foundInVault;
    }
  }

  const defaultInDir = path.join(fileDir, 'cover.jpg');
  if (fs.existsSync(defaultInDir)) return defaultInDir;

  return DEFAULT_VISUAL_ASSET;
}

function findFileRecursively(rootDir, fileName) {
  if (!fs.existsSync(rootDir)) return null;
  try {
    const files = fs.readdirSync(rootDir);
    for (const f of files) {
      const full = path.join(rootDir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (f.startsWith('.') || f === 'node_modules') continue;
        const res = findFileRecursively(full, fileName);
        if (res) return res;
      } else if (f.toLowerCase() === fileName.toLowerCase()) {
        return full;
      }
    }
  } catch {}
  return null;
}

function parseMarkdownDraft(bodyText) {
  const slides = [];
  const rawBlocks = bodyText.split(/(?=^###?\s*CARD\s*\d+|^###?\s*Slide\s*\d+)/mi);

  rawBlocks.forEach(block => {
    const trimmed = block.trim();
    if (!/^###?\s*(?:CARD|Slide)\s*\d+/i.test(trimmed)) return;

    const slideNumMatch = trimmed.match(/(?:CARD|Slide)\s*(\d+)/i);
    const slideNum = slideNumMatch ? parseInt(slideNumMatch[1], 10) : slides.length + 1;

    let headline = '';
    const headlineMatch = trimmed.match(/(?:\*|-)?\s*\*\*Header\*\*:\s*(.+)/i) || 
                          trimmed.match(/Headline:\s*(.+)/i) || 
                          trimmed.match(/###?\s*(?:CARD|Slide)\s*\d+:\s*(.+)/i);
    if (headlineMatch) {
      headline = headlineMatch[1]
        .replace(/!\[\[.*?\]\]/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[\*\_]/g, '')
        .trim();
    }

    let subtext = '';
    const subtextMatch = trimmed.match(/(?:\*|-)?\s*\*\*Body\*\*:\s*([\s\S]*?)(?=\n\*|\n#|\n-|$)/i) || 
                         trimmed.match(/(?:Subheadline|Subtext|Body):\s*(.+)/i);
    if (subtextMatch) {
      subtext = subtextMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    let format = 'Format_1_BulletSOP.html';
    if (trimmed.includes('Format 2') || trimmed.includes('Key-Value') || trimmed.includes('Table')) {
      format = 'Format_2_KeyValueTable.html';
    } else if (trimmed.includes('Format 3') || trimmed.includes('Arrow') || trimmed.includes('Flow')) {
      format = 'Format_3_ArrowFlow.html';
    } else if (trimmed.includes('Format 4') || trimmed.includes('Q&A') || trimmed.includes('Split')) {
      format = 'Format_4_QASplit.html';
    } else if (trimmed.includes('Format 5') || trimmed.includes('Narrative') || trimmed.includes('Block') || trimmed.includes('Paragraph')) {
      format = 'Format_5_NarrativeBlock.html';
    }

    slides.push({
      slideNum,
      headline,
      subtext,
      format,
      rawBlock: trimmed
    });
  });

  return slides;
}

function extractOutroCopy(body) {
  const match = body.match(/\*\*Kata si [^*]+\*\*:\s*([\s\S]*?)(?=\n---|#|$)/i) || 
                body.match(/(?:Outro|Closing|CTA):\s*([\s\S]*?)(?=\n---|#|$)/i);
  if (match) {
    const fullText = match[1].trim();
    const labelMatch = body.match(/(\*\*Kata si [^*]+\*\*)/i);
    const headline = labelMatch ? labelMatch[1].replace(/\*/g, '') : "Bear Market Survival";
    return { headline, subtext: fullText };
  }
  return {
    headline: "Kuasai Hedging, Modalnya Nggak Tergerus Bear Market",
    subtext: "Simpan panduan ini & follow buat SOP taktis kripto tanpa gorengan."
  };
}

function formatBodyToHtml(subtext, format) {
  if (!subtext) return '<div class="bullet-item"><div class="bullet-text">Sub-pembahasan strategi.</div></div>';
  const lines = subtext.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (format.includes('Format_5') || format.includes('Narrative')) {
    let cleanText = subtext.replace(/^["'\s]+|["'\s]+$/g, '');
    cleanText = cleanText.replace(/(support|breakdown|funding rate|volume|sideways|range|short|spot|hedging)/gi, '<span style="color: #10B981; font-weight: 800;">$1</span>');

    const periodIdx = cleanText.indexOf('.');
    if (periodIdx > 0 && periodIdx < 70) {
      const lead = cleanText.slice(0, periodIdx + 1);
      const rest = cleanText.slice(periodIdx + 1).trim();
      return `<div class="narrative-text" id="quote-text"><span style="font-size: 36px; font-weight: 800; color: #FFFFFF; display: block; margin-bottom: 14px; line-height: 1.4;">${lead}</span><span style="font-size: 28px; font-weight: 500; color: #CBD5E1; line-height: 1.55; display: block;">${rest}</span></div>`;
    }
    return `<div class="narrative-text" id="quote-text">"${cleanText}"</div>`;
  }

  if (format.includes('Format_1') || format.includes('Bullet')) {
    return lines.map(line => {
      const cleanLine = line.replace(/^[•\-\*\d\.]+\s*/, '');
      const parts = cleanLine.split(':');
      if (parts.length > 1) {
        return `<div class="bullet-item"><span class="bullet-icon">•</span><div class="bullet-text"><span class="bullet-lead">${parts[0].trim()}:</span> ${parts.slice(1).join(':').trim()}</div></div>`;
      }
      return `<div class="bullet-item"><span class="bullet-icon">•</span><div class="bullet-text">${cleanLine}</div></div>`;
    }).join('\n');
  }

  if (format.includes('Format_4') || format.includes('QASplit') || format.includes('Split')) {
    const qaPairs = [];
    let currentQ = null;
    let currentA = [];

    lines.forEach(line => {
      const qMatch = line.match(/^(?:Q|Question|Pertanyaan|\?)\s*:?\s*(.+)/i);
      const aMatch = line.match(/^(?:A|Answer|Jawaban|\!)\s*:?\s*(.+)/i);

      if (qMatch) {
        if (currentQ) {
          qaPairs.push({ q: currentQ, a: currentA.join(' ') });
        }
        currentQ = qMatch[1].trim();
        currentA = [];
      } else if (aMatch) {
        currentA.push(aMatch[1].trim());
      } else if (currentQ) {
        currentA.push(line);
      }
    });
    if (currentQ) {
      qaPairs.push({ q: currentQ, a: currentA.join(' ') });
    }

    if (qaPairs.length === 0) {
      const question = lines[0]?.replace(/^(?:Q|Question|Pertanyaan|\?)\s*:?\s*/i, '') || 'Pertanyaan Strategi?';
      const answer = lines.slice(1).join(' ').replace(/^(?:A|Answer|Jawaban|\!)\s*:?\s*/i, '') || subtext;
      qaPairs.push({ q: question, a: answer });
    }

    if (qaPairs.length === 1) {
      return `
        <div class="question-card">
          <div class="question-tag">❓ PERTANYAAN / MITOS</div>
          <div class="question-text auto-q-text">"${qaPairs[0].q.replace(/"/g, '')}"</div>
        </div>
        <div class="answer-card" id="ans-card">
          <div class="answer-tag">💡 JAWABAN & SOLUSI</div>
          <div class="answer-text auto-a-text">${qaPairs[0].a}</div>
        </div>
      `;
    }

    return qaPairs.map(pair => `
      <div class="qa-pair-container">
        <div class="question-row">
          <div class="question-tag-mini">❓ PERTANYAAN</div>
          <div class="question-text-mini">${pair.q}</div>
        </div>
        <div class="answer-row">
          <div class="answer-tag-mini">💡 JAWABAN & INSIGHT</div>
          <div class="answer-text-mini">${pair.a}</div>
        </div>
      </div>
    `).join('\n');
  }

  if (format.includes('Format_3') || format.includes('Arrow') || format.includes('Flow')) {
    const cleanLines = lines.filter(l => !/^[↓➔→\-\s]+$/.test(l.trim()));
    const steps = [];
    let currentTitle = null;
    let currentDescs = [];

    cleanLines.forEach(line => {
      const cleanLine = line.replace(/^[•\-\*\d\.\s↓➔→]+/, '').trim();
      if (!cleanLine) return;

      const colonIdx = cleanLine.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35 && !cleanLine.toLowerCase().startsWith('http')) {
        if (currentTitle) {
          steps.push({ title: currentTitle, desc: currentDescs.join(' ') });
        }
        currentTitle = cleanLine.slice(0, colonIdx).trim();
        const rest = cleanLine.slice(colonIdx + 1).trim();
        currentDescs = rest ? [rest] : [];
      } else if (currentTitle) {
        currentDescs.push(cleanLine);
      } else {
        currentTitle = `Langkah ${steps.length + 1}`;
        currentDescs = [cleanLine];
      }
    });
    if (currentTitle) {
      steps.push({ title: currentTitle, desc: currentDescs.join(' ') });
    }

    if (steps.length === 0) {
      steps.push({ title: 'Langkah 1', desc: subtext });
    }

    return steps.map((st, idx) => {
      const stepNum = String(idx + 1).padStart(2, '0');
      const arrow = idx < steps.length - 1 ? '<div class="arrow-divider">↓</div>' : '';
      return `
        <div class="step-card">
          <div class="step-number-badge">${stepNum}</div>
          <div class="step-content">
            <div class="step-title">${st.title}</div>
            <div class="step-desc">${st.desc}</div>
          </div>
        </div>
        ${arrow}
      `;
    }).join('\n');
  }

  if (format.includes('Format_2') || format.includes('KeyValue') || format.includes('Table')) {
    const qaPairs = [];
    let currentQ = null;
    let currentA = [];

    lines.forEach(line => {
      const qMatch = line.match(/^(?:Q|Question|Pertanyaan|\?)\s*:?\s*(.+)/i);
      const aMatch = line.match(/^(?:A|Answer|Jawaban|\!)\s*:?\s*(.+)/i);

      if (qMatch) {
        if (currentQ) {
          qaPairs.push({ q: currentQ, a: currentA.join(' ') });
        }
        currentQ = qMatch[1].trim();
        currentA = [];
      } else if (aMatch) {
        currentA.push(aMatch[1].trim());
      } else if (currentQ) {
        currentA.push(line);
      }
    });
    if (currentQ) {
      qaPairs.push({ q: currentQ, a: currentA.join(' ') });
    }

    if (qaPairs.length > 0) {
      const half = Math.ceil(qaPairs.length / 2);
      const leftPairs = qaPairs.slice(0, half);
      const rightPairs = qaPairs.slice(half);

      const renderCol = (pairs) => pairs.map(p => `
        <div style="margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="font-size: 22px; font-weight: 800; color: #EF4444; margin-bottom: 6px;">Q: ${p.q}</div>
          <div style="font-size: 20px; font-weight: 500; color: #CBD5E1; line-height: 1.45;">A: ${p.a}</div>
        </div>
      `).join('');

      return `
        <div class="card-positive" id="card-pos" style="padding: 40px 36px; justify-content: flex-start;">
          <div class="card-badge-pos" style="margin-bottom: 20px;">📌 PERTANYAAN & SOP</div>
          <div class="card-desc auto-desc" style="font-size: 20px;">${renderCol(leftPairs)}</div>
        </div>
        <div class="card-negative" id="card-neg" style="padding: 40px 36px; justify-content: flex-start;">
          <div class="card-badge-neg" style="margin-bottom: 20px;">💡 JAWABAN & MANFAAT</div>
          <div class="card-desc auto-desc" style="font-size: 20px;">${renderCol(rightPairs)}</div>
        </div>
      `;
    }

    const half = Math.ceil(lines.length / 2);
    const leftLines = lines.slice(0, half).join(' ');
    const rightLines = lines.slice(half).join(' ');
    return `
      <div class="card-positive" id="card-pos">
        <div class="card-badge-pos">✓ REKOMENDASI</div>
        <div class="card-desc auto-desc">${leftLines || subtext}</div>
      </div>
      <div class="card-negative" id="card-neg">
        <div class="card-badge-neg">✓ DETAIL & HASIL</div>
        <div class="card-desc auto-desc">${rightLines || subtext}</div>
      </div>
    `;
  }

  return `<div class="narrative-text">${subtext.replace(/\n/g, '<br>')}</div>`;
}

async function renderCarouselPost(filePath) {
  console.log(`\n[Designer Agent] Processing target file: ${filePath}`);
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, body } = parseFrontmatter(rawContent);

  const slides = parseMarkdownDraft(body);
  
  // Extract proper cover title from Card 1 or frontmatter
  const card1HeaderMatch = body.match(/###?\s*CARD\s*1\s*:\s*([^\n!]+)/i);
  const card1Header = card1HeaderMatch ? card1HeaderMatch[1].trim() : null;
  const firstSlideTitle = slides[0]?.headline;
  
  const cleanTitle = card1Header || firstSlideTitle || frontmatter.title || 'BTC Jebol Support? Lindungi Portofolio Tanpa Jual Spot';
  
  const topicSlug = slugify(cleanTitle);
  const fileDir = path.dirname(filePath);

  updateFrontmatterStatus(filePath, 'rendering');

  const targetTopicDir = path.join(READY_DIR, topicSlug);
  if (!fs.existsSync(targetTopicDir)) {
    fs.mkdirSync(targetTopicDir, { recursive: true });
  } else {
    // Clean up any old rendered PNGs to avoid orphaned files from previous runs
    const existingPngs = fs.readdirSync(targetTopicDir).filter(f => f.endsWith('.png'));
    for (const png of existingPngs) {
      try { fs.unlinkSync(path.join(targetTopicDir, png)); } catch {}
    }
  }

  console.log(`[Designer Agent] Parsed ${slides.length} slides for topic: "${topicSlug}"`);

  const browser = await chromium.launch({ headless: true });

  // 1. Render Cover Slide (Slide 1)
  try {
    console.log('[Designer Agent] Rendering Slide 1 (Cover Card)...');
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
    
    const coverAssetPath = frontmatter.image_path || extractCoverImageFromMarkdown(body, fileDir);
    const base64Cover = getBase64DataUri(coverAssetPath);

    // Dynamic Gemini Flash 2.0 Vision Analysis & Layout Rule Engine
    console.log(`[Designer Agent] Analyzing cover image saliency with Gemini Flash Vision: ${coverAssetPath}`);
    const visionData = await analyzeImageSaliency(coverAssetPath);
    const layout = selectUniversalLayout(visionData);
    console.log(`[Designer Agent] Selected Universal Cover Layout:`, layout);

    const templateCoverPath = path.join(TEMPLATES_DIR, 'covers', 'Option_A_SplitContainer.html');
    const templateCover = fs.readFileSync(templateCoverPath, 'utf8');

    const coverHeadlineText = card1Header || slides[0]?.headline || cleanTitle;
    const coverHeadlineHtml = coverHeadlineText.replace(/(Bitcoin|Futures|Hedging|Crash|Stop‑Loss|Rekt|Monopoli|Cashflow)/gi, '<span class="highlight-emerald">$1</span>');
    const coverSubheadline = slides[0]?.subtext || frontmatter.subheadline || 'Tips batasi kerugian spot menggunakan teknik hedging Futures.';
    const accentHex = visionData.recommended_accent_hex || '#10B981';

    const htmlCover = templateCover
      .replace(/\{\{TEXT_PLACEMENT\}\}/g, layout.placement)
      .replace(/\{\{OBJECT_POSITION\}\}/g, layout.objectPosition)
      .replace(/\{\{OBJECT_FIT\}\}/g, layout.objectFit || 'cover')
      .replace(/\{\{ACCENT_HEX\}\}/g, accentHex)
      .replace(/\{\{IMAGE_SRC\}\}/g, base64Cover)
      .replace(/\{\{HEADLINE_HTML\}\}/g, coverHeadlineHtml)
      .replace(/\{\{SUBHEADLINE_TEXT\}\}/g, coverSubheadline);

    await page.setContent(htmlCover, { waitUntil: 'networkidle' });
    const coverOutPath = path.join(targetTopicDir, 'Slide_1_Cover.png');
    await page.screenshot({ path: coverOutPath, type: 'png' });
    console.log(`  ✓ Saved: ${coverOutPath}`);
    await page.close();
  } catch (err) {
    console.error('  ! Failed rendering Cover Slide:', err.message);
  }

  // 2. Render Body Slides (Slide 2 to Slide N-1)
  const bodySlides = slides.length > 1 ? slides.slice(1) : slides;
  for (let i = 0; i < bodySlides.length; i++) {
    const s = bodySlides[i];
    const slideIdx = i + 2;
    console.log(`[Designer Agent] Rendering Slide ${slideIdx} (${s.format})...`);

    try {
      const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
      const templatePath = path.join(BODY_TEMPLATES_DIR, s.format);
      const templateBody = fs.existsSync(templatePath) 
        ? fs.readFileSync(templatePath, 'utf8')
        : fs.readFileSync(path.join(BODY_TEMPLATES_DIR, 'Format_1_BulletSOP.html'), 'utf8');

      const bodyHtmlContent = formatBodyToHtml(s.subtext, s.format);

      const htmlBody = templateBody
        .replace(/\{\{ACCENT_HEX\}\}/g, '#10B981')
        .replace(/\{\{HEADLINE_TEXT\}\}/g, s.headline || `Poin Strategi ${i + 1}`)
        .replace(/\{\{BODY_CONTENT_HTML\}\}/g, bodyHtmlContent);

      await page.setContent(htmlBody, { waitUntil: 'networkidle' });
      const slideOutPath = path.join(targetTopicDir, `Slide_${slideIdx}_Body_${s.format.replace('.html','')}.png`);
      await page.screenshot({ path: slideOutPath, type: 'png' });
      console.log(`  ✓ Saved: ${slideOutPath}`);
      await page.close();
    } catch (err) {
      console.error(`  ! Failed rendering Slide ${slideIdx}:`, err.message);
    }
  }

  // 3. Render Outro CTA Slide (Slide N)
  try {
    const outroSlideIdx = bodySlides.length + 2;
    console.log(`[Designer Agent] Rendering Slide ${outroSlideIdx} (Ultra-Pure Outro CTA Card)...`);
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
    const templateOutro = fs.readFileSync(path.join(TEMPLATES_DIR, 'Outro_CTA_Card.html'), 'utf8');

    const outroData = extractOutroCopy(body);
    const htmlOutro = templateOutro
      .replace(/\{\{OUTRO_HEADLINE\}\}/g, outroData.headline)
      .replace(/\{\{OUTRO_SUBTEXT\}\}/g, outroData.subtext.replace(/\n/g, '<br>'));

    await page.setContent(htmlOutro, { waitUntil: 'networkidle' });
    const outroOutPath = path.join(targetTopicDir, `Slide_${outroSlideIdx}_OutroCTA.png`);
    await page.screenshot({ path: outroOutPath, type: 'png' });
    console.log(`  ✓ Saved: ${outroOutPath}`);
    await page.close();
  } catch (err) {
    console.error('  ! Failed rendering Outro CTA Slide:', err.message);
  }

  await browser.close();

  // 4. Update Markdown status to 'ready' and organize inside target topic folder
  const readyMdPath = path.join(targetTopicDir, `${topicSlug}.md`);
  updateFrontmatterStatus(filePath, 'ready');
  if (filePath !== readyMdPath) {
    fs.copyFileSync(filePath, readyMdPath);
    fs.unlinkSync(filePath);
  }

  console.log(`\n[Designer Agent] ✅ Carousel Successfully Rendered & Assembled!`);
  console.log(`[Designer Agent] Output Directory: ${targetTopicDir}`);
}

function getAllMarkdownFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllMarkdownFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.md')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function runDaemon() {
  console.log('====================================================');
  console.log('      DESIGNER AGENT: MULTI-SLIDE RENDER ENGINE     ');
  console.log('====================================================');
  console.log(`[Daemon] Monitoring Directories: ${PROCESSING_DIR} & ${READY_DIR}`);

  const scanDirs = [PROCESSING_DIR, READY_DIR];
  let processedCount = 0;

  for (const scanDir of scanDirs) {
    const mdFiles = getAllMarkdownFiles(scanDir);
    for (const filePath of mdFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter } = parseFrontmatter(content);

        const typeStr = (frontmatter.type || '').toUpperCase();
        const isInstagramDraft = typeStr.includes('INSTAGRAM') || typeStr.includes('REPURPOSED DRAFT');
        const isDesignStatus = (frontmatter.status || '').toLowerCase() === 'design';

        if (isInstagramDraft && isDesignStatus) {
          console.log(`\n[Daemon Match] Found draft ready for design: ${path.basename(filePath)}`);
          await renderCarouselPost(filePath);
          processedCount++;
        }
      } catch (err) {
        console.error(`[Designer Agent Error] Failed reading ${filePath}:`, err.message);
      }
    }
  }

  if (processedCount === 0) {
    console.log('[Daemon] Zero files currently matching status="design". Waiting...');
  }
}

runDaemon().catch(err => {
  console.error('[Designer Agent Error]:', err);
  process.exit(1);
});
