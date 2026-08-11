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

## Section 3: Ad Astra UI Analytics Canvas & Metric Definitions

The Beidou Analytics Canvas (accessible under **Sosmed Center → Intel**) provides three core diagnostic sub-views:

### 1. `Diagnostic` View
Evaluates target account health relative to its competitor cohort and distinguishes macro market drops from micro execution issues.

* **Diagnostic Status Badges (`status_badge`)**:
  * 🟢 **AHEAD** ($V > +10\%$): Target outperforming peer cohort median.
  * ⚪ **PARITY** ($-10\% \le V \le +10\%$): Performing in lockstep with cohort.
  * 🟡 **MACRO_DOWNTURN** ($V < -10\%$ or peer median $< 0.5\%$): Entire niche engagement is down. Moving with market waves; do not panic pivot.
  * 🔴 **MICRO_FAILURE** ($V < -15\%$ while peers $\ge 0.5\%$): Competitors remain strong while target drops. Action required on topic/hook selection.
* **Net Relative Variance ($V$ / `net_variance_pct`)**:
  $$V = \text{Target Median Yield \%} - \text{Peer Cohort Median Yield \%}$$
* **Target Account Metrics**:
  * **Follower Scale**: Total follower count of the target account.
  * **Median Impression Yield %**: Median ratio of views to followers across target posts:
    $$\text{Impression Yield \%} = \left(\frac{\text{Views}}{\text{Followers}}\right) \times 100$$
  * **Median Engagement Rate %**: Median interaction density per view:
    $$\text{Engagement Rate \%} = \left(\frac{\text{Likes} + \text{Retweets} + \text{Replies}}{\text{Views}}\right) \times 100$$
* **Peer Cohort Baseline**:
  * **Peer Tier Size**: Number of accounts tracked in the Peer Tier.
  * **Peer Median Yield %**: Aggregated median yield across all peer tier posts.
  * **Peer Median Engagement %**: Aggregated median engagement rate across peer tier posts.

### 2. `Pivot Data` View
Provides a structured numeric side-by-side comparison table between the target account and the peer benchmark.

* **Tier / Account**: Identifies `@target_account` vs. `👥 Peer Tier Median`.
* **Role**: `TARGET` (evaluated account) vs. `BENCHMARK` (cohort median).
* **Followers**: Displays follower count (`Target` value vs. `—` for aggregated benchmark).
* **Median Yield %**: Side-by-side comparison of Target Impression Yield % vs. Peer Median.
* **Engagement %**: Side-by-side comparison of Target Engagement Rate % vs. Peer Median.

### 3. `Market Leaders` View
Ranks and surfaces top viral content format archetypes from the **Leader Tier** (macro accounts / niche leaders) for content inspiration.

* **Ranking Metric**: Ranked by **Time-Adjusted Impression Yield %** (`impression_yield_pct`).
* **Handle & Follower Count**: Shows account handle and scale (e.g. `@GuarEmperor (87,700 followers)`).
* **Yield Badge (`Yield: XX.XX%`)**:
  $$\text{Yield \%} = \left(\frac{\text{Views}}{\text{Followers}}\right) \times 100$$
  A yield $>100\%$ indicates the post achieved algorithmic distribution outside the account's existing follower base (e.g. "For You" feed).
* **Post Body & Engagement Bar**: Displays exact raw post text alongside ❤️ Likes, 🔁 Retweets, and 💬 Replies counters.

---

## Section 4: Operational Commands & Automation

* **Daily Scheduler**: Managed via PM2 cron (`beidou_scheduler.mjs` + `/home/silvester/beidou_daily.sh` wrapper) running daily at 01:30 UTC.
* **Manual Diagnostic Trigger**: Run diagnostics on-demand via the UI **Run Diagnostics** button or via API:
  `POST /api/beidou/run-diagnostics` with `{ "cohort_id": "crypto-indonesia" }`.

