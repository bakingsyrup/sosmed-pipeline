# Lulua AI Briefing (`lulua_brief.md`)
**Last Updated:** July 28, 2026

This document serves as the high-density technical blueprint and session context for **Lulua** (Iroi's Competitor Intelligence, Interactive Style R&D, and Multi-Platform Strategy Engine).

---

## 📌 High-Level Architecture & File Map

Lulua monitors Beidou's daily metric snapshots, ingests human-curated viral posts via Obsidian note watching or Chat/CLI, isolates high-yielding competitor post structures, runs monthly macro playbook habit profiling, executes interactive R&D sandbox prototyping sessions with the human operator, builds the Post Style Bank (`01-Style-Bank/`), and orchestrates monothematic cross-platform expansion.

### Folder Pipeline Structure (`lulua-pipeline/` & `Configuration/lulua/`)
* **`lulua-pipeline/00-Inbox/`**: Input directory for Obsidian note watching (`_NEW_POST_DISSECTION.md` & `_NEW_ACCOUNT_AUDIT.md`).
* **`lulua-pipeline/00-Outliers/`**: Scraped high-yield competitor posts, ratio signatures, account dissection blueprints (`account-[platform]-[handle].md`), and cached monthly playbooks (`playbook-[cohort].json`).
* **`lulua-pipeline/01-Style-Bank/`**: Modular post structure templates formatted via 4-part wireframe schema (`style-[name].md`).
* **`lulua-pipeline/02-Memory/`**: Persistent memory logs (`memory_log.md` with top 7 rolling window).
* **`lulua-pipeline/02-Proposals/`**: Tier 2 permission proposals and platform expansion blueprints.
* **`lulua-pipeline/03-Briefings/`**: Daily executive briefing reports for the human operator.
* **`Configuration/lulua/engine/`**: Ratio calculation, outlier filtering, note watcher, monthly playbook scanning, account auditing, and interactive prompt orchestration scripts.

---

## ⚡ Active Core Rules & Constraints

### 1. Fundamental Modular Build & Anti-Bloat Standards
* **Pointer Principle**: Keep `lulua_brief.md` under **200 lines max** using file pointers and top 5 rolling changelog.
* **Horizontal Integration**: Operates as a peer tool alongside **Shinku** (Production) and **Beidou** (Intelligence).

### 2. 2-Tier Authorization Gate
* **Tier 1 (Briefing & Interactive R&D Sandbox)**: Proactively mines outliers, presents structural findings in the daily briefing, and opens an interactive conversational R&D session upon human request. Never auto-appends unapproved drafts into production queues.
* **Tier 2 (Permission Required)**: Any action requiring a new workflow, new directory/file structure, or new platform channel setup must be proposed in the daily brief and wait for explicit human authorization (`Approve` / `Reject`).

### 3. Non-Destructive Additive Rule
* **Zero Modification**: Never overwrite, replace, or alter existing Shinku drafts or Beidou configurations. All approved style templates are saved as new standalone files in `01-Style-Bank/`.

### 4. Multi-Trigger Data Ingestion Architecture
* **Trigger 1 (Automated Metric Mining)**: Daily scan of Beidou's `snapshot-YYYY-MM-DD.json` cache across configured cohort handles.
* **Trigger 2 (Obsidian Note Watcher)**: Background daemon watches `lulua-pipeline/00-Inbox/` for `_NEW_POST_DISSECTION.md` and `_NEW_ACCOUNT_AUDIT.md`. When frontmatter switches `status: draft` ➔ `status: ready`, Lulua executes the job and re-creates clean template notes (`status: draft`).
* **Trigger 3 (Interactive Chat / CLI)**: Direct ad-hoc commands (`lulua dissect [URL/Text]` or `lulua audit @handle --platform=[x|ig|youtube|tiktok]`) triggered via chat window or CLI.

### 5. Monothematic Cohesive Brand Strategy
* **Unified Brand Identity**: All cross-platform efforts share a single core topic domain (Finance, Tech & Macro) under the **Iroi** brand.
* **Format-Specific Adaptation**: Winning X research is repurposed into 60s vertical video script skeletons for TikTok, Instagram Reels, and YouTube Shorts without creating fragmented, unrelated niches.

### 6. Ratio Signature Thresholds & Virality Filter
* **Bookmark Ratio** ($\frac{\text{Bookmarks}}{\text{Views}} \ge 0.5\%$): High Utility / Save Value.
* **Reply Ratio** ($\frac{\text{Replies}}{\text{Views}} \ge 0.3\%$): High Debate / Polarization.
* **Retweet Ratio** ($\frac{\text{Retweets}}{\text{Views}} \ge 0.2\%$): High Broadcast / Identity Signal.
* **View Yield** ($\frac{\text{Views}}{\text{Followers}} \ge 2.5\times$ Cohort Median): Algorithmic Distribution Spike.
* **Fluke Filter**: Discard single-event viral flukes (e.g., celebrity retweets). Isolate copy structure, hook framework, and formatting.

### 7. 3-Layer Compact Memory Architecture (Anti-Bloat)
* **Layer 1 (Core Rules)**: [lulua_brief.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/lulua_brief.md) & [x_style_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/x_style_guide.md) (Max 200 lines). Loaded every session.
* **Layer 2 (Asset Memory)**: `01-Style-Bank/` directory listing. Prevents re-recommending formats Iroi already owns.
* **Layer 3 (Rolling History)**: `02-Memory/memory_log.md`. Appends 1 bullet summary per session; maintains a **7-Day Rolling Window** (prunes older entries to archive) to prevent context bloat.

### 8. Dual-Layer Analysis Scope & Monthly Playbook Cache
* **Daily Layer 1 (Micro Post Outliers)**: Scans daily snapshots at 05:00 UTC to isolate high-yield post structures.
* **Monthly Layer 2 (Macro Account Playbooks)**: Runs every 30 days (or on-demand). Aggregates 30-day snapshot data to profile competitor habits (posting time heatmaps, word count ratios, prefix flags) and uses an **Open-Ended Hybrid Discovery Prompt** to catch unscripted narrative/visual habits. Results are cached in `00-Outliers/playbook-[cohort].json`.

---

## 🔄 Active Workflows

1. **Daily Outlier Mining**: Scans Beidou's daily `snapshot-YYYY-MM-DD.json`, calculates ratio signatures, and flags repeatable competitor structures.
2. **Human-Curated & Automated Post Dissection & Post Style Bank**:
   - **Step A (Discovery & Ingestion)**: Initiated via Beidou metric scan, Obsidian note watcher (`_NEW_POST_DISSECTION.md`), or Chat/CLI command.
   - **Step B (Dissection Engine)**: Extracts structural wireframe according to the **Standardized 4-Part Style Bank Wireframe Schema**:
     - **Part 1: Metadata & Ratio Trigger**: Targeted engagement metric (Bookmarks, Replies, Retweets, Views).
     - **Part 2: Psychological Lever**: Primary emotional driver (Utility, Contrarian Piercing, FOMO, Debate).
     - **Part 3: Micro-Rhythm & Pacing Rules**: Hook length limits, line-break cadence, sentence caps.
     - **Part 4: Plug-and-Play Wireframe**: Bracketed parameter slots (`[Hook]`, `[Setup]`, `[Body]`, `[Closing]`).
   - **Step C (Interactive R&D Prototyping & Feedback)**: Prototyped in sandbox via [x_style_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/x_style_guide.md); operator gives qualitative feedback to adjust tone/layout.
   - **Step D (Style Banking)**: Approved wireframe is saved into `01-Style-Bank/style-[name].md` for Shinku reference.
3. **Daily Executive Briefing**: Outputs daily summary covering cohort diagnostics, outlier discoveries, R&D recommendations, and Tier 2 permission proposals.
4. **Monothematic Multi-Platform Expansion**:
   - **Repurposing Proposals**: Identifies high-bookmark X research ($\ge 0.5\%$), presents a short-form video script proposal in the Daily Briefing / Chat Window, and waits for human direction before sending to Shinku's `01-Inbox/00-Video-Inputs/`.
   - **Platform Penetration Blueprints**: Drafts a Tier 2 Penetration Blueprint (`02-Proposals/proposal-[platform].md`) whenever triggered by the human operator via the Chat Window.
5. **Monthly Cohort Playbook Scan**: Aggregates 30-day snapshot data to extract competitor operational habits (posting schedule heatmaps, prefix conventions, narrative rhythms) and updates cached `playbook-[cohort].json`.
6. **Custom Ad-Hoc Strategy Queries**: Executes on-demand strategic hypothesis testing and custom metric filtering triggered via the Chat Window, querying Beidou's historical snapshot cache to answer specific operational or audience pivot questions.
7. **Multi-Platform Account Playbook & Funnel Audit**:
   - **80/20 Hybrid Execution Lifecycle**: Note watcher status flow (`status: fetch` ➔ Beidou metrics & surface profile pre-fill ➔ `status: draft` ➔ 60s human monetization notes ➔ `status: ready` ➔ 5-Dimension LLM synthesis).
   - **5-Dimension Dissection Framework**:
     - **Dimension 1 (Positioning & Bio Authority)**: Value proposition & credibility markers.
     - **Dimension 2 (Content Ecosystem Pillars)**: 3-Pillar ratio (Authority vs. Reach vs. Trust) & format mix taxonomy.
     - **Dimension 3 (Growth Catalyst & Outlier Engine)**: Breakthrough growth event & empirical Beidou view-yield spike frequency ($>2.5\times$).
     - **Dimension 4 (Platform-Exclusive Tactical Execution)**: Hook cutoffs/pacing (X), ManyChat DM automation & Grid vs. Stories split (IG), Title/Thumbnail CTR tension & 5s retention hooks (YouTube), 2s visual interrupts & 1% audio volume layering (TikTok).
     - **Dimension 5 (Funnel Architecture & Revenue Matrix)**: Lead magnet mechanics (newsletters/giveaways) & back-end monetization model (courses, SaaS, community, sponsorships).
   - **Long-Form & External Media Extraction**: X Articles & external blog links are parsed for core frameworks; viral long-form text cached in `lulua-pipeline/00-Outliers/references/[handle]_[slug].md`.
   - **Multimodal Visual Blueprinting**: Visual hooks & image preview URLs embedded in report; raw MP4/PNG files excluded to prevent storage bloat.
   - **Output Artifact**: Saved to `lulua-pipeline/00-Outliers/account-[platform]-[handle].md`.

---

## 🚀 Current State & Rolling Changelog
* **Status**: Steps 1, 2, and 3 fully built, live, and integrated into Ad Astra Web UI with real-time MOC index management.
* **July 28, 2026**: Deployed **Ad Astra Web UI 4-Subtab Navigation** (`X Posts` | `Intel` | `Style Bank` | `Account Bank`) with larger text sizes (+2 font steps), search filtering, direct `🔗 X Profile` links, and one-click file deletion.
* **July 28, 2026**: Deployed **Automated MOC Index Manager** (`lulua_moc_manager.mjs`) maintaining real-time Markdown index tables `00-Style-Bank-MOC.md` and `00-Account-Audits-MOC.md`.
* **July 28, 2026**: Completed **Step 3 (Obsidian Note Watcher Daemon & Option B Control Card)**: Created `lulua_note_watcher.mjs`, `lulua_account_auditor.mjs`, and `lulua_post_dissecter.mjs` handling 5D audits and 4-part post dissections via UI or Obsidian inbox notes.
* **July 28, 2026**: Completed **Step 1 (`lulua_outlier_scanner.mjs`) & Step 2 (`lulua_briefing_generator.mjs`)**: Daily metric outlier scanner (with Reach Gate and retweet exclusion) chained automatically into today's Executive Briefing generator.
* **July 26, 2026**: Added **Custom Ad-Hoc Strategy Queries** (Workflow 6) to `lulua_brief.md` for on-demand hypothesis testing via Chat Window.
* **July 26, 2026**: Added **Dual-Layer Analysis Scope & Monthly Playbook Cache** (Layer 1 Daily Micro Outliers + Layer 2 Monthly Macro Playbooks with Hybrid Open-Ended Pattern Discovery) to `lulua_brief.md`.
* **July 26, 2026**: Added **3-Layer Compact Memory Architecture** (`memory_log.md` with 7-day rolling window) to `lulua_brief.md` to guarantee output consistency and eliminate context bloat.


