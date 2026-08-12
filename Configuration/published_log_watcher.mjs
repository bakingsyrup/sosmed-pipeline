import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import console from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIPELINE_BASE = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline';
const STYLE_BANK_DIR = path.join(PIPELINE_BASE, 'lulua-pipeline/01-Style-Bank');
const HISTORY_LOG_PATH = path.join(__dirname, 'topic_history_log.json');
const INBOX_PATH = path.join(PIPELINE_BASE, '01-Inbox');
const TEMPLATE_PATH = path.join(INBOX_PATH, '_LOG_PUBLISHED_POST.md');
const IMAGE_ARCHIVE_DIR = path.join(PIPELINE_BASE, '01-Inbox', '_LOG_PUBLISHED_IMAGES');

const VALID_CONTENT_TYPES = [
  'x_thread', 'instagram_carousel', 'youtube_short',
  'youtube_longform', 'tiktok', 'linkedin_article'
];

const PLATFORM_MAP = {
  x_thread: 'X',
  instagram_carousel: 'Instagram',
  youtube_short: 'YouTube',
  youtube_longform: 'YouTube',
  tiktok: 'TikTok',
  linkedin_article: 'LinkedIn'
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const meta = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return meta;
}

function extractStyleArchetype(styleFilename) {
  if (!styleFilename || typeof styleFilename !== 'string') return null;
  const name = styleFilename.replace(/^style-/, '');
  const parts = name.split('_');
  if (parts.length < 3) {
    const trimmed = styleFilename.replace(/^style-/, '').replace(/_v\d+$/, '');
    return trimmed || null;
  }
  return parts[2] || null;
}

function validateStyle(styleFilename) {
  if (!styleFilename) return { valid: false, error: 'Style filename is empty' };
  const filePath = path.join(STYLE_BANK_DIR, `${styleFilename}.md`);
  if (!fs.existsSync(filePath)) return { valid: false, error: `Style file not found: ${styleFilename}.md in Style Bank` };
  return { valid: true, archetype: extractStyleArchetype(styleFilename) };
}

function parsePostBlocks(body) {
  const posts = [];
  const sections = body.split(/\n## Post (\d+)\n/);
  for (let i = 1; i < sections.length; i += 2) {
    const index = parseInt(sections[i], 10);
    const rawContent = (sections[i + 1] || '').trim();
    if (!rawContent || rawContent.startsWith('<!--') || rawContent === '<!-- Paste full post text') {
      continue;
    }
    const cleanContent = rawContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!cleanContent) continue;
    const imageMatches = [...cleanContent.matchAll(/!\[([^\]]*)\]\(([^\)]+)\)/g)];
    const images = imageMatches.map(m => ({
      alt: m[1] || null,
      path: m[2] || null,
      wikiLink: m[0]
    }));
    posts.push({
      index,
      text: cleanContent,
      images: images.length > 0 ? images : null
    });
  }
  return posts;
}

function collectImageFiles(posts) {
  const imageFiles = [];
  for (const post of posts) {
    if (post.images) {
      for (const img of post.images) {
        if (img.path && !img.path.startsWith('http')) {
          const absPath = path.isAbsolute(img.path) ? img.path : path.join(PIPELINE_BASE, img.path);
          if (fs.existsSync(absPath)) {
            imageFiles.push({ source: absPath, filename: path.basename(absPath), wikiLink: img.wikiLink });
          }
        }
      }
    }
  }
  return imageFiles;
}

function archiveImages(imageFiles, logId) {
  const archiveDir = path.join(IMAGE_ARCHIVE_DIR, logId);
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  const archived = [];
  for (const img of imageFiles) {
    const destPath = path.join(archiveDir, img.filename);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(img.source, destPath);
      console.log(`[Published Log] Archived image: ${img.filename} -> ${archiveDir}`);
    }
    archived.push({ original: img.wikiLink, archivePath: destPath });
  }
  return archived;
}

