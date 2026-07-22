import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import console from 'console';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Gemini API caller
import { callGemini } from './services/gemini_api.mjs';

// Load Environment Variables manually
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
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}
loadEnv();

const PIPELINE_BASE = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline';
const CONFIG_FILE_PATH = path.join(__dirname, 'sourcing_config.md');
const PITCHES_DIR = path.join(PIPELINE_BASE, '01a-Idea-Pitches');

// Ensure directories exist
if (!fs.existsSync(PITCHES_DIR)) {
  fs.mkdirSync(PITCHES_DIR, { recursive: true });
}

// Simple YAML frontmatter parser helper
function parseFrontmatter(content) {
  const frontmatter = {};
  if (content.startsWith('---')) {
    const endOffset = content.indexOf('---', 3);
    if (endOffset !== -1) {
      const yamlContent = content.substring(3, endOffset);
      for (const line of yamlContent.split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const k = line.substring(0, colonIndex).trim();
          let v = line.substring(colonIndex + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          frontmatter[k] = v;
        }
      }
    }
  }
  return frontmatter;
}

// Scans the archive directory recursively to find all past topic slugs and competitor links
function getSourcingHistory() {
  const archiveDir = path.join(PIPELINE_BASE, '05-Archive', 'how-to');
  const historySlugs = [];
  const historyUrls = [];

  if (!fs.existsSync(archiveDir)) {
    return { slugs: historySlugs, urls: historyUrls };
  }

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.md') && item.startsWith('pitch-')) {
          const slug = item.replace('pitch-', '').replace('.md', '');
          historySlugs.push(slug);

          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const originLinkMatch = content.match(/- \*\*Origin Link\*\*:\s*(.*)/);
            if (originLinkMatch) {
              let url = originLinkMatch[1].trim();
              const mdUrlMatch = url.match(/\[.*\]\((.*)\)/);
              if (mdUrlMatch) {
                url = mdUrlMatch[1].trim();
              }
              if (url && url !== '#') {
                historyUrls.push(url);
              }
            }
          } catch (fileErr) {
            // ignore read errors
          }
        }
      }
    } catch (err) {
      // ignore directory read errors
    }
  }

  scanDirectory(archiveDir);
  return { slugs: historySlugs, urls: historyUrls };
}

