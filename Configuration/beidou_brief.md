# Beidou AI Briefing (`beidou_brief.md`)
**Last Updated:** July 26, 2026 (evening)

This document serves as the high-density technical blueprint and session context for **Beidou** (Iroi's Automated Account Performance & Competitor Diagnostic Engine).

---

## 📌 High-Level Architecture & File Map

Beidou tracks Iroi's account performance relative to direct competitor cohorts, normalizes engagement metrics, diagnoses macro vs. micro drops, and provides data-driven strategic feedback.

### Folder Pipeline Structure (`beidou-pipeline/` & `Configuration/beidou/`)
* **`beidou-pipeline/00-Cohorts/`**: Competitor cohort configuration files (JSON).
* **`beidou-pipeline/01-Snapshots/`**: Metric snapshot cache. Contains daily `snapshot-YYYY-MM-DD.json` files and `tweet-ids/` dedup index directory.
* **`beidou-pipeline/02-Reports/`**: Generated diagnostic reports and executive summaries.
* **`Configuration/beidou/adapters/`**: Decoupled Data Ingestion Adapters (X, YouTube, etc.).
* **`Configuration/beidou/engine/`**: Benchmark calculation and diagnostic logic.

### CDP Architecture (X Adapter)
* **Port**: 18800 (authenticated Chrome session — same browser as main X fetcher).
* **Page Strategy**: Shared page (`conn.page`) from `cdp-connect.mjs` — NOT `browser.newPage()` (cold pages render X without data-testid attributes).
* **Mutex**: `cdp-lock.mjs` with lock name `'18800-page'` — shared with main fetcher (`scrape-tweets.mjs`). Prevents concurrent Chrome usage.
* **Views Extraction**: `a[role="link"] span` aria-label pattern — works for all accounts.
* **Lifecycle**: One-shot script. Must call `process.exit(0)` after completion — CDP WebSocket keeps event loop alive.

---

## ⚡ Active Core Rules & Constraints

### 1. Fundamental Modular Build
* **Decoupled Architecture**: Ingestion, Benchmark Calculation, and Reporting are strictly separated. Changing data sources does not break the calculation engine.
* **Anti-Bloat Standards**: Maintain `beidou_brief.md` under **200 lines max** using the Pointer Principle and top 5 rolling changelog.

### 2. Fetch Logic (Time-Window + Dedup + Skip + Schedule)
* **Time Window**: Fetches yesterday's posts using UTC window (`yesterdayT00:00:00Z → todayT00:00:00Z`). Scrolling stops when oldest tweet on page falls outside window. Snapshot filename uses local date.
* **Dedup**: Per-handle tweet-ID indices stored in `01-Snapshots/tweet-ids/{handle}.json`. Adapter receives dedup set via `--dedup-file`, skips already-seen IDs.
* **Cap**: Target accounts get ALL tweets from window. Peer/leader accounts capped at 20 oldest (most mature metrics).
* **Skip Today**: Snapshot manager checks if today's `snapshot-YYYY-MM-DD.json` already has valid data. Skips scrape if yes.
* **Scheduler**: PM2 cron at 05:00 UTC daily (`beidou_scheduler.mjs` + `/home/silvester/beidou_daily.sh` wrapper). Runs snapshot batch → diagnostics for all cohorts → exits. Saved to PM2 dump for `pm2 resurrect`.

### 3. Diagnostic Core & VS/ALL Mode Architecture
* **Baseline Threshold Floor**: Absolute minimum healthy reach yield set to `0.5%` (20 views per 1,000 followers threshold for `MACRO_DOWNTURN` floor).
* **VS Mode (Head-to-Head)**: Compare target account directly against a single selected entity (`👥 Peer Collective` benchmark or specific handle) with live delta badges (`+X%` / `-X%`) and active metric bar charts.
* **ALL Mode (Full Cohort Matrix)**: Multi-bar distribution chart and sortable data matrix table comparing Target (Purple), Peer Collective (Blue), Peers, and Leaders across all raw metrics.
* **Multi-Timeframe Engine (`1D`, `7D`, `14D`, `30D`, `3M`)**: Aggregates tweets across snapshot files by actual `timestamp` date (not snapshot filename). Computes rolling medians for yield/engagement, total growth rate %, and average daily post volume. Missing metrics in bare backfill snapshots are computed on-the-fly.
* **Metadata Tracking**: Tracks `total_data_days` (total unique snapshot files in `01-Snapshots/`), `time_range`, and `snapshots_counted`.

### 4. Ad Astra UI Analytics Dashboard (Pivot & Visual Builder)
* **Numeric Pivot Table**: Slice & dice by Cohort, Account Tier, Time Window (T+24h / T+48h), and Shinku Draft Types. CSV export enabled.
* **Dynamic Visual Canvas**: Interactive VS/ALL comparison canvas with customizable metric selectors and localized inline timeframe pills (`1D`, `7D`, `14D`, `30D`, `3M`).
* **Flexible Dual-Account VS Selector**: Compare any 2 accounts in the cohort (Account A vs Account B) with side-by-side colored bars (Purple Account A vs Emerald Green Account B) and a dual-column drill-down inspector grid.
* **Instant Disk Recalculation**: Timeframe clicks pass `skipScrape: true` to recalculate diagnostics from disk in <5ms without acquiring Chrome CDP locks.

### 5. Decoupled Horizontal Architecture & Feedback UI
* **Horizontal Decoupled Model**: Shinku (Production) and Beidou (Intelligence) operate as independent peer tools at the same level with zero direct code/prompt coupling.
* **Human-in-the-Loop Feedback**: Beidou renders a dedicated **Strategic Feedback Card** in Ad Astra Sosmed Center UI displaying top winning formats, underperforming formats, and actionable recommendations for the human operator.

### 6. Storage Engine (Lightweight JSON File-Database)
* **Storage Model**: 100% file-based JSON database inside `beidou-pipeline/01-Snapshots/` (zero PostgreSQL / SQLite overhead).
* **Efficiency**: ~160 MB total footprint across 10 years of daily snapshots. In-memory array filtering, median calculations, and 7d/30d follower growth math execute in <5ms in Node.js.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Beidou full pipeline automated with daily PM2 cron scheduler at 05:00 UTC. Dual-Account VS Mode, inline timeframe canvas selector, 90D historical backfill, and 5-timeframe engine (1D-3M) active across 2 cohorts (18 accounts).
* **July 26, 2026**: Fixed 1D engine bug — now aggregates tweets by actual `timestamp` across snapshots instead of reading only the latest file. Added on-the-fly metric computation for backfill snapshots lacking `impression_yield_pct`/`engagement_rate_pct`. Server route now busts ESM module cache via `?v=mtime` so engine changes take effect without restart.
* **July 26, 2026**: Built Flexible Dual-Account VS Mode (`Account A vs Account B`) with side-by-side colored bars (Purple vs Emerald Green), inline canvas timeframe pills (`1D`-`3M`), and dual-column drill-down inspector grid.
* **July 26, 2026**: Completed 200-post 90-day historical backfill for `crypto-indonesia` (1,178 tweets across 89 snapshots) and `news-global` (779 tweets).
* **July 26, 2026**: Optimized timeframe switching with instant disk recalculation (`skipScrape: true`) and exact filename date sorting (`snapshot-YYYY-MM-DD.json`).
* **July 26, 2026**: Upgraded diagnostic engine with multi-timeframe aggregation (`1D`, `7D`, `14D`, `30D`, `3M` / 90 days), rolling medians, accurate 24h UTC post timestamp filtering, and `0.5%` yield floor threshold.


(End of file — total 78 lines)
