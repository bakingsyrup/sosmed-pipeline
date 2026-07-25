/**
 * Beidou Snapshot Manager (`beidou_snapshot_manager.mjs`)
 *
 * Responsibilities:
 * 1. Reads all active cohort config files from `beidou-pipeline/00-Cohorts/`.
 * 2. Deduplicates target, peer, and leader handles across cohorts.
 * 3. Computes yesterday's UTC time window.
 * 4. Builds per-handle tweet-ID dedup indices from `01-Snapshots/tweet-ids/`.
 * 5. Skips if today's snapshot already exists with valid data.
 * 6. Triggers `x_headless_adapter.mjs` to fetch yesterday's posts.
 * 7. Updates dedup indices after successful scrape.
 * 8. Processes raw data with Time-Adjusted Impression Yield & Engagement Rate %.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline';
const COHORTS_DIR = path.join(BASE_DIR, 'beidou-pipeline/00-Cohorts');
const SNAPSHOTS_DIR = path.join(BASE_DIR, 'beidou-pipeline/01-Snapshots');
const DEDUP_DIR = path.join(SNAPSHOTS_DIR, 'tweet-ids');
const ADAPTER_PATH = path.join(BASE_DIR, 'Configuration/beidou/adapters/x_headless_adapter.mjs');

// Ensure directories exist
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
if (!fs.existsSync(DEDUP_DIR)) fs.mkdirSync(DEDUP_DIR, { recursive: true });

/**
 * Load all handles across saved cohort JSON files.
 * Returns handles, cohorts, and a Set of target handle names.
 */
export function getAllCohortHandles() {
  if (!fs.existsSync(COHORTS_DIR)) return { handles: [], cohorts: [], targets: new Set() };

  const files = fs.readdirSync(COHORTS_DIR).filter(f => f.endsWith('.json'));
  const handleSet = new Set();
  const targetSet = new Set();
  const cohorts = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(COHORTS_DIR, file), 'utf-8');
      const cohort = JSON.parse(raw);
      cohorts.push(cohort);

      const target = (cohort.target_account || '').replace(/^@/, '');
      if (target) {
        handleSet.add(target);
        targetSet.add(target);
      }
      if (Array.isArray(cohort.tiers?.peer_tier)) {
        cohort.tiers.peer_tier.forEach(h => handleSet.add(h.replace(/^@/, '')));
      }
      if (Array.isArray(cohort.tiers?.leader_tier)) {
        cohort.tiers.leader_tier.forEach(h => handleSet.add(h.replace(/^@/, '')));
      }
    } catch (err) {
      console.error(`[beidou-snapshot] Error reading cohort ${file}:`, err.message);
    }
  }

  return { handles: Array.from(handleSet), cohorts, targets: targetSet };
}

/**
 * Check if today's snapshot already exists and contains valid data.
 */
