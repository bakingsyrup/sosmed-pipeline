#!/usr/bin/env node
/**
 * Beidou Historical Backfill Script
 * Scrapes up to 200 historical posts per account across all cohort tiers
 * and populates multi-month snapshot data in 01-Snapshots/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { runCohortDiagnostics } from './beidou_engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIPELINE_ROOT = path.resolve(__dirname, '../../../beidou-pipeline');
const COHORTS_DIR   = path.join(PIPELINE_ROOT, '00-Cohorts');
const SNAPSHOTS_DIR = path.join(PIPELINE_ROOT, '01-Snapshots');
const TWEET_IDS_DIR = path.join(SNAPSHOTS_DIR, 'tweet-ids');
const ADAPTER_PATH  = path.resolve(__dirname, '../adapters/x_headless_adapter.mjs');

if (!fs.existsSync(TWEET_IDS_DIR)) fs.mkdirSync(TWEET_IDS_DIR, { recursive: true });

async function runBackfill(cohortId = 'crypto-indonesia', targetMaxPosts = 200) {
  const cohortFile = path.join(COHORTS_DIR, `${cohortId}.json`);
  if (!fs.existsSync(cohortFile)) {
    console.error(`Cohort file not found: ${cohortFile}`);
    process.exit(1);
  }

  const cohort = JSON.parse(fs.readFileSync(cohortFile, 'utf-8'));
  const targetHandle = (cohort.target_account || '').replace(/^@/, '').toLowerCase();
  const peerHandles = (cohort.tiers?.peer_tier || []).map(h => h.replace(/^@/, '').toLowerCase());
  const leaderHandles = (cohort.tiers?.leader_tier || []).map(h => h.replace(/^@/, '').toLowerCase());

  const allHandles = [...new Set([targetHandle, ...peerHandles, ...leaderHandles].filter(Boolean))];
  console.log(`[beidou-backfill] Starting 200-post historical backfill for cohort '${cohortId}' (${allHandles.length} handles)...`);

  // Load existing dedup map
  const dedupMap = {};
  allHandles.forEach(h => {
    const p = path.join(TWEET_IDS_DIR, `${h}.json`);
    if (fs.existsSync(p)) {
      try { dedupMap[h] = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { dedupMap[h] = []; }
    } else {
      dedupMap[h] = [];
    }
  });

  const dedupTempFile = path.join(SNAPSHOTS_DIR, `temp-dedup-backfill.json`);
  fs.writeFileSync(dedupTempFile, JSON.stringify(dedupMap, null, 2), 'utf-8');

  // 90 days ago cutoff
  const sinceISO = new Date(Date.now() - (90 * 24 * 3600 * 1000)).toISOString();
  const untilISO = new Date().toISOString();
  const tempOutFile = path.join(SNAPSHOTS_DIR, `temp-backfill-out.json`);

  const args = [
    ADAPTER_PATH,
    ...allHandles,
    '--targets', 'all',
    '--max-posts', String(targetMaxPosts),
    '--since', sinceISO,
    '--until', untilISO,
    '--dedup-file', dedupTempFile,
    '--out', tempOutFile,
  ];

  console.log(`[beidou-backfill] Executing CDP scraper adapter...`);
  const child = spawn('node', args, { stdio: 'inherit' });

  await new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Adapter exited with code ${code}`));
    });
  });

  if (!fs.existsSync(tempOutFile)) {
    console.error('[beidou-backfill] No output JSON produced by adapter');
    process.exit(1);
  }

  const scrapedData = JSON.parse(fs.readFileSync(tempOutFile, 'utf-8'));
  console.log(`[beidou-backfill] Scrape complete. Processing and grouping posts by date...`);

  // Group posts by date snapshot (YYYY-MM-DD)
  const snapshotDateMap = new Map(); // dateStr -> accountMap

  scrapedData.forEach(acc => {
    const handle = (acc.handle || '').toLowerCase();
    const tweets = Array.isArray(acc.tweets) ? acc.tweets : [];

    // Update dedup index
    if (!dedupMap[handle]) dedupMap[handle] = [];
    const dedupSet = new Set(dedupMap[handle]);
    tweets.forEach(t => { if (t.id) dedupSet.add(t.id); });
    dedupMap[handle] = [...dedupSet];
    fs.writeFileSync(path.join(TWEET_IDS_DIR, `${handle}.json`), JSON.stringify(dedupMap[handle], null, 2));

    tweets.forEach(t => {
      const dateStr = t.timestamp ? t.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
      if (!snapshotDateMap.has(dateStr)) {
        snapshotDateMap.set(dateStr, new Map());
      }
      const accMap = snapshotDateMap.get(dateStr);
      if (!accMap.has(handle)) {
        accMap.set(handle, { handle, followers: acc.followers || 0, tweets: [] });
      }
      accMap.get(handle).tweets.push(t);
    });
  });

  // Write/Merge into snapshot files
  let snapshotsCreated = 0;
  snapshotDateMap.forEach((accMap, dateStr) => {
    const snapFile = path.join(SNAPSHOTS_DIR, `snapshot-${dateStr}.json`);
    let existingData = [];
    if (fs.existsSync(snapFile)) {
      try { existingData = JSON.parse(fs.readFileSync(snapFile, 'utf-8')); } catch (e) {}
    }

    const existingMap = new Map(existingData.map(a => [a.handle.toLowerCase(), a]));

    accMap.forEach((accData, handle) => {
      if (!existingMap.has(handle)) {
        existingMap.set(handle, accData);
      } else {
        const ext = existingMap.get(handle);
        ext.followers = accData.followers || ext.followers;
        const tweetMap = new Map((ext.tweets || []).map(t => [t.id, t]));
        accData.tweets.forEach(t => tweetMap.set(t.id, t));
        ext.tweets = Array.from(tweetMap.values());
      }
    });

    const finalSnap = Array.from(existingMap.values());
    fs.writeFileSync(snapFile, JSON.stringify(finalSnap, null, 2), 'utf-8');
    snapshotsCreated++;
  });

  // Cleanup temp files
  try {
    if (fs.existsSync(dedupTempFile)) fs.unlinkSync(dedupTempFile);
    if (fs.existsSync(tempOutFile)) fs.unlinkSync(tempOutFile);
  } catch (e) {}

  console.log(`[beidou-backfill] Backfill merged into ${snapshotsCreated} snapshot date files!`);

  // Run diagnostics for 90D time range
  console.log(`[beidou-backfill] Re-running cohort diagnostics for 90D window...`);
  runCohortDiagnostics(cohortId, 90);
  console.log(`[beidou-backfill] Backfill successfully finished!`);
}

if (process.argv[1] === __filename) {
  const cohortId = process.argv[2] || 'crypto-indonesia';
  const targetMaxPosts = process.argv[3] ? parseInt(process.argv[3], 10) : 200;
  runBackfill(cohortId, targetMaxPosts).catch(err => {
    console.error(`[beidou-backfill] Error:`, err);
    process.exit(1);
  });
}
