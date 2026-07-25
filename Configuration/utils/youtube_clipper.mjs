import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Executes the Python YouTube Clip Finder script.
 * 
 * @param {string} query Search query string
 * @param {string[]} keywords Array of keyword strings to match in subtitles
 * @param {string} entity Primary subject/entity name for dynamic channel prioritization
 * @param {string} outputId Base filename ID for the output .mp4
 * @returns {Promise<Object>} JSON result object containing status, media_path, obsidian_embed, etc.
 */
export function findAndClipVideo(query, keywords = [], entity = '', outputId = '') {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(__dirname, '../scripts/yt_clip_finder.py');
    const keywordStr = Array.isArray(keywords) ? keywords.join(',') : keywords;
    const outDir = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline/00-Media-Vault';

    const args = [
      scriptPath,
      '--query', query,
      '--keywords', keywordStr,
      '--entity', entity,
      '--output-id', outputId,
      '--out-dir', outDir
    ];

    execFile('python3', args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[youtube_clipper] Execution error: ${error.message}`);
        return resolve({ status: 'error', message: error.message });
      }

      try {
        const result = JSON.parse(stdout.trim());
        return resolve(result);
      } catch (parseErr) {
        console.error(`[youtube_clipper] JSON parse error: ${stdout}`);
        return resolve({ status: 'error', message: 'Failed to parse clip finder output' });
      }
    });
  });
}
