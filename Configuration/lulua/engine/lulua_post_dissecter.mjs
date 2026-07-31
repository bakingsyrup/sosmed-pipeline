import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { callGemini } from '../../services/gemini_api.mjs';
import { fetchPostOrThreadText } from './lulua_url_fetcher.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '../../../');
const STYLE_BANK_DIR = path.join(BASE_DIR, 'lulua-pipeline/01-Style-Bank');

function loadEnv() {
  const envPaths = [
    path.join(BASE_DIR, 'Configuration/.env'),
    path.join(BASE_DIR, '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          if (!process.env[k.trim()]) {
            process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    }
  }
}
loadEnv();

async function dissectSinglePayload(payloadText, formatType, postUrl, platform, extraFrontmatterObj = {}) {
  const systemInstruction = `You are Lulua, the Interactive Style R&D Engine for Iroi media business.
Your task is to dissect viral social media content (${formatType}) into Lulua's Standardized 4-Part Style Bank Wireframe Schema:

Part 1: Metadata & Ratio Trigger (Target metric: Bookmarks, Replies, Retweets, Views).
Part 2: Psychological Lever (Primary emotional driver: Utility, Contrarian, FOMO, Debate, Pride).
Part 3: Micro-Rhythm & Pacing Rules (Hook length caps, line-break density, sentence caps, thread/section progression).
Part 4: Plug-and-Play Wireframe Blueprint (Bracketed parameter slots: [Hook], [Setup], [Body], [Closing/CTA]).

Format output cleanly as a standalone Style Bank Markdown file. Generate a descriptive style_name in frontmatter following the 3-part schema: [Format]_[HookFramework]_[ConversionDriver] using PascalCase for multi-word phrases in each part, separated by single underscores (e.g. style_name: "Short_ToolGiveaway_LeadMagnet" or "Article_StepByStepSystem_HighUtility").`;

  const userPrompt = `Target Social Media Content to Dissect (${formatType}):
${payloadText}

Platform: ${platform.toUpperCase()}

Please dissect this content and generate the complete 4-Part Wireframe Schema for saving into the Post Style Bank.`;

  let styleMarkdown = '';
  try {
    const rawRes = await callGemini(userPrompt, systemInstruction, true);
    styleMarkdown = rawRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.warn(`⚠️ Gemini call error during ${formatType} dissection, generating fallback wireframe:`, err.message);
    const lines = payloadText.split('\n').filter(l => l.trim().length > 0);
    const hook = lines[0] || payloadText;

    const fallbackPrefix = formatType === 'long_form_article' ? 'Article' : 'Short';
    styleMarkdown = `---
style_name: "${fallbackPrefix}_GenericWireframe_ReachYield"
platform: "${platform}"
---

# 📐 Post Style Wireframe: ${formatType}

## Part 1: Metadata & Ratio Trigger
- **Target Metric:** Reach Yield & High Retention

## Part 2: Psychological Lever
- **Emotional Driver:** High Utility & Authority

## Part 3: Micro-Rhythm & Pacing Rules
- **Pacing:** Structured multi-paragraph cadence.

## Part 4: Plug-and-Play Wireframe Blueprint
\`\`\`markdown
[Hook]: "${hook}"
[Setup / Evidence]: [Insert 2-3 supporting bullet points or evidence]
[Closing / CTA]: [Insert open-ended debate question or takeaway]
\`\`\`
`;
  }

  const match = styleMarkdown.match(/style_name:\s*["']?([a-zA-Z0-9_-]+)["']?/);
  let styleName = match ? match[1] : `${formatType}_${Date.now()}`;

  // Ensure unique style name handling (_v2, _v3, etc. if collision)
  let counter = 2;
  const cleanBase = styleName.replace(/_v\d+$/, '');
  let testFile = path.join(STYLE_BANK_DIR, `style-${styleName}.md`);
  while (fs.existsSync(testFile)) {
    styleName = `${cleanBase}_v${counter}`;
    testFile = path.join(STYLE_BANK_DIR, `style-${styleName}.md`);
    counter++;
  }

  // Strip existing frontmatter from styleMarkdown to rebuild pristine frontmatter at line 1
  let bodyMarkdown = styleMarkdown.replace(/^---[\s\S]*?---\n*/, '').trim();

  let frontmatterBlock = `---\nstyle_name: "${styleName}"\n`;
  if (extraFrontmatterObj.format) frontmatterBlock += `format: "${extraFrontmatterObj.format}"\n`;
  if (extraFrontmatterObj.attached_article) frontmatterBlock += `attached_article: "${extraFrontmatterObj.attached_article}"\n`;
  if (extraFrontmatterObj.promo_post) frontmatterBlock += `promo_post: "${extraFrontmatterObj.promo_post}"\n`;
  frontmatterBlock += `---\n\n`;

  let sourceReferenceBlock = `## 📌 Source Reference & Original Content\n`;
  if (postUrl) {
    sourceReferenceBlock += `- 🔗 **Direct Link:** [Inspect Content on X](${postUrl})\n\n`;
  }
  sourceReferenceBlock += `### 📜 Complete Original Text:\n> ${payloadText.replace(/\n/g, '\n> ')}\n\n---\n\n`;

  const finalMarkdown = frontmatterBlock + sourceReferenceBlock + bodyMarkdown;
  return { styleName, finalMarkdown };
}

export async function runPostDissection(inputUrlOrText, platform = 'x') {
  console.log(`📐 [Lulua] Dissecting Post Wireframe for Style Bank...`);

  if (!fs.existsSync(STYLE_BANK_DIR)) {
    fs.mkdirSync(STYLE_BANK_DIR, { recursive: true });
  }

  // 1. Resolve URL into literal post, thread, and X Article text
  const fetchRes = await fetchPostOrThreadText(inputUrlOrText, platform);
  const postUrl = inputUrlOrText.match(/https?:\/\/[^\s]+/)?.[0] || null;

  // STRICT VALIDATION GATE: Halt immediately if fetch failed, text is empty, or text is a raw URL string
  const payloadToDissect = (fetchRes && fetchRes.text) ? fetchRes.text.trim() : '';
  const isRawUrlOnly = /^(?:https?:\/\/|\/)?(?:www\.)?(?:x|twitter|instagram|tiktok|youtube|youtu\.be)\.com\/[^\s]+$/i.test(payloadToDissect) || (payloadToDissect.length < 100 && payloadToDissect.includes('status/'));

  if (!fetchRes.ok || !payloadToDissect || payloadToDissect.length < 40 || isRawUrlOnly) {
    const errorDetail = fetchRes.error || (isRawUrlOnly ? 'Scraped text is only a URL' : 'Extracted content is too short or empty');
    console.error(`❌ [Lulua Dissector] Aborting dissection: ${errorDetail}`);
    return {
      ok: false,
      error: `Scraping failed: ${errorDetail}. Dissection aborted to prevent hallucination.`
    };
  }

  // 2. Dual Generation if an attached X Article is detected
  if (fetchRes.hasArticle && fetchRes.articleText) {
    console.log(`✨ [Lulua] Dual Content Detected (Launch Post + Attached X Article). Generating paired wireframes...`);

    // First generate article wireframe to derive style name
    const articleRes = await dissectSinglePayload(fetchRes.articleText, 'long_form_article', postUrl, platform);

    // Then generate post wireframe with attached_article cross-link
    const postRes = await dissectSinglePayload(fetchRes.postText || fetchRes.text, 'short_form_launch', postUrl, platform, {
      format: 'short_form_launch',
      attached_article: `[[style-${articleRes.styleName}]]`
    });

    // Re-build article wireframe with promo_post cross-link
    const articleResFinal = await dissectSinglePayload(fetchRes.articleText, 'long_form_article', postUrl, platform, {
      format: 'long_form_article',
      promo_post: `[[style-${postRes.styleName}]]`
    });

    const postFile = path.join(STYLE_BANK_DIR, `style-${postRes.styleName}.md`);
    const articleFile = path.join(STYLE_BANK_DIR, `style-${articleRes.styleName}.md`);

    fs.writeFileSync(postFile, postRes.finalMarkdown);
    fs.writeFileSync(articleFile, articleResFinal.finalMarkdown);

    try {
      const { updateStyleBankMOC } = await import('./lulua_moc_manager.mjs');
      updateStyleBankMOC();
    } catch (e) {}

    console.log(`✅ [Lulua] Dual dissection complete! Saved paired wireframes:\n  - Post: style-${postRes.styleName}.md\n  - Article: style-${articleRes.styleName}.md`);
    return { ok: true, isDual: true, postFile, articleFile, postStyle: postRes.styleName, articleStyle: articleRes.styleName };
  }

  // 3. Single Content Dissection
  const singleRes = await dissectSinglePayload(fetchRes.text || inputUrlOrText, 'social_post', postUrl, platform, { format: 'social_post' });
  const outputFile = path.join(STYLE_BANK_DIR, `style-${singleRes.styleName}.md`);
  fs.writeFileSync(outputFile, singleRes.finalMarkdown);

  try {
    const { updateStyleBankMOC } = await import('./lulua_moc_manager.mjs');
    updateStyleBankMOC();
  } catch (e) {}

  console.log(`✅ [Lulua] Post dissection complete. Saved to Style Bank: style-${singleRes.styleName}.md`);
  return { ok: true, isDual: false, styleName: singleRes.styleName, file: outputFile, filename: `style-${singleRes.styleName}.md` };
}

// CLI execution check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputArg = process.argv[2] || 'https://x.com/milesdeutscher/status/2082646132157780412?s=20';
  runPostDissection(inputArg).catch(err => {
    console.error('❌ Dissection execution failed:', err);
    process.exit(1);
  });
}
