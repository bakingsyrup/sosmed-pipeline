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

### 2. Diagnostic Core Matrix
* **Macro Downturn**: Entire competitor cohort down; Iroi's drop matches cohort baseline. *(Status: MACRO_DOWNTURN)*.
* **Micro Failure**: Competitor cohort steady/up; Iroi's metrics dropping. *(Status: MICRO_FAILURE)*.
* **Outperformance**: Iroi growing faster than cohort baseline. *(Status: AHEAD)*.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Initial architecture defined. Phase 1 (Data Schema & Ingestion Interface Specification) in progress.
* **July 25, 2026**: Initialized Beidou architecture, directory structure (`Configuration/beidou/`, `beidou-pipeline/`), and documentation ecosystem (`iroi_brief.md`, `beidou_brief.md`, `beidou_guide.md`, `.gemini/rules/beidou_docs.md`).
