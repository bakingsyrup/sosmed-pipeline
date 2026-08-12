import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import console from 'console';
import http from 'http';
import https from 'https';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Modular API Services & File Helpers
import { callGemini } from './services/gemini_api.mjs';
import { callDeepSeek } from './services/deepseek_api.mjs';
import { parseMarkdown } from './utils/file_helper.mjs';

// Load Environment Variables manually from .env
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const colonIndex = trimmed.indexOf('=');
          if (colonIndex !== -1) {
            const key = trimmed.slice(0, colonIndex).trim();
            let val = trimmed.slice(colonIndex + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
      }
      console.log(`[Repurpose Agent] Loaded environment variables from ${envPath}`);
      break;
    }
  }
}
loadEnv();

// Base Constants & Pipeline Directories
const PIPELINE_BASE = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline';
const X_PIPELINE_BASE = path.join(PIPELINE_BASE, 'x-pipeline');

const paths = {
  inbox: path.join(PIPELINE_BASE, '01-Inbox'),
  repurposeInputsDir: path.join(PIPELINE_BASE, '01-Inbox', '00-Repurpose-Inputs'),
  researching: path.join(PIPELINE_BASE, '02-Researching'),
  template: path.join(PIPELINE_BASE, '01-Inbox', '00-Repurpose-Inputs', '_NEW_REPURPOSE_INPUT.md'),
  repurposingGuide: path.join(__dirname, 'repurposing_guide.md'),
  styleGuide: path.join(__dirname, 'x_style_guide.md'),
  styleBankMoc: path.join(PIPELINE_BASE, 'lulua-pipeline', '01-Style-Bank', '00-Style-Bank-MOC.md'),
  historyLog: path.join(__dirname, 'topic_history_log.json'),
  statusFile: path.join(__dirname, 'repurpose_status.md')
};

const platformOutputDirs = {
  x: {
    ready: path.join(PIPELINE_BASE, 'x-pipeline', '03-Ready'),
    archive: path.join(PIPELINE_BASE, 'x-pipeline', '05-Archive')
  },
  youtube: {
    ready: path.join(PIPELINE_BASE, 'yt-pipeline', '03-Ready'),
    archive: path.join(PIPELINE_BASE, 'yt-pipeline', '05-Archive')
  },
  instagram: {
    ready: path.join(PIPELINE_BASE, 'ig-pipeline', '03-Ready'),
    archive: path.join(PIPELINE_BASE, 'ig-pipeline', '05-Archive')
  },
  tiktok: {
    ready: path.join(PIPELINE_BASE, 'tiktok-pipeline', '03-Ready'),
    archive: path.join(PIPELINE_BASE, 'tiktok-pipeline', '05-Archive')
  },
  linkedin: {
    ready: path.join(PIPELINE_BASE, 'linkedin-pipeline', '03-Ready'),
    archive: path.join(PIPELINE_BASE, 'linkedin-pipeline', '05-Archive')
  }
};

// Master Wireframe Mapping Table (1 to 11)
const WIREFRAME_FILES = {
  1: 'style-Format1_HighUtility_StepByStep_v1.md',
  2: 'style-HighUtility_Thread_MasterCheatSheet_v1.md',
  3: 'style-ClientAds_Thread_LearnAndEarn_v1.md',
  4: 'style-HighUtility_Thread_HistoricalCaseStudy_BookmarkSave.md',
  5: 'style-ViralReach_Thread_HistoricalCaseStudy_RetweetIdentity.md',
  6: 'style-DebateEngagement_Thread_BinaryChoice_v1.md',
  7: 'style-ClientAds_Thread_ProblemSolution_AppDownload_v1.md',
  8: 'style-BrandIdentity_Thread_ContrarianManifesto_v1.md',
  9: 'style-HighUtility_Thread_HowToPlaybook_NewsletterOptin.md',
  10: 'style-OwnedLeadGen_Thread_LeadMagnetGiveaway_v1.md',
  11: 'style-BrandIdentity_Thread_StoryNarrative_ProfileVisit_v2.md'
};

