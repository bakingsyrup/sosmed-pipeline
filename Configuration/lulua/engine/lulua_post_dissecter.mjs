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
  // Pre-clean payload text: strip scraper-prepended metadata headers and standalone stat lines
  const cleanPayload = payloadText
    .replace(/^Author:\s*@[A-Za-z0-9_]+\s*\n+/i, '')
    .replace(/^(?:\d+K?|\d+M?|\d+)\s*\n+/i, '')
    .trim();

  const systemInstruction = `You are Lulua, an expert Social Media Structural Analyst and Style R&D Engine for Iroi media business.
Your task is to dissect viral social media content (${formatType}) into Lulua's Standardized 4-Part Style Bank Wireframe Schema:

Part 1: Metadata & Ratio Trigger
- Identify the target metric trigger based on content mechanics: Bookmarks (High Utility/Save Value), Replies (High Debate/Polarization), Retweets (Identity Signal), or Views (Algorithmic Reach Yield).

Part 2: Psychological Lever
- Primary emotional driver: High Utility & Authority, Contrarian Piercing, FOMO, Debate, Social Proof, or Direct Benefit.

Part 3: Micro-Rhythm & Pacing Rules
- Analyze exact structural mechanics: hook line length caps, line-break density, whitespace pacing, bullet/list patterns, and section progression rules.

Part 4: Plug-and-Play Wireframe Blueprint
- Create a parameterized structural formula using bracketed variable slots representing the content's exact structure (e.g. [Hook: Pattern], [Setup / Evidence: Pattern], [Core Mechanism: Step-by-Step], [CTA: Action]). Do NOT use static or generic placeholder text.

CRITICAL FRONTMATTER RULES:
Generate a descriptive, meaningful style_name in frontmatter following the 4-part Option 2 schema: [CategoryName]_[Format]_[HookArchetype]_[ConversionDriver] using PascalCase for each part, separated by single underscores.

1. CategoryName MUST be strictly chosen from:
- ClientAds (Client Sponsorships & Paid Promo)
- ViralReach (Viral Reach, Impressions & Discovery)
- HighUtility (Educational Deep-Dives, Glossaries & Save Value)
- OwnedLeadGen (Owned Email Opt-ins, Sales & Product Lead-Gen)
- DebateEngagement (Polarization, Reply Farming & Comments)
- BrandIdentity (Culture, Build in Public & Personal Brand)

2. Format MUST be strictly chosen from: Short, Thread, Article, Video.

3. HookArchetype MUST be strictly chosen using this 8-Step Decision Tree (FORBIDDEN to invent new terms):
   - Step 1: Offers a free downloadable tool, template, PDF, or lead magnet? ➔ ResourceGiveaway
   - Step 2: Exposes a specific flaw/risk/pain point AND presents a step-by-step fix? ➔ ProblemSolution
   - Step 3: Calls out a common mistake/misconception ("99% do this wrong") AND provides correct method? ➔ MistakeCorrection
   - Step 4: Teaches a structured system, framework, or operational methodology from scratch? ➔ HowToPlaybook
   - Step 5: Analyzes a specific historical benchmark, past event, or quantitative case study? ➔ HistoricalCaseStudy
   - Step 6: Challenges popular consensus or presents a counter-intuitive market reality? ➔ ContrarianInsight
   - Step 7: Asks a spicy binary question, poll, or polarized topic to drive comments? ➔ BinaryDebate
   - Step 8: Default fallback (Shares a personal journey, build-in-public update, or brand culture check-in) ➔ StoryNarrative

4. ConversionDriver MUST be strictly chosen from: AppDownload, SponsorSignup, BookmarkSave, NewsletterOptin, ReplyFarming, RetweetIdentity, ProfileVisit.

Example valid style_names:
- "ClientAds_Thread_ProblemSolution_AppDownload"
- "HighUtility_Short_MistakeCorrection_BookmarkSave"
- "ViralReach_Article_HistoricalCaseStudy_RetweetIdentity"
- "OwnedLeadGen_Short_ResourceGiveaway_NewsletterOptin"
- "DebateEngagement_Short_BinaryDebate_ReplyFarming"
- "BrandIdentity_Short_StoryNarrative_ProfileVisit"

PART 4 BLUEPRINT REQUIREMENTS:
Part 4 MUST follow the Dynamic & Adaptive Blueprint format. Tag every structural slot explicitly as [Mandatory], [Adaptive], or [Optional] with clear evaluation guidance so the wireframe remains versatile and avoids AI slop.

STRICT UNBIASED PART 4 BLUEPRINT RULE:
- Part 4 MUST be 100% topic-agnostic and generalized.
- Parenthetical examples (e.g. ...) inside Part 4 MUST use generic structural slots (e.g., [Primary System/Asset], [Key Operational Task], [Resource A], [Keyword]), NEVER specific niche terms from the source post (do NOT use terms like "Claude", "AI agents", "Crypto", or specific job titles inside Part 4).
- Niche-specific source post details belong ONLY in Parts 1–3 and the Example Implementation section!

STRICTLY FORBIDDEN: Do NOT use generic terms like "GenericWireframe" or "ReachYield". Output frontmatter at the top as: style_name: "...".`;

  const userPrompt = `Target Social Media Content to Dissect (${formatType}):
${cleanPayload}

Platform: ${platform.toUpperCase()}

Please dissect this content thoroughly and generate the complete 4-Part Wireframe Schema for saving into the Post Style Bank.`;

  let styleMarkdown = '';
  try {
    const rawRes = await callGemini(userPrompt, systemInstruction, false);
    styleMarkdown = rawRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.warn(`⚠️ Gemini call error during ${formatType} dissection:`, err.message);
    const lines = cleanPayload.split('\n').filter(l => l.trim().length > 0);
    const firstLine = lines[0] || cleanPayload;

    const fallbackPrefix = formatType === 'long_form_article' ? 'Article' : 'Short';
    styleMarkdown = `---
style_name: "HighUtility_${fallbackPrefix}_ContentStructure_BookmarkSave"
platform: "${platform}"
---

# 📐 Post Style Wireframe: ${formatType}

## Part 1: Metadata & Ratio Trigger
- **Target Metric:** High Utility & Retention

## Part 2: Psychological Lever
- **Emotional Driver:** High Utility & Authority

## Part 3: Micro-Rhythm & Pacing Rules
- **Pacing:** Structured multi-paragraph cadence with whitespace pauses.

## Part 4: Plug-and-Play Wireframe Blueprint
\`\`\`markdown
[Hook: Opening Hook Pattern]: "${firstLine.slice(0, 100)}"
[Body: Structural Framework]: [Insert 2-3 supporting evidence points]
[CTA: Direct Response Action]: [Insert clear call to action]
\`\`\`
`;
  }

  const match = styleMarkdown.match(/style_name:\s*["']?([a-zA-Z0-9_-]+)["']?/);
  let styleName = match ? match[1] : `${formatType}_${Date.now()}`;

  // Sanitize styleName to guarantee no generic fallbacks
  if (styleName.includes('GenericWireframe') || styleName.includes('ReachYield')) {
    const prefix = formatType === 'long_form_article' ? 'Article' : 'Short';
    styleName = `HighUtility_${prefix}_StructuralBlueprint_BookmarkSave`;
  }

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
