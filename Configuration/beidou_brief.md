# Beidou AI Briefing (`beidou_brief.md`)
**Last Updated:** July 25, 2026

This document serves as the high-density technical blueprint and session context for **Beidou** (Iroi's Automated Account Performance & Competitor Diagnostic Engine).

---

## 📌 High-Level Architecture & File Map

Beidou tracks Iroi's account performance relative to direct competitor cohorts, normalizes engagement metrics, diagnoses macro vs. micro drops, and provides data-driven strategic feedback.

### Folder Pipeline Structure (`beidou-pipeline/` & `Configuration/beidou/`)
* **`beidou-pipeline/00-Cohorts/`**: Competitor cohort configuration files (JSON/Markdown).
* **`beidou-pipeline/01-Snapshots/`**: Raw metric snapshot cache collected from tracked accounts.
* **`beidou-pipeline/02-Reports/`**: Generated diagnostic reports and executive summaries.
* **`Configuration/beidou/adapters/`**: Decoupled Data Ingestion Adapters (X, YouTube, etc.).
* **`Configuration/beidou/engine/`**: Benchmark calculation and diagnostic logic.

### CDP Architecture (X Adapter)
* **Port**: 18800 (authenticated Chrome session — same browser as main X fetcher).
* **Page Strategy**: Shared page (`conn.page`) from `cdp-connect.mjs` — NOT `browser.newPage()` (cold pages render X without data-testid attributes).
* **Mutex**: `cdp-lock.mjs` with lock name `'18800-page'` — shared with main fetcher (`scrape-tweets.mjs`). Prevents concurrent Chrome usage. Both scripts use same lock format.
* **Views Extraction**: `a[role="link"] span` aria-label pattern — works for all accounts (own tweets + competitors). Old `a[href*="/analytics"]` selector only works for own tweets.
* **Lifecycle**: One-shot script. Must call `process.exit(0)` after completion — CDP WebSocket keeps event loop alive, preventing natural exit. Without it, snapshot manager's `close` event never fires.

---

## ⚡ Active Core Rules & Constraints

### 1. Fundamental Modular Build
* **Decoupled Architecture**: Ingestion, Benchmark Calculation, and Reporting are strictly separated. Changing data sources does not break the calculation engine.
* **Anti-Bloat Standards**: Maintain `beidou_brief.md` under **200 lines max** using the Pointer Principle and top 5 rolling changelog.

### 2. Diagnostic Core Matrix & Net Variance Math
* **Net Relative Variance ($V$)**: $V = \Delta_{\text{iroi}} - \Delta_{\text{cohort\_median}}$ (7-day rolling window).
* **Categories**:
  * **🟢 AHEAD** ($V > +10\%$): Outperforming niche. Double down on current mix.
  * **⚪ PARITY** ($-10\% \le V \le +10\%$): Moving in lockstep with cohort median.
  * **🟡 MACRO_DOWNTURN** ($V \ge -10\%$ AND $\Delta_{\text{cohort}} < -10\%$): Entire niche down. Do NOT panic-pivot strategy.
  * **🔴 MICRO_FAILURE** ($V < -15\%$ AND $\Delta_{\text{cohort}} \ge -5\%$): Competitors flat/up while Iroi drops. Action required (topic fatigue, algorithm penalty, hook flaw).

### 3. Ad Astra UI Analytics Dashboard (Pivot & Visual Builder)
* **Numeric Pivot Table**: Slice & dice by Cohort, Account Tier, Time Window (T+24h / T+48h), and Shinku Draft Types. CSV export enabled.
* **Dynamic Visual Canvas**: Interactive chart builder (Bar, Line Trend, Donut/Pie) with customizable X/Y axes for dynamic performance analysis.

### 4. Decoupled Horizontal Architecture & Feedback UI
* **Horizontal Decoupled Model**: Shinku (Production) and Beidou (Intelligence) operate as independent peer tools at the same level with zero direct code/prompt coupling.
* **Human-in-the-Loop Feedback**: Beidou renders a dedicated **Strategic Feedback Card** in Ad Astra Sosmed Center UI displaying top winning formats, underperforming formats, and actionable recommendations for the human operator.

### 5. Storage Engine (Lightweight JSON File-Database)
* **Storage Model**: 100% file-based JSON database inside `beidou-pipeline/01-Snapshots/` (zero PostgreSQL / SQLite overhead).
* **Efficiency**: ~160 MB total footprint across 10 years of daily snapshots. In-memory array filtering, median calculations, and 7d/30d follower growth math execute in <5ms in Node.js.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Beidou full pipeline (scrape → process → diagnose → report) verified end-to-end across 2 cohorts, 18 accounts, 180 tweets. Metrics show real data (e.g. crypto-indonesia: -12.81% variance, MACRO_DOWNTURN). `process.exit(0)` fix prevents adapter hang.
* **July 25, 2026**: Fixed adapter hang caused by CDP WebSocket keeping event loop alive. Added `process.exit(0)` after output write so snapshot manager's `close` event fires and pipeline completes.
* **July 25, 2026**: Fixed views extraction for competitor accounts. Switched from `a[href*="/analytics"]` (own-tweets only) to `a[role="link"] span` aria-label pattern (all accounts). Verified on WatcherGuru (283K views).
* **July 25, 2026**: Migrated adapter to port 18800 (authenticated Chrome) with shared `conn.page` + CDP mutex lock pattern, matching main fetcher. Abandoned port 18810 (headless) due to auth-wall and `browser.newPage()` due to cold-page DOM mismatch.
* **July 25, 2026**: Built Beidou Analytics Canvas UI (`BeidouAnalyticsCanvas.jsx`) mounted in Ad Astra `Intel` tab, rendering diagnostic badges, benchmark cards, pivot data, and top market leader archetypes.
* **July 25, 2026**: Built Snapshot Manager and Diagnostic Engine with Net Relative Variance ($V$) math and T+24h / T+48h post windowing.

(End of file — total 77 lines)
