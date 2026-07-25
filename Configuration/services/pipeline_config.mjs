import fs from 'fs';
import path from 'path';

/**
 * Default safe settings fallback if 00-Settings.md is missing or unreadable
 */
const DEFAULT_SETTINGS = {
  features: {
    video_clipper: true,
    glossary_automation: true
  }
};

/**
 * Helper to parse YAML-like key-value frontmatter block including nested feature maps
 */
function parseSettingsFrontmatter(content) {
  const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  if (!content) return settings;

  const lines = content.split('\n');
  let inFrontmatter = false;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '---') {
      if (i === 0) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        break;
      }
    }

    if (!inFrontmatter) continue;

    // Check section header (e.g. features:)
    if (line.match(/^[a-zA-Z0-9_-]+:\s*$/)) {
      currentSection = line.split(':')[0].trim();
      if (!settings[currentSection]) {
        settings[currentSection] = {};
      }
      continue;
    }

    // Check nested key value (e.g.   video_clipper: true)
    if (currentSection && line.startsWith('  ')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmed.slice(0, colonIdx).trim();
        const rawVal = trimmed.slice(colonIdx + 1).trim().toLowerCase();
        const boolVal = rawVal === 'true' || rawVal === 'on' || rawVal === '1' || rawVal === 'yes';
        settings[currentSection][key] = boolVal;
      }
      continue;
    }

    // Top-level key value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      currentSection = null;
      const key = trimmed.slice(0, colonIdx).trim();
      const rawVal = trimmed.slice(colonIdx + 1).trim();
      const rawValLower = rawVal.toLowerCase();
      if (rawValLower === 'true' || rawValLower === 'false' || rawValLower === 'on' || rawValLower === 'off') {
        settings[key] = (rawValLower === 'true' || rawValLower === 'on');
      } else {
        settings[key] = rawVal;
      }
    }
  }

  return settings;
}

/**
 * Get active pipeline settings from x-pipeline/00-Settings.md
 * @param {string} pipelineBase Base directory of x-pipeline
 * @returns {object} Pipeline settings object
 */
export function getPipelineSettings(pipelineBase) {
  try {
    const settingsPath = path.join(pipelineBase, '00-Settings.md');
    if (!fs.existsSync(settingsPath)) {
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(settingsPath, 'utf8');
    return parseSettingsFrontmatter(raw);
  } catch (err) {
    console.error(`[Pipeline Config] Error reading 00-Settings.md: ${err.message}. Using default fallbacks.`);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Check if a specific pipeline feature is enabled (evaluates note-level frontmatter overrides, global settings, and safe fallbacks)
 * @param {string} featureName Name of feature (e.g. 'video_clipper', 'glossary_automation')
 * @param {object} noteFrontmatter Note frontmatter object (optional)
 * @param {string} pipelineBase Base directory of x-pipeline
 * @returns {boolean} Whether feature is active
 */
export function isFeatureEnabled(featureName, noteFrontmatter = {}, pipelineBase) {
  // Tier 1: Check note frontmatter override (e.g. video: false or video_clipper: false or glossary: false)
  if (featureName === 'video_clipper' && noteFrontmatter.video !== undefined) {
    const v = String(noteFrontmatter.video).toLowerCase();
    return v === 'true' || v === 'on' || v === '1' || v === 'yes';
  }
  if (featureName === 'glossary_automation' && noteFrontmatter.glossary !== undefined) {
    const g = String(noteFrontmatter.glossary).toLowerCase();
    return g === 'true' || g === 'on' || g === '1' || g === 'yes';
  }
  if (noteFrontmatter[featureName] !== undefined) {
    const f = String(noteFrontmatter[featureName]).toLowerCase();
    return f === 'true' || f === 'on' || f === '1' || f === 'yes';
  }

  // Tier 2: Check global settings from 00-Settings.md
  const settings = getPipelineSettings(pipelineBase || process.env.PIPELINE_BASE || '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline');
  if (settings.features && settings.features[featureName] !== undefined) {
    return Boolean(settings.features[featureName]);
  }

  // Tier 3: Safe default fallback
  return DEFAULT_SETTINGS.features[featureName] ?? true;
}
