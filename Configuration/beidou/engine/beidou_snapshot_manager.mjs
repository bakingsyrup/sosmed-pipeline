/**
 * Beidou Snapshot Manager (`beidou_snapshot_manager.mjs`)
 *
 * Responsibilities:
 * 1. Reads all active cohort config files from `beidou-pipeline/00-Cohorts/`.
 * 2. Deduplicates target, peer, and leader handles across cohorts.
 * 3. Triggers `x_headless_adapter.mjs` to fetch current profile & post metrics.
 * 4. Stores raw dated snapshot files in `beidou-pipeline/01-Snapshots/`.
 * 5. Tags posts with Fixed Time-Window metrics (T+24h and T+48h Impression Yield %).
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
const ADAPTER_PATH = path.join(BASE_DIR, 'Configuration/beidou/adapters/x_headless_adapter.mjs');

// Ensure directories exist
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

/**
 * Load all handles across saved cohort JSON files
 */
export function getAllCohortHandles() {
  if (!fs.existsSync(COHORTS_DIR)) return { handles: [], cohorts: [] };

  const files = fs.readdirSync(COHORTS_DIR).filter(f => f.endsWith('.json'));
  const handleSet = new Set();
  const cohorts = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(COHORTS_DIR, file), 'utf-8');
      const cohort = JSON.parse(raw);
      cohorts.push(cohort);

      if (cohort.target_account) handleSet.add(cohort.target_account.replace(/^@/, ''));
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

  return { handles: Array.from(handleSet), cohorts };
}

/**
 * Execute snapshot collection batch
 */
export async function runSnapshotBatch(options = {}) {
  const { handles, cohorts } = getAllCohortHandles();
  if (handles.length === 0) {
    console.log('[beidou-snapshot] No handles found in cohorts directory.');
    return { ok: false, error: 'No handles found' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const snapshotFile = path.join(SNAPSHOTS_DIR, `snapshot-${todayStr}.json`);

  console.log(`[beidou-snapshot] Starting batch scrape for ${handles.length} unique handles across ${cohorts.length} cohort(s)...`);

  return new Promise((resolve) => {
    const child = spawn('node', [ADAPTER_PATH, '--out', snapshotFile, '--limit', '10', ...handles], {
      cwd: BASE_DIR,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(snapshotFile)) {
        try {
          const raw = fs.readFileSync(snapshotFile, 'utf-8');
          const data = JSON.parse(raw);
          const processed = processSnapshotMetrics(data);
          fs.writeFileSync(snapshotFile, JSON.stringify(processed, null, 2), 'utf-8');
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

      // Raw metrics
      const impression_yield_pct = (impressions / followers) * 100;
      const engagement_rate_pct = impressions > 0 ? (engagements / impressions) * 100 : 0;

      // Fixed Window Tagging (T+24h: 22h-26h, T+48h: 46h-50h)
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