// Single-Platform Format Specs (injected dynamically per target_platform)
const PLATFORM_SPECS = {
  instagram: `   - INSTAGRAM CAROUSEL:
     * ELASTIC CARD COUNT: Do NOT force a fixed 6-card or 8-card limit. Dynamically scale the slide deck (3 to 15 cards) based on natural topic depth. 1 core thought per card.
     * COVER CARD (Slide 1): Headline MAX 12 words, Sub-headline MAX 18 words (Total MAX 30 words).
     * BODY CARDS (Slides 2 to N): Step/Header MAX 6 words, Core body text MAX 25 words per block (Total MAX 40 words per card).
     * OUTRO CARD (Final Slide): Takeaway MAX 15 words, Action CTA MAX 15 words (Total MAX 30 words).`,
  youtube: `   - YOUTUBE SHORTS: 130-145 words max (55s @ 150 WPM), sentence max 12 words, 4-stage timestamp table with visual editing cues.
   - YOUTUBE LONG-FORM: 5-chapter structured video essay outline + B-roll/graphic asset cues.
   - YOUTUBE COMMUNITY: Bulleted text + visual card spec + discussion question.`,
  tiktok: `   - TIKTOK: 130-145 words max (55s @ 150 WPM), sentence max 12 words, 4-stage timestamp table with visual editing cues.`,
  linkedin: `   - LINKEDIN: 1-2 sentences per block (whitespace formatting), bold first line.`,
  x: `   - X (TWITTER): Compact thread format, double line breaks, sentence case headlines.`
};

// Dynamic Wireframe Loader: Extract only the target platform's section from the full wireframe
function extractWireframeSection(wireframeMd, targetPlatform) {
  const platformKeywords = {
    instagram: /instagram/i,
    youtube: /youtube/i,
    tiktok: /tiktok/i,
    linkedin: /linkedin/i,
    x: /x\s*\(twitter\)|twitter\s*thread/i
  };
  const keyword = platformKeywords[targetPlatform];
  if (!keyword) return wireframeMd;

  const lines = wireframeMd.split('\n');

  const introEnd = lines.findIndex(line => /^###\s/.test(line));
  const intro = introEnd >= 0 ? lines.slice(0, introEnd).join('\n') : '';

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^###\s/.test(lines[i]) && keyword.test(lines[i])) {
      startIdx = i;
      break;
    }
  }
  if (startIdx < 0) return wireframeMd;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^###\s/.test(lines[i]) || /^---/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  const section = lines.slice(startIdx, endIdx).join('\n');
  return intro + '\n' + section;
}

