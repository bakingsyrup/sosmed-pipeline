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

// Import Modular API Service
import { callGemini } from './services/gemini_api.mjs';
import { callDeepSeek } from './services/deepseek_api.mjs';
import { findAndClipVideo } from './utils/youtube_clipper.mjs';
import { isFeatureEnabled } from './services/pipeline_config.mjs';

// Import Modular File Helpers
import {
  parseMarkdown,
  extractTweetText,
  extractSources,
  getActiveGlossaryTerms,
  getDefinedGlossaryTerms,
  countTodayGlossaryEntries,
  appendGlossaryAlphabetically,
  getFilesRecursive
} from './utils/file_helper.mjs';

// Import Modular Prompts
import {
  getResearchSystemInstruction,
  getResearchPromptStr,
  getTargetedResearchSystemInstruction,
  getTargetedResearchPromptStr
} from './prompts/research_prompt.mjs';

import {
  getMorningBriefingSystemInstruction,
  getStandardSystemInstruction,
  getStandardPromptStr
} from './prompts/drafting_prompt.mjs';

import {
  getPlannerSystemInstruction,
  getPlannerPromptStr,
  getWireframeSystemInstruction,
  getWireframeDraftPromptStr,
  getStyleSelectionSystemInstruction,
  getStyleSelectionPromptStr
} from './prompts/wireframe_drafting_prompt.mjs';

import {
  getVideoSkeletonSystemInstruction,
  getVideoSkeletonPromptStr
} from './prompts/video_skeleton_prompt.mjs';

// 1. Load Environment Variables from .env file manually
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
      console.log(`Loaded environment variables from ${envPath}`);
      break;
    }
  }
}
loadEnv();

const PIPELINE_BASE = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline';
const STYLE_GUIDE_PATH = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/x_style_guide.md';
const STATUS_FILE_PATH = path.join(PIPELINE_BASE, '00-Status.md');

const paths = {
  inbox: path.join(PIPELINE_BASE, '01-Inbox'),
  videoInputsDir: path.join(PIPELINE_BASE, '01-Inbox', '00-Video-Inputs'),
  researching: path.join(PIPELINE_BASE, '02-Researching'),
  ready: path.join(PIPELINE_BASE, '03-Ready'),
  videoSkeletonsDir: path.join(PIPELINE_BASE, '03-Ready', '00-Video-Skeletons'),
  videoArchiveDir: path.join(PIPELINE_BASE, '05-Archive', 'video-skeletons'),
  pitches: path.join(PIPELINE_BASE, '01a-Idea-Pitches'),
  styleGuide: STYLE_GUIDE_PATH
};