async function main() {
  console.log('Starting Sourcing Agent...');

  // Safeguard: Check if there's already an active pending or approved pitch in the directory
  try {
    const files = fs.readdirSync(PITCHES_DIR);
    for (const file of files) {
      if (file.endsWith('.md') && file.startsWith('pitch-')) {
        const filePath = path.join(PITCHES_DIR, file);
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const fm = parseFrontmatter(existingContent);
        const status = (fm.status || '').toLowerCase();
        
        if (status === 'pending' || status === 'approved') {
          console.log(`Aborting: An active idea pitch "${file}" with status "${status}" already exists in 01a-Idea-Pitches/.`);
          return;
        }
      }
    }
  } catch (err) {
    console.error('Safeguard check failed:', err.message);
  }

  // Load sourcing config
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    console.error(`Sourcing config not found at: ${CONFIG_FILE_PATH}`);
    process.exit(1);
  }
  const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');

  // Load history data
  const { slugs: historySlugs, urls: historyUrls } = getSourcingHistory();
  console.log(`Loaded sourcing history: ${historySlugs.length} past topics, ${historyUrls.length} origin links.`);

  // Build negative constraint prompts
  const excludedSlugsPrompt = historySlugs.length > 0
    ? `\nHere are the topics we have already pitched and written about. You MUST NOT select any topic that overlaps semantically or conceptually with these:\n- ${historySlugs.join('\n- ')}`
    : '';

  const systemInstruction = `
You are a Growth Hacker and Social Media Content Strategist specializing in AI Development and Crypto/DeFi content.
Your task is to identify the single best "How-To" (builder/tutorial) topic currently trending on YouTube and Reddit.
You have access to Google Search to fetch views, upvotes, and latest video details.

CRITICAL RULES:
1. Focus ONLY on two niches: "AI Dev" and "Crypto". Ignore Economics.
2. Sourcing YouTube views: Query competitor channels to estimate standard baseline views, then search for outliers (how-to tutorials that outperform the channel average). Note that views are the primary metric for YouTube, comments can be ignored.
3. Sourcing Reddit: Look for high-upvote and high-comment tutorials in technical subreddits (r/LocalLLaMA, r/defi, r/cryptocurrency).
4. Output formatting: Output a single markdown note with YAML frontmatter exactly as specified in the prompt.
5. Topic Uniqueness: Do not write about topics we've already covered. ${excludedSlugsPrompt}
`;

  const promptStr = `
Using the sourcing configuration below, identify one trending, high-interest "How-To" topic (either in AI Dev or Crypto/DeFi) that would make a viral X post and native X Article.

Sourcing Configuration:
${configContent}

Steps for SGR Search:
1. Run a search to check recent video views for YouTube competitors (e.g. Nate Herk, Matthew Berman, Miles Deutscher for AI Dev; CoinGecko, Jesse Eckel, Altcoin Daily for Crypto) to establish a baseline of what is "normal" view count.
2. Search for recent (under 1 month old) technical guides or tutorials in the target niches, and check if they represent significant outliers (either above the average baseline, or outperforming the creator's typical video views by 2x-5x).
3. Check target subreddits for high-upvote and highly discussed guides/walkthroughs.
4. Select the SINGLE best topic.

Output the results exactly in this markdown format:

---
type: Idea Pitch
niche: [AI Dev / Crypto]
sourcing_platform: [e.g. YouTube (X views, Y weeks old) / Reddit (X upvotes)]
status: pending
lang: en
date_pitched: ${new Date().toISOString().split('T')[0]}
---

# 💡 Proposed "How-To" Topic: [Title of Guide]

## 📈 Sourcing Proof
- **Origin Link**: [Insert link to YouTube video or Reddit thread]
- **Metrics**: [Views/upvotes, upload age, average channel views context proving it is a Layer B outlier]

---

## 📐 Proposed Post Structure

### 1. The Teaser Tweet Plan
- **Hook**: How to [Core Builder Task] from scratch.
- **Pillars**: [Pillar 1], [Pillar 2], and [Pillar 3].
- **Outcome**: [Clear ultimate value/bot/yield executing for the reader]

### 2. The X Article Plan

#### Section 1: The Core Loop (How it works)
* **Diagram**: [Text-based visual ASCII arrow flow showing the financial/technical loop]
* **Explanation**: [A brief explanation utilizing a simple, everyday analogy (cynical peer voice)]

#### Section 2: Why Most Fail
* **Warning 1**: [Concrete pitfall/slippage/API limit details]
* **Warning 2**: [Another realistic pitfall]

#### Section 3: The Step-by-Step Blueprint
* **Step 1 (Setup)**: [What will be installed/connected]
* **Step 2 (Strategy)**: [The core python/logic block details]
* **Step 3 (Memory/Automation)**: [How memory, logs, or timers are set up to run automatically]
`;

  const researchModel = process.env.GEMINI_RESEARCH_MODEL || 'gemini-3.1-flash-lite';
  
  let excludedLink = '';
  let attempt = 1;
  const maxAttempts = 3;
  let successfulPitchText = '';
  let successfulPitchFileName = '';

  while (attempt <= maxAttempts) {
    console.log(`Running research query via Gemini with Search Grounding (Attempt ${attempt}/${maxAttempts})...`);
    
    let activePrompt = promptStr;
    const allExcludedUrls = [...historyUrls];
    if (excludedLink) {
      allExcludedUrls.push(excludedLink);
    }

    if (allExcludedUrls.length > 0) {
      activePrompt += `\n\nCRITICAL DEDUPLICATION RULE: You MUST NOT select or reference any of the following URLs/Origin Links, as we have already covered them in previous posts. Ignore them completely and search for other sources:\n- ${allExcludedUrls.join('\n- ')}`;
    }

    try {
      const result = await callGemini(activePrompt, systemInstruction, true, researchModel);
      const pitchText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!pitchText.trim()) {
        console.warn(`Empty response received on attempt ${attempt}. Retrying...`);
        attempt++;
        continue;
      }

      // Parse output metrics link and slug
      const originLinkMatch = pitchText.match(/- \*\*Origin Link\*\*:\s*(.*)/);
      let proposedUrl = '';
      if (originLinkMatch) {
        proposedUrl = originLinkMatch[1].trim();
        const mdUrlMatch = proposedUrl.match(/\[.*\]\((.*)\)/);
        if (mdUrlMatch) {
          proposedUrl = mdUrlMatch[1].trim();
        }
      }

      const topicTitle = pitchText.match(/# 💡 Proposed "How-To" Topic:\s*(.*)/)?.[1] || 'How-To Guide';
      const slug = topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check duplicates
      const isDuplicateUrl = historyUrls.some(u => u === proposedUrl || (proposedUrl && u.includes(proposedUrl)) || (proposedUrl && proposedUrl.includes(u)));
      const isDuplicateSlug = historySlugs.includes(slug);

      if (proposedUrl && proposedUrl !== '#' && isDuplicateUrl) {
        console.log(`⚠️ Sourced origin link matches past history: ${proposedUrl}. Requesting alternate topic...`);
        excludedLink = proposedUrl;
        attempt++;
        continue;
      }

      if (isDuplicateSlug) {
        console.log(`⚠️ Proposed topic slug already exists in history: ${slug}. Requesting alternate topic...`);
        attempt++;
        continue;
      }

      // Found a completely fresh topic!
      successfulPitchText = pitchText;
      successfulPitchFileName = `pitch-${slug}.md`;
      break;
    } catch (err) {
      console.error(`Error on query attempt ${attempt}:`, err.message);
      attempt++;
    }
  }

  if (successfulPitchText) {
    const targetPitchPath = path.join(PITCHES_DIR, successfulPitchFileName);
    fs.writeFileSync(targetPitchPath, successfulPitchText, 'utf8');
    console.log(`Success! New unique idea pitch saved to: 01a-Idea-Pitches/${successfulPitchFileName}`);
  } else {
    console.error('Failed to generate a unique topic pitch after maximum retry attempts.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in sourcing agent:', err);
  process.exit(1);
});
