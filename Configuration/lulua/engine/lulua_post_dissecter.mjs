import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { callDeepSeek } from '../../services/deepseek_api.mjs';
import { fetchPostOrThreadText } from './lulua_url_fetcher.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '../../../');
const STYLE_BANK_DIR = path.join(BASE_DIR, 'lulua-pipeline/01-Style-Bank');
const DISSECTIONS_LOG = path.join(STYLE_BANK_DIR, 'new_dissections.md');
const DEBUG_LOG = path.join(STYLE_BANK_DIR, 'dissection_debug.log');

function debugLog(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const line = `[${ts}] ${msg}\n`;
  try {
    const existing = fs.existsSync(DEBUG_LOG) ? fs.readFileSync(DEBUG_LOG, 'utf8') : '';
    fs.writeFileSync(DEBUG_LOG, line + existing);
  } catch (e) {}
}

function logNewDissection(styleName) {
  debugLog(`logNewDissection called: styleName=${styleName}`);
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const line = `- [succeed] [[style-${styleName}]] — ${ts}\n`;
  try {
    const exists = fs.existsSync(DISSECTIONS_LOG);
    debugLog(`  DISSECTIONS_LOG=${DISSECTIONS_LOG}, exists=${exists}`);
    const existing = exists ? fs.readFileSync(DISSECTIONS_LOG, 'utf8') : '';
    fs.writeFileSync(DISSECTIONS_LOG, line + existing);
    debugLog(`  writeFileSync OK, size=${(line.length + existing.length)}`);
  } catch (e) {
    debugLog(`  FAILED: ${e.message}`);
    console.warn(`⚠️ Failed to log dissection to new_dissections.md:`, e.message);
  }
}

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

