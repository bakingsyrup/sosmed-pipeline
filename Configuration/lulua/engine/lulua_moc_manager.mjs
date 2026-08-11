import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const STYLE_BANK_DIR = path.join(BASE_DIR, 'lulua-pipeline/01-Style-Bank');
const OUTLIERS_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Outliers');

const CATEGORIES = [
  "01 - Step-by-Step SOP",
  "02 - Master Cheat Sheet",
  "03 - Learn & Earn Walkthrough",
  "04 - Historical Precedent",
  "05 - Mega Number Alert",
  "06 - Binary Choice Debate",
  "07 - Friction Remover",
  "08 - Contrarian Manifesto",
  "09 - Master Framework",
  "10 - Lead Magnet Giveaway",
  "11 - Founder Retrospective",
  "12 - Company PR & Milestones",
  "13 - Memes & Industry Satire",
  "14 - Live Recaps & AMAs",
  "15 - Social Proof & UGC",
  "16 - Daily Posts",
  "17 - Story Narrative"
];

// Exact file-by-file unique human titles restored directly from git commit 8a94ae5
const COMMIT_FILE_LOOKUP = {
  "style-Format1_HighUtility_StepByStep_v1": "Time-saved promise → 3 to 5 setup steps → Tool link CTA",
  "style-HighUtility_Thread_MasterCheatSheet_v1": "Effort compression claim → Curated list of tools/formulas → Bookmark prompt",
  "style-HighUtility_Short_HowToPlaybook_BookmarkSave": "Bite-sized rule offer → 4 core playbook takeaways → Save for later CTA",
  "style-ClientAds_Thread_LearnAndEarn_v1": "Skill reward promise → Interactive feature walkthrough → Incentive referral link",
  "style-HighUtility_Thread_HistoricalCaseStudy_BookmarkSave": "Current trend comparison → Historical event backtest data → Pattern rule takeaway",
  "style-ViralReach_Thread_HistoricalCaseStudy_RetweetIdentity": "Shocking financial stat → 4-step math breakdown → Retweet prompt",
  "style-DebateEngagement_Thread_BinaryChoice_v1": "This-vs-That dilemma → 3 opposing arguments → Community poll CTA",
  "style-ClientAds_Thread_ProblemSolution_AppDownload": "User friction callout → Direct app feature solution → Download CTA",
  "style-ClientAds_Thread_ProblemSolution_AppDownload_v1": "Hidden mistake warning → 3 risk mitigation rules → App download link",
  "style-ClientAds_Thread_ProblemSolution_AppDownload_v2": "Common security risk → Step-by-step risk elimination → Direct app install CTA",
  "style-BrandIdentity_Thread_ContrarianManifesto_v1": "Controversial advice → 3 real market backtests → Risk rule summary",
  "style-ViralReach_Thread_ContrarianInsight_RetweetIdentity": "Industry myth teardown → 4 flaws in consensus thinking → Identity retweet CTA",
  "style-HighUtility_Thread_HowToPlaybook_NewsletterOptin": "Expert mental model offer → Institutional risk diagram → Newsletter opt-in CTA",
  "style-OwnedLeadGen_Thread_LeadMagnetGiveaway_v1": "Free template offer → 3 key resource highlights → Comment/DM lead opt-in",
  "style-BrandIdentity_Thread_StoryNarrative_ProfileVisit": "Behind-the-scenes build story → 3 lessons learned → Profile follow prompt",
  "style-BrandIdentity_Thread_StoryNarrative_ProfileVisit_v2": "Failure claim → Hard-earned founder story → Profile visit invitation",
  "style-ClientAds_Thread_ProofOfConcept_v1": "Traction milestone claim → Proof of concept metrics → Product link CTA",
  "style-ClientAds_Thread_TimelyAlpha_v1": "Breaking feature news → Real-time market alpha → Early access link CTA",
  "style-HighUtility_Thread_CaseStudyExample_v1": "Client results spotlight → Real-world metric proof → Case study link CTA",
  "style-HighUtility_Thread_HowToPlaybook_BookmarkSave": "Modular system framework → 4 operational phases → Bookmark for implementation",
  "style-HighUtility_Thread_HowToPlaybook_BookmarkSave_v2": "SOP workflow breakdown → Step-by-step execution rules → Save for reference CTA",
  "style-HighUtility_Thread_HowToPlaybook_BookmarkSave_v3": "System architecture offer → 3 structural optimization rules → Bookmark prompt",
  "style-HighUtility_Thread_HowToPlaybook_BookmarkSave_v4": "High-leverage playbook → Practical implementation steps → Save for later CTA",
  "style-HighUtility_Thread_MistakeCorrection_BookmarkSave": "Costly mistake warning → Root cause explanation → Actionable correction guide",
  "style-HighUtility_Thread_ProblemSolution_BookmarkSave": "Operational friction callout → Direct workflow fix → High-utility bookmark prompt",
  "style-HighUtility_Thread_ProblemSolution_BookmarkSave_v2": "Common failure trap → Step-by-step risk elimination → Save for reference CTA",
  "style-HighUtility_Thread_ProblemSolution_BookmarkSave_v3": "System bottleneck warning → Verified solution framework → Bookmark prompt"
};

