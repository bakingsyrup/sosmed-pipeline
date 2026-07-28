import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGemini } from '../../services/gemini_api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const STYLE_BANK_DIR = path.join(BASE_DIR, 'lulua-pipeline/01-Style-Bank');

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

export async function runPostDissection(inputUrlOrText, platform = 'x') {
  console.log(`📐 [Lulua] Dissecting Post Wireframe for Style Bank...`);

  const systemInstruction = `You are Lulua, the Interactive Style R&D Engine for Iroi media business.
Your task is to dissect a viral social media post into Lulua's Standardized 4-Part Style Bank Wireframe Schema:

Part 1: Metadata & Ratio Trigger (Target metric: Bookmarks, Replies, Retweets, Views).
Part 2: Psychological Lever (Primary emotional driver: Utility, Contrarian, FOMO, Debate, Pride).
Part 3: Micro-Rhythm & Pacing Rules (Hook length caps, line-break density, sentence caps).
Part 4: Plug-and-Play Wireframe Blueprint (Bracketed parameter slots: [Hook], [Setup], [Body], [Closing/CTA]).

Format output cleanly as a standalone Style Bank Markdown file. Include a short 1-word descriptive style name in frontmatter (e.g. style_name: "dialogue_breakdown").`;

  const userPrompt = `Input Post / URL:
${inputUrlOrText}

Platform: ${platform.toUpperCase()}

Please dissect this post and generate the complete 4-Part Wireframe Schema for saving into the Post Style Bank.`;

  let styleMarkdown = '';
  try {
    const rawRes = await callGemini(userPrompt, systemInstruction, true);
    styleMarkdown = rawRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.warn('⚠️ Gemini call error during dissection, generating fallback wireframe:', err.message);
    const lines = inputUrlOrText.split('\n').filter(l => l.trim().length > 0);
    const hook = lines[0] || inputUrlOrText;

    styleMarkdown = `---
style_name: "custom_wireframe"
platform: "${platform}"
---

# 📐 Post Style Wireframe: Custom Wireframe

## Part 1: Metadata & Ratio Trigger
- **Target Metric:** Virality & Reach Yield Spike

## Part 2: Psychological Lever
- **Emotional Driver:** High Utility & Authority

## Part 3: Micro-Rhythm & Pacing Rules
- **Line Count:** ${lines.length} lines
- **Pacing:** Spaced multi-paragraph cadence with bold lead-ins.

## Part 4: Plug-and-Play Wireframe Blueprint
\`\`\`markdown
[Hook]: "${hook}"
[Setup / Evidence]: [Insert 2-3 supporting bullet points or evidence]
[Closing / CTA]: [Insert open-ended debate question or takeaway]
\`\`\`
`;
  }

  // Extract style name from output or generate timestamp name
  const match = styleMarkdown.match(/style_name:\s*["']?([a-zA-Z0-9_-]+)["']?/);
  const styleName = match ? match[1] : `wireframe_${Date.now()}`;

  // Prepend Source Link & Complete Original Post Text block
  const urlMatch = inputUrlOrText.match(/https?:\/\/[^\s]+/);
  const postUrl = urlMatch ? urlMatch[0] : null;

  let sourceReferenceBlock = `## 📌 Source Reference & Original Post\n`;
  if (postUrl) {
    sourceReferenceBlock += `- 🔗 **Direct Post Link:** [Inspect Post on X](${postUrl})\n\n`;
  }
  sourceReferenceBlock += `### 📜 Complete Original Post Text:\n> ${inputUrlOrText.replace(/\n/g, '\n> ')}\n\n---\n\n`;

  // Inject source block right after frontmatter or header
  let finalMarkdown = styleMarkdown;
  if (finalMarkdown.includes('---') && finalMarkdown.indexOf('---', 3) !== -1) {
    const endFrontmatter = finalMarkdown.indexOf('---', 3) + 3;
    finalMarkdown = finalMarkdown.slice(0, endFrontmatter) + '\n\n' + sourceReferenceBlock + finalMarkdown.slice(endFrontmatter);
  } else {
    finalMarkdown = sourceReferenceBlock + finalMarkdown;
  }

  if (!fs.existsSync(STYLE_BANK_DIR)) {
    fs.mkdirSync(STYLE_BANK_DIR, { recursive: true });
  }

  const outputFile = path.join(STYLE_BANK_DIR, `style-${styleName}.md`);
  fs.writeFileSync(outputFile, finalMarkdown);

  try {
    const { updateStyleBankMOC } = await import('./lulua_moc_manager.mjs');
    updateStyleBankMOC();
  } catch (e) {}

  console.log(`✅ [Lulua] Post dissection complete. Saved to Style Bank: style-${styleName}.md`);

  return { ok: true, styleName, file: outputFile, filename: `style-${styleName}.md` };
}

// CLI execution check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputArg = process.argv[2] || 'https://x.com/satyaXBT/status/2081725743814578505';
  runPostDissection(inputArg).catch(err => {
    console.error('❌ Dissection execution failed:', err);
    process.exit(1);
  });
}
