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
 * Check which accounts in today's snapshot have too few tweets and need re-scraping.
 * Returns { underCounted: string[], snapshotFile: string, data: array|null }
 *   - null data means no snapshot exists yet
 *   - empty underCounted means all accounts are fine → skip entire scrape
 */
const TARGET_MIN_TWEETS = 30;
const PEER_MIN_TWEETS   = 20;

function findUnderCountedAccounts(targets, allHandles) {
  const todayStr = new Date().toISOString().split('T')[0];
  const snapshotFile = path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`);

  if (!fs.existsSync(snapshotFile)) {
    return { underCounted: allHandles, snapshotFile, data: null };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) {
      return { underCounted: allHandles, snapshotFile, data: null };
    }
  } catch {
    return { underCounted: allHandles, snapshotFile, data: null };
  }

  const snapshotMap = {};
  for (const a of data) {
    if (a.handle) snapshotMap[a.handle.toLowerCase()] = a;
  }

  const underCounted = [];
  for (const h of allHandles) {
    const existing = snapshotMap[h.toLowerCase()];
    const minTweets = targets.has(h) ? TARGET_MIN_TWEETS : PEER_MIN_TWEETS;

    if (!existing || existing.error || existing.tweets?.length < minTweets) {
      underCounted.push(h);
    }
  }

  console.log(`[beidou-snapshot] Snapshot exists — ${allHandles.length - underCounted.length}/${allHandles.length} accounts OK, ${underCounted.length} need re-scrape`);
  return { underCounted, snapshotFile, data };
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

  // ── Compute yesterday's UTC window ──
  const now = new Date();
  const yesterdayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
  const yesterdayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  const sinceISO = yesterdayStart.toISOString();
  const untilISO = yesterdayEnd.toISOString();
  const todayStr = now.toISOString().split('T')[0];
  const snapshotFile = path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`);

  // ── Check which accounts need re-scraping ──
  const { underCounted, data: existingSnapshot } = findUnderCountedAccounts(targets, handles);

  if (underCounted.length === 0 && existingSnapshot) {
    console.log('[beidou-snapshot] All accounts have sufficient data. Skipping scrape.');
    return { ok: true, file: snapshotFile, skipped: true };
  }

  const scrapeHandles = underCounted;
  const isFullScrape = !existingSnapshot; // first-ever scrape needs dedup for all handles
  console.log(`[beidou-snapshot] Yesterday window: ${sinceISO} → ${untilISO}`);
  console.log(`[beidou-snapshot] Re-scraping ${scrapeHandles.length}/${handles.length} under-counted accounts${isFullScrape ? '' : ' (dedup disabled — fresh pass)'}...`);

  // Only pass dedup on the first-ever scrape. Re-scrapes skip dedup so deeper
  // scrolling picks up tweets the first pass missed (X lazy-loads more when dedup
  // doesn't remove already-seen content from the DOM).
  const dedupArgFile = path.join(SNAPSHOTS_DIR, `_dedup-work-${todayStr}.json`);
  const targetList = [...targets].filter(t => scrapeHandles.some(h => h.toLowerCase() === t.toLowerCase())).join(',');

  if (isFullScrape) {
    const dedupMap = loadDedupIndices(scrapeHandles);
    fs.writeFileSync(dedupArgFile, JSON.stringify(dedupMap), 'utf8');
  }
  if (targetList) console.log(`[beidou-snapshot] Target accounts (fetch all): ${targetList}`);

  return new Promise((resolve) => {
    const args = [
      ADAPTER_PATH,
      '--out', snapshotFile,
      '--since', sinceISO,
      '--until', untilISO,
    ];
    if (isFullScrape) args.push('--dedup-file', dedupArgFile);
    if (targetList) args.push('--targets', targetList);
    args.push(...scrapeHandles);

    const child = spawn('node', args, {
      cwd: BASE_DIR,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      try { fs.unlinkSync(dedupArgFile); } catch {}

      if (code === 0 && fs.existsSync(snapshotFile)) {
        try {
          const raw = fs.readFileSync(snapshotFile, 'utf-8');
          const freshData = JSON.parse(raw);

          // Merge fresh results into existing snapshot
          const mergedData = existingSnapshot
            ? mergeSnapshotData(existingSnapshot, freshData)
            : freshData;

          const processed = processSnapshotMetrics(mergedData);
          fs.writeFileSync(snapshotFile, JSON.stringify(processed, null, 2), 'utf-8');

          // Update dedup indices with newly scraped tweet IDs
          updateDedupIndices(freshData);

          console.log(`[beidou-snapshot] Successfully merged & saved snapshot: ${snapshotFile}`);
          resolve({ ok: true, file: snapshotFile, accountsScraped: mergedData.length });
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
 * Merge freshly scraped accounts into an existing snapshot array.
 * Existing accounts are kept; new/re-scraped accounts replace their old entries.
 */
function mergeSnapshotData(existing, fresh) {
  const merged = new Map();
  for (const a of existing) merged.set(a.handle.toLowerCase(), a);
  for (const a of fresh) {
    const old = merged.get(a.handle.toLowerCase());
    const freshCount = a.tweets?.length || 0;
    const oldCount = old?.tweets?.length || 0;
    if (!old || old.error || freshCount > oldCount) {
      if (old && !old.error && (a.followers || 0) === 0 && old.followers > 0) {
        a.followers = old.followers;
      }
      merged.set(a.handle.toLowerCase(), a);
    }
  }
  return Array.from(merged.values());
}

/**
 * Process raw snapshot array and calculate Time-Adjusted Impression Yield & Engagement Rate %
 */
export function processSnapshotMetrics(rawAccounts) {
  const now = Date.now();

  return rawAccounts.map(account => {
    const followers = account.followers > 0 ? account.followers : 0;

    const processedTweets = (account.tweets || []).map(tweet => {
      const pubTime = tweet.ts_epoch || (tweet.timestamp ? new Date(tweet.timestamp).getTime() : now);
      const ageHours = Math.max(0.1, (now - pubTime) / (1000 * 3600));

      const impressions = tweet.views || 0;
      const engagements = (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0) + (tweet.bookmarks || 0);

      const impression_yield_pct = followers > 0 ? parseFloat(((impressions / followers) * 100).toFixed(2)) : undefined;
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