// Ensure all directories exist
for (const p of Object.values(paths)) {
  if (!p.endsWith('.md') && !p.endsWith('.json') && !fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}
for (const platformObj of Object.values(platformOutputDirs)) {
  if (!fs.existsSync(platformObj.ready)) fs.mkdirSync(platformObj.ready, { recursive: true });
  if (!fs.existsSync(platformObj.archive)) fs.mkdirSync(platformObj.archive, { recursive: true });
}

// Global pipeline status tracking
let currentStatusState = '';
let currentErrorState = '';

function writeStatus(status, errorMsg = null) {
  if (status === currentStatusState && errorMsg === currentErrorState) return;
  currentStatusState = status;
  currentErrorState = errorMsg;

  const now = new Date().toLocaleString();
  let statusEmoji = status === 'OK' ? '🟢 OK' : status === 'STANDBY' ? '🟡 STANDBY' : '🔴 ERROR';
  let content = `---\ntype: Repurpose Pipeline Status\nstatus: ${status}\nlast_checked: ${now}\n---\n\n`;
  content += `# Repurpose Pipeline Status: ${statusEmoji}\n- **Last Checked**: ${now}\n`;
  if (errorMsg) content += `\n> [!WARNING]\n> **Notice**: ${errorMsg}\n`;

  try {
    fs.writeFileSync(paths.statusFile, content, 'utf8');
  } catch (err) {
    console.error('Failed to write repurpose status file:', err.message);
  }
}

// Check if SGT Peak Pricing is active for DeepSeek fallback
function isDeepSeekPeakPricing() {
  const sgtTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
  const sgtDate = new Date(sgtTime);
  const hours = sgtDate.getHours();
  const minutes = sgtDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Morning Peak: 8:50 AM (530) to 12:10 PM (730) SGT
  const isMorningPeak = (timeInMinutes >= 530 && timeInMinutes < 730);
  // Afternoon Peak: 1:50 PM (830) to 6:10 PM (1090) SGT
  const isAfternoonPeak = (timeInMinutes >= 830 && timeInMinutes < 1090);

  return isMorningPeak || isAfternoonPeak;
}

function resolveDraftModel() {
  const configuredModel = process.env.GEMINI_DRAFT_MODEL || 'deepseek-v4-pro';
  if (configuredModel.toLowerCase().includes('deepseek') && isDeepSeekPeakPricing()) {
    const fallbackModel = process.env.GEMINI_FALLBACK_DRAFT_MODEL || 'gemini-2.5-flash';
    console.log(`[Peak Pricing Router] SGT Peak Pricing active. Falling back to: ${fallbackModel}`);
    return fallbackModel;
  }
  return configuredModel;
}

// Call drafting model (DeepSeek or Gemini fallback)
async function callDraftingModel(prompt, systemInstruction, modelName) {
  const DRAFTING_HARD_TIMEOUT_MS = 600000; // 10 minutes timeout

  const draftingPromise = (async () => {
    if (modelName.toLowerCase().includes('deepseek')) {
      try {
        console.log(`[Drafting Engine] Calling DeepSeek API (${modelName})...`);
        const result = await callDeepSeek(prompt, systemInstruction, modelName);
        const text = result.choices?.[0]?.message?.content || '';
        if (text) return text;
        throw new Error('Empty DeepSeek response');
      } catch (err) {
        console.warn(`[Drafting Engine Warning] DeepSeek API call failed (${err.message}). Falling back to Gemini 2.5 Flash...`);
        const fallbackResult = await callGemini(prompt, systemInstruction, false, 'gemini-2.5-flash');
        return fallbackResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } else {
      console.log(`[Drafting Engine] Calling Gemini API (${modelName})...`);
      const result = await callGemini(prompt, systemInstruction, false, modelName);
      return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Drafting call timed out after ${DRAFTING_HARD_TIMEOUT_MS / 1000}s`)), DRAFTING_HARD_TIMEOUT_MS)
  );

  return Promise.race([draftingPromise, timeoutPromise]);
}

// Programmatic 404 URL verifier
async function verifyUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const protocol = parsed.protocol === 'https:' ? https : http;
    return await new Promise((resolve) => {
      const req = protocol.request(parsed, {
        method: 'HEAD',
        timeout: 2500,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) resolve(true);
        else if (res.statusCode === 404 || res.statusCode >= 500) resolve(false);
        else resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  } catch {
    return false;
  }
}

async function verifyAndCleanMarkdownContent(content) {
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  const foundUrls = new Set();
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    foundUrls.add(match[2].trim());
  }

  if (foundUrls.size === 0) return content;

  console.log(`[Link Verifier] Verifying ${foundUrls.size} URLs...`);
  const urlResults = new Map();
  await Promise.all(
    Array.from(foundUrls).map(async (url) => {
      const isValid = await verifyUrl(url);
      urlResults.set(url, isValid);
    })
  );

  let cleanedContent = content;
  for (const [url, isValid] of urlResults.entries()) {
    if (!isValid) {
      console.log(`[Link Verifier] Cleaning invalid/404 URL: ${url}`);
      try {
        const parsed = new URL(url);
        const domainRoot = `${parsed.protocol}//${parsed.hostname}`;
        const isRootValid = await verifyUrl(domainRoot);
        if (isRootValid) {
          cleanedContent = cleanedContent.replaceAll(url, domainRoot);
        } else {
          const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapedUrl}\\)`, 'g');
          cleanedContent = cleanedContent.replace(linkRegex, '$1');
        }
      } catch {
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapedUrl}\\)`, 'g');
        cleanedContent = cleanedContent.replace(linkRegex, '$1');
      }
    }
  }

  return cleanedContent;
}