function categorizeStyle(filename, content) {
  // Read category from frontmatter (set by DeepSeek based on content structure)
  const fmCatMatch = content.match(/^category:\s*["']?([^"'\n]+)["']?/m);
  if (fmCatMatch) {
    const fmCat = fmCatMatch[1].trim();
    for (const cat of CATEGORIES) {
      if (cat === fmCat) return cat;
    }
    const numMatch = fmCat.match(/^(\d{2})/);
    if (numMatch) {
      for (const cat of CATEGORIES) {
        if (cat.startsWith(numMatch[1])) return cat;
      }
    }
  }

  // Legacy: filename keyword matching for older files without category frontmatter
  const fn = filename.toLowerCase();

  if (fn.includes('stepbystep') || fn.includes('format1_')) return "01 - Step-by-Step SOP";
  if (fn.includes('mastercheatsheet') || fn.includes('format2_')) return "02 - Master Cheat Sheet";
  if (fn.includes('learnandearn') || fn.includes('format3_')) return "03 - Learn & Earn Walkthrough";
  if (fn.includes('historicalcasestudy') || fn.includes('historicalprecedent') || fn.includes('format4_')) return "04 - Historical Precedent";
  if (fn.includes('meganumberalert') || fn.includes('format5_')) return "05 - Mega Number Alert";
  if (fn.includes('binarychoice') || fn.includes('binarydebate') || fn.includes('format6_')) return "06 - Binary Choice Debate";
  if (fn.includes('problemsolution') || fn.includes('frictionremover') || fn.includes('format7_')) return "07 - Friction Remover";
  if (fn.includes('contrarianmanifesto') || fn.includes('contrarianinsight') || fn.includes('format8_')) return "08 - Contrarian Manifesto";
  if (fn.includes('masterframework') || fn.includes('howtoplaybook') || fn.includes('format9_')) return "09 - Master Framework";
  if (fn.includes('leadmagnetgiveaway') || fn.includes('resourcegiveaway') || fn.includes('format10_')) return "10 - Lead Magnet Giveaway";
  if (fn.includes('founderretrospective') || fn.includes('format11_')) return "11 - Founder Retrospective";
  if (fn.includes('companypr') || fn.includes('proofofconcept') || fn.includes('timelyalpha')) return "12 - Company PR & Milestones";
  if (fn.includes('meme')) return "13 - Memes & Industry Satire";
  if (fn.includes('ama') || fn.includes('liverecap')) return "14 - Live Recaps & AMAs";
  if (fn.includes('socialproof') || fn.includes('ugc') || fn.includes('casestudyexample')) return "15 - Social Proof & UGC";
  if (fn.includes('dailypost')) return "16 - Daily Posts";
  if (fn.includes('storynarrative')) return "17 - Story Narrative";

  return "01 - Step-by-Step SOP";
}

function extractNarrativeFlow(baseName, content) {
  // Method 1: Dynamic frontmatter summary generated by AI agent
  const frontmatterSummary = content.match(/narrative_flow_summary:\s*["']?([^"'\n]+)["']?/i);
  if (frontmatterSummary && frontmatterSummary[1].trim() && !frontmatterSummary[1].includes('[Concise')) {
    return frontmatterSummary[1].trim();
  }

  // Method 2: Match exact file lookup from commit 8a94ae5
  if (COMMIT_FILE_LOOKUP[baseName]) {
    return COMMIT_FILE_LOOKUP[baseName];
  }

  return "Unique Hook → Core Execution → Conversion CTA";
}

export function updateStyleBankMOC(newlyDissectedFile = null) {
  if (!fs.existsSync(STYLE_BANK_DIR)) return;

  const files = fs.readdirSync(STYLE_BANK_DIR).filter(f => f.startsWith('style-') && f.endsWith('.md') && f !== '00-Style-Bank-MOC.md');
  const categoryMap = {};
  CATEGORIES.forEach(cat => categoryMap[cat] = []);

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(STYLE_BANK_DIR, file), 'utf8');
      const baseName = file.replace(/\.md$/, '');
      const category = categorizeStyle(file, content);
      const narrativeFlow = extractNarrativeFlow(baseName, content);

      let platformTag = 'X.Thread';
      if (content.includes('supported_output_formats: ["article"') || content.includes('format: "article"') || content.includes('format: "long_form_article"')) {
        platformTag = 'X.Article';
      }

      const cardText = `- [ ] [[${baseName}|${narrativeFlow}. ${platformTag}]]`;
      categoryMap[category].push(cardText);
    } catch (e) {}
  }

  const mocLines = [
    `---`,
    `type: MOC`,
    `database: Lulua Style Bank`,
    `kanban-plugin: board`,
    `---`,
    ``
  ];

  CATEGORIES.forEach(cat => {
    mocLines.push(`## ${cat}`);
    mocLines.push(``);
    const cards = categoryMap[cat];
    if (cards.length > 0) {
      cards.forEach(card => mocLines.push(card));
    }
    mocLines.push(``);
  });

  mocLines.push(`%% kanban:settings`);
  mocLines.push(`{"kanban-plugin":"board","list-collapse":[false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]}`);
  mocLines.push(`%%`);

  fs.writeFileSync(path.join(STYLE_BANK_DIR, '00-Style-Bank-MOC.md'), mocLines.join('\n'));
  console.log(`✅ Updated Style Bank MOC to Kanban Board: 00-Style-Bank-MOC.md (${files.length} styles indexed)`);
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
updateAccountAuditsMOC();
