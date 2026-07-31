import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const STYLE_BANK_DIR = path.join(BASE_DIR, 'lulua-pipeline/01-Style-Bank');
const OUTLIERS_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Outliers');

export function updateStyleBankMOC() {
  if (!fs.existsSync(STYLE_BANK_DIR)) return;

  const files = fs.readdirSync(STYLE_BANK_DIR).filter(f => f.endsWith('.md') && f !== '00-Style-Bank-MOC.md');
  const items = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(STYLE_BANK_DIR, file), 'utf8');
      const styleMatch = content.match(/style_name:\s*["']?([a-zA-Z0-9_-]+)["']?/);
      const styleName = styleMatch ? styleMatch[1] : file.replace(/^style-|\.md$/g, '');

      const leverMatch = content.match(/Primary Emotional Driver:?\s*\*?\*?([^\*\n]+)\*?\*?/i) || content.match(/Part 2: Psychological Lever\s*\n\s*\*?\s*([^\n]+)/i);
      const lever = leverMatch ? leverMatch[1].replace(/^\*\*|\*\*$/g, '').trim() : 'General Virality';

      const metricMatch = content.match(/Target Metrics?:?\s*\*?\*?\s*([^\*\n]+)\*?\*?/i) || content.match(/Part 1: Metadata & Ratio Trigger\s*\n\s*\*?\s*([^\n]+)/i);
      let metric = metricMatch ? metricMatch[1].replace(/^s:\s*/i, '').replace(/^\*\*|\*\*$/g, '').trim() : 'Reach Yield';
      if (!metric || metric.toLowerCase() === 's:') metric = 'Bookmarks & Engagement';

      const linkMatch = content.match(/\[Inspect (?:Content|Post) on X\]\(([^\)]+)\)/i) || content.match(/(https?:\/\/(?:x|twitter)\.com\/[^\s\)]+)/i);
      const url = linkMatch ? linkMatch[1] : '#';

      items.push({ file, styleName, lever, metric, url });
    } catch (e) {}
  }

  const mocLines = [
    `---`,
    `type: MOC`,
    `database: Lulua Style Bank`,
    `---`,
    ``,
    `# 📐 Lulua Post Style Bank MOC Index`,
    ``,
    `This index automatically organizes all saved post wireframe templates.`,
    ``,
    `| Style Name | Psychological Lever | Target Metric | Source Post | File Link |`,
    `| :--- | :--- | :--- | :--- | :--- |`
  ];

  items.forEach(item => {
    const sourceLink = item.url !== '#' ? `[Inspect on X](${item.url})` : 'N/A';
    mocLines.push(`| **${item.styleName}** | ${item.lever} | ${item.metric} | ${sourceLink} | [[${item.file.replace(/\.md$/, '')}]] |`);
  });

  fs.writeFileSync(path.join(STYLE_BANK_DIR, '00-Style-Bank-MOC.md'), mocLines.join('\n'));
  console.log(`✅ Updated Style Bank MOC: 00-Style-Bank-MOC.md (${items.length} styles)`);
}

export function updateAccountAuditsMOC() {
  if (!fs.existsSync(OUTLIERS_DIR)) return;

  const files = fs.readdirSync(OUTLIERS_DIR).filter(f => f.startsWith('account-') && f.endsWith('.md') && f !== '00-Account-Audits-MOC.md');
  const items = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(OUTLIERS_DIR, file), 'utf8');
      const handleMatch = file.match(/account-([a-z0-9_]+)-([a-zA-Z0-9_]+)\.md/i);
      const platform = handleMatch ? handleMatch[1].toUpperCase() : 'X';
      const handle = handleMatch ? handleMatch[2] : file;

      const dateMatch = content.match(/\*\*Date:\*\*\s*([^\n]+)/);
      const date = dateMatch ? dateMatch[1].trim() : 'Recent';

      const summaryMatch = content.match(/## Executive Summary\s*\n\s*([^\n]+)/);
      const summary = summaryMatch ? summaryMatch[1].slice(0, 80) + '...' : '5D Account Audit';

      items.push({ file, handle, platform, date, summary });
    } catch (e) {}
  }

  const mocLines = [
    `---`,
    `type: MOC`,
    `database: Lulua Account Audits`,
    `---`,
    ``,
    `# 👤 Lulua 5-Dimension Account Audits MOC Index`,
    ``,
    `This index automatically organizes all 5-Dimension Competitor Account Audits.`,
    ``,
    `| Account Handle | Platform | Audit Date | Executive Summary | File Link |`,
    `| :--- | :--- | :--- | :--- | :--- |`
  ];

  items.forEach(item => {
    mocLines.push(`| **@${item.handle}** | ${item.platform} | ${item.date} | ${item.summary} | [[${item.file.replace(/\.md$/, '')}]] |`);
  });

  fs.writeFileSync(path.join(OUTLIERS_DIR, '00-Account-Audits-MOC.md'), mocLines.join('\n'));
  console.log(`✅ Updated Account Audits MOC: 00-Account-Audits-MOC.md (${items.length} accounts)`);
}

// Initial sync on module load
updateStyleBankMOC();
updateAccountAuditsMOC();
