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
* **`Configuration/beidou/schema/`**: Universal Data Contracts and Entity Definitions.
* **`Configuration/beidou/adapters/`**: Decoupled Data Ingestion Adapters (X, YouTube, etc.).
* **`Configuration/beidou/engine/`**: Benchmark calculation and diagnostic logic.

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

### 5. Ad Astra UI Analytics Dashboard (Pivot & Visual Builder)
* **Numeric Pivot Table**: Slice & dice by Cohort, Account Tier, Time Window (T+24h / T+48h), and Shinku Draft Types. CSV export enabled.
* **Dynamic Visual Canvas**: Interactive chart builder (Bar, Line Trend, Donut/Pie) with customizable X/Y axes for dynamic performance analysis.

### 6. Decoupled Horizontal Architecture & Feedback UI
* **Horizontal Decoupled Model**: Shinku (Production) and Beidou (Intelligence) operate as independent peer tools at the same level with zero direct code/prompt coupling.
* **Human-in-the-Loop Feedback**: Beidou renders a dedicated **Strategic Feedback Card** in Ad Astra Sosmed Center UI displaying top winning formats, underperforming formats, and actionable recommendations for the human operator.

### 7. Storage Engine (Lightweight JSON File-Database)
* **Storage Model**: 100% file-based JSON database inside `beidou-pipeline/01-Snapshots/` (zero PostgreSQL / SQLite overhead).
* **Efficiency**: ~160 MB total footprint across 10 years of daily snapshots. In-memory array filtering, median calculations, and 7d/30d follower growth math execute in <5ms in Node.js.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Beidou Diagnostic Engine (`beidou_engine.mjs`) & Snapshot Manager (`beidou_snapshot_manager.mjs`) built and verified. DOM article selector fixed for X profile timelines.
* **July 25, 2026**: Identified profile timeline DOM selector requirement (`article` vs `article[data-testid="tweet"]`) and session auth requirement for direct handle timelines on X.
* **July 25, 2026**: Verified 100% background headless scraping on Port 18810 with Tab Isolation across 18 cohort accounts (180 tweets scraped).
* **July 25, 2026**: Built Beidou Analytics Canvas UI (`BeidouAnalyticsCanvas.jsx`) mounted in Ad Astra `Intel` tab, rendering diagnostic badges (`🟢 AHEAD`), benchmark cards, pivot data, and top market leader archetypes.
* **July 25, 2026**: Built Snapshot Manager (`beidou_snapshot_manager.mjs`) and Diagnostic Engine (`beidou_engine.mjs`) with Net Relative Variance ($V$) math and T+24h / T+48h post windowing.
