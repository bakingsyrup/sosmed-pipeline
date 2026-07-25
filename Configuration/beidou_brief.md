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

---

## 🚀 Current State & Rolling Changelog
* **Status**: Architectural Specification Phase 1 Complete. Ready for Data Schema & Ingestion Implementation.
* **July 25, 2026**: Recorded Decision 4: Confirmed Horizontal Decoupled Model between Shinku & Beidou, presenting strategic insights directly to the human operator via a dedicated Strategic Feedback Card in Ad Astra Sosmed Center UI.
* **July 25, 2026**: Recorded Decision 3: Defined Mathematical Diagnostic Engine (Net Relative Variance $V$) + Ad Astra Interactive Pivot Table & Dynamic Visual Chart Canvas (Bar, Line Trend, Donut/Pie).
* **July 25, 2026**: Recorded Decision 2: Configured Multi-Cohort & Multi-Account architecture with 2-Tier structure (Peer Tier for diagnostic math, Leader Tier for macro trend discovery) via isolated `00-Cohorts/*.json` files.
* **July 25, 2026**: Recorded Decision 1: Selected Headless Free Ingestion (`x_headless_adapter.mjs`) for 100% public DOM metric extraction (Impressions, Likes, Retweets, Replies, Bookmarks, Post Age) using Fixed T+24h & T+48h Snapshots.
* **July 25, 2026**: Initialized Beidou architecture, directory structure (`Configuration/beidou/`, `beidou-pipeline/`), and documentation ecosystem (`iroi_brief.md`, `beidou_brief.md`, `beidou_guide.md`, `.gemini/rules/beidou_docs.md`).
