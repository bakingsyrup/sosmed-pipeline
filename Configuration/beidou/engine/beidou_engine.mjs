/**
 * Beidou Diagnostic Calculation Engine (`beidou_engine.mjs`)
 *
 * Core Math Responsibilities:
 * 1. Computes Peer Tier Normalized Medians (Impression Yield %, Engagement Rate %, Growth Velocity %).
 * 2. Computes Net Relative Variance ($V = \Delta_{iroi} - \Delta_{cohort}$).
 * 3. Categorizes performance: 🟢 AHEAD, ⚪ PARITY, 🟡 MACRO_DOWNTURN, 🔴 MICRO_FAILURE.
 * 4. Extracts Leader Tier winning format archetypes.
 * 5. Generates structured JSON reports in `beidou-pipeline/02-Reports/`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline';
const COHORTS_DIR = path.join(BASE_DIR, 'beidou-pipeline/00-Cohorts');
const SNAPSHOTS_DIR = path.join(BASE_DIR, 'beidou-pipeline/01-Snapshots');
const REPORTS_DIR = path.join(BASE_DIR, 'beidou-pipeline/02-Reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Generate diagnostic report for a given cohort config and time window (days: 1, 7, 14, 30, 90)
 */
export function runCohortDiagnostics(cohortId, days = 1) {
  const safeId = cohortId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cohortFile = path.join(COHORTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(cohortFile)) {
    return { ok: false, error: `Cohort config ${safeId}.json not found` };
  }

  const cohort = JSON.parse(fs.readFileSync(cohortFile, 'utf-8'));
  const targetHandle = (cohort.target_account || '').replace(/^@/, '').toLowerCase();
  const peerHandles = (cohort.tiers?.peer_tier || []).map(h => h.replace(/^@/, '').toLowerCase());
  const leaderHandles = (cohort.tiers?.leader_tier || []).map(h => h.replace(/^@/, '').toLowerCase());

  // Find snapshot files
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return { ok: false, error: 'No snapshot files found in 01-Snapshots' };
  }

  const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(SNAPSHOTS_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (snapshotFiles.length === 0) {
    return { ok: false, error: 'No valid snapshot-*.json data files found' };
  }

  // Determine time range label & filter snapshot files within date window
  const daysNum = parseInt(days, 10) || 1;
  let timeRangeLabel = '1D';
  if (daysNum >= 90) timeRangeLabel = '3M';
  else if (daysNum >= 30) timeRangeLabel = '30D';
  else if (daysNum >= 14) timeRangeLabel = '14D';
  else if (daysNum >= 7) timeRangeLabel = '7D';

  const cutoffMs = Date.now() - (daysNum * 24 * 3600 * 1000);
  const targetSnapshots = snapshotFiles.filter((f, idx) => idx === 0 || f.mtime >= cutoffMs);
  const snapshotsCounted = targetSnapshots.length;

  // Aggregate account data across selected snapshot files
  const accountMap = new Map(); // handle -> { latestFollowers, oldestFollowers, tweetsMap }

  targetSnapshots.forEach((snapFile, snapIndex) => {
    try {
      const snapPath = path.join(SNAPSHOTS_DIR, snapFile.name);
      const rawData = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));

      rawData.forEach(acc => {
        const handle = (acc.handle || '').toLowerCase();
        if (!accountMap.has(handle)) {
          accountMap.set(handle, {
            latestFollowers: acc.followers || 0,
            oldestFollowers: acc.followers || 0,
            tweetsMap: new Map(),
          });
        }

        const entry = accountMap.get(handle);
        // First snapshot in array is latest
        if (snapIndex === 0) entry.latestFollowers = acc.followers || 0;
        // Last snapshot in array is oldest in window
        entry.oldestFollowers = acc.followers || 0;

        // Merge tweets deduplicated by ID
        if (Array.isArray(acc.tweets)) {
          acc.tweets.forEach(t => {
            if (t.id && !entry.tweetsMap.has(t.id)) {
              entry.tweetsMap.set(t.id, t);
            }
          });
        }
      });
    } catch (e) {}
  });

  // Calculate Peer Tier Medians
  const peerYields = [];
  const peerEngagements = [];

  peerHandles.forEach(h => {
    const acc = accountMap.get(h);
    if (acc) {
      acc.tweetsMap.forEach(t => {
        if (t.impression_yield_pct !== undefined) peerYields.push(t.impression_yield_pct);
        if (t.engagement_rate_pct !== undefined) peerEngagements.push(t.engagement_rate_pct);
      });
    }
  });

  const peerMedianYield = calculateMedian(peerYields);
  const peerMedianEngagement = calculateMedian(peerEngagements);

  // Target Account Metrics
  const targetAcc = accountMap.get(targetHandle);
  const targetTweets = targetAcc ? Array.from(targetAcc.tweetsMap.values()) : [];
  const targetYields = targetTweets.map(t => t.impression_yield_pct || 0);
  const targetMedianYield = calculateMedian(targetYields);
  const targetEngagements = targetTweets.map(t => t.engagement_rate_pct || 0);
  const targetMedianEngagement = calculateMedian(targetEngagements);

  // Net Relative Variance Math ($V = \Delta_{iroi} - \Delta_{cohort}$)
  const netVariancePct = parseFloat((targetMedianYield - peerMedianYield).toFixed(2));

  // Determine Diagnostic Category
  let diagnosticStatus = 'PARITY';
  let statusBadge = '⚪ PARITY';
  let summaryMessage = '';

  if (netVariancePct > 10.0) {
    diagnosticStatus = 'AHEAD';
    statusBadge = '🟢 AHEAD';
    summaryMessage = `Target account @${targetHandle} is outperforming peer cohort median by +${netVariancePct}%. Double down on current mix.`;
  } else if (netVariancePct < -15.0 && peerMedianYield >= 0.5) {
    diagnosticStatus = 'MICRO_FAILURE';
    statusBadge = '🔴 MICRO_FAILURE';
    summaryMessage = `Target account @${targetHandle} is dropping (-${Math.abs(netVariancePct)}%) while peers remain strong (${peerMedianYield}% median yield). Action required on content hook/topic selection.`;
  } else if (netVariancePct < -10.0 || peerMedianYield < 0.5) {
    diagnosticStatus = 'MACRO_DOWNTURN';
    statusBadge = '🟡 MACRO_DOWNTURN';
    summaryMessage = `Overall niche engagement is down (Peer median yield: ${peerMedianYield}%). Target account is moving with the market wave. Do NOT panic-pivot strategy.`;
  } else {
    diagnosticStatus = 'PARITY';
    statusBadge = '⚪ PARITY';
    summaryMessage = `Target account @${targetHandle} is performing in lockstep with the peer cohort median (${peerMedianYield}%).`;
  }

  // Leader Tier Top Performing Posts
  const leaderTopPosts = [];
  leaderHandles.forEach(h => {
    const acc = accountMap.get(h);
    if (acc) {
      acc.tweetsMap.forEach(t => {
        leaderTopPosts.push({
          handle: `@${h}`,
          followers: acc.latestFollowers,
          text: t.text,
          url: t.url,
          impression_yield_pct: t.impression_yield_pct || 0,
          likes: t.likes,
          retweets: t.retweets,
          replies: t.replies,
        });
      });
    }
  });

  leaderTopPosts.sort((a, b) => b.impression_yield_pct - a.impression_yield_pct);

  // Helper to process account into normalized entity
  const helperProcessAccount = (handle, role) => {
    const acc = accountMap.get(handle);
    if (!acc) return null;
    const tweets = Array.from(acc.tweetsMap.values());
    const yields = tweets.map(t => t.impression_yield_pct || 0);
    const maxYield = yields.length > 0 ? Math.max(...yields) : 0;
    const engagements = tweets.map(t => t.engagement_rate_pct || 0);
    const totalViews = tweets.reduce((sum, t) => sum + (t.views || 0), 0);
    const totalEngagements = tweets.reduce((sum, t) => sum + ((t.likes || 0) + (t.retweets || 0) + (t.replies || 0) + (t.bookmarks || 0)), 0);

    // Compute Follower Growth % across range
    let follower_growth_pct = 0;
    if (acc.oldestFollowers > 0 && acc.latestFollowers > 0) {
      follower_growth_pct = parseFloat((((acc.latestFollowers - acc.oldestFollowers) / acc.oldestFollowers) * 100).toFixed(2));
    }

    // Daily Post Volume: total posts divided by days window (or 1 if 1D)
    const daily_post_count = daysNum > 1 ? parseFloat((tweets.length / daysNum).toFixed(1)) : tweets.length;

    return {
      id: `@${handle}`,
      name: `@${handle}`,
      role,
      followers: acc.latestFollowers || 0,
      metrics: {
        impression_yield_pct: calculateMedian(yields),
        max_impression_yield_pct: parseFloat(maxYield.toFixed(2)),
        engagement_rate_pct: calculateMedian(engagements),
        daily_post_count,
        follower_growth_pct,
        total_views: totalViews,
        total_engagements: totalEngagements,
      }
    };
  };

  // Target Entity
  const entities = [];
  const targetEntity = helperProcessAccount(targetHandle, 'TARGET');
  if (targetEntity) entities.push(targetEntity);

  // Peer Entities
  const peerEntities = [];
  peerHandles.forEach(h => {
    const e = helperProcessAccount(h, 'PEER');
    if (e) {
      entities.push(e);
      peerEntities.push(e);
    }
  });

  // Leader Entities
  leaderHandles.forEach(h => {
    const e = helperProcessAccount(h, 'LEADER');
    if (e) entities.push(e);
  });

  // Calculate Peer Collective Entity
  const collectiveFollowers = peerEntities.length > 0 ? calculateMedian(peerEntities.map(p => p.followers)) : 0;
  const collectivePosts = peerEntities.length > 0 ? calculateMedian(peerEntities.map(p => p.metrics.daily_post_count)) : 0;
  const collectiveMaxYield = peerEntities.length > 0 ? calculateMedian(peerEntities.map(p => p.metrics.max_impression_yield_pct)) : 0;
  const collectiveGrowth = peerEntities.length > 0 ? calculateMedian(peerEntities.map(p => p.metrics.follower_growth_pct)) : 0;

  const collectiveEntity = {
    id: 'peer-collective',
    name: '👥 Peer Collective',
    role: 'COLLECTIVE',
    followers: Math.round(collectiveFollowers),
    metrics: {
      impression_yield_pct: peerMedianYield,
      max_impression_yield_pct: collectiveMaxYield,
      engagement_rate_pct: peerMedianEngagement,
      daily_post_count: collectivePosts,
      follower_growth_pct: collectiveGrowth,
      total_views: peerEntities.reduce((sum, p) => sum + p.metrics.total_views, 0),
      total_engagements: peerEntities.reduce((sum, p) => sum + p.metrics.total_engagements, 0),
    }
  };
  entities.push(collectiveEntity);

  const reportPayload = {
    cohort_id: safeId,
    target_account: `@${targetHandle}`,
    niche: cohort.niche || 'Crypto',
    snapshot_date: snapshotFiles[0].name,
    time_range: timeRangeLabel,
    days_window: daysNum,
    snapshots_counted: snapshotsCounted,
    total_data_days: snapshotFiles.length,
    diagnostic_status: diagnosticStatus,
    status_badge: statusBadge,
    net_variance_pct: netVariancePct,
    summary_message: summaryMessage,
    target_metrics: {
      follower_count: targetAcc?.latestFollowers || 0,
      median_impression_yield_pct: targetMedianYield,
      median_engagement_rate_pct: targetMedianEngagement,
    },
    peer_tier_benchmarks: {
      peer_count: peerHandles.length,
      median_impression_yield_pct: peerMedianYield,
      median_engagement_rate_pct: peerMedianEngagement,
    },
    entities,
    leader_tier_top_archetypes: leaderTopPosts.slice(0, 5),
    generated_at: new Date().toISOString(),
  };

  const reportFile = path.join(REPORTS_DIR, `report-${safeId}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(reportPayload, null, 2), 'utf-8');

  console.log(`[beidou-engine] Diagnostic report generated for ${timeRangeLabel} (${snapshotsCounted} snapshots): ${reportFile}`);
  return { ok: true, report: reportPayload, file: reportFile };
}

// CLI Execution support
if (process.argv[1] === __filename) {
  const cohortId = process.argv[2] || 'crypto-indonesia';
  const days = process.argv[3] || 1;
  runCohortDiagnostics(cohortId, days);
}