// History Logger Helpers
function readTopicHistory() {
  if (fs.existsSync(paths.historyLog)) {
    try {
      const content = fs.readFileSync(paths.historyLog, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  return [];
}

function updateTopicHistory(entry) {
  const history = readTopicHistory();
  history.push(entry);
  try {
    fs.writeFileSync(paths.historyLog, JSON.stringify(history, null, 2), 'utf8');
    console.log(`[History Logger] Updated topic history log.`);
  } catch (err) {
    console.error(`[History Logger] Failed to update topic history:`, err.message);
  }
}

// Auto-spawn or reset _NEW_REPURPOSE_INPUT.md in 01-Inbox/00-Repurpose-Inputs/
function ensureRepurposeInputTemplate() {
  if (!fs.existsSync(paths.repurposeInputsDir)) {
    fs.mkdirSync(paths.repurposeInputsDir, { recursive: true });
  }

  if (!fs.existsSync(paths.template)) {
    const templateContent = `---
type: Content Repurpose Input
status: draft # draft | ready (changing to 'ready' triggers automated repurposing)
source_platform: x # x | youtube | instagram | tiktok | linkedin | blog | podcast
target_platform: instagram # instagram (default) | x | youtube | tiktok | linkedin
existing_sponsor: no # yes | no (Does the source content contain a client/sponsor? Default: no)
repurpose_sponsorship: no # yes | no (Should repurposed outputs actively promote a sponsor?)
target_language: id # id (Indonesian, default) | en (English)
---

# 📝 Source Content Input
<!-- Paste your published thread, script, or raw content below. The agent will parse this as primary context. -->

# 🤝 Sponsorship Brief & Constraints (Optional)
<!-- Fill ONLY if repurpose_sponsorship is set to 'yes'. -->
<!-- Provide sponsor name, product focus, key talking points, required CTAs, promo codes, or links. -->
`;
    fs.writeFileSync(paths.template, templateContent, 'utf8');
    console.log('[Template Engine] Auto-created template: 01-Inbox/00-Repurpose-Inputs/_NEW_REPURPOSE_INPUT.md');
  }
}

// User-driven archiver: Moves completed drafts (status: done) from 03-Ready/ ➔ 05-Archive/
function archiveFinishedRepurposedDrafts() {
  try {
    for (const [platform, platformObj] of Object.entries(platformOutputDirs)) {
      if (!fs.existsSync(platformObj.ready)) continue;
      const files = fs.readdirSync(platformObj.ready).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(platformObj.ready, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontmatter } = parseMarkdown(content);
        if (frontmatter.status === 'done') {
          const destPath = path.join(platformObj.archive, file);
          fs.renameSync(filePath, destPath);
          console.log(`[Archive Engine] Moved completed ${platform} draft to: 05-Archive/${file}`);
        }
      }
    }
  } catch (err) {
    console.error('[Archive Engine] Error archiving finished drafts:', err.message);
  }
}

// Main Repurposing Processor
async function processRepurposeInputFile(inputFilePath) {
  const filename = path.basename(inputFilePath);
  console.log(`\n========================================`);
  console.log(`[Repurpose Agent] Triggered! Processing input file: ${filename}`);
  writeStatus('STANDBY', `Processing ${filename}...`);

  let lockPath = inputFilePath;
  const isInInbox = inputFilePath.includes(paths.repurposeInputsDir);

  if (isInInbox) {
    const lockFileName = `${Date.now()}-repurpose-${filename.replace(/[^a-z0-9.]+/gi, '-')}`;
    lockPath = path.join(paths.researching, lockFileName);
    try {
      fs.renameSync(inputFilePath, lockPath);
    } catch (err) {
      console.error(`Failed to acquire lock for ${filename}:`, err.message);
      return;
    }
    // Instantly auto-respawn fresh input template in 01-Inbox/00-Repurpose-Inputs/
    ensureRepurposeInputTemplate();
  }

  try {
    const rawInput = fs.readFileSync(lockPath, 'utf8');
    const { frontmatter, body } = parseMarkdown(rawInput);

    const existingSponsor = (frontmatter.existing_sponsor || 'no').toLowerCase();
    const repurposeSponsorship = (frontmatter.repurpose_sponsorship || 'no').toLowerCase();
    const targetLang = (frontmatter.target_language || 'id').toLowerCase();
    
    let targetPlatform = (frontmatter.target_platform || frontmatter.target_platforms?.[0] || 'instagram').toLowerCase();
    if (targetPlatform === 'ig') targetPlatform = 'instagram';
    if (targetPlatform === 'yt') targetPlatform = 'youtube';

    const repurposedGuideStr = fs.existsSync(paths.repurposingGuide) ? fs.readFileSync(paths.repurposingGuide, 'utf8') : '';
    const styleGuideStr = fs.existsSync(paths.styleGuide) ? fs.readFileSync(paths.styleGuide, 'utf8') : '';
    const styleBankMocStr = fs.existsSync(paths.styleBankMoc) ? fs.readFileSync(paths.styleBankMoc, 'utf8') : '';
    const historyLog = readTopicHistory();

    const researchModel = process.env.GEMINI_RESEARCH_MODEL || 'gemini-2.5-flash';
    const draftModel = resolveDraftModel();

    // STEP 1: Fast 1st-Degree Fact & Context Verification (Gemini 2.5 Flash)
    console.log(`[Step 1/4] Gemini 2.5 Flash: Running 1st-degree fact verification & market context search...`);
    const step1System = `You are a senior market, tech, and business researcher across any domain, business, technical, or educational niche. Fact-check the input and gather 1st-degree benchmark data.`;
    const step1Prompt = `
Source Input Content:
${body}

Target Language: ${targetLang}
Existing Sponsor: ${existingSponsor} | Repurpose Sponsorship: ${repurposeSponsorship}

Perform fact-checking and gather core metrics, historical dates, and verified source links [Title](URL).
`;
    const step1Res = await callGemini(step1Prompt, step1System, true, researchModel);
    const step1Brief = step1Res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`[Step 1/4 Completed] 1st-degree research gathered.`);

    // STEP 2: Angle Mutation Selection & 2nd-Degree Deep-Dive Items Request (DeepSeek)
    console.log(`[Step 2/4] DeepSeek: Selecting native angles & identifying 2nd-degree deep-dive items...`);
    const recentAnglesStr = JSON.stringify(historyLog.filter(e => e.style_archetype).map(e => ({ topic_id: e.topic_id, platform: e.platform, style_archetype: e.style_archetype })).slice(-5));
    const step2System = `You are the Editor-in-Chief of the primary publication channel. Match topics to platform angles and identify missing deep-dive facts.`;
    const step2Prompt = `
11 MASTER WIREFRAME FORMAT OPTIONS:
1. Format 1 (StepByStepSOP): Tactical setup walkthroughs & time-bound SOPs (Tool Mechanic).
2. Format 2 (MasterCheatSheet): Curated resource listicles & tool stacks (Tool Mechanic).
3. Format 3 (ToolIntegration): Learn & Earn feature walkthroughs & app setup (Tool Mechanic).
4. Format 4 (HistoricalPrecedent): Cycle comparisons & backtest data (Data Journalist).
5. Format 5 (MegaNumberAlert): Mega-number shock & whale transaction math (Data Journalist).
6. Format 6 (BinaryChoice): Option A vs Option B market decision matrix (Data Journalist).
7. Format 7 (FrictionRemover): Anti-liquidation rules & security SOPs (Risk Manager).
8. Format 8 (ContrarianManifesto): Piercing mainstream consensus & mythbusting (Risk Manager).
9. Format 9 (MasterFramework): Institutional portfolio models & macro frameworks (Framework Curator).
10. Format 10 (LeadMagnetGiveaway): Free calculator/Notion template opt-ins (Framework Curator).
11. Format 11 (FounderRetrospective): Executive lessons & long-term wisdom (Framework Curator).

Recent Published Content Log (COOLDOWN CHECK - Do NOT reuse these style_archetype on the same platform):
${recentAnglesStr}

1st-Degree Fact Brief:
${step1Brief}

Source Content:
${body}

Target Platform Requested: ${targetPlatform.toUpperCase()}

Tasks:
1. Read the source content and analyze its core intent and strategic goal.
2. Select the SINGLE BEST Format Number (1 to 11) that natively matches this core intent (e.g. "Selected Format: Format 1").
3. Assign a native presentation angle for ${targetPlatform.toUpperCase()} that PRESERVES this core intent and format purpose 100%.
   CRITICAL MANDATE: You MUST NOT invert or flip the core solution/message of the source content into a contradictory warning post!
4. List 3 to 5 specific 2nd-degree deep-dive search queries needed to support this presentation angle with real verified facts/numbers.
5. Image Sourcing Hierarchy Directive:
   Analyze the source reference input and classify the primary visual subject into 1 of 3 Universal Tiers:
   - TIER 1 (Recognized Entity / Person): If a prominent figure or organization is present: generate query: "[Primary Subject Name] [Relevant Niche] high resolution portrait neutral background"
   - TIER 2 (Event / Historic Scene): If a specific historic event, market crisis, or deal is present: generate query: "[Event/Topic Name] historic press photo high resolution"
   - TIER 3 (Abstract SOP / Conceptual): If an abstract guide, framework, or SOP: generate query: "minimalist [Niche Topic] dark aesthetic high resolution background"
   Output 1 to 2 targeted image search queries under "Image Search Queries Needed:".
`;
    const step2Brief = await callDraftingModel(step2Prompt, step2System, draftModel);
    console.log(`[Step 2/4 Completed] Native angles selected & 2nd-degree search items identified.`);

    // Parse Selected Wireframe Format from Step 2 Brief
    const formatMatch = step2Brief.match(/Format\s*(\d+)/i);
    const selectedFormatNum = formatMatch ? parseInt(formatMatch[1], 10) : 1;
    const selectedFileName = WIREFRAME_FILES[selectedFormatNum] || WIREFRAME_FILES[1];
    const selectedFormatPath = path.join(PIPELINE_BASE, 'lulua-pipeline', '01-Style-Bank', selectedFileName);

    const selectedFormatContent = fs.existsSync(selectedFormatPath) 
      ? fs.readFileSync(selectedFormatPath, 'utf8') 
      : '';

    console.log(`[Targeted Wireframe Loader] Selected Format ${selectedFormatNum} ➔ Loading ${selectedFileName}`);

    // Extract style archetype for history logging
    let repurposeStyleArchetype = null;
    try {
      const nameCore = selectedFileName.replace(/^style-/, '');
      const parts = nameCore.split('_');
      repurposeStyleArchetype = parts.length >= 3 ? parts[2] : null;
    } catch {}

    const platformWireframe = extractWireframeSection(selectedFormatContent, targetPlatform);

    // STEP 3: Targeted 2nd-Degree Deep-Dive Search (Gemini 2.5 Flash)
    console.log(`[Step 3/4] Gemini 2.5 Flash: Executing 2nd-degree search queries for deep-dive metrics...`);
    const step3Prompt = `
Search Queries Needed:
${step2Brief}

Execute Google Search for these specific queries and return verified high-signal facts, data deltas, and direct source links [Title](URL).
`;
    const step3Res = await callGemini(step3Prompt, 'Fetch targeted 2nd-degree facts with direct web links.', true, researchModel);
    const step3Brief = step3Res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`[Step 3/4 Completed] 2nd-degree deep-dive facts gathered.`);

    // STEP 4: Master Multi-Platform Production Drafting (DeepSeek)
    console.log(`[Step 4/4] DeepSeek: Writing final production-ready drafts for all target platforms...`);
    const step4System = `
You are the Master Copywriter for the primary publication channel.
Your task is to write production-ready, ultra-high quality drafts for the requested target platform.

CRITICAL DIRECTIVES:
1. VOICE & STYLE: Strict compliance with x_style_guide.md (dynamic prefix stripping, active voice, sentence case headlines, double line breaks, dry cynical endings).
2. SPONSORSHIP MANDATE:
   - If existing_sponsor is 'yes' AND repurpose_sponsorship is 'no': PURGE all client mentions, codes, and app links. Replace with owned channel CTAs.
   - If repurpose_sponsorship is 'yes': Incorporate sponsor details from the input brief.
3. LANGUAGE: Produce drafts in target language: ${targetLang.toUpperCase()}.
4. DYNAMIC CONTENT-DRIVEN ELASTICITY & SECTION WORD CAPS:
${PLATFORM_SPECS[targetPlatform] || PLATFORM_SPECS['instagram']}

5. 5 CORE NARRATIVE WRITING RULES:
   - Rule 1 (Red Thread): Every line/card MUST logically answer the question raised by the previous line.
   - Rule 2 (Jargon Unpacking): Immediately explain technical terms (e.g. specialized industry acronyms, technical concepts, or domain metrics) in simple everyday language.
   - Rule 3 (Show, Don't Tell): Zero hype words ("masif", "sangat berbahaya"); prove scale using raw facts & relative comparisons.
   - Rule 4 (Comparative Context): Always compare metrics to benchmarks, previous periods, or expectations.
   - Rule 5 (Active Root Verbs & Brevity): Strip Indonesian prefixes (me-, meng-) to use active root verbs (kata dasar). Max 33 words per sentence.

6. DYNAMIC DUAL-LIBRARY CARD VARIATION ENGINE (INSTAGRAM CAROUSEL):
   CRITICAL MANDATE: You MUST NOT output single static slides for Instagram Carousels (do NOT write "Slide 1:", "Slide 2:").
   For EVERY card in the deck (Card 1 Cover through Final Card), you MUST generate all 5 DISTINCT COMBINED VARIATIONS (Variation 1 through Variation 5) under ### CARD [N]!
   All 5 variations MUST deliver the 100% EXACT SAME facts and information, but dynamically pair 1 Phrasing Style from Library A with 1 Visual Delivery Format from Library B that natively fits the card's specific content type:

   LIBRARY A (5 SEMANTIC PHRASING STYLES):
   - Style A1: Ultra-Compact & Direct (Short active clauses, zero filler)
   - Style A2: Fluid Conversational ("Kita" inclusive peer tone, smooth connectives)
   - Style A3: Condition-Action-Outcome ("Jika [Condition] ➔ [Action] ➔ [Result]")
   - Style A4: Outcome & Metric First (Front-loads numbers or end results)
   - Style A5: Interrogative Q&A (Rhetorical question + direct answer)

   LIBRARY B (5 VISUAL DELIVERY FORMATS):
   - Format B1: Compact Narrative Paragraph (\n\n)
   - Format B2: Scannable Bullet List (•)
   - Format B3: Key-Value Table / Split Metrics (Key : Value)
   - Format B4: Rhetorical Q&A Split (Q / A)
   - Format B5: Directional Arrow Flow (➔ / ↓)

   DYNAMIC PAIRING INSTRUCTION:
   Do NOT hardcode rigid static assignments. Dynamically pair Phrasing Styles with the visual formats that make the most sense for THAT SPECIFIC CARD (e.g. use Cover-friendly layouts for Slide 1, Data-friendly layouts for Data cards, and Sequence-friendly layouts for Step cards).

   MARKDOWN FORMATTING REQUIREMENT PER CARD:
   Format each card cleanly using these sub-headers:
   ### CARD [N]: [CARD TITLE]

   #### 🔵 Variation 1 ([Style Name] + [Format Name])
   * **Header**: ...
   * **Body**: ...

   #### 🟣 Variation 2 ([Style Name] + [Format Name])
   * **Header**: ...
   * **Body**: ...

   #### 🟢 Variation 3 ([Style Name] + [Format Name])
   * **Header**: ...
   * **Body**: ...

   #### 🔴 Variation 4 ([Style Name] + [Format Name])
   * **Header**: ...
   * **Body**: ...

   #### 🟡 Variation 5 ([Style Name] + [Format Name])
   * **Header**: ...
   * **Body**: ...

7. ANGLE OVERVIEW & EDITORIAL PITCH SECTION DIRECTIVE:
   At the VERY TOP of your output (right below ### PLATFORM: ${targetPlatform.toUpperCase()} and BEFORE the content cards/script), you MUST generate a 2-part Editorial Pitch.

   CRITICAL PITCH MANDATES:
   - MANDATE 1 (ENGLISH LANGUAGE): The entire 🎙️ Angle Overview & Editorial Pitch section (Part 1 and Part 2) MUST ALWAYS BE WRITTEN IN ENGLISH, regardless of the target_language setting for the social media content cards!
   - MANDATE 2 (CORE INTENT PRESERVATION): In Part 1, explain how your presentation angle preserves the primary educational solution and thesis of the source material. Do NOT invert or flip a solution guide into a warning post!

   ## 🎙️ Angle Overview & Editorial Pitch (To Editor-in-Chief)

   ### 💬 Part 1: Strategic Angle Rationale
   (Write 2-3 analytical paragraphs IN ENGLISH explaining why you selected this presentation angle, how it preserves the core solution/intent of the source material, and how your narrative flow guides the audience from hook to actionable value payoff.)

   ### 📋 Part 2: Slide-by-Slide Executive Outline
   (Provide a 1-sentence micro-summary bullet point IN ENGLISH for each card/section in the deck explaining its narrative role.)
   * Card 1 (Cover / Hook): ...
   * Card 2 (Context / Problem): ...
   ...
   * Card N (Outro / CTA): ...

Output your response cleanly formatted with the Markdown header for the target platform:
### PLATFORM: ${targetPlatform.toUpperCase()}
`;

    const step4Prompt = `
TARGET WIREFRAME FORMAT SPECIFICATION (Format ${selectedFormatNum}):
${platformWireframe}

STYLE GUIDE (VOICE):
${styleGuideStr}

RAW INPUT CONTENT:
${body}

1ST & 2ND DEGREE RESEARCH BUNDLE:
${step1Brief}

${step3Brief}

Draft the complete content kit for ${targetPlatform.toUpperCase()} now.
`;

    const finalDrafts = await callDraftingModel(step4Prompt, step4System, draftModel);

    // STEP 5: Programmatic 404 URL Verifier & Cleaner
    console.log(`[Step 5/5] Running Programmatic 404 URL Verifier...`);
    const verifiedDrafts = await verifyAndCleanMarkdownContent(finalDrafts);

    // STEP 6: Dispatch Output into Selected Platform's Native 03-Ready Folder
    const topicSlug = body.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'repurposed-post';
    const dateStr = new Date().toISOString().split('T')[0];
    const timestampStr = Date.now();

    const usedAnglesLog = {
      id: `log_${dateStr.replace(/-/g, '')}_${timestampStr}`,
      published_at: dateStr,
      content_type: targetPlatform === 'x' ? 'x_thread' : targetPlatform === 'instagram' ? 'instagram_carousel' : targetPlatform === 'youtube' ? 'youtube_short' : targetPlatform === 'tiktok' ? 'tiktok' : targetPlatform === 'linkedin' ? 'linkedin_article' : targetPlatform,
      topic_id: topicSlug,
      style: selectedFileName,
      style_archetype: repurposeStyleArchetype,
      platform: targetPlatform === 'x' ? 'X' : targetPlatform === 'instagram' ? 'Instagram' : targetPlatform === 'youtube' ? 'YouTube' : targetPlatform === 'tiktok' ? 'TikTok' : targetPlatform === 'linkedin' ? 'LinkedIn' : targetPlatform,
      post_url: null,
      post_count: 0,
      posts: []
    };

    const platformObj = platformOutputDirs[targetPlatform] || platformOutputDirs['instagram'];
    const outFilename = `${dateStr}-REPURPOSED-${targetPlatform.toUpperCase()}-${topicSlug}.md`;
    const outPath = path.join(platformObj.ready, outFilename);

    // Extract content under header if present, or use verifiedDrafts
    const platUpper = targetPlatform.toUpperCase();
    const platformRegex = new RegExp(`(?:###|##)\\s*(?:PLATFORM:\\s*)?${platUpper}\\b([\\s\\S]*?)$`, 'i');
    const platformMatch = verifiedDrafts.match(platformRegex);
    const platformContent = platformMatch && platformMatch[1].trim().length > 20 ? platformMatch[1].trim() : verifiedDrafts;

    const outFrontmatter = `---
type: ${targetPlatform.toUpperCase()} - Repurposed Draft
status: ready
source_platform: ${frontmatter.source_platform || 'x'}
existing_sponsor: ${existingSponsor}
repurpose_sponsorship: ${repurposeSponsorship}
lang: ${targetLang}
created_at: ${new Date().toISOString()}
---

# 📝 Repurposed Content Kit (${targetPlatform.toUpperCase()})

${platformContent}
`;
      const outFrontmatterWithBrief = `${outFrontmatter}

---
# 🔍 Supporting Fact Brief & Grounding Sources
${step1Brief}

${step3Brief}
`;
    fs.writeFileSync(outPath, outFrontmatterWithBrief, 'utf8');
    console.log(`[Dispatch] Saved single draft to: ${outPath}`);

    // STEP 7: Update History Logger & Discard Lock File in 02-Researching/
    updateTopicHistory(usedAnglesLog);

    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log(`[Lock Engine] Discarded temporary lock file in 02-Researching/`);
    }

    console.log(`\n========================================`);
    console.log(`[Repurpose Agent] Success! All outputs dispatched cleanly.`);
    writeStatus('OK');
  } catch (err) {
    console.error(`[Repurpose Agent] Error during execution:`, err);
    writeStatus('ERROR', err.message);
    if (fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath);
        console.log(`[Lock Engine] Cleaned lock file after error.`);
      } catch (e) {
        console.error(`Could not remove lock file:`, e.message);
      }
    }
  }
}

