import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const OUTLIERS_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Outliers');
const BRIEFINGS_DIR = path.join(BASE_DIR, 'lulua-pipeline/03-Briefings');

async function generateExecutiveBriefing() {
  console.log('📋 [Lulua] Generating Daily Executive Briefing...');

  const todayStr = new Date().toISOString().split('T')[0];
  const outlierFile = path.join(OUTLIERS_DIR, `outlier-${todayStr}.json`);

  if (!fs.existsSync(outlierFile)) {
    console.error(`❌ Outlier file for today not found: ${outlierFile}`);
    console.log('💡 Tip: Run lulua_outlier_scanner.mjs first.');
    process.exit(1);
  }

  const outliers = JSON.parse(fs.readFileSync(outlierFile, 'utf8'));
  console.log(`📄 Ingested ${outliers.length} mined outliers from today.`);

  // Group outliers by trigger
  const yieldOutliers = outliers.filter(o => o.triggers.highYield);
  const utilityOutliers = outliers.filter(o => o.triggers.highUtility);
  const debateOutliers = outliers.filter(o => o.triggers.highDebate);
  const broadcastOutliers = outliers.filter(o => o.triggers.highBroadcast);
  const appreciationOutliers = outliers.filter(o => o.triggers.highAppreciation);

  // Top 3 Recommended Wireframe Templates for Shinku
  const topRecommendations = outliers.slice(0, 3).map((item, idx) => {
    const lines = item.text.split('\n').filter(l => l.trim().length > 0);
    const hookLine = lines[0] || item.text;
    const bodyLines = lines.length > 2 ? lines.slice(1, lines.length - 1) : (lines.length === 2 ? [lines[1]] : []);
    const closingLine = lines.length > 1 ? lines[lines.length - 1] : '';

    let lever = 'High Reach / Distribution Spike';
    if (item.triggers.highUtility) lever = 'High Utility & Save Value (Bookmarks)';
    else if (item.triggers.highDebate) lever = 'Contrarian / Debate Catalyst (Replies)';
    else if (item.triggers.highBroadcast) lever = 'Identity Signal & Amplification (Retweets)';
    else if (item.triggers.highAppreciation) lever = 'Resonance & Broad Agreement (Likes)';

    const mediaLabel = item.media?.label || '📝 Text Only Post';

    // Construct concrete wireframe representation
    let wireframeText = `[Hook]: "${hookLine}"`;
    if (bodyLines.length > 0) {
      wireframeText += `\n[Body Setup]: "${bodyLines.join(' / ')}"`;
    } else {
      wireframeText += `\n[Body Setup]: Direct single-statement hook (No middle body paragraph)`;
    }
    if (closingLine) {
      wireframeText += `\n[Closing / Question]: "${closingLine}"`;
    } else {
      wireframeText += `\n[Closing / Question]: Implicit ending (No explicit CTA line)`;
    }

    return {
      rank: idx + 1,
      handle: item.handle,
      url: item.url,
      lever,
      metrics: item.metrics,
      ratios: item.ratios,
      hookLine,
      bodyText: bodyLines.join('\n> '),
      closingLine,
      wireframeSchema: {
        part1_trigger: `Yield vs Median: ${item.ratios.yieldVsMedian}x | Likes: ${item.metrics.likes.toLocaleString()} | Views: ${item.metrics.views.toLocaleString()}`,
        part2_psychology: lever,
        part3_pacing: `Line Count: ${lines.length} lines | Pacing: ${lines.length > 2 ? 'Multi-paragraph structured rhythm' : 'Punchy short statement'}`,
        part4_wireframe: wireframeText
      }
    };
  });

  // Construct Markdown Briefing Document
  const briefingLines = [
    `# 🏛️ Lulua Daily Executive Briefing (${todayStr})`,
    `**Target Domain:** Finance, Tech & Macro (Monothematic Brand)`,
    `**Outlier Source Snapshot:** \`outlier-${todayStr}.json\``,
    `**Total Mined Outliers:** ${outliers.length}`,
    `---`,
    ``,
    `## 📊 1. Macro Outlier Summary`,
    `- ⚡ **High Reach Spikes:** ${yieldOutliers.length} posts`,
    `- 🔖 **High Utility (Bookmarks):** ${utilityOutliers.length} posts`,
    `- 💬 **High Debate (Replies):** ${debateOutliers.length} posts`,
    `- 🔄 **High Broadcast (Retweets):** ${broadcastOutliers.length} posts`,
    `- ❤️ **High Appreciation (Likes):** ${appreciationOutliers.length} posts`,
    ``,
    `---`,
    ``,
    `## 🎯 2. Top 3 Post Wireframes Recommended for Shinku (Style Bank R&D)`,
    ``
  ];

  topRecommendations.forEach(rec => {
    briefingLines.push(`### 🌟 Recommendation #${rec.rank}: @${rec.handle}`);
    briefingLines.push(`- **Psychological Lever:** ${rec.lever}`);
    briefingLines.push(`- **Performance Yield:** ${rec.ratios.yieldVsMedian}x Cohort Median (${rec.metrics.views.toLocaleString()} views | ${rec.metrics.likes.toLocaleString()} likes)`);
    briefingLines.push(`- 🔗 **Direct X Link:** [Inspect Post on X](${rec.url})`);
    briefingLines.push(``);
    briefingLines.push(`#### 📐 Standardized 4-Part Wireframe Schema:`);
    briefingLines.push(`1. **Metadata & Trigger:** ${rec.wireframeSchema.part1_trigger}`);
    briefingLines.push(`2. **Psychological Lever:** ${rec.wireframeSchema.part2_psychology}`);
    briefingLines.push(`3. **Micro-Rhythm & Pacing Rules:** ${rec.wireframeSchema.part3_pacing}`);
    briefingLines.push(`4. **Plug-and-Play Wireframe Blueprint:**`);
    briefingLines.push(`\`\`\`markdown`);
    briefingLines.push(rec.wireframeSchema.part4_wireframe);
    briefingLines.push(`\`\`\``);
    briefingLines.push(``);
    briefingLines.push(`> **Original Hook:** "${rec.hookLine}"`);
    briefingLines.push(``);
    briefingLines.push(`---`);
    briefingLines.push(``);
  });

  briefingLines.push(`## 🔒 3. Governance & Tier 2 Proposals`);
  briefingLines.push(`- **Status:** No structural workflow or directory changes required today.`);
  briefingLines.push(`- **Action Item:** Review the Top 3 wireframes above. Approved formats will be saved to \`lulua-pipeline/01-Style-Bank/style-[name].md\` for Shinku reference.`);
  briefingLines.push(``);

  if (!fs.existsSync(BRIEFINGS_DIR)) {
    fs.mkdirSync(BRIEFINGS_DIR, { recursive: true });
  }

  const briefingFile = path.join(BRIEFINGS_DIR, `briefing-${todayStr}.md`);
  fs.writeFileSync(briefingFile, briefingLines.join('\n'));

  console.log(`✅ [Lulua] Executive Briefing generated successfully!`);
  console.log(`📝 Saved Briefing to: ${briefingFile}`);

  return { file: briefingFile, count: outliers.length };
}

generateExecutiveBriefing().catch(err => {
  console.error('❌ Error generating Lulua Executive Briefing:', err);
  process.exit(1);
});
