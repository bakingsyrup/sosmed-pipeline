# Beidou AI Briefing (`beidou_brief.md`)
**Last Updated:** July 27, 2026

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
* **Page Strategy**: Shared page (`conn.page`) from `cdp-connect.mjs`.
* **Mutex**: `cdp-lock.mjs` with lock name `'18800-page'` — shared with main fetcher. File-based lock in `/tmp/opencode/` with PID-based auto-heal stale detection (dead PID or >5min old).
* **Chrome Lifecycle**: Restarted every 5 accounts via `killChrome` + `connectCDP` to prevent renderer bloat degrading later accounts. Lock held across restarts.
* **Scrolling**: `MAX_SCROLLS=200`, `STALE_LIMIT=10`, mouse wheel 800px/scroll with 1500ms delay. Boundary check per-scroll (ignores old pinned tweets from accumulated history).
* **Lifecycle**: One-shot script. Must call `process.exit(0)` after completion — CDP WebSocket keeps event loop alive.

---

## ⚡ Active Core Rules & Constraints

### 1. Fundamental Modular Build
* **Decoupled Architecture**: Ingestion, Benchmark Calculation, and Reporting are strictly separated. Changing data sources does not break the calculation engine.
* **Anti-Bloat Standards**: Maintain `beidou_brief.md` under **200 lines max** using the Pointer Principle and top 5 rolling changelog.

### 2. Fetch Logic (Time-Window + Dedup + Per-Account Skip + Schedule)
* **Time Window**: Fetches yesterday's posts using UTC window (`yesterdayT00:00:00Z → todayT00:00:00Z`). Boundary check only examines current scroll's tweets (not accumulated pins from prior scrolls). Snapshot filename uses local date.
* **Dedup**: Per-handle tweet-ID indices stored in `01-Snapshots/tweet-ids/{handle}.json`. Only passed to adapter on first-ever scrape; re-scrapes skip dedup so deeper scrolling picks up missed tweets.
* **Cap**: Target accounts get ALL tweets from window. Peer/leader accounts capped at 20 oldest (most mature metrics).
* **Per-Account Skip**: Instead of all-or-nothing daily skip, snapshot manager checks each account individually. Targets need ≥30 tweets, peers/leaders need ≥20. Only under-counted accounts are re-scraped. Results are smart-merged (keeps data with more tweets, never replaces good data with worse).
* **Scheduler**: PM2 cron at 05:00 UTC daily (`beidou_scheduler.mjs` + `/home/silvester/beidou_daily.sh` wrapper). Runs snapshot batch → diagnostics for all cohorts → exits.

### 3. Diagnostic Core & VS/ALL Mode Architecture
* **Baseline Threshold Floor**: Absolute minimum healthy reach yield set to `0.5%`.
* **VS Mode**: Head-to-head with delta badges and bar charts.
* **ALL Mode**: Multi-bar distribution chart with sortable data matrix.
* **Multi-Timeframe Engine (`1D`–`3M`)**: Aggregates by actual `timestamp` across snapshots. Rolling medians, on-the-fly metric computation for backfill.
* **Instant Disk Recalculation**: `skipScrape: true` → <5ms from disk, no Chrome lock.

### 4. Ad Astra UI Analytics Dashboard
* **Numeric Pivot Table**, **Dynamic Visual Canvas**, **Flexible Dual-Account VS Selector**, **Strategic Feedback Card**.
* **Run Diagnostics Button**: Triggers full pipeline (per-account check → scrape undercounted → calculate). `onClick` wrapper prevents React event object leaking into `daysOverride`.

### 5. Storage Engine (Lightweight JSON File-Database)
* **Storage Model**: 100% file-based JSON inside `beidou-pipeline/01-Snapshots/`. ~160 MB footprint. In-memory operations in <5ms.

### 6. ESM Module Cache Busting
* Both `beidou_snapshot_manager.mjs` and `beidou_engine.mjs` imports use `?v=mtime` in the server route to ensure code changes take effect without PM2 restart.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Per-account re-scrape with smart merge, Chrome batch restart every 5 accounts, boundary check fix for pinned tweets, 200 max scrolls.
* **July 27, 2026**: Fixed boundary check — pinned/old tweets from prior scrolls no longer falsely trigger early loop exit. Now checks only current scroll batch.
* **July 27, 2026**: Replaced all-or-nothing daily skip with per-account minimum-tweet threshold check. Smart merge preserves best data. Re-scrapes skip dedup for deeper coverage.
* **July 27, 2026**: Added Chrome restart every 5 accounts (`BATCH_SIZE=5`) to prevent stale renderers degrading later-account scrapes. Lock held across restarts via `killChrome` + `connectCDP`.
* **July 27, 2026**: Increased `STALE_LIMIT` (3→10) and `MAX_SCROLLS` (40→200) for heavy posters. Fixed `onClick` event leak in Run Diagnostics button. Added cache busting for snapshot manager import.
* **July 27, 2026**: Fixed cold-start issue — `cdp-lock.mjs` now auto-creates `/tmp/opencode/` dir via `mkdirSync`.
