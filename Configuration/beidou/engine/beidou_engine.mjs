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
 * Generate diagnostic report for a given cohort config
 */
export function runCohortDiagnostics(cohortId) {
  const safeId = cohortId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cohortFile = path.join(COHORTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(cohortFile)) {
    return { ok: false, error: `Cohort config ${safeId}.json not found` };
  }

  const cohort = JSON.parse(fs.readFileSync(cohortFile, 'utf-8'));
  const targetHandle = (cohort.target_account || '').replace(/^@/, '').toLowerCase();
  const peerHandles = (cohort.tiers?.peer_tier || []).map(h => h.replace(/^@/, '').toLowerCase());
  const leaderHandles = (cohort.tiers?.leader_tier || []).map(h => h.replace(/^@/, '').toLowerCase());

  // Find latest snapshot file
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return { ok: false, error: 'No snapshot files found in 01-Snapshots' };
  }

  const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (snapshotFiles.length === 0) {
    return { ok: false, error: 'No snapshot data available to analyze' };
  }

  const latestSnapshotPath = path.join(SNAPSHOTS_DIR, snapshotFiles[0]);
  const snapshotData = JSON.parse(fs.readFileSync(latestSnapshotPath, 'utf-8'));

  // Account Lookup Map
  const accountMap = new Map();
  snapshotData.forEach(acc => {
    accountMap.set((acc.handle || '').toLowerCase(), acc);
  });

  const targetAcc = accountMap.get(targetHandle);

  // Calculate Peer Tier Medians
  const peerYields = [];
  const peerEngagements = [];

  peerHandles.forEach(h => {
    const acc = accountMap.get(h);
    if (acc && Array.isArray(acc.tweets)) {
      acc.tweets.forEach(t => {
        if (t.impression_yield_pct !== undefined) peerYields.push(t.impression_yield_pct);
        if (t.engagement_rate_pct !== undefined) peerEngagements.push(t.engagement_rate_pct);
      });
    }
  });

  const peerMedianYield = calculateMedian(peerYields);
  const peerMedianEngagement = calculateMedian(peerEngagements);

  // Target Account Metrics
  const targetYields = (targetAcc?.tweets || []).map(t => t.impression_yield_pct || 0);
  const targetMedianYield = calculateMedian(targetYields);
  const targetEngagements = (targetAcc?.tweets || []).map(t => t.engagement_rate_pct || 0);
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
  } else if (netVariancePct < -15.0 && peerMedianYield >= 2.0) {
    diagnosticStatus = 'MICRO_FAILURE';
    statusBadge = '🔴 MICRO_FAILURE';
    summaryMessage = `Target account @${targetHandle} is dropping (-${Math.abs(netVariancePct)}%) while peers remain strong (${peerMedianYield}% median yield). Action required on content hook/topic selection.`;
  } else if (netVariancePct < -10.0 || peerMedianYield < 2.0) {
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
    if (acc && Array.isArray(acc.tweets)) {
      acc.tweets.forEach(t => {
        leaderTopPosts.push({
          handle: `@${acc.handle}`,
          followers: acc.followers,
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

  const reportPayload = {
    cohort_id: safeId,
    target_account: `@${targetHandle}`,
    niche: cohort.niche || 'Crypto',
    snapshot_date: snapshotFiles[0],
    diagnostic_status: diagnosticStatus,
    status_badge: statusBadge,
    net_variance_pct: netVariancePct,
    summary_message: summaryMessage,
    target_metrics: {
      follower_count: targetAcc?.followers || 0,
      median_impression_yield_pct: targetMedianYield,
      median_engagement_rate_pct: targetMedianEngagement,
    },
    peer_tier_benchmarks: {
      peer_count: peerHandles.length,
      median_impression_yield_pct: peerMedianYield,
      median_engagement_rate_pct: peerMedianEngagement,
    },
    leader_tier_top_archetypes: leaderTopPosts.slice(0, 5),
    generated_at: new Date().toISOString(),
  };

  const reportFile = path.join(REPORTS_DIR, `report-${safeId}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(reportPayload, null, 2), 'utf-8');

  console.log(`[beidou-engine] Diagnostic report generated: ${reportFile}`);
  return { ok: true, report: reportPayload, file: reportFile };
}

// CLI Execution support
if (process.argv[1] === __filename) {
  const cohortId = process.argv[2] || 'crypto-indonesia';
  runCohortDiagnostics(cohortId);
}
