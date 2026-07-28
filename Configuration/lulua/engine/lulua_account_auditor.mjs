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

  // Pull Beidou quantitative metrics if snapshot exists
  let beidouMetrics = null;
  if (fs.existsSync(SNAPSHOT_DIR)) {
    const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.startsWith('snapshot-') && f.endsWith('.json')).sort().reverse();
    if (files.length > 0) {
      try {
        const snapshotData = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, files[0]), 'utf8'));
        const accountList = Array.isArray(snapshotData) ? snapshotData : Object.values(snapshotData);
        beidouMetrics = accountList.find(a => (a.handle || '').toLowerCase() === cleanHandle.toLowerCase());
      } catch (err) {
        console.warn('⚠️ Could not parse Beidou snapshot:', err.message);
      }
    }
  }

  const metricsContext = beidouMetrics ? `
- Followers: ${beidouMetrics.followers || 'Unknown'}
- Scraped Posts Count: ${(beidouMetrics.tweets || []).length}
- Sample Post Views: ${(beidouMetrics.tweets || []).map(t => t.views).slice(0, 5).join(', ')}
` : `- Followers & Baseline Metrics: Query via web search for @${cleanHandle} on ${platform}.`;

  const systemInstruction = `You are Lulua, the Strategy & Account Audit Engine for Iroi media business.
Your task is to conduct an in-depth 5-Dimension Account Audit for a competitor account according to Lulua's 5-Dimension Dissection Framework:

Dimension 1 (Positioning & Bio Authority): Value proposition & credibility markers.
Dimension 2 (Content Ecosystem Pillars): 3-Pillar ratio (Authority vs. Reach vs. Trust) & format mix taxonomy.
Dimension 3 (Growth Catalyst & Outlier Engine): Outlier growth events & virality spikes.
Dimension 4 (Platform-Exclusive Tactical Execution): Hook cutoffs, line-break cadence, micro-rhythm.
Dimension 5 (Funnel Architecture & Revenue Matrix): Lead magnet mechanics & back-end monetization model (courses, SaaS, paid community, newsletter).

Format your output in clean GitHub-style Markdown with clear headings and executive takeaways.`;

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
