/**
 * Beidou Daily Scheduler (`beidou_scheduler.mjs`)
 *
 * Runs once per day at 01:30 UTC via PM2 cron.
 * 1. Runs snapshot batch (scrapes yesterday's posts).
 * 2. Runs diagnostics for all cohorts.
 * 3. Exits with code 0 on success, 1 on failure.
 */

import { runSnapshotBatch } from './beidou_snapshot_manager.mjs';
import { runCohortDiagnostics } from './beidou_engine.mjs';
import fs from 'node:fs';
import path from 'node:path';

const COHORTS_DIR = '/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/beidou-pipeline/00-Cohorts';

console.log('[beidou-scheduler] Starting daily run...');

try {
  // ── Step 1: Run snapshot batch ──
  const snapResult = await runSnapshotBatch();
  if (!snapResult.ok) {
    console.error('[beidou-scheduler] Snapshot batch failed:', snapResult.error);
    process.exit(1);
  }
  if (snapResult.skipped) {
    console.log('[beidou-scheduler] Snapshot skipped (already exists). Proceeding with existing data.');
  }

  // ── Step 2: Run diagnostics for all cohorts ──
  if (!fs.existsSync(COHORTS_DIR)) {
    console.error('[beidou-scheduler] No cohorts directory found.');
    process.exit(1);
  }

  const cohortFiles = fs.readdirSync(COHORTS_DIR).filter(f => f.endsWith('.json'));
  if (cohortFiles.length === 0) {
    console.log('[beidou-scheduler] No cohort configs found. Skipping diagnostics.');
    process.exit(0);
  }

  let failures = 0;
  for (const file of cohortFiles) {
    const cohortId = file.replace(/\.json$/, '');
    const result = runCohortDiagnostics(cohortId);
    if (result.ok) {
      console.log(`[beidou-scheduler] ${cohortId}: ${result.report.status_badge} (variance: ${result.report.net_variance_pct}%)`);
    } else {
      console.error(`[beidou-scheduler] ${cohortId} FAILED:`, result.error);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`[beidou-scheduler] Completed with ${failures}/${cohortFiles.length} failures.`);
    process.exit(1);
  }

  // ── Step 3: Trigger Lulua Outlier Scanner & Executive Briefing ──
  console.log('[beidou-scheduler] Triggering Lulua Outlier Scanner & Executive Briefing...');
  try {
    const { runOutlierScanner } = await import('../../lulua/engine/lulua_outlier_scanner.mjs');
    await runOutlierScanner();
  } catch (luluaErr) {
    console.error('[beidou-scheduler] Error triggering Lulua outlier scan:', luluaErr.message);
  }

  console.log('[beidou-scheduler] Daily run complete successfully.');
  process.exit(0);
} catch (err) {
  console.error('[beidou-scheduler] Fatal error:', err.message);
  process.exit(1);
}