// Ensure directories exist
for (const [key, dir] of Object.entries(paths)) {
  if (key !== 'styleGuide' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Global pipeline status states to deduplicate status file writes
let currentStatusState = '';
let currentErrorState = '';

// Helper to route drafting calls to either Gemini or DeepSeek
async function callDraftingModel(prompt, systemInstruction, modelName) {
  const DRAFTING_HARD_TIMEOUT_MS = 600000; // 10 minutes

  const draftingPromise = (async () => {
    if (modelName.toLowerCase().includes('deepseek')) {
      console.log(`Calling DeepSeek API with model: ${modelName}`);
      const result = await callDeepSeek(prompt, systemInstruction, modelName);
      return result.choices?.[0]?.message?.content || '';
    } else {
      console.log(`Calling Gemini API with model: ${modelName}`);
      const result = await callGemini(prompt, systemInstruction, false, modelName);
      return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Drafting call timed out after ${DRAFTING_HARD_TIMEOUT_MS / 1000}s`)), DRAFTING_HARD_TIMEOUT_MS)
  );

  return Promise.race([draftingPromise, timeoutPromise]);
}

// Main Orchestrator for processing a single note file
async function processFile(filename, styleGuideContent) {
  const inboxPath = path.join(paths.inbox, filename);
  const researchingPath = path.join(paths.researching, filename);
  const readyPath = path.join(paths.ready, filename);

  console.log(`\n----------------------------------------`);
  console.log(`Processing: ${filename}`);

  // Move to 02-Researching (Acquire Lock)
  try {
    fs.renameSync(inboxPath, researchingPath);
  } catch (err) {
    console.error(`Failed to lock file ${filename} (might be processed by another run):`, err.message);
    return;
  }

  try {
    const rawContent = fs.readFileSync(researchingPath, 'utf8');
    const { frontmatter, body } = parseMarkdown(rawContent);
    const lang = (frontmatter.lang || 'id').toLowerCase();
    const isMorningBrief = frontmatter.type === 'X - Morning Briefing';

    let researchBrief = '';
    let sources = [];
    let drafts = '';
    let tweetText = '';
    let glossaryData = null;

    if (isMorningBrief) {
      console.log('Step 1: Compiling morning briefing research from locally curated notes...');
      const approvedDir = path.join(PIPELINE_BASE, '04-Approved');
      const archiveDir = path.join(PIPELINE_BASE, '05-Archive');
      const aggregatedBriefs = [];
      const sourcesList = [];

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterday.setHours(20, 0, 0, 0); // 8:00 PM yesterday SGT
      const startTime = yesterday.getTime();
      const endTime = now.getTime();

      console.log(`Scanning folders for approved/archived notes between ${yesterday.toLocaleString()} and ${now.toLocaleString()} SGT...`);

      const scanDirs = [approvedDir, archiveDir];
      for (const dir of scanDirs) {
        if (!fs.existsSync(dir)) continue;
        const filesInDir = getFilesRecursive(dir);
        for (const file of filesInDir) {
          try {
            const fileContent = fs.readFileSync(file, 'utf8');
            const parsed = parseMarkdown(fileContent);
            const stats = fs.statSync(file);
            const dateStr = parsed.frontmatter.date || parsed.frontmatter.created_at;
            const fileTime = dateStr ? new Date(dateStr).getTime() : stats.mtime.getTime();

            if (fileTime >= startTime && fileTime <= endTime) {
              const lines = parsed.body.split('\n');
              let briefLines = [];
              let capture = false;
              for (const line of lines) {
                if (line.includes('# Fact-Checking & Research Brief')) {
                  capture = true;
                  continue;
                }
                if (capture) {
                  if (line.startsWith('# ') || line.trim() === '---') {
                    break;
                  }
                  briefLines.push(line);
                }
              }
              
              const extractedBrief = briefLines.length > 0 ? briefLines.join('\n').trim() : parsed.body.trim();
              aggregatedBriefs.push(`Source: @${parsed.frontmatter.handle || 'unknown'} (${parsed.frontmatter.url || 'No URL'})\nTitle: ${path.basename(file).replace('.md', '')}\n\n${extractedBrief}`);
              
              if (parsed.frontmatter.url) {
                sourcesList.push({
                  title: `@${parsed.frontmatter.handle || 'unknown'} Source`,
                  url: parsed.frontmatter.url
                });
              }
            }
          } catch (fileErr) {
            console.error(`Error reading file ${file} for morning brief:`, fileErr.message);
          }
        }
      }

      console.log(`Found ${aggregatedBriefs.length} curated notes from overnight.`);
      researchBrief = aggregatedBriefs.length > 0 
        ? aggregatedBriefs.join('\n\n=========================================\n\n')
        : "No curated news notes found in 04-Approved or 05-Archive from the last 24 hours.";
      
      sources = sourcesList;
      console.log('Local research compilation completed.');

      // Step 2: Drafting based on Style Guide
      console.log('Step 2: Generating Morning Briefing draft using Cognitive Decision Gate...');
      
      const draftingSystemInstruction = getMorningBriefingSystemInstruction(styleGuideContent, lang);
      const draftingPromptStr = `Fact-Checking & Research Brief:\n${researchBrief}\n\nChoose the single best template that fits this news from the 5 options provided, and write the compact morning briefing post in ${lang === 'en' ? 'ENGLISH' : 'INDONESIAN'}. Include the Visual Asset Suggestion at the end.`;

      const draftModel = resolveDraftModel();
      drafts = await callDraftingModel(draftingPromptStr, draftingSystemInstruction, draftModel);

    } else {
      tweetText = extractTweetText(body);
      console.log(`Found raw tweet from @${frontmatter.handle || 'unknown'}:`);
      console.log(`"${tweetText.substring(0, 120)}..."`);

      // Step 1: Research & Verification with Google Search Grounding
      console.log('Step 1: Running macro/geopolitical fact verification via Gemini...');
      
      const activeTerms = getActiveGlossaryTerms(PIPELINE_BASE);
      const definedTerms = getDefinedGlossaryTerms(PIPELINE_BASE);
      
      const activeListStr = Array.from(activeTerms).join(', ') || 'None';
      const unpostedDefinedList = Array.from(definedTerms.keys()).filter(t => !activeTerms.has(t));
      const definedListStr = unpostedDefinedList.join(', ') || 'None';

      const todayGlossaryCount = countTodayGlossaryEntries(PIPELINE_BASE);
      const skipGlossaryToday = todayGlossaryCount >= 6; // 3 posts * 2 terms = 6 database entries
      if (skipGlossaryToday) {
        console.log(`Daily glossary limit reached (${todayGlossaryCount} terms / 3 posts created today SGT). Skipping glossary generation for this post.`);
      }

      let glossaryPromptInstruction = '';
      if (skipGlossaryToday) {
        glossaryPromptInstruction = `
- CRITICAL: Daily glossary limit has been reached. Do NOT extract any glossary terms or run search queries for them. You MUST write "GLOSSARY_DETECTION: NO" at the end of your response.
`;
      } else {
        glossaryPromptInstruction = `
- Concept & Term Extraction:
  * Is there a complex technical term, economic indicator, or protocol in this news?
  * If yes, identify it, state its category (AI, Economics, or Crypto), select the best Mapping Angle (Tech Stack, Chronological, or Causal Chain), and list exactly one partner term to form a 2-term pair.
  * Do NOT select or partner with any of these ALREADY POSTED/DRAFTED terms: ${activeListStr}
  * You CAN partner with any of these DEFINED but UNPOSTED terms (if it fits the logical angle): ${definedListStr}
  * Provide the search-grounded definition and facts for both terms.
  * Format this section at the very end of your response exactly as:
    GLOSSARY_DETECTION: YES
    CATEGORY: [AI/Economics/Crypto]
    ANGLE: [Tech Stack/Chronological/Causal Chain]
    TERM_1: [Extracted Term]
    TERM_2: [Partner Term]
    TERM_1_FACTS: [Brief definitions/facts]
    TERM_2_FACTS: [Brief definitions/facts]
  * If no complex term exists, write:
    GLOSSARY_DETECTION: NO
`;
      }

      const researchSystemInstruction = getResearchSystemInstruction(skipGlossaryToday);
      const researchPromptStr = getResearchPromptStr(tweetText, frontmatter.url, glossaryPromptInstruction);

      const researchModel = process.env.GEMINI_RESEARCH_MODEL || 'gemini-2.5-flash';
      const enableSearch = process.env.GEMINI_ENABLE_SEARCH !== 'false';
      const researchResult = await callGemini(researchPromptStr, researchSystemInstruction, enableSearch, researchModel);
      researchBrief = researchResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      sources = extractSources(researchResult);

      console.log(`Research completed. Found ${sources.length} source links.`);

      // Step 1b: Trigger YouTube Clip Finder (if enabled)
      if (isFeatureEnabled('video_clipper', frontmatter, PIPELINE_BASE)) {
        try {
          console.log('Step 1b: Running YouTube Clip Finder & Precision Cutter...');
          // Universal query cleaning: strip URLs, @handles, leading ALL-CAPS tags (e.g. "JUST IN:", "BERITA TERKINI:"), and non-alphanumeric clutter
          const cleanQuery = tweetText
            .replace(/https?:\/\/\S+/g, '')
            .replace(/@\w+/g, '')
            .replace(/^[A-Z\s]{2,15}:/g, '')
            .replace(/[^\w\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80);

          const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 3).slice(0, 6);
          const clipId = path.basename(filePath, '.md');

          const clipRes = await findAndClipVideo(cleanQuery, keywords, '', clipId);
          if (clipRes.status === 'success') {
            console.log(`[YouTube Clipper] Clip created successfully: ${clipRes.obsidian_embed}`);
            researchBrief += `\n\n# Media Asset\n- **Video Clip**: ${clipRes.obsidian_embed}\n- **Timestamp**: ${clipRes.timestamp_range}\n- **Source**: ${clipRes.channel} (${clipRes.source_url})\n`;
          } else {
            console.log(`[YouTube Clipper] No video clip attached: ${clipRes.message}`);
          }
        } catch (clipErr) {
          console.error(`[YouTube Clipper] Error: ${clipErr.message}`);
        }
      } else {
        console.log('[YouTube Clipper] Feature toggled OFF (Skipping video search & clip generation)');
      }

      // Parse Glossary extraction details from the research brief (if enabled)
      const isGlossaryActive = isFeatureEnabled('glossary_automation', frontmatter, PIPELINE_BASE);
      const hasGlossary = isGlossaryActive && researchBrief.includes('GLOSSARY_DETECTION: YES');
      glossaryData = null;
      if (hasGlossary && !skipGlossaryToday) {
        const categoryMatch = researchBrief.match(/CATEGORY:\s*([^\n]+)/);
        const angleMatch = researchBrief.match(/ANGLE:\s*([^\n]+)/);
        const term1Match = researchBrief.match(/TERM_1:\s*([^\n]+)/);
        const term2Match = researchBrief.match(/TERM_2:\s*([^\n]+)/);
        const term1FactsMatch = researchBrief.match(/TERM_1_FACTS:\s*([\s\S]*?)(?=TERM_2_FACTS:|\n\n|\n\r\n|$)/);
        const term2FactsMatch = researchBrief.match(/TERM_2_FACTS:\s*([\s\S]*?)(?=\n\n|\n\r\n|$)/);

        if (categoryMatch && term1Match && term2Match) {
          glossaryData = {
            category: categoryMatch[1].trim(),
            angle: angleMatch ? angleMatch[1].trim() : 'Causal Chain',
            term1: term1Match[1].trim(),
            term2: term2Match[1].trim(),
            term1Facts: term1FactsMatch ? term1FactsMatch[1].trim() : '',
            term2Facts: term2FactsMatch ? term2FactsMatch[1].trim() : ''
          };
          console.log(`Glossary detected: Category: ${glossaryData.category}, Angle: ${glossaryData.angle}, Terms: "${glossaryData.term1}" & "${glossaryData.term2}"`);
        }
      } else if (!isGlossaryActive) {
        console.log('[Glossary Automation] Feature toggled OFF (Skipping glossary extraction)');
      }

      // Step 2: Drafting based on Style Guide
      console.log('Step 2: Generating social media drafts in signature style...');
      const draftingSystemInstruction = getStandardSystemInstruction(styleGuideContent, lang);
      const draftingPromptStr = getStandardPromptStr(tweetText, researchBrief, lang, glossaryData, definedTerms);

      const draftModel = resolveDraftModel();
      drafts = await callDraftingModel(draftingPromptStr, draftingSystemInstruction, draftModel);
    }

    // Step 3: Write Output Note
    const updatedFrontmatter = {
      ...frontmatter,
      status: 'ready',
      researched_at: new Date().toISOString()
    };
    if (!isMorningBrief) {
      updatedFrontmatter.original_tweet_id = frontmatter.tweet_id;
      updatedFrontmatter.original_handle = frontmatter.handle;
      updatedFrontmatter.drafts_generated = '3';
    } else {
      updatedFrontmatter.drafts_generated = '1';
    }

    // Serialize frontmatter
    let frontmatterStr = '---\n';
    for (const [k, v] of Object.entries(updatedFrontmatter)) {
      if (k !== 'status' && k !== 'tweet_id' && k !== 'handle') {
        frontmatterStr += `${k}: ${v}\n`;
      }
    }
    frontmatterStr += `status: ready\n`;
    frontmatterStr += '---\n';

    // Extract and parse glossary blocks from drafts if present
    let cleanDrafts = drafts;
    let dbEn = '';
    let dbId = '';
    let postEn = '';
    let postId = '';

    if (glossaryData && drafts.includes('### GLOSSARY_DB_EN')) {
      const parts = drafts.split('### GLOSSARY_DB_EN');
      cleanDrafts = parts[0].trim();
      
      const glossarySection = '### GLOSSARY_DB_EN' + parts[1];
      
      const dbEnMatch = glossarySection.match(/### GLOSSARY_DB_EN([\s\S]*?)### GLOSSARY_DB_ID/);
      const dbIdMatch = glossarySection.match(/### GLOSSARY_DB_ID([\s\S]*?)### GLOSSARY_POST_EN/);
      const postEnMatch = glossarySection.match(/### GLOSSARY_POST_EN([\s\S]*?)### GLOSSARY_POST_ID/);
      const postIdMatch = glossarySection.match(/### GLOSSARY_POST_ID([\s\S]*?)### END_GLOSSARY/);

      if (dbEnMatch) dbEn = dbEnMatch[1].trim();
      if (dbIdMatch) dbId = dbIdMatch[1].trim();
      if (postEnMatch) postEn = postEnMatch[1].trim();
      if (postIdMatch) postId = postIdMatch[1].trim();
    }

    // Write primary Event Post to 03-Ready/
    const sourcesSection = sources.length > 0
      ? sources.map(src => `- [${src.title}](${src.url})`).join('\n')
      : '- No online sources found / Local curation used.';
      
    let finalMainContent = '';
    if (isMorningBrief) {
      finalMainContent = `${frontmatterStr}
# Fact-Checking & Research Brief
${researchBrief}

# Sources
${sourcesSection}

# Final Post


# Generated Drafts

${drafts}
`;
    } else {
      finalMainContent = `${frontmatterStr}
# Fact-Checking & Research Brief
${researchBrief}

# Sources
${sourcesSection}

# Final Post


# Generated Drafts

${cleanDrafts}

---
# Original Source (X)
**From:** @${frontmatter.handle || 'unknown'}  
**Link:** [Open on X](${frontmatter.url || '#'})  

> [!quote]
> ${tweetText.replace(/\n/g, '\n> ')}
`;
    }
    fs.writeFileSync(readyPath, finalMainContent, 'utf8');

    // Save glossary databases and posts if generated
    if (glossaryData && dbEn && dbId) {
      const category = glossaryData.category;
      const glossaryBase = path.join(PIPELINE_BASE, '06-Glossaries');
      
      // Update English database
      const fileEnPath = path.join(glossaryBase, `Glossary-${category}-EN.md`);
      appendGlossaryAlphabetically(fileEnPath, dbEn);
      
      // Update Indonesian database
      const fileIdPath = path.join(glossaryBase, `Glossary-${category}-ID.md`);
      appendGlossaryAlphabetically(fileIdPath, dbId);
      
      // Save Clean X Posts to 03-Ready/00-Glossary-Drafts/
      const baseName = filename.replace('.md', '');
      const glossaryDraftsDir = path.join(paths.ready, '00-Glossary-Drafts');
      if (!fs.existsSync(glossaryDraftsDir)) {
        fs.mkdirSync(glossaryDraftsDir, { recursive: true });
      }
      
      if (postEn) {
        const glossaryReadyPathEn = path.join(glossaryDraftsDir, `Glossary-EN-${baseName}.md`);
        const glossaryReadyContentEn = `---
type: X - Glossary Post
status: ready
category: ${category}
term_1: "${glossaryData.term1}"
term_2: "${glossaryData.term2}"
lang: en
generated_at: ${new Date().toISOString()}
---

# Final Post


# Generated Drafts

${postEn}
`;
        fs.writeFileSync(glossaryReadyPathEn, glossaryReadyContentEn, 'utf-8');
        console.log(`Saved English X Glossary Post: 03-Ready/00-Glossary-Drafts/Glossary-EN-${baseName}.md`);
      }

      if (postId) {
        const glossaryReadyPathId = path.join(glossaryDraftsDir, `Glossary-ID-${baseName}.md`);
        const glossaryReadyContentId = `---
type: X - Glossary Post
status: ready
category: ${category}
term_1: "${glossaryData.term1}"
term_2: "${glossaryData.term2}"
lang: id
generated_at: ${new Date().toISOString()}
---

# Final Post


# Generated Drafts

${postId}
`;
        fs.writeFileSync(glossaryReadyPathId, glossaryReadyContentId, 'utf-8');
        console.log(`Saved Indonesian X Glossary Post: 03-Ready/00-Glossary-Drafts/Glossary-ID-${baseName}.md`);
      }
    }

    fs.unlinkSync(researchingPath); // Remove the lock file from 02-Researching

    console.log(`Success: File saved to 03-Ready/${filename}`);
    writeStatus('OK');
  } catch (err) {
    console.error(`Error during processing ${filename}:`, err);
    writeStatus('ERROR', `Error processing ${filename}: ${err.message}`);
    // Restore file to 01-Inbox so it can be retried
    if (fs.existsSync(researchingPath) && !fs.existsSync(inboxPath)) {
      try {
        fs.renameSync(researchingPath, inboxPath);
        console.log(`Restored ${filename} to 01-Inbox due to failure.`);
      } catch (restoreErr) {
        console.error(`Failed to restore file ${filename}:`, restoreErr.message);
      }
    }
  }
}

// Process an approved How-To idea pitch
async function processApprovedPitch(pitchPath, pitchContent, styleGuideContent) {
  writeStatus('STANDBY', 'Processing approved How-To idea pitch...');

  try {
    const parsed = parseMarkdown(pitchContent);
    const fm = parsed.frontmatter;
    const niche = fm.niche || 'AI Dev';
    const lang = (fm.lang || 'en').toLowerCase();
    const targetLangStr = lang === 'id' ? 'Indonesian language (use natural technical Indonesian mixed with modern developer terms, similar to Jakarta tech slang style where appropriate)' : 'English language';

    console.log(`Step 1: Expanding pitch into full How-To drafts (Target Language: ${targetLangStr})...`);
    const howToStylePath = path.join(path.dirname(STYLE_GUIDE_PATH), 'how_to_style_guide.md');
    let howToStyleInstructions = '';
    if (fs.existsSync(howToStylePath)) {
      howToStyleInstructions = fs.readFileSync(howToStylePath, 'utf8');
    }

    const draftingPromptStr = `
Please write a complete, high-quality, professional "How-To" guide based on the following approved Idea Pitch:

Approved Idea Pitch:
${pitchContent}

Formatting & Style Instructions:
${howToStyleInstructions}

You MUST follow the prompt guidelines in the instructions. Output the teaser tweet under "### DRAFT_TWEET" and the full long-form article under "### DRAFT_ARTICLE". You MUST write both the tweet and the article drafts in ${targetLangStr}.
`;

    const systemInstruction = `
You are a premium social media ghostwriter and technical documentation writer.
Your job is to expand the provided idea pitch into a viral teaser tweet and a highly readable, educational native X Article.
Write in a smart, peer-to-peer, action-focused voice. Follow the provided Style Guide instructions strictly. You MUST draft the final output in ${targetLangStr}.
`;

    const activeModel = resolveDraftModel();
    const generatedDrafts = await callDraftingModel(draftingPromptStr, systemInstruction, activeModel);

    // Save to 03-Ready/
    const topicTitle = pitchContent.match(/# 💡 Proposed "How-To" Topic:\s*(.*)/)?.[1] || 'How-To Guide';
    const slug = topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const readyFileName = `how-to-${slug}.md`;
    const howToDraftsDir = path.join(paths.ready, '01-How-To-Drafts');
    if (!fs.existsSync(howToDraftsDir)) {
      fs.mkdirSync(howToDraftsDir, { recursive: true });
    }
    const readyPath = path.join(howToDraftsDir, readyFileName);

    // Format final markdown file for Obsidian dashboard
    const outputFrontmatter = {
      type: 'X - How-To Guide',
      niche: niche,
      status: 'ready',
      lang: lang,
      generated_at: new Date().toISOString()
    };

    let frontmatterStr = '---\n';
    for (const [k, v] of Object.entries(outputFrontmatter)) {
      frontmatterStr += `${k}: ${v}\n`;
    }
    frontmatterStr += '---\n\n';

    // Extract original link from pitch
    const originLinkMatch = pitchContent.match(/- \*\*Origin Link\*\*:\s*(.*)/);
    const originLink = originLinkMatch ? originLinkMatch[1].trim() : '#';

    const pitchFileName = path.basename(pitchPath);
    const finalContent = `${frontmatterStr}# Fact-Checking & Research Brief
Refer to original pitch details inside 05-Archive/how-to/${pitchFileName}.

# Sources
- Origin: ${originLink}

# Final Post


# Generated Drafts

${generatedDrafts}
`;

    fs.writeFileSync(readyPath, finalContent, 'utf8');
    console.log(`Saved completed How-To guide to: 03-Ready/01-How-To-Drafts/${readyFileName}`);

    // Update the pitch note status to "processed" and move it to 05-Archive/how-to/
    const archiveHowToDir = path.join(PIPELINE_BASE, '05-Archive', 'how-to');
    if (!fs.existsSync(archiveHowToDir)) {
      fs.mkdirSync(archiveHowToDir, { recursive: true });
    }
    const archivePitchPath = path.join(archiveHowToDir, pitchFileName);
    const updatedPitchContent = pitchContent.replace('status: approved', 'status: processed');
    fs.writeFileSync(pitchPath, updatedPitchContent, 'utf8');
    fs.renameSync(pitchPath, archivePitchPath);
    console.log(`Moved processed pitch to: 05-Archive/how-to/${pitchFileName}`);

    writeStatus('OK');
  } catch (err) {
    console.error('Error during processing approved pitch:', err);
    writeStatus('ERROR', `Error processing pitch: ${err.message}`);
  }
}

// Strategic Post Wireframe Drafter — Phase 5.1
// Planner → Researcher → Drafter ping-pong pipeline
async function processStrategicPost(filename, styleGuideContent) {
  const inboxPath = path.join(paths.inbox, filename);
  const researchingPath = path.join(paths.researching, filename);
  const strategicDraftsDir = path.join(paths.ready, '00-Strategic-Drafts');
  const STYLE_BANK_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/lulua-pipeline/01-Style-Bank';
  const STYLE_INDEX_PATH = path.join(STYLE_BANK_DIR, 'style-index.md');

  console.log(`\n----------------------------------------`);
  console.log(`[Strategic Post] Processing: ${filename}`);

  try {
    fs.renameSync(inboxPath, researchingPath);
  } catch (err) {
    console.error(`Failed to lock ${filename}:`, err.message);
    return;
  }

  try {
    const rawContent = fs.readFileSync(researchingPath, 'utf8');
    const { frontmatter, body } = parseMarkdown(rawContent);
    const lang = (frontmatter.lang || 'id').toLowerCase();
    const coreTopic = frontmatter.core_topic || '';
    const contextSnippet = frontmatter.context_snippet || body.trim().slice(0, 500);
    const sourceUrl = frontmatter.source_url || '';
    const funnelStage = frontmatter.funnel_stage || 'TOFU';
    const persona = frontmatter.persona || '';
    const customStyles = frontmatter.custom_styles || '';

    if (!coreTopic) {
      console.error('[Strategic Post] Missing core_topic in frontmatter. Aborting.');
      fs.renameSync(researchingPath, inboxPath);
      return;
    }

    // Ensure output dir
    if (!fs.existsSync(strategicDraftsDir)) {
      fs.mkdirSync(strategicDraftsDir, { recursive: true });
    }

    const draftModel = resolveDraftModel();
    const researchModel = process.env.GEMINI_RESEARCH_MODEL || 'gemini-2.5-flash';

    // === STEP 1: Style Selection ===
    console.log(`[Step 1/5] Selecting top 4 wireframe styles...`);
    let selectedStyles = [];

    const customList = customStyles ? customStyles.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (customList.length >= 4) {
      selectedStyles = customList.slice(0, 4);
      console.log(`  Using custom styles: ${selectedStyles.join(', ')}`);
    } else {
      const styleIndexContent = fs.existsSync(STYLE_INDEX_PATH)
        ? fs.readFileSync(STYLE_INDEX_PATH, 'utf8')
        : 'No style index available.';

      const lockedStyles = customList.length > 0 ? customList : null;

      // Read published history log for per-platform style cooldown (X platform only)
      const HISTORY_LOG_PATH = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/topic_history_log.json';
      let excludedStyles = null;
      if (fs.existsSync(HISTORY_LOG_PATH)) {
        try {
          const history = JSON.parse(fs.readFileSync(HISTORY_LOG_PATH, 'utf8'));
          const xPosts = history.filter(e => e.platform === 'X' && e.style).slice(-10);
          const excludeFilenames = xPosts.map(e => e.style).filter(Boolean);
          if (excludeFilenames.length > 0) {
            excludedStyles = excludeFilenames;
            console.log(`  Cooldown: excluding ${excludedStyles.length} recently published X styles.`);
          }
        } catch (e) {
          console.warn('  Could not read history log for style cooldown:', e.message);
        }
      }

      const selSystem = getStyleSelectionSystemInstruction(lockedStyles, excludedStyles);
      const selPrompt = getStyleSelectionPromptStr(coreTopic, contextSnippet, funnelStage, persona, styleIndexContent, lockedStyles, excludedStyles);
      const selResult = await callDraftingModel(selPrompt, selSystem, draftModel);

      try {
        const selJson = JSON.parse((selResult || '').replace(/```json|```/g, '').trim());
        selectedStyles = selJson.selected_styles || [];
        console.log(`  Selected: ${selectedStyles.join(', ')}`);
        if (selJson.reasoning) {
          selJson.reasoning.forEach((r, i) => console.log(`    ${i + 1}. ${r}`));
        }
      } catch (e) {
        console.warn('  Style selection JSON parse failed, using first 4 from index.');
        const lines = styleIndexContent.split('\n').filter(l => l.includes('[[style-'));
        selectedStyles = lines.slice(0, 4).map(l => {
          const m = l.match(/\[\[(style-[^\]]+)\]\]/);
          return m ? m[1] : '';
        }).filter(Boolean);
      }

      // Inject locked styles and deduplicate
      if (lockedStyles) {
        const deduped = [];
        for (const s of [...lockedStyles, ...selectedStyles]) {
          if (!deduped.includes(s)) deduped.push(s);
        }
        selectedStyles = deduped.slice(0, 4);
        console.log(`  Final (locked + auto): ${selectedStyles.join(', ')}`);
      }
    }

    if (selectedStyles.length === 0) {
      console.error('[Strategic Post] No styles selected. Aborting.');
      fs.renameSync(researchingPath, inboxPath);
      return;
    }

    // === STEP 2: Read selected style files & extract Part 3 blueprints ===
    console.log(`[Step 2/5] Reading ${selectedStyles.length} wireframe blueprints...`);
    const wireframeBlueprints = [];
    for (const styleFile of selectedStyles.slice(0, 4)) {
      const filePath = path.join(STYLE_BANK_DIR, `${styleFile}.md`);
      if (!fs.existsSync(filePath)) {
        console.warn(`  Style file not found: ${styleFile}.md — skipping.`);
        continue;
      }
      const styleContent = fs.readFileSync(filePath, 'utf8');
      const bpMatch = styleContent.match(/## Part 3:[\s\S]+/);
      const blueprintText = bpMatch ? bpMatch[0].trim() : styleContent;
      const nameMatch = styleContent.match(/style_name:\s*["']?([^"'\n]+)["']?/);
      wireframeBlueprints.push({
        template_name: nameMatch ? nameMatch[1] : styleFile,
        blueprint_text: blueprintText,
        filename: styleFile
      });
      console.log(`  Loaded: ${styleFile}`);
    }

    if (wireframeBlueprints.length === 0) {
      console.error('[Strategic Post] No valid wireframes loaded. Aborting.');
      fs.renameSync(researchingPath, inboxPath);
      return;
    }

    // === STEP 3: Planner — skeleton + research shopping list ===
    console.log(`[Step 3/5] Planner generating skeleton & research shopping list...`);
    const inputPayload = {
      topic_id: coreTopic.replace(/[^a-z0-9]+/g, '_').slice(0, 40),
      core_topic: coreTopic,
      context_snippet: contextSnippet,
      source_url: sourceUrl,
      funnel_stage: funnelStage,
      persona: persona
    };

    let plannerResult;
    let falsePremiseFeedback = null;
    const MAX_PINGPONG = 2;

    for (let pingpong = 0; pingpong < MAX_PINGPONG; pingpong++) {
      const bpForPlanner = wireframeBlueprints.length > 0
        ? wireframeBlueprints[0]
        : { blueprint_text: 'Generic multi-phase elastic blueprint.' };

      const plannerSystem = getPlannerSystemInstruction();
      const plannerPrompt = getPlannerPromptStr(inputPayload, bpForPlanner, falsePremiseFeedback);
      plannerResult = await callDraftingModel(plannerPrompt, plannerSystem, draftModel);

      // Extract research shopping list from planner JSON
      let researchList = [];
      try {
        const plannerJson = JSON.parse((plannerResult || '').replace(/```json|```/g, '').trim());
        researchList = plannerJson.research_shopping_list || [];
        if (!falsePremiseFeedback) {
          console.log(`  Skeleton: ${plannerJson.planned_post_count || '?'} posts planned.`);
        }
      } catch (e) {
        researchList = [];
      }

      if (researchList.length === 0) {
        console.log(`  No research items needed. Skipping research phase.`);
        break;
      }

      // === STEP 4: Researcher — verify facts ===
      console.log(`[Step 4/5] Researcher verifying facts (${researchList.length} items)...`);
      const researchItemsStr = researchList.map((item, i) =>
        `${i + 1}. DATA WANTED: ${item.data_wanted}\n   INTENT: ${item.intent || 'Fact verification'}`
      ).join('\n\n');

      const researchPrompt = `
You are a fact-checking research agent. Verify the following data requests using web search.

RESEARCH SHOPPING LIST:
${researchItemsStr}

For each item, return:
- STATUS: [VERIFIED / PARTIAL / FALSE_PREMISE]
- FINDINGS: What you found (with specific numbers if available)
- SOURCE: Direct URL to the source

If any item's premise is fundamentally wrong (FALSE_PREMISE), explain the correct ground truth.
`;
      const researchResult = await callGemini(researchPrompt,
        'You are a fact-verification agent. Search the web and return verified findings. Use FALSE_PREMISE only when the underlying assumption is wrong.',
        true, researchModel);
      const researchBrief = researchResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Check for false premises
      if (researchBrief.includes('FALSE_PREMISE')) {
        console.log(`  ⚠️ False premise detected! Re-planning (ping-pong ${pingpong + 1}/${MAX_PINGPONG})...`);
        falsePremiseFeedback = {
          research_findings: researchBrief,
          instruction: 'Update your skeleton to reflect the true ground truth above.'
        };
        continue;
      }

      falsePremiseFeedback = researchBrief;
      break;
    }

    const finalResearchBrief = typeof falsePremiseFeedback === 'string'
      ? falsePremiseFeedback
      : (falsePremiseFeedback?.research_findings || 'No research data required.');

    // === STEP 5: Drafter — generate 4 drafts ===
    console.log(`[Step 5/5] Drafter generating ${wireframeBlueprints.length} draft variations...`);
    const drafterSystem = getWireframeSystemInstruction(styleGuideContent, lang);
    const drafterPrompt = getWireframeDraftPromptStr(inputPayload, wireframeBlueprints, finalResearchBrief, lang);
    const drafts = await callDraftingModel(drafterPrompt, drafterSystem, draftModel);

    // Save output
    const topicSlug = coreTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
    const dateStr = new Date().toISOString().split('T')[0];
    const outputFilename = `${dateStr}-strategic-${topicSlug}.md`;
    const outputPath = path.join(strategicDraftsDir, outputFilename);

    const selectedStylesStr = selectedStyles.slice(0, 4).map(s => `  - [[${s}]]`).join('\n');
    const outputFrontmatter = `---
type: Strategic Post
status: ready
core_topic: "${coreTopic}"
funnel_stage: ${funnelStage}
persona: ${persona || 'auto'}
lang: ${lang}
selected_styles:
${selectedStylesStr}
generated_at: ${new Date().toISOString()}
---

# Research Brief

${finalResearchBrief}

# Generated Drafts

${drafts}
`;

    fs.writeFileSync(outputPath, outputFrontmatter, 'utf8');
    console.log(`[Strategic Post] Saved: ${outputPath}`);

    // Cleanup & regenerate template
    if (fs.existsSync(researchingPath)) {
      fs.unlinkSync(researchingPath);
    }

    const blankTemplate = `---
type: Strategic Post
status: draft
core_topic: ""
context_snippet: ""
source_url: ""
target_metric: ""
primary_lever: ""
funnel_stage: ""
lang: "id"
persona: ""
custom_styles: ""
---

# Strategic Post Briefing

## 🎯 Core Topic & Angle
<!-- What is the post about? What narrative angle? -->

## 📌 Context & Key Points
<!-- Supporting context, data points, product links, source references -->

## 🎨 Style Preferences (Optional)
<!-- Leave empty for auto-selection. Or specify up to 4 style filenames from style-index.md -->
`;
    fs.writeFileSync(inboxPath, blankTemplate);
    console.log(`[Strategic Post] Re-created clean template in 01-Inbox/00-Strategic-Inputs/.`);
    writeStatus('OK');

  } catch (err) {
    console.error(`[Strategic Post] Error:`, err);
    writeStatus('ERROR', `Strategic post error: ${err.message}`);
    if (fs.existsSync(researchingPath) && !fs.existsSync(inboxPath)) {
      try {
        fs.renameSync(researchingPath, inboxPath);
      } catch (e) {}
    }
  }
}

// Helper to check if DeepSeek peak pricing is active in Singapore Time (SGT)
// Morning Peak: 9:00 AM – 12:00 PM SGT. Buffer 10m before & after: 8:50 AM – 12:10 PM SGT.
// Afternoon Peak: 2:00 PM – 6:00 PM SGT. Buffer 10m before & after: 1:50 PM – 6:10 PM SGT.
function isDeepSeekPeakPricing() {
  const sgtTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
  const sgtDate = new Date(sgtTime);
  const hours = sgtDate.getHours();
  const minutes = sgtDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Morning Peak: 8:50 AM (530) to 12:10 PM (730)
  const isMorningPeak = (timeInMinutes >= 530 && timeInMinutes < 730);

  // Afternoon Peak: 1:50 PM (830) to 6:10 PM (1090)
  const isAfternoonPeak = (timeInMinutes >= 830 && timeInMinutes < 1090);

  return isMorningPeak || isAfternoonPeak;
}

// Helper to resolve the active drafting model name dynamically
// Falls back to Gemini during DeepSeek peak pricing hours to avoid double billing.
function resolveDraftModel() {
  const configuredModel = process.env.GEMINI_DRAFT_MODEL || 'deepseek-v4-pro';
  if (configuredModel.toLowerCase().includes('deepseek') && isDeepSeekPeakPricing()) {
    const fallbackModel = process.env.GEMINI_FALLBACK_DRAFT_MODEL || 'deepseek-v4-pro';
    const sgtTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
    console.log(`[Peak Pricing Routing] SGT Peak Pricing is active. Routing draft to fallback model: ${fallbackModel} (Current SGT: ${sgtTime})`);
    return fallbackModel;
  }
  return configuredModel;
}

// Ensure _NEW_VIDEO_INPUT.md exists in 01-Inbox/00-Video-Inputs/
function ensureVideoInputTemplate() {
  const templatePath = path.join(paths.videoInputsDir, '_NEW_VIDEO_INPUT.md');
  if (!fs.existsSync(templatePath)) {
    const templateContent = `---
type: Video - Topic Input
status: draft
mode: manual # manual | auto
topic: ""
angles:
  - ""
  - ""
  - ""
niche_focus: all # macro | crypto | ai | ai_productivity | all
lang: id # id (Indonesian, default) | en (English)
---

# 📝 Raw Notes & Links (Optional)
<!-- Paste any links, tweets, chart references, or raw notes here. The agent will read these as primary context. -->
`;
    fs.writeFileSync(templatePath, templateContent, 'utf8');
    console.log('[Video Skeleton] Auto-created template: 01-Inbox/00-Video-Inputs/_NEW_VIDEO_INPUT.md');
  }
}

// Check for and archive completed video skeletons in 03-Ready/00-Video-Skeletons/ with status: done
function archiveFinishedVideoSkeletons() {
  try {
    if (!fs.existsSync(paths.videoSkeletonsDir)) return;
    const files = fs.readdirSync(paths.videoSkeletonsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(paths.videoSkeletonsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter } = parseMarkdown(content);
      if (frontmatter.status === 'done') {
        const destPath = path.join(paths.videoArchiveDir, file);
        fs.renameSync(filePath, destPath);
        console.log(`[Video Skeleton] Archived completed skeleton to: 05-Archive/video-skeletons/${file}`);
      }
    }
  } catch (err) {
    console.error('[Video Skeleton] Error archiving finished skeletons:', err.message);
  }
}

// Link Extractor Helper: Collects explicit markdown links and Google Grounding URLs
function extractSourceLinks(text, groundingObj) {
  const links = new Map();

  // 1. Extract markdown links [Title](URL)
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();
    if (url && !url.includes('example.com') && !links.has(url)) {
      links.set(url, title);
    }
  }

  // 2. Extract groundingMetadata chunks if available
  const chunks = groundingObj?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        const uri = chunk.web.uri.trim();
        const title = chunk.web.title?.trim() || 'Source Link';
        if (uri && !links.has(uri)) {
          links.set(uri, title);
        }
      }
    }
  }

  return links;
}

// Helper to check if a URL returns 2xx/3xx HTTP status (HEAD/GET request with 2.5s timeout)
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
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else if (res.statusCode === 404 || res.statusCode >= 500) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  } catch {
    return false;
  }
}

