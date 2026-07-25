# Beidou Operator Guide (`beidou_guide.md`)
**Human-Facing Operational Manual**

---

## Section 1: Overview & Prerequisites

### Overview
**Beidou** is the automated account performance analytics and competitor diagnostic engine for **Iroi**. It tracks competitor cohorts on X (and future platforms), calculates normalized baseline metrics, and identifies whether account performance changes are driven by macro industry trends or micro execution issues.

### Prerequisites
* **Node.js**: v18+ installed on host system.
* **PM2**: Global process manager for automated background polling.
* **Tracked Cohorts**: Defined competitor lists in `beidou-pipeline/00-Cohorts/`.

---

## Section 2: Workflows & Folder Pipeline Map

### Workflows Summary
1. **Metric Ingestion**: Periodically polls public post and account metrics for Iroi and competitor cohorts.
2. **Benchmark Calculation**: Computes normalized medians, growth deltas, and baseline performance scores.
3. **Diagnostic Reporting**: Generates automated markdown reports in `beidou-pipeline/02-Reports/`.

### Folder Pipeline Map
* 📁 **`beidou-pipeline/00-Cohorts/`**: Place competitor cohort definitions here.
* 📁 **`beidou-pipeline/01-Snapshots/`**: Cached raw metric data snapshots.
* 📊 **`beidou-pipeline/02-Reports/`**: Output diagnostic reports.

---

## Section 3: Execution, Troubleshooting & Cohort Setup

*(Operational execution commands will be populated during Phase 2 engine build).*

---

## Section 4: Agent Roster & Operational Rules

*(System rules will be populated during Phase 2 engine build).*