// Main Polling Loop
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');

  ensureRepurposeInputTemplate();
  archiveFinishedRepurposedDrafts();

  if (watchMode) {
    console.log(`[Repurpose Agent] Running in WATCH mode (polling every 10s)...`);
    console.log(`Watching Directory: ${paths.repurposeInputsDir}`);
    writeStatus('OK');

    while (true) {
      try {
        // 1. Maintain input template
        ensureRepurposeInputTemplate();

        // 2. Archive any drafts marked status: done in 03-Ready/
        archiveFinishedRepurposedDrafts();

        // 3. Check for ready input files in 01-Inbox/00-Repurpose-Inputs/
        if (fs.existsSync(paths.repurposeInputsDir)) {
          const files = fs.readdirSync(paths.repurposeInputsDir).filter(f => f.endsWith('.md'));
          for (const file of files) {
            const filePath = path.join(paths.repurposeInputsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const { frontmatter } = parseMarkdown(content);
            if (frontmatter.status === 'ready' && frontmatter.type === 'Content Repurpose Input') {
              await processRepurposeInputFile(filePath);
              break;
            }
          }
        }
      } catch (err) {
        console.error('[Repurpose Agent] Error in watch loop:', err.message);
        writeStatus('ERROR', err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  } else {
    console.log(`[Repurpose Agent] Running in SINGLE execution mode...`);
    writeStatus('OK');
    if (fs.existsSync(paths.repurposeInputsDir)) {
      const files = fs.readdirSync(paths.repurposeInputsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const filePath = path.join(paths.repurposeInputsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontmatter } = parseMarkdown(content);
        if (frontmatter.status === 'ready' && frontmatter.type === 'Content Repurpose Input') {
          await processRepurposeInputFile(filePath);
          break;
        }
      }
    }
    console.log('Done.');
  }
}

main().catch(err => {
  console.error('Fatal error in Repurpose Agent:', err);
  process.exit(1);
});
