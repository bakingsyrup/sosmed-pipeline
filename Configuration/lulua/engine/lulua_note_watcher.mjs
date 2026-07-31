import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAccountAudit } from './lulua_account_auditor.mjs';
import { runPostDissection } from './lulua_post_dissecter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const INBOX_DIR = path.join(BASE_DIR, 'lulua-pipeline/00-Inbox');
const AUDIT_NOTE = path.join(INBOX_DIR, '_NEW_ACCOUNT_AUDIT.md');
const DISSECT_NOTE = path.join(INBOX_DIR, '_NEW_POST_DISSECTION.md');

// Helper to parse YAML frontmatter
function parseFrontmatter(content) {
  const meta = {};
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      const block = content.substring(3, endIdx);
      block.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
          meta[key] = val;
        }
      });
    }
  }
  return meta;
}

async function checkInboxNotes() {
  // Check Account Audit note
  if (fs.existsSync(AUDIT_NOTE)) {
    const content = fs.readFileSync(AUDIT_NOTE, 'utf8');
    const meta = parseFrontmatter(content);

    if (meta.status === 'fetch' && meta.handle) {
      console.log(`📥 [Note Watcher] Detected status: fetch for handle ${meta.handle}`);
      await runAccountAudit(meta.handle, meta.platform || 'x');

      // Update frontmatter to draft
      const updated = content.replace(/^status:\s*fetch/m, 'status: draft');
      fs.writeFileSync(AUDIT_NOTE, updated);
    } else if (meta.status === 'ready' && meta.handle) {
      console.log(`📥 [Note Watcher] Detected status: ready for audit of ${meta.handle}`);
      
      // Extract human notes section
      const notesIdx = content.indexOf('## 💰 Monetization & Funnel Notes');
      const humanNotes = notesIdx !== -1 ? content.substring(notesIdx) : '';

      await runAccountAudit(meta.handle, meta.platform || 'x', humanNotes);

      // Reset template
      const template = `---
status: draft
handle: ""
platform: "x"
---

# Account Audit Template

## 📊 Beidou Quantitative Data (Auto-Filled)

## 🔗 Surface Profile Info (Auto-Filled)

---------------------------------------------------------
## 💰 Monetization & Funnel Notes (Human Input)
`;
      fs.writeFileSync(AUDIT_NOTE, template);
    }
  }

  // Check Post Dissection note
  if (fs.existsSync(DISSECT_NOTE)) {
    const content = fs.readFileSync(DISSECT_NOTE, 'utf8');
    const meta = parseFrontmatter(content);

    if (meta.status === 'ready' && (meta.url || content.includes('http'))) {
      console.log(`📥 [Note Watcher] Detected status: ready for post dissection`);
      const urlMatch = content.match(/https?:\/\/[^\s\)\>]+/i);
      const target = (meta.url && meta.url.trim()) ? meta.url.trim() : (urlMatch ? urlMatch[0] : content);
      await runPostDissection(target, meta.platform || 'x');

      // Reset template
      const template = `---
status: draft
url: ""
platform: "x"
---

# Post Dissection Template

## 📌 Target Post Content / URL

## 📐 Extracted Structural Wireframe (Lulua Output)
`;
      fs.writeFileSync(DISSECT_NOTE, template);
    }
  }
}

// Start continuous polling / watching
console.log('👀 [Lulua] Starting Obsidian Inbox Note Watcher Daemon...');
setInterval(checkInboxNotes, 5000);
checkInboxNotes();