function hasValidSnapshotToday() {
  const todayStr = new Date().toISOString().split('T')[0];
  const snapshotFile = path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`);
  if (!fs.existsSync(snapshotFile)) return false;

  try {
    const data = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    return Array.isArray(data) && data.length > 0 && data.some(a => a.followers > 0 && Array.isArray(a.tweets) && a.tweets.length > 0);
  } catch {
    return false;
  }
}

/**
 * Load per-handle tweet-ID dedup indices from disk.
 */
function loadDedupIndices(handles) {
  const map = {};
  for (const handle of handles) {
    const f = path.join(DEDUP_DIR, `${handle}.json`);
    if (fs.existsSync(f)) {
      try {
        map[handle] = JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch {}
    }
    if (!map[handle]) map[handle] = [];
  }
  return map;
}

/**
 * Update per-handle tweet-ID dedup indices with newly scraped tweet IDs.
 */
function updateDedupIndices(accounts) {
  for (const account of accounts) {
    if (!account.handle || !account.tweets?.length) continue;
    const f = path.join(DEDUP_DIR, `${account.handle}.json`);
    let existing = [];
    if (fs.existsSync(f)) {
      try { existing = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
    }
    const merged = new Set(existing);
    for (const tweet of account.tweets) {
      if (tweet.id) merged.add(tweet.id);
    }
    fs.writeFileSync(f, JSON.stringify([...merged]), 'utf8');
  }
}

/**
 * Execute snapshot collection batch.
 * Skips if today already ran. Scrapes yesterday's posts for all cohort handles.
 */
export async function runSnapshotBatch(options = {}) {
  const { handles, cohorts, targets } = getAllCohortHandles();
  if (handles.length === 0) {
    console.log('[beidou-snapshot] No handles found in cohorts directory.');
    return { ok: false, error: 'No handles found' };
  }

  // ── Early exit: skip if today already ran successfully ──
  if (hasValidSnapshotToday()) {
    console.log('[beidou-snapshot] Today\'s snapshot already exists with valid data. Skipping scrape.');
    const todayStr = new Date().toISOString().split('T')[0];
    return { ok: true, file: path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`), skipped: true };
  }

  // ── Compute yesterday's UTC window ──
  const now = new Date();
  const yesterdayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
  const yesterdayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  const sinceISO = yesterdayStart.toISOString();
  const untilISO = yesterdayEnd.toISOString();
  const todayStr = now.toISOString().split('T')[0];
  const snapshotFile = path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`);

  console.log(`[beidou-snapshot] Yesterday window: ${sinceISO} → ${untilISO}`);
  console.log(`[beidou-snapshot] Starting batch scrape for ${handles.length} unique handles across ${cohorts.length} cohort(s)...`);

  // ── Build dedup indices and targets ──
  const dedupMap = loadDedupIndices(handles);
  const dedupCount = Object.values(dedupMap).reduce((sum, ids) => sum + ids.length, 0);
  if (dedupCount > 0) console.log(`[beidou-snapshot] Loaded ${dedupCount} known tweet IDs across ${Object.keys(dedupMap).length} handles`);

  const targetList = Array.from(targets).join(',');
  if (targetList) console.log(`[beidou-snapshot] Target accounts (fetch all): ${targetList}`);

  const dedupArgFile = path.join(SNAPSHOTS_DIR, `_dedup-work-${todayStr}.json`);
  fs.writeFileSync(dedupArgFile, JSON.stringify(dedupMap), 'utf8');

  return new Promise((resolve) => {
    const args = [
      ADAPTER_PATH,
      '--out', snapshotFile,
      '--since', sinceISO,
      '--until', untilISO,
      '--dedup-file', dedupArgFile,
    ];
    if (targetList) args.push('--targets', targetList);
    args.push(...handles);

    const child = spawn('node', args, {
      cwd: BASE_DIR,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      // Clean up temp dedup file
      try { fs.unlinkSync(dedupArgFile); } catch {}

      if (code === 0 && fs.existsSync(snapshotFile)) {
        try {
          const raw = fs.readFileSync(snapshotFile, 'utf-8');
          const data = JSON.parse(raw);
          const processed = processSnapshotMetrics(data);
          fs.writeFileSync(snapshotFile, JSON.stringify(processed, null, 2), 'utf-8');

          // Update dedup indices with newly scraped tweet IDs
          updateDedupIndices(data);

          console.log(`[beidou-snapshot] Successfully processed & saved snapshot: ${snapshotFile}`);
          resolve({ ok: true, file: snapshotFile, accountsScraped: data.length });
        } catch (err) {
          console.error('[beidou-snapshot] Error post-processing snapshot:', err.message);
          resolve({ ok: false, error: err.message });
        }
      } else {
        console.error(`[beidou-snapshot] Adapter exited with code ${code}`);
        resolve({ ok: false, error: `Adapter exit code ${code}` });
      }
    });
  });
}

/**
 * Process raw snapshot array and calculate Time-Adjusted Impression Yield & Engagement Rate %
 */
export function processSnapshotMetrics(rawAccounts) {
  const now = Date.now();

  return rawAccounts.map(account => {
    const followers = account.followers || 1;

    const processedTweets = (account.tweets || []).map(tweet => {
      const pubTime = tweet.ts_epoch || (tweet.timestamp ? new Date(tweet.timestamp).getTime() : now);
      const ageHours = Math.max(0.1, (now - pubTime) / (1000 * 3600));

      const impressions = tweet.views || 0;
      const engagements = (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0) + (tweet.bookmarks || 0);

      const impression_yield_pct = (impressions / followers) * 100;
      const engagement_rate_pct = impressions > 0 ? (engagements / impressions) * 100 : 0;

      let time_window = 'LIVE';
      if (ageHours >= 22 && ageHours <= 26) time_window = 'T+24h';
      else if (ageHours >= 46 && ageHours <= 50) time_window = 'T+48h';
      else if (ageHours > 50) time_window = 'HISTORICAL';

      return {
        ...tweet,
        post_age_hours: parseFloat(ageHours.toFixed(2)),
        time_window,
        impression_yield_pct: parseFloat(impression_yield_pct.toFixed(2)),
        engagement_rate_pct: parseFloat(engagement_rate_pct.toFixed(2)),
      };
    });

    return {
      ...account,
      snapshot_timestamp: new Date().toISOString(),
      tweets: processedTweets,
    };
  });
}

// CLI Execution support
if (process.argv[1] === __filename) {
  runSnapshotBatch().then(res => console.log('Snapshot Result:', res));
}