export async function dissectSinglePayload(payloadText, formatType, postUrl = null, platform = 'x', options = {}) {
  const cleanPayload = payloadText.trim();
  if (!cleanPayload) throw new Error('Cannot dissect empty payload text.');

  const systemInstruction = `You are Lulua, an expert Social Media Structural Analyst and Style R&D Engine for Iroi media business.
Your task is to dissect viral social media content (${formatType}) into Lulua's Standardized 3-Part Style Bank Wireframe Schema:

Part 1: Post-by-Post Dissection Matrix (Source Analysis Table)
- Construct a Markdown table mapping every post in the source content across 5 dimensions:
  1. Structural Arc Role (e.g. High-Stakes Hook, Problem Setup, Term Explainer Block, Red Flag Checklist, Conversion CTA).
  2. Core Message Payload (Literal narrative event or data point).
  3. Closing Bridge Line (Exact cliffhanger / transition line driving the next scroll).
  4. Psychological Trigger (Target emotion: Shock, Curiosity, Relief, Caution, etc.).
  5. Topic-Agnostic Wireframe Variable Slot (Parameter slot, e.g. [Slot: Thesis Statement & Teaser]).

Part 2a: Reference Source Content (Original Text)
- DO NOT WRITE THIS SECTION. It will be injected automatically by the system with the exact source text.

Part 2b: Cross-Domain Applied Demonstration Output
- Randomly select a COMPLETELY UNRELATED industry domain from the target topic (e.g. Specialty Coffee, Skincare, SaaS, Real Estate, Fitness, Productivity).
- Apply the Part 3 Wireframe Blueprint you generated.
- Write 100% in Indonesian, using natural sentence-case copywriting per strict x_style_guide.md rules.
- CRITICAL: You MUST translate and write ALL headlines, list headers, bullet titles, and body text in Indonesian together. NEVER leave English headers with Indonesian body text.
- CRITICAL: You MUST write the full post starting from the top hook/intro line down to the final CTA. Never skip the opening intro sentence.
- Include the mandatory anti-bias banner at the top of Part 2b:
  > ⚠️ **ANTI-BIAS DIRECTIVE FOR AI AGENTS**: The sample implementation in Part 2b is provided purely for multi-domain illustration. You MUST NOT copy or default to the specific topic, industry vocabulary, or niche terms used in this example when generating content for other niches! Dynamically adapt all placeholders to the user's target topic.

Part 3: Master Universal Wireframe Blueprint (Elastic Narrative Phases)
- Create a 100% topic-agnostic, phase-based wireframe blueprint for drafting agents (Shinku).
- Organize content into Elastic Narrative Phases adapted to the content's structural archetype.
- Include explicit DYNAMIC CONTENT SCALING DIRECTIVES for adaptive phases, instructing the drafting agent to analyze input data depth first and scale post count dynamically (1/N ... N/N). Never hardcode fixed post counts.

CRITICAL FRONTMATTER RULES:
Generate YAML frontmatter at the top with these exact 8 fields:
---
category: "01 - Step-by-Step SOP"
style_name: "[CategoryName]_[Format]_[HookArchetype]_[ConversionDriver]"
authority_persona: "[Persona Name]"
funnel_stage: "TOFU" | "MOFU" | "BOFU"
target_metric: "[Metric Name]"
elasticity: "dynamic (3 to 15 posts)"
supported_output_formats: ["thread", "article", "ig_carousel", "yt_shorts", "linkedin"]
narrative_flow_summary: "[Concise Human Hook (2-4 words)] → [Concise Human Body (2-4 words)] → [Concise Human CTA (2-4 words)]"
---

CRITICAL FOR category: Pick exactly ONE from this list matching the content's structural archetype:
"01 - Step-by-Step SOP", "02 - Master Cheat Sheet", "03 - Learn & Earn Walkthrough", "04 - Historical Precedent", "05 - Mega Number Alert", "06 - Binary Choice Debate", "07 - Friction Remover", "08 - Contrarian Manifesto", "09 - Master Framework", "10 - Lead Magnet Giveaway", "11 - Founder Retrospective", "12 - Company PR & Milestones", "13 - Memes & Industry Satire", "14 - Live Recaps & AMAs", "15 - Social Proof & UGC", "16 - Daily Posts", "17 - Story Narrative"

Note for narrative_flow_summary: Use clean, natural, Title-Case human copywriting phrases (2–4 words per segment, separated by ' → '). Example: "Skill reward promise → Interactive feature walkthrough → Incentive referral link".`;

  const userPrompt = `Target Social Media Content to Dissect (${formatType}):
${cleanPayload}

Platform: ${platform.toUpperCase()}

Please dissect this content thoroughly and generate the complete Wireframe Schema including all parts (Part 1 Matrix, Part 2b Indonesian Applied Output, Part 3 Blueprint).`;

  let styleMarkdown = '';
  try {
    console.log(`🧠 [Lulua] DeepSeek V4 Pro dissecting full wireframe schema...`);
    const rawRes = await callDeepSeek(userPrompt, systemInstruction, 'deepseek-v4-pro');
    try {
      const parsed = typeof rawRes === 'string' ? JSON.parse(rawRes) : rawRes;
      styleMarkdown = parsed.choices?.[0]?.message?.content || parsed.text || rawRes || '';
    } catch (e) {
      styleMarkdown = typeof rawRes === 'string' ? rawRes : '';
    }
  } catch (err) {
    console.warn(`⚠️ DeepSeek call error during ${formatType} dissection:`, err.message);
    const lines = cleanPayload.split('\n').filter(l => l.trim().length > 0);
    const firstLine = lines[0] || cleanPayload;

    const fallbackPrefix = formatType === 'long_form_article' ? 'Article' : 'Short';
    styleMarkdown = `---
category: "01 - Step-by-Step SOP"
style_name: "HighUtility_${fallbackPrefix}_ContentStructure_BookmarkSave"
authority_persona: "Tool Mechanic"
funnel_stage: "TOFU"
target_metric: "Bookmarks_and_Saves"
elasticity: "dynamic (3 to 15 posts)"
supported_output_formats: ["thread", "article", "ig_carousel", "yt_shorts", "linkedin"]
narrative_flow_summary: "Time-saved promise → 3 to 5 setup steps → Tool link CTA"
${postUrl ? `source_url: "${postUrl}"\n` : ''}---

# 🔬 Dissected Style Wireframe: ${formatType}

## 🔬 Part 1: Post-by-Post Dissection Matrix (Source Analysis)

| Post # | Structural Arc Role | Core Message Payload | Closing Bridge Line | Psychological Trigger | Topic-Agnostic Wireframe Variable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Post 1** | **Hook Arc** | "${firstLine.slice(0, 80)}" | *Bridge line* | Curiosity | [Slot: Hook] |

## 📜 Part 2a: Reference Source Content (Original Text)

${cleanPayload}

## 📜 Part 2b: Cross-Domain Applied Output

## 🤖 Part 3: Master Universal Wireframe Blueprint (Elastic Narrative Phases)

Phase 1: Hook Arc
Phase 2: Core Execution
Phase 3: Conversion CTA
`;
  }

  // Inject Part 2a directly with the exact source text (no AI involved)
  let part2aBlock = `## 📜 Part 2a: Reference Source Content\n\n`;
  if (postUrl) {
    part2aBlock += `> 🔗 **Source Reference**: [${postUrl}](${postUrl})\n\n`;
  }
  part2aBlock += cleanPayload;

  if (styleMarkdown.includes('## 📜 Part 2b:')) {
    styleMarkdown = styleMarkdown.replace('## 📜 Part 2b:', part2aBlock + '\n\n## 📜 Part 2b:');
  } else if (styleMarkdown.includes('## Part 2b:')) {
    styleMarkdown = styleMarkdown.replace('## Part 2b:', part2aBlock + '\n\n## Part 2b:');
  } else if (styleMarkdown.includes('## 🤖 Part 3:') || styleMarkdown.includes('## Part 3:')) {
    styleMarkdown = styleMarkdown.replace(/(## 🤖 Part 3:|## Part 3:)/i, part2aBlock + '\n\n## 📜 Part 2b: Cross-Domain Applied Output\n\n$1');
  }

  // Inject source_url into frontmatter (dedup relies on it, no AI hallucination risk)
  if (postUrl && !styleMarkdown.includes('source_url:')) {
    styleMarkdown = styleMarkdown.replace(
      /(^---\n[\s\S]*?)(\n---)/,
      `$1\nsource_url: "${postUrl}"$2`
    );
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

  styleMarkdown = styleMarkdown.replace(/style_name:\s*["']?[a-zA-Z0-9_-]+["']?/, `style_name: "${styleName}"`);

  // Build final structured document block
  let frontmatterBlock = '';
  let bodyMarkdown = styleMarkdown;

  const fmMatch = styleMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    frontmatterBlock = `---\n${fmMatch[1].trim()}\n---\n\n`;
    bodyMarkdown = styleMarkdown.slice(fmMatch[0].length).trim();
  } else {
    frontmatterBlock = `---\ncategory: "01 - Step-by-Step SOP"\nstyle_name: "${styleName}"\nauthority_persona: "Tool Mechanic"\nfunnel_stage: "TOFU"\ntarget_metric: "Bookmarks_and_Saves"\nelasticity: "dynamic (3 to 15 posts)"\nsupported_output_formats: ["thread", "article", "ig_carousel", "yt_shorts", "linkedin"]\nnarrative_flow_summary: "Time-saved promise → 3 to 5 setup steps → Tool link CTA"${postUrl ? `\nsource_url: "${postUrl}"` : ''}\n---\n\n`;
  }

  const finalMarkdown = frontmatterBlock + bodyMarkdown;
  return { styleName, finalMarkdown };
}

export async function runPostDissection(inputUrlOrText, platform = 'x') {
  debugLog('=== DISSECTION START ===');
  debugLog(`Input: ${inputUrlOrText.slice(0, 200)}`);

  console.log(`📐 [Lulua] Dissecting Post Wireframe for Style Bank (Hybrid Gemini + DeepSeek)...`);

  if (!fs.existsSync(STYLE_BANK_DIR)) {
    fs.mkdirSync(STYLE_BANK_DIR, { recursive: true });
  }

  const postUrl = inputUrlOrText.match(/https?:\/\/[^\s]+/)?.[0] || null;
  const statusMatch = inputUrlOrText.match(/status\/(\d+)/i);
  const targetStatusId = statusMatch ? statusMatch[1] : null;
  debugLog(`postUrl: ${postUrl || 'none'}, statusId: ${targetStatusId || 'none'}`);

  // DUPLICATE PRE-CHECK GATE: Scan Source Reference header of existing Style Bank files
  if (fs.existsSync(STYLE_BANK_DIR) && (postUrl || targetStatusId)) {
    const existingFiles = fs.readdirSync(STYLE_BANK_DIR).filter(f => f.endsWith('.md') && f !== '00-Style-Bank-MOC.md');
    debugLog(`Duplicate check: scanning ${existingFiles.length} existing files...`);
    for (const file of existingFiles) {
      const filePath = path.join(STYLE_BANK_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      const sourceHeaderSection = fileContent.split(/###?\s*Part\s*1/i)[0] || fileContent.slice(0, 800);
      
      const isUrlMatch = postUrl && sourceHeaderSection.includes(postUrl);
      const isStatusMatch = targetStatusId && sourceHeaderSection.includes(`status/${targetStatusId}`);
      
      if (isUrlMatch || isStatusMatch) {
        const styleNameMatch = fileContent.match(/style_name:\s*["']?([a-zA-Z0-9_-]+)["']?/);
        const styleName = styleNameMatch ? styleNameMatch[1] : file.replace(/^style-|\.md$/g, '');
        debugLog(`DUPLICATE FOUND: ${file}`);
        debugLog('=== DISSECTION END (duplicate, discarded) ===');
        console.log(`⚡ [Lulua Dissector] Post URL already dissected in Style Bank: ${file}`);
        return {
          ok: true,
          isDuplicate: true,
          filename: file,
          styleName: styleName,
          msg: `Post URL has already been dissected and saved as ${file}`
        };
      }
    }
    debugLog('Duplicate check: no match found');
  } else {
    debugLog('Duplicate check: skipped (no URL/statusId or dir missing)');
  }

  // 1. Resolve URL into literal post, thread, and X Article text
  const textWithoutUrls = inputUrlOrText.replace(/https?:\/\/[^\s]+/g, '').trim();
  const isPastedContent = textWithoutUrls.length > 200;

  let fetchRes;
  if (isPastedContent) {
    debugLog('Pasted content detected, skipping CDP fetch');
    fetchRes = { ok: true, isUrl: false, text: textWithoutUrls, articleUrl: null, isDual: false, hasArticle: false };
  } else {
    debugLog('Fetching post content...');
    fetchRes = await fetchPostOrThreadText(inputUrlOrText, platform);
  }
  debugLog(`Fetch result: isDual=${fetchRes.isDual}, hasArticle=${fetchRes.hasArticle}, textLen=${fetchRes.text?.length || 0}`);

  // 2. Dissect the post thread (X Articles are dissected separately via their own URL)
  debugLog('SINGLE dissection route triggered');
  const singleRes = await dissectSinglePayload(fetchRes.text || inputUrlOrText, 'social_post', postUrl, platform, { format: 'social_post' });
  debugLog(`Single dissection done: styleName=${singleRes.styleName}`);

  // Inject article_url into frontmatter if the fetcher found an embedded article link
  if (fetchRes.articleUrl) {
    singleRes.finalMarkdown = singleRes.finalMarkdown.replace(
      /(^---\n[\s\S]*?)(\n---)/,
      `$1\narticle_url: "${fetchRes.articleUrl}"$2`
    );
  }

  const outputFile = path.join(STYLE_BANK_DIR, `style-${singleRes.styleName}.md`);
  fs.writeFileSync(outputFile, singleRes.finalMarkdown);
  debugLog(`Saved: ${outputFile}`);

  debugLog('Calling logNewDissection...');
  logNewDissection(singleRes.styleName);

  try {
    const { updateStyleBankMOC } = await import('./lulua_moc_manager.mjs');
    debugLog('Calling updateStyleBankMOC...');
    updateStyleBankMOC();
    debugLog('updateStyleBankMOC completed');
  } catch (e) { debugLog(`updateStyleBankMOC ERROR: ${e.message}`); }

  debugLog('=== DISSECTION END (single, success) ===');
  console.log(`✅ [Lulua Hybrid] Post dissection complete. Saved to Style Bank: style-${singleRes.styleName}.md`);
  return { ok: true, isDual: false, styleName: singleRes.styleName, file: outputFile, filename: `style-${singleRes.styleName}.md` };
}

// CLI execution check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputArg = process.argv[2] || 'https://x.com/milesdeutscher/status/2082646132157780412?s=20';
  debugLog(`CLI execution: inputArg = ${inputArg}`);
  runPostDissection(inputArg).catch(err => {
    debugLog(`FATAL ERROR: ${err.message}`);
    console.error('❌ Dissection execution failed:', err);
    process.exit(1);
  });
}