// Layer 3: Programmatic 404 Verifier & Fallback Cleaner
async function verifyAndCleanMarkdownContent(content) {
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  const foundUrls = new Set();
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    foundUrls.add(match[2].trim());
  }

  if (foundUrls.size === 0) return content;

  console.log(`[Link Verifier] Verifying ${foundUrls.size} unique URLs...`);
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
      console.log(`[Link Verifier] Invalid 404 URL detected: ${url}`);
      try {
        const parsed = new URL(url);
        const domainRoot = `${parsed.protocol}//${parsed.hostname}`;
        const isRootValid = await verifyUrl(domainRoot);
        if (isRootValid) {
          console.log(`[Link Verifier] Replacing 404 URL ${url} with domain root: ${domainRoot}`);
          cleanedContent = cleanedContent.replaceAll(url, domainRoot);
        } else {
          console.log(`[Link Verifier] Stripping broken link wrapper for: ${url}`);
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

// 4-Step Ping-Pong Processor for Video Skeletons
async function processVideoInput(inputFilePath) {
  const filename = path.basename(inputFilePath);
  const lockFileName = `${Date.now()}-video-${filename.replace(/[^a-z0-9.]+/gi, '-')}`;
  const researchingPath = path.join(paths.researching, lockFileName);

  console.log(`\n----------------------------------------`);
  console.log(`[Video Skeleton] Processing input: ${filename}`);

  // Lock file
  try {
    fs.renameSync(inputFilePath, researchingPath);
  } catch (err) {
    console.error(`Failed to lock video input ${filename}:`, err.message);
    return;
  }

  // Immediately regenerate template in Inbox so user doesn't wait
  ensureVideoInputTemplate();

  try {
    const rawContent = fs.readFileSync(researchingPath, 'utf8');
    const { frontmatter, body } = parseMarkdown(rawContent);
    const mode = frontmatter.mode || 'manual';
    const topic = frontmatter.topic || '';
    const angles = Array.isArray(frontmatter.angles) ? frontmatter.angles.filter(a => a && a.trim() !== '') : [];
    const nicheFocus = frontmatter.niche_focus || 'macro';
    const lang = (frontmatter.lang || 'id').toLowerCase();
    const rawNotes = body.trim();

    const styleGuideContent = lang === 'id' ? fs.readFileSync(paths.styleGuide, 'utf8') : '';

    const researchModel = process.env.GEMINI_RESEARCH_MODEL || 'gemini-3.1-flash-lite';
    const draftModel = resolveDraftModel();

    // MODE: AUTO (Topic Discovery Digest Mode)
    if (mode === 'auto') {
      console.log(`[Video Discovery] Mode: AUTO triggered (Niche Focus: ${nicheFocus})`);

      const isAiProductivity = (nicheFocus === 'ai_productivity');
      const isAllNiches = (!isAiProductivity && (nicheFocus === 'all' || !nicheFocus || nicheFocus === 'auto'));
      const targetCount = isAllNiches ? 30 : 10;

      // ── Shared AI Productivity prompt (used by both dedicated 'ai_productivity' mode and 'all' mode append) ──
      const aiProdSystemInstruction = `
You are a senior content strategist specializing in AI productivity and practical tech adoption.
Your task is to discover the top trending practical AI use cases, productivity tools, and workflow hacks that are going viral among small business owners, solopreneurs, and individual operators.

SEARCH METHODOLOGY:
1. Search YouTube for viral AI productivity tool demos, workflow tutorials, and "how I use AI for my business" videos from the past 7 days.
2. Search Reddit (r/smallbusiness, r/Entrepreneur, r/productivity, r/ChatGPT, r/ClaudeAI, r/LocalLLaMA) for highly-upvoted threads about AI tools saving time/money, concrete use cases, and real-world results.
3. Search Google News for newly launched AI tools, major feature updates to existing tools, and case studies of non-tech businesses adopting AI.
4. OUTLIER FILTER: prioritize topics with 2x-5x higher engagement than typical content in these communities. A YouTube video with 50K views about an Excel AI hack is more valuable than a 10K-view GPU benchmark.
5. PRESERVE THE USE CASE: If a video title is generic (e.g. "You're using ChatGPT wrong"), extract the specific workflow or tool that made it go viral.
6. DISCARD: purely technical AI research paper summaries, GPU hardware reviews, AI model benchmark comparisons, and enterprise "press release" announcements with no practical user takeaway.

FORMATTING REQUIREMENTS:
- Output exactly 10 topics.
- For EVERY topic, provide:
  - Title: Clear, benefit-driven headline written for a small business owner (e.g. "How a bakery owner uses ChatGPT to write 30 Instagram captions in 10 minutes").
  - Summary: Maximum 3 sentences: (1) the specific tool/workflow, (2) the time or money saved, (3) the skill level needed (no-code, low-code, simple prompting).
  - Origin Link: Direct URL to the YouTube video, Reddit thread, or news article [Source Title](URL).
  - Outlier Proof: Engagement metric (views, upvotes) demonstrating viral breakout.
`;

      const aiProdPromptStr = `
Perform the viral AI productivity topic scan and output the Top 10 Trending AI Productivity Topics.

SEARCH FOCUS:
- Practical AI use cases for small business owners, solopreneurs, and individual operators
- Tools: ChatGPT, Claude, Perplexity, Make.com, Notion AI, and new AI productivity launches
- Workflows: content creation, data analysis, customer communication, automation, research
- Language: English (primary) and Indonesian (secondary — viral content from Indonesian creators)

Please format your response strictly using this Markdown structure:

# 🛠️ Trending AI Productivity Topics (Top 10)

### 1. [Topic Title]
- **Summary:** [Max 3 sentence explainer: tool + time/money saved + skill level]
- **Origin Link:** [Source Name](URL)
- **Outlier Proof:** [Engagement metric proving viral breakout]

(Repeat for topics 2 to 10)
`;

      if (isAiProductivity) {
        // ── AI Productivity Niche (practical use cases, tools, workflows) ──
        console.log(`[Video Discovery] AI Productivity mode: scanning for viral practical AI use cases...`);

        const aiProdResult = await callGemini(aiProdPromptStr, aiProdSystemInstruction, true, researchModel);
        const rawAiProdContent = aiProdResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const verifiedAiProdContent = await verifyAndCleanMarkdownContent(rawAiProdContent);

        const dateStr = new Date().toISOString().split('T')[0];
        const outputFilename = `${dateStr}-video-topics-ai-productivity.md`;
        const outputPath = path.join(paths.videoSkeletonsDir, outputFilename);

        const outputFrontmatter = `---
type: Video - Topic Menu
status: ready
mode: auto
niche_focus: ai_productivity
created_at: ${dateStr}
---

`;

        fs.writeFileSync(outputPath, outputFrontmatter + verifiedAiProdContent, 'utf8');
        console.log(`[Video Discovery] Saved AI Productivity Topics Digest to: 03-Ready/00-Video-Skeletons/${outputFilename}`);

        if (fs.existsSync(researchingPath)) {
          fs.unlinkSync(researchingPath);
        }

        writeStatus('OK');
        return;
      }

      // ── Standard News Niche (Macro, Crypto, AI, All) ──
      console.log(`[Video Discovery] Performing 2-step baseline outlier scan for Top ${targetCount} trending topics...`);

      const sourcingConfigPath = path.join(__dirname, 'video_sourcing_config.md');
      let sourcingConfigContent = '';
      if (fs.existsSync(sourcingConfigPath)) {
        sourcingConfigContent = fs.readFileSync(sourcingConfigPath, 'utf8');
      }

      const autoSystemInstruction = `
You are a senior video producer and growth content strategist.
Your task is to identify the top trending video/news topics using the baseline anchor configuration provided.

SEARCH METHODOLOGY:
1. Query the competitor anchor channels listed in the configuration to establish normal baseline view counts for each niche (Macro, Crypto, AI).
2. Search across ALL of YouTube, Reddit (r/Economics, r/wallstreetbets, r/cryptocurrency, r/defi, r/LocalLLaMA, r/Singularity), and Google News for recent (under 7 days old) breaking news topics and video catalysts.
3. Calculate Outlier Metrics: Filter for topics/videos that represent significant engagement outliers (2x-5x higher views/discussion than standard channel baselines).
4. CLICKBAIT & CHAPTER RESOLUTION: If a YouTube video title is generic or clickbait (e.g. "THIS CHANGES EVERYTHING"), inspect the video description, chapter timestamps, top comments, and grounding snippets to extract the concrete underlying news catalyst.
5. SARCASM FILTER: Discard joke or sarcastic comments. Only select topics backed by real financial/tech news groundings.

FORMATTING REQUIREMENTS:
- If niche is 'all': Output Top 10 Macro topics, Top 10 Crypto topics, and Top 10 AI topics (Total 30 topics).
- If niche is specific ('macro', 'crypto', or 'ai'): Output Top 10 topics for that specific niche.
- For EVERY topic item, provide:
  - Title: Crisp, clear headline of the breaking catalyst.
  - Summary: Maximum 3 sentences explaining the core news event and market impact.
  - Origin Link: Direct URL link to the YouTube video, Reddit thread, or primary news article [Source Title](URL).
  - Outlier Proof: View count / upvote metric demonstrating why it is a 2x-5x breakout outlier vs the baseline anchors.
`;	  

      const autoPromptStr = `
Perform the 2-step outlier discovery scan and output the Top ${targetCount} Trending Video Topics.

Niche Focus: ${isAllNiches ? 'ALL NICHES (Macro, Crypto, AI)' : nicheFocus}
Sourcing Baseline Anchors Configuration:
${sourcingConfigContent}

Please format your response strictly using this Markdown structure:

# 📰 Trending Video Topics Digest (${isAllNiches ? 'Master 30 Topics' : 'Top 10 Topics - ' + nicheFocus})

${isAllNiches ? `
## 📊 Macro & Global Economy (Top 10)
### 1. [Topic Title]
- **Summary:** [Max 3 sentence explainer]
- **Origin Link:** [Source Name](URL)
- **Outlier Proof:** [Metrics proving 2x-5x baseline performance]

(Repeat for Macro topics 2 to 10)

## 🪙 Crypto & Web3 News (Top 10)
### 1. [Topic Title]
- **Summary:** [Max 3 sentence explainer]
- **Origin Link:** [Source Name](URL)
- **Outlier Proof:** [Metrics proving 2x-5x baseline performance]

(Repeat for Crypto topics 2 to 10)

## 🤖 AI & Tech News (Top 10)
### 1. [Topic Title]
- **Summary:** [Max 3 sentence explainer]
- **Origin Link:** [Source Name](URL)
- **Outlier Proof:** [Metrics proving 2x-5x baseline performance]

(Repeat for AI topics 2 to 10)
` : `
## ${nicheFocus.toUpperCase()} (Top 10)
### 1. [Topic Title]
- **Summary:** [Max 3 sentence explainer]
- **Origin Link:** [Source Name](URL)
- **Outlier Proof:** [Metrics proving 2x-5x baseline performance]

(Repeat for topics 2 to 10)
`}
`;

      const autoResult = await callGemini(autoPromptStr, autoSystemInstruction, true, researchModel);
      const rawAutoContent = autoResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Layer 3 404 URL verifier
      const verifiedAutoContent = await verifyAndCleanMarkdownContent(rawAutoContent);

      const dateStr = new Date().toISOString().split('T')[0];
      const outputFilename = `${dateStr}-video-topics-${isAllNiches ? 'all' : nicheFocus}.md`;
      const outputPath = path.join(paths.videoSkeletonsDir, outputFilename);

      const outputFrontmatter = `---
type: Video - Topic Menu
status: ready
mode: auto
niche_focus: ${nicheFocus}
created_at: ${dateStr}
---

`;

      fs.writeFileSync(outputPath, outputFrontmatter + verifiedAutoContent, 'utf8');
      console.log(`[Video Discovery] Saved completed Top Topics Digest to: 03-Ready/00-Video-Skeletons/${outputFilename}`);

      // If 'all' mode, also run AI Productivity scan and append to the same file
      if (isAllNiches) {
        console.log(`[Video Discovery] Appending AI Productivity topics to 'all' digest...`);
        const aiProdResult = await callGemini(aiProdPromptStr, aiProdSystemInstruction, true, researchModel);
        const rawAiProdContent = aiProdResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const verifiedAiProdContent = await verifyAndCleanMarkdownContent(rawAiProdContent);

        const aiProdSection = `\n\n---\n\n# 🛠️ AI Productivity (Top 10)\n\n${verifiedAiProdContent}`;
        fs.appendFileSync(outputPath, aiProdSection, 'utf8');
        console.log(`[Video Discovery] AI Productivity section appended — digest now contains 40 topics.`);
      }

      if (fs.existsSync(researchingPath)) {
        fs.unlinkSync(researchingPath);
        console.log(`[Video Discovery] Deleted temporary researching file: ${lockFileName}`);
      }

      writeStatus('OK');
      return;
    }

    console.log(`[Video Skeleton] Executing 4-Step Ping-Pong Workflow...`);

    // STEP 1: Initial Research (Gemini 3.1 Flash-Lite + Google Search Grounding)
    console.log(`[Step 1/4] Gemini 3.1 Flash-Lite: Performing 1st-degree fact verification & raw metric search...`);
    const step1Prompt = `
You are a financial news researcher. Perform initial 1st-degree web search for the following video topic:
Topic: "${topic || 'Discover top story in ' + nicheFocus}"
User Notes: "${rawNotes}"

Output a clean, factual research brief:
1. Fact-check status: Is the claim true/false/context needed?
2. 1st-degree statistics, dates, figures, consensus forecasts.
3. Official website source links for all data points found [Source Name](URL).
`;
    const step1Result = await callGemini(step1Prompt, 'Provide fact-checked research brief with source URLs.', true, researchModel);
    const step1Brief = step1Result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const links1 = extractSourceLinks(step1Brief, step1Result);
    console.log(`[Step 1/4 Completed] 1st-degree research gathered (${links1.size} URLs extracted).`);

    // STEP 2: Angle Synthesis & 2nd-Degree Deep-Dive Items Request (DeepSeek-v4-pro)
    console.log(`[Step 2/4] DeepSeek-v4-pro: Formulating 5 angles & identifying required 2nd-degree deep-dive queries...`);
    const step2System = `You are a senior macro and AI Editor-in-Chief. Analyze the initial research and list specific 2nd-degree data points needed.`;
    const step2Prompt = `
Initial Research Brief:
${step1Brief}

User Inputs:
- Topic: ${topic}
- Custom Angles: ${JSON.stringify(angles)}

Tasks:
1. Formulate 5 distinct, high-impact video angles.
2. Identify 3 to 5 specific 2nd-degree deep-dive queries (e.g. underlying component breakdowns, manufacturing bottlenecks, unexpected facts) that are missing from the initial research and needed to support these angles.
3. List these search requests clearly with exact search keywords.
`;
    const step2Brief = await callDraftingModel(step2Prompt, step2System, draftModel);
    console.log(`[Step 2/4 Completed] 5 angles formulated & 2nd-degree search list created.`);

    // STEP 3: Targeted 2nd-Degree Research (Gemini 3.1 Flash-Lite + Google Search Grounding)
    console.log(`[Step 3/4] Gemini 3.1 Flash-Lite: Executing targeted 2nd-degree searches for deep-dive facts...`);
    const step3Prompt = `
Execute targeted Google Search calls for the following 2nd-degree search requests:

Search Requests:
${step2Brief}

Output:
For each requested search item, provide the exact verified facts, surprising metrics, and direct report/news links [Source Name](URL).
`;
    const step3Result = await callGemini(step3Prompt, 'Execute 2nd-degree searches and return high-signal facts with direct source URLs.', true, researchModel);
    const step3Brief = step3Result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const links3 = extractSourceLinks(step3Brief, step3Result);
    console.log(`[Step 3/4 Completed] 2nd-degree high-signal facts and links gathered (${links3.size} URLs extracted).`);

    // STEP 4: Final 6-Part Video Skeleton Generation (DeepSeek-v4-pro)
    console.log(`[Step 4/4] DeepSeek-v4-pro: Synthesizing final 6-part Video Research Skeleton...`);
    const step4System = getVideoSkeletonSystemInstruction(lang, styleGuideContent);
    const step4Prompt = getVideoSkeletonPromptStr(topic, angles, rawNotes, nicheFocus, mode, lang) + `

COMPLETION DATA:
--- 1ST DEGREE RESEARCH ---
${step1Brief}

--- 2ND DEGREE RESEARCH & HIGH-SIGNAL FACTS ---
${step3Brief}
`;
    const finalSkeletonContent = await callDraftingModel(step4Prompt, step4System, draftModel);

    // Layer 3: Verify & clean 404 links programmatically before saving
    console.log(`[Step 4/4] Running Layer 3 Programmatic 404 Link Verifier...`);
    const verifiedSkeletonContent = await verifyAndCleanMarkdownContent(finalSkeletonContent);

    // Save final output to 03-Ready/00-Video-Skeletons/
    const topicSlug = (topic || 'trending-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const outputFilename = `${dateStr}-video-${topicSlug}.md`;
    const outputPath = path.join(paths.videoSkeletonsDir, outputFilename);

    const outputFrontmatter = `---
type: Video - Skeleton
status: ready
mode: ${mode}
niche_focus: ${nicheFocus}
created_at: ${dateStr}
---

`;

    fs.writeFileSync(outputPath, outputFrontmatter + verifiedSkeletonContent, 'utf8');
    console.log(`[Video Skeleton] Saved completed skeleton to: 03-Ready/00-Video-Skeletons/${outputFilename}`);

    // Delete temporary lock file in 02-Researching/
    if (fs.existsSync(researchingPath)) {
      fs.unlinkSync(researchingPath);
      console.log(`[Video Skeleton] Deleted temporary researching file: ${lockFileName}`);
    }

    writeStatus('OK');
  } catch (err) {
    console.error(`[Video Skeleton] Error during processing video input:`, err);
    writeStatus('ERROR', `Video Skeleton error: ${err.message}`);
    if (fs.existsSync(researchingPath)) {
      try {
        const restorePath = path.join(paths.videoInputsDir, lockFileName);
        fs.renameSync(researchingPath, restorePath);
        console.log(`[Video Skeleton] Restored ${lockFileName} to 01-Inbox/00-Video-Inputs/ for retry.`);
      } catch (e) {
        console.error(`[Video Skeleton] Could not restore ${lockFileName}:`, e.message);
      }
    }
  }
}

// Main Loop / Process Orchestration
async function processInbox() {
  if (!fs.existsSync(paths.styleGuide)) {
    console.error(`Style guide not found at: ${paths.styleGuide}`);
    process.exit(1);
  }
  const styleGuideContent = fs.readFileSync(paths.styleGuide, 'utf8');

  // Check for Strategic Post input (Priority 1 overrides all)
  const strategicInputPath = path.join(paths.inbox, '00-Strategic-Inputs', '_NEW_STRATEGIC_INPUT.md');
  if (fs.existsSync(strategicInputPath)) {
    const stratContent = fs.readFileSync(strategicInputPath, 'utf8');
    const { frontmatter } = parseMarkdown(stratContent);
    if (frontmatter.status === 'ready' && frontmatter.type === 'Strategic Post') {
      console.log(`\n----------------------------------------`);
      console.log(`[Strategic Post] Detected status: ready.`);
      await processStrategicPost('00-Strategic-Inputs/_NEW_STRATEGIC_INPUT.md', styleGuideContent);
      return;
    }
  }

  // Maintain template note in 01-Inbox/00-Video-Inputs/
  ensureVideoInputTemplate();

  // Archive any finished skeletons in 03-Ready/00-Video-Skeletons/ with status: done
  archiveFinishedVideoSkeletons();

  // Check if there are any ready Video Inputs in 01-Inbox/00-Video-Inputs/
  try {
    if (fs.existsSync(paths.videoInputsDir)) {
      const vFiles = fs.readdirSync(paths.videoInputsDir).filter(f => f.endsWith('.md'));
      for (const file of vFiles) {
        const vPath = path.join(paths.videoInputsDir, file);
        const content = fs.readFileSync(vPath, 'utf8');
        const { frontmatter } = parseMarkdown(content);
        if (frontmatter.status === 'ready' && (frontmatter.type === 'Video - Topic Input' || frontmatter.type === 'Video - Skeleton')) {
          console.log(`\n----------------------------------------`);
          console.log(`[Video Skeleton] Found ready input note: ${file}`);
          await processVideoInput(vPath);
          return;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading Video Inputs directory:`, err.message);
  }

  // Check if there are any approved or rejected How-To idea pitches to process in 01a-Idea-Pitches
  try {
    const pitchFiles = fs.readdirSync(paths.pitches);
    for (const file of pitchFiles) {
      if (file.endsWith('.md') && file.startsWith('pitch-')) {
        const pitchPath = path.join(paths.pitches, file);
        const pitchContent = fs.readFileSync(pitchPath, 'utf8');
        const fm = parseMarkdown(pitchContent).frontmatter;
        if (fm.status === 'approved' && fm.type === 'Idea Pitch') {
          const topicTitle = pitchContent.match(/# 💡 Proposed "How-To" Topic:\s*(.*)/)?.[1] || 'How-To Guide';
          console.log(`\n----------------------------------------`);
          console.log(`Processing Approved Idea Pitch: "${fm.niche} - ${topicTitle}"`);
          await processApprovedPitch(pitchPath, pitchContent, styleGuideContent);
          return;
        } else if (fm.status === 'rejected' && fm.type === 'Idea Pitch') {
          const topicTitle = pitchContent.match(/# 💡 Proposed "How-To" Topic:\s*(.*)/)?.[1] || 'How-To Guide';
          console.log(`\n----------------------------------------`);
          console.log(`Archiving Rejected Idea Pitch: "${fm.niche} - ${topicTitle}"`);
          
          const archiveRejectedDir = path.join(PIPELINE_BASE, '05-Archive', 'how-to', 'rejected');
          if (!fs.existsSync(archiveRejectedDir)) {
            fs.mkdirSync(archiveRejectedDir, { recursive: true });
          }
          const archivePath = path.join(archiveRejectedDir, file);
          fs.renameSync(pitchPath, archivePath);
          console.log(`Moved rejected pitch to: 05-Archive/how-to/rejected/${file}`);
          return;
        }
      }
    }
  } catch (err) {
    console.error(`Failed to read Pitches directory:`, err.message);
  }

  // Load and parse CLI arguments
  const args = process.argv.slice(2);
  let limit = 3;
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
  }

  // Get files in Inbox
  let files = [];
  try {
    files = fs.readdirSync(paths.inbox)
      .filter(f => f.endsWith('.md'))
      // Sort by creation time so we process the oldest first
      .map(name => ({
        name,
        time: fs.statSync(path.join(paths.inbox, name)).mtime.getTime()
      }))
      .sort((a, b) => a.time - b.time)
      .map(f => f.name);
  } catch (err) {
    console.error(`Failed to read Inbox directory:`, err.message);
    return;
  }

  if (files.length === 0) {
    console.log('No new files in 01-Inbox.');
    if (currentStatusState === 'STANDBY') {
      writeStatus('OK');
    }
    return;
  }

  console.log(`Found ${files.length} notes in 01-Inbox. Processing limit: ${limit}`);
  const toProcess = files.slice(0, limit);

  for (const file of toProcess) {
    await processFile(file, styleGuideContent);
  }
}

// Helper to update the 00-Status.md file in the Obsidian workspace
function writeStatus(status, errorMsg = null) {
  if (status === currentStatusState && errorMsg === currentErrorState) {
    return; // Avoid redundant status file updates
  }
  currentStatusState = status;
  currentErrorState = errorMsg;

  const now = new Date().toLocaleString();
  
  let content = `---\n`;
  content += `type: Pipeline Status\n`;
  content += `status: ${status}\n`;
  content += `last_checked: ${now}\n`;
  if (errorMsg) {
    content += `error: "${errorMsg.replace(/"/g, '\\"')}"\n`;
  }
  content += `---\n\n`;
  
  let statusEmoji = '🟢 OK';
  let statusText = 'Running smoothly, watching for new files.';
  if (status === 'STANDBY') {
    statusEmoji = '🟡 STANDBY';
    statusText = errorMsg || 'Paused during DeepSeek peak hours.';
  } else if (status === 'ERROR') {
    statusEmoji = '🔴 ERROR';
    statusText = 'Encountered an issue.';
  }

  content += `# X Pipeline Status: ${statusEmoji}\n\n`;
  content += `- **Last Checked**: ${now}\n`;
  content += `- **Status**: ${statusText}\n`;
  
  if (errorMsg && status !== 'STANDBY') {
    content += `\n> [!WARNING]\n`;
    content += `> **Error Summary**:\n`;
    content += `> ${errorMsg}\n`;
  } else if (errorMsg && status === 'STANDBY') {
    content += `\n> [!NOTE]\n`;
    content += `> **Standby Notice**:\n`;
    content += `> ${errorMsg}\n`;
  }
  
  try {
    fs.writeFileSync(STATUS_FILE_PATH, content, 'utf8');
  } catch (err) {
    console.error('Failed to write status file:', err.message);
  }
}

// Self-Healing Lock Recovery System
function recoverOrphanedLocks() {
  try {
    if (fs.existsSync(paths.researching)) {
      const lockedFiles = fs.readdirSync(paths.researching).filter(f => f.endsWith('.md'));
      if (lockedFiles.length > 0) {
        console.log(`[Self-Healing] Found ${lockedFiles.length} orphaned locks in 02-Researching. Restoring...`);
        for (const file of lockedFiles) {
          const lockedPath = path.join(paths.researching, file);
          if (file.includes('-video-')) {
            fs.unlinkSync(lockedPath);
            console.log(`[Self-Healing] Cleaned up temporary video lock: ${file}`);
          } else {
            const inboxPath = path.join(paths.inbox, file);
            fs.renameSync(lockedPath, inboxPath);
            console.log(`[Self-Healing] Recovered: ${file}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Self-Healing] Error recovering orphaned locks:', err.message);
  }
}

function checkStaleLocks(timeoutMs = 15 * 60 * 1000) {
  try {
    if (fs.existsSync(paths.researching)) {
      const lockedFiles = fs.readdirSync(paths.researching).filter(f => f.endsWith('.md'));
      const now = Date.now();
      for (const file of lockedFiles) {
        const lockedPath = path.join(paths.researching, file);
        const age = now - fs.statSync(lockedPath).mtimeMs;
        if (age > timeoutMs) {
          if (file.includes('-video-')) {
            fs.unlinkSync(lockedPath);
            console.warn(`[Self-Healing] Stale video lock detected for ${file}. Cleaned up.`);
          } else {
            const inboxPath = path.join(paths.inbox, file);
            console.warn(`[Self-Healing] Stale lock detected for ${file} (Locked for ${Math.round(age / 60000)}m). Releasing to 01-Inbox...`);
            fs.renameSync(lockedPath, inboxPath);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Self-Healing] Error cleaning stale locks:', err.message);
  }
}

// Watch mode vs Single execution
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');

  // Recover any locks abandoned from previous runs
  recoverOrphanedLocks();

  if (watchMode) {
    console.log('Starting X Drafting Agent in WATCH mode...');
    console.log(`Watching Inbox: ${paths.inbox}`);
    console.log('Checking for new files every 10 seconds. Press Ctrl+C to stop.');
    
    writeStatus('OK');
    let lastStatusIsError = false;
    
    while (true) {
      try {
        // Clean any stale locks that have hung during execution
        checkStaleLocks();
        
        await processInbox();
        if (lastStatusIsError) {
          writeStatus('OK');
          lastStatusIsError = false;
        }
      } catch (err) {
        console.error('Error in main watch loop:', err.message);
        writeStatus('ERROR', err.message);
        lastStatusIsError = true;
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  } else {
    console.log('Starting X Drafting Agent in SINGLE run mode...');
    writeStatus('OK');
    try {
      await processInbox();
    } catch (err) {
      writeStatus('ERROR', err.message);
      throw err;
    }
    console.log('Done.');
  }
}

main().catch(err => {
  console.error('Fatal error in agent script:', err);
  process.exit(1);
});

/**
 * 3-Step Ping-Pong Research & Drafting Pipeline:
 * Step 1: Planner Agent generates thread skeleton + Research Shopping List [Data + Intent].
 * Step 2: Search Grounding Agent (Gemini Flash + Web Search) fulfills shopping list & audits false premises.
 * Step 3: Ping-Pong Loop (Max 1 retry): If false premise detected, re-plan skeleton with true ground-truth facts.
 * Step 4: Final Writer Agent (DeepSeek Pro / Gemini) populates Part 3 Elastic Blueprint into publication-ready thread.
 */
export async function executePingPongDraftingPipeline(topicPayload, wireframeBlueprint, styleGuideContent, lang = 'id') {
  console.log(`🚀 [Ping-Pong Pipeline] Starting 3-step targeted research loop for: "${topicPayload.core_topic || topicPayload.topic_id}"`);

  // Step 1: Planner Agent
  const plannerSystem = getPlannerSystemInstruction();
  const plannerPrompt = getPlannerPromptStr(topicPayload, wireframeBlueprint);
  
  let plannerResStr = await callDeepSeek(plannerPrompt, plannerSystem, false);
  let plannerObj = {};
  try {
    const jsonMatch = plannerResStr.match(/\{[\s\S]*\}/);
    plannerObj = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (e) {
    console.warn('⚠️ Planner JSON parse fallback:', e.message);
  }

  const shoppingList = plannerObj.research_shopping_list || [
    { slot_id: "General Facts", data_wanted: topicPayload.core_topic, intent: "Verify core claims and numbers" }
  ];

  // Step 2: Targeted Search Grounding (Gemini 2.5 Flash + Web Search)
  console.log(`🌐 [Ping-Pong Pipeline] Executing targeted search grounding for ${shoppingList.length} items...`);
  const researchSystem = getTargetedResearchSystemInstruction();
  const researchPrompt = getTargetedResearchPromptStr(topicPayload, shoppingList);
  
  const researchRes = await callGemini(researchPrompt, researchSystem, false);
  const researchBrief = researchRes.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Step 3: Check for False Premise Flag & Execute Re-plan Loop (Max 1 Loop)
  let finalResearchBrief = researchBrief;
  let finalPlannerObj = plannerObj;

  if (researchBrief.includes('FALSE_PREMISE_DETECTED')) {
    console.log('⚠️ [Ping-Pong Pipeline] False premise caught by Research Agent. Triggering Round 2 Re-plan loop...');
    const revisedPlannerPrompt = getPlannerPromptStr(topicPayload, wireframeBlueprint, researchBrief);
    const revisedPlannerStr = await callDeepSeek(revisedPlannerPrompt, plannerSystem, false);
    
    try {
      const jsonMatch2 = revisedPlannerStr.match(/\{[\s\S]*\}/);
      finalPlannerObj = jsonMatch2 ? JSON.parse(jsonMatch2[0]) : plannerObj;
    } catch (e) {}

    const revisedShoppingList = finalPlannerObj.research_shopping_list || shoppingList;
    const revisedResearchPrompt = getTargetedResearchPromptStr(topicPayload, revisedShoppingList, researchBrief);
    const revisedResearchRes = await callGemini(revisedResearchPrompt, researchSystem, false);
    finalResearchBrief = revisedResearchRes.candidates?.[0]?.content?.parts?.[0]?.text || researchBrief;
    console.log('✅ [Ping-Pong Pipeline] Round 2 Re-plan complete with corrected ground truth!');
  }

  // Step 4: Final Writer Agent Generation
  console.log('✍️ [Ping-Pong Pipeline] Generating final publication-ready Indonesian thread output...');
  const writerSystem = getWireframeSystemInstruction(styleGuideContent, lang);
  const writerPrompt = getWireframeDraftPromptStr(topicPayload, [wireframeBlueprint], finalResearchBrief, lang);
  
  const finalDrafts = await callDeepSeek(writerPrompt, writerSystem, false);
  return {
    ok: true,
    plannerObj: finalPlannerObj,
    researchBrief: finalResearchBrief,
    drafts: finalDrafts
  };
}