function readHistoryLog() {
  if (fs.existsSync(HISTORY_LOG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_LOG_PATH, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function appendHistoryEntry(entry) {
  const history = readHistoryLog();
  history.push(entry);
  fs.writeFileSync(HISTORY_LOG_PATH, JSON.stringify(history, null, 2), 'utf8');
  console.log(`[Published Log] Appended entry ${entry.id} to topic_history_log.json`);
}

function regenerateTemplate() {
  const posts = Array.from({ length: 25 }, (_, i) => `## Post ${i + 1}\n\n`);
  const template = `---
type: Published Post Log
status: draft
style: ""
content_type: ""
topic_id: ""
post_url: ""
published_at: ""
---

# Published Content Body

${posts.join('\n')}`;
  fs.writeFileSync(TEMPLATE_PATH, template, 'utf8');
  console.log(`[Published Log] Regenerated blank template.`);
}

async function processLogNote() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    regenerateTemplate();
    return;
  }

  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const fm = parseFrontmatter(content);
  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n?/, '');

  if (fm.status !== 'ready' || fm.type !== 'Published Post Log') return;

  console.log(`\n----------------------------------------`);
  console.log(`[Published Log] Detected status: ready. Processing...`);

  const errors = [];

  if (!fm.style || !fm.style.trim()) {
    errors.push('style is empty');
  }
  if (!fm.content_type || !VALID_CONTENT_TYPES.includes(fm.content_type)) {
    errors.push(`content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }
  if (!fm.published_at || !fm.published_at.trim()) {
    errors.push('published_at is empty');
  }

  if (errors.length > 0) {
    console.error(`[Published Log] Validation failed: ${errors.join('; ')}`);
    return;
  }

  const styleValidation = validateStyle(fm.style.trim());
  if (!styleValidation.valid) {
    console.error(`[Published Log] Style validation failed: ${styleValidation.error}`);
    return;
  }

  const posts = parsePostBlocks(bodyContent);
  const postCount = posts.length;
  console.log(`[Published Log] Found ${postCount} non-empty post blocks. Archetype: ${styleValidation.archetype}`);

  const imageFiles = collectImageFiles(posts);
  const timestamp = Date.now();
  const logId = `log_${fm.published_at.replace(/-/g, '')}_${timestamp}`;

  let archivedImages = [];
  if (imageFiles.length > 0) {
    archivedImages = archiveImages(imageFiles, logId);
    console.log(`[Published Log] Archived ${archivedImages.length} images.`);
  }

  const entry = {
    id: logId,
    published_at: fm.published_at,
    content_type: fm.content_type,
    topic_id: fm.topic_id && fm.topic_id.trim() ? fm.topic_id.trim() : null,
    style: fm.style.trim(),
    style_archetype: styleValidation.archetype,
    platform: PLATFORM_MAP[fm.content_type] || 'Unknown',
    post_url: fm.post_url && fm.post_url.trim() ? fm.post_url.trim() : null,
    post_count: postCount,
    posts: posts.map(p => ({
      index: p.index,
      text: p.text.slice(0, 500),
      image_count: p.images ? p.images.length : 0
    })),
    archived_images: archivedImages.length > 0 ? archivedImages.map(a => a.archivePath) : null
  };

  appendHistoryEntry(entry);
  regenerateTemplate();

  console.log(`[Published Log] Done. (style: ${fm.style}, archetype: ${styleValidation.archetype}, platform: ${entry.platform}, posts: ${postCount})`);
}

let lastCheck = false;
let wasInError = false;

async function checkForLogNote() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    regenerateTemplate();
    return;
  }

  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const fm = parseFrontmatter(content);
  const isReady = fm.status === 'ready' && fm.type === 'Published Post Log';

  if (isReady && !lastCheck) {
    try {
      await processLogNote();
      wasInError = false;
    } catch (err) {
      if (!wasInError) {
        console.error(`[Published Log] Error: ${err.message}`);
        wasInError = true;
      }
    }
  }

  if (wasInError && !isReady) {
    wasInError = false;
  }

  lastCheck = isReady;
}

console.log('📋 [Published Log Watcher] Starting daemon...');
console.log(`   Watching: ${TEMPLATE_PATH}`);
console.log('   Polling every 5 seconds. Press Ctrl+C to stop.');
checkForLogNote();
setInterval(checkForLogNote, 5000);
