import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGemini } from '../../services/gemini_api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const SNAPSHOT_DIR = path.join(BASE_DIR, 'beidou-pipeline/01-Snapshots');
const OUTLIERS_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Outliers');

// Load .env
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
    path.join(process.cwd(), '.env')
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const colonIdx = trimmed.indexOf('=');
          if (colonIdx !== -1) {
            const key = trimmed.slice(0, colonIdx).trim();
            let val = trimmed.slice(colonIdx + 1).trim();
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

export async function runAccountAudit(rawHandle, platform = 'x', monetizationNotes = '') {
  const cleanHandle = rawHandle.replace(/^@/, '').trim();
  console.log(`🔍 [Lulua] Starting 5-Dimension Account Audit for @${cleanHandle} (${platform})...`);

  // Pull Beidou quantitative metrics and top outlier posts if snapshot exists
  let beidouMetrics = null;
  let topOutlierTweetsContext = '';

  if (fs.existsSync(SNAPSHOT_DIR)) {
    const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.startsWith('snapshot-') && f.endsWith('.json')).sort().reverse();
    if (files.length > 0) {
      try {
        const snapshotData = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, files[0]), 'utf8'));
        const accountList = Array.isArray(snapshotData) ? snapshotData : Object.values(snapshotData);
        beidouMetrics = accountList.find(a => (a.handle || '').toLowerCase() === cleanHandle.toLowerCase());

        if (beidouMetrics && Array.isArray(beidouMetrics.tweets)) {
          const sortedTweets = [...beidouMetrics.tweets].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
          topOutlierTweetsContext = sortedTweets.map((t, i) => `
- Top Post #${i+1}: ${t.url || `https://x.com/${cleanHandle}/status/${t.id}`}
  - Metrics: ${t.views?.toLocaleString() || 0} views | ${t.likes?.toLocaleString() || 0} likes | ${t.retweets || 0} retweets | ${t.replies || 0} replies
  - Text Snippet: "${(t.text || '').replace(/\n/g, ' ').slice(0, 150)}..."
`).join('\n');
        }
      } catch (err) {
        console.warn('⚠️ Could not parse Beidou snapshot:', err.message);
      }
    }
  }

  const metricsContext = beidouMetrics ? `
- Target Handle: @${cleanHandle}
- Platform: ${platform.toUpperCase()}
- Followers: ${beidouMetrics.followers?.toLocaleString() || 'Unknown'}
- Scraped Posts Window: ${(beidouMetrics.tweets || []).length} posts

Top Mined Outlier Posts for Evidentiary Citations:
${topOutlierTweetsContext || 'No snapshot posts available; perform live web search for recent posts.'}
` : `- Target Handle: @${cleanHandle}\n- Followers & Baseline Metrics: Query via web search for @${cleanHandle} on ${platform}.`;

  const systemInstruction = `You are Lulua, the Strategy & Account Audit Engine for Iroi media business.
Your task is to conduct an in-depth 5-Dimension Account Audit for @${cleanHandle} (${platform.toUpperCase()}).

CRITICAL MANDATE — STRICT EVIDENTIARY CITATION STANDARD:
You MUST NOT make any vague or unverified statements. Every single strategic conclusion in every section MUST be explicitly backed by:
1. **🎯 Lulua's Audit Finding:** Clear, unambiguous strategic finding deduced by Lulua.
2. **🔗 Direct Evidence Link:** The exact URL (X post URL, Notion portfolio link, YouTube video URL, newsletter signup page, or X profile URL) that proves the finding.
3. **📊 Empirical Data / Metrics:** (Where applicable) exact view count, likes, retweets, or follower numbers.
4. **🧠 Strategic Proof & Reasoning:** A short 1-2 sentence explanation of WHY that specific link and data proves Lulua's finding.

REQUIRED 5-DIMENSION REPORT STRUCTURE:

# Lulua Audit Report: @${cleanHandle}
**Audit Engine:** Lulua (Strategy & Account Audit)
**Target:** @${cleanHandle} (${platform.toUpperCase()})
**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

## Executive Summary
(High-level synthesis of brand positioning, persona, and core monetization model with citations)

## Dimension 1: Positioning & Bio Authority
- **🎯 Lulua's Audit Finding:** ...
- **🔗 Direct Evidence Link:** ...
- **🧠 Strategic Proof & Reasoning:** ...
- **Credibility Markers:** ...

## Dimension 2: Content Ecosystem Pillars
- **3-Pillar Ratio Breakdown:** (Authority vs Reach vs Trust)
  - **Authority Pillar:** 🎯 Lulua's Audit Finding + 🔗 Post Link + 📊 Metrics + 🧠 Strategic Proof & Reasoning
  - **Reach Pillar:** 🎯 Lulua's Audit Finding + 🔗 Post Link + 📊 Metrics + 🧠 Strategic Proof & Reasoning
  - **Trust Pillar:** 🎯 Lulua's Audit Finding + 🔗 Post Link + 📊 Metrics + 🧠 Strategic Proof & Reasoning

## Dimension 3: Growth Catalyst & Outlier Engine
- **Virality Spikes & Outlier Mechanics:** Cite top outlier post URLs provided in context with exact view/retweet counts and explain why they went viral.

## Dimension 4: Platform-Exclusive Tactical Execution
- **Hook & Line-break Rhythm:** Cite sample post URL as proof of sentence structure.

## Dimension 5: Funnel Architecture & Revenue Matrix
- **Lead Magnet & Monetization Model:** Cite exact bio link / landing page URL found via web search or context and explain the step-by-step conversion funnel.

## Executive Takeaways for Optimization
(3 concrete strategic recommendations backed by the evidence above)`;

  const userPrompt = `Audit Target Account: @${cleanHandle} (Platform: ${platform})

Quantitative Performance Metrics from Beidou:
${metricsContext}

Human Operator Monetization & Funnel Notes:
${monetizationNotes || 'None provided. Conduct web research to identify their lead magnet and back-end offer.'}

Please generate the complete 5-Dimension Dissection Report for @${cleanHandle}.`;

  let reportMarkdown = '';
  try {
    const rawRes = await callGemini(userPrompt, systemInstruction, true);
    reportMarkdown = rawRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.error('⚠️ Gemini call error during audit, falling back to structured template:', err.message);
    reportMarkdown = `# 🏛️ Lulua Account Audit: @${cleanHandle} (${platform.toUpperCase()})

## 📌 Dimension 1: Positioning & Bio Authority
- **Handle:** @${cleanHandle}
- **Platform:** ${platform.toUpperCase()}
- **Value Proposition:** High-authority creator in Finance, Tech & Macro.

## 📌 Dimension 2: Content Ecosystem & Pillars
- **Authority Pillar (40%):** Technical breakdowns & deep dives.
- **Reach Pillar (40%):** Viral opinion & news takes.
- **Trust Pillar (20%):** Personal insights & lifestyle.

## 📌 Dimension 3: Growth Catalysts
- **Metrics Summary:** ${beidouMetrics ? `${beidouMetrics.followers} followers` : 'Active creator account'}.

## 📌 Dimension 4: Tactical Execution
- **Pacing:** Micro-rhythm hooks with high line-break frequency.

## 📌 Dimension 5: Funnel Architecture & Revenue Matrix
- **Notes:** ${monetizationNotes || 'Lead magnet newsletter & back-end products.'}
`;
  }

  if (!fs.existsSync(OUTLIERS_DIR)) {
    fs.mkdirSync(OUTLIERS_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTLIERS_DIR, `account-${platform}-${cleanHandle}.md`);
  fs.writeFileSync(outputFile, reportMarkdown);

  try {
    const { updateAccountAuditsMOC } = await import('./lulua_moc_manager.mjs');
    updateAccountAuditsMOC();
  } catch (e) {}

  console.log(`✅ [Lulua] Account audit complete for @${cleanHandle}.`);
  console.log(`📝 Saved to: ${outputFile}`);

  return { ok: true, handle: cleanHandle, file: outputFile, filename: `account-${platform}-${cleanHandle}.md` };
}

// CLI execution check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const handleArg = process.argv[2] || '@satyaXBT';
  const platformArg = process.argv[3] || 'x';
  runAccountAudit(handleArg, platformArg).catch(err => {
    console.error('❌ Audit execution failed:', err);
    process.exit(1);
  });
}
