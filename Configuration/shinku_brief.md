# Shinku AI Briefing (`shinku_brief.md`)
**Last Updated:** July 24, 2026

This document serves as the high-density technical blueprint and session context for **Shinku** (Obsidian-driven Social Media, Video & Glossary Drafting Pipeline).

---

## 📌 High-Level Architecture & File Map
Shinku parses curated Obsidian notes, runs web fact-verification via Gemini (Google Search Grounding), generates copy/skeletons via DeepSeek v4 Pro, updates an A-Z glossary database, feeds the Ad Astra Sosmed Center UI, and outputs publication-ready drafts.

### Folder Pipeline Structure (`x-pipeline/`)
* **`00-Settings.md`**: Master pipeline feature configuration file managed by Ad Astra Sosmed Center UI.
* **`00-Status.md`**: Live pipeline status dashboard file for Ad Astra Sosmed Center UI.
* **`00-Media-Vault/`**: Centralized video vault for trimmed `.mp4` video clips linked in notes.
* **`01-Inbox/`**: Raw curated news notes input.
* **`01-Inbox/00-Video-Inputs/`**: Input notes for video skeleton generation.
* **`01a-Idea-Pitches/`**: Content pitch storage.
* **`02-Researching/`**: Processing lock directory.
* **`03-Ready/`**: Finished Event News, Morning Briefings, and How-To drafts.
* **`03-Ready/00-Glossary-Drafts/`**: Bilingual X Glossary thread drafts.
* **`03-Ready/00-Video-Skeletons/`**: Completed video script skeletons.
* **`05-Archive/video-skeletons/`**: Archive for processed video inputs.
* **`06-Glossaries/`**: Master technical database (`Glossary-[Category]-[EN/ID].md`).

### Modular Core Scripts & Guides ([Configuration/](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/))
1. **[draft_agent.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/draft_agent.mjs)**: Watch-loop orchestrator driven by PM2 daemon (`x-draft-agent`).
2. **[services/pipeline_config.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/services/pipeline_config.mjs)**: Centralized pipeline settings manager reading `00-Settings.md` with safe fallbacks and note frontmatter overrides.
3. **[utils/youtube_clipper.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/utils/youtube_clipper.mjs)**: Node.js wrapper invoking `scripts/yt_clip_finder.py` to search, subtitle-scan, and clip 30-60s `.mp4` video clips during Research Phase.
3. **[services/deepseek_api.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/services/deepseek_api.mjs)**: Native HTTPS DeepSeek API client with retry logic.
4. **[services/gemini_api.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/services/gemini_api.mjs)**: Native fetch Gemini search grounding client with retries.
5. **[utils/file_helper.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/utils/file_helper.mjs)**: File crawling, parsing, SGT date check, and glossary sorting.
5. **[prompts/research_prompt.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/prompts/research_prompt.mjs)**: Research & search grounding prompt.
6. **[prompts/drafting_prompt.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/prompts/drafting_prompt.mjs)**: Standard & Morning Briefing drafting prompts.
7. **[prompts/video_skeleton_prompt.mjs](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/prompts/video_skeleton_prompt.mjs)**: Video skeleton drafting prompts.
8. **Style Guides**: [x_style_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/x_style_guide.md) (Mario Style), [how_to_style_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/how_to_style_guide.md), [video_skeleton_style_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/video_skeleton_style_guide.md).

---

## ⚡ Active Core Rules & Constraints

### 1. Token Quota & Preservations
* **No Chat Polling Loops**: Never run sleep/polling commands in chat. Users monitor via `pm2 logs`.
* **Approval Gate**: Request user permission before running wide codebase scans.

### 2. Universal Binary Pronoun Rule
* **🟢 Traders, Consumers, Citizens, Business Owners**: Use **We / Us / Our** (ID: *kita / aku / kamu*).
* **🔴 Protocols, Central Banks, Smart Contracts, Corporations, Hackers**: Use **Specific Noun + It / Its / They / Their** (ID: Suffix *-nya*, *ia*, *mereka*).

### 3. Engine & Peak Hour Pricing Management
* **Drafting Model**: DeepSeek v4 Pro (`deepseek-v4-pro`).
* **Research Model**: Gemini 2.5 Flash (`gemini-2.5-flash`) with Google Search Grounding.
* **Peak Pricing Auto-Fallback**:
  * SGT Morning Peak (8:50 AM – 12:10 PM) & Afternoon Peak (1:50 PM – 6:10 PM).
  * Automatically routes drafting calls to Gemini during DeepSeek peak pricing windows to save costs.

### 4. Daily Glossary Quota (3 Posts / 6 Terms Max)
* SGT timezone date check (`Asia/Singapore`).
* Counts `<!-- Date: YYYY-MM-DD -->` in `06-Glossaries/*-EN.md`.
* Bypasses glossary stage if daily count `>= 6`.

### 5. Vocabulary & Style Rules (Mario Style)
* **Mario Style**: Visual badges on Line 1 (`🇺🇸`, `🚨`), dynamic 1–3 sentence blocks, 3 pipeline archetypes, menu of 10 Mid-Post Turns, output rationale tag (`🎯 Selected Archetype`), separated EN/ID copywriting engines with contextual vocabulary rules, and 1-sentence macro thesis/ironic closings (no mandatory victim blocks).
* **No "101" Synonym**: Use *basics, foundation, essentials, fundamentals* (ID: *dasar-dasar, fondasi, esensi*).
* **Definition Prefix**: First sentence of **What it is?** (EN) / **Apa itu?** (ID) follows `[Term] is [Def]` / `[Term] adalah [Def]`.

---

## 🔄 Active Workflows
1. **Standard Event News Drafting**: Fact-verifies news via Gemini, drafts posts in `03-Ready/`.
2. **Morning Briefing Drafting**: Aggregates overnight approved notes from `04-Approved/` & `05-Archive/` (8:00 PM yesterday to present SGT), using a cognitive gate to select the best template.
3. **Bilingual X Glossary Pipeline**: Extracts 2-term pairs, appends entries to `06-Glossaries/`, drafts X threads in `03-Ready/00-Glossary-Drafts/`.
4. **Video Skeleton Drafting**: Processes inputs from `01-Inbox/00-Video-Inputs/`, drafts script skeletons in `03-Ready/00-Video-Skeletons/`, archives inputs to `05-Archive/video-skeletons/`.
5. **How-To Guide Drafting**: Standardized instructional post drafting guided by `how_to_style_guide.md`.

---

## 🚀 Current State & Rolling Changelog
* **Status**: `x-draft-agent` actively running via PM2 in watch mode; syncs real-time state & feature settings with Ad Astra UI (`00-Status.md`, `00-Settings.md`).
* **July 25, 2026**: Fully upgraded Research and Drafting Pipeline for **Historical Benchmarks & Breaking News (Draft 1a, 1b, 1c)**. `research_prompt.mjs` now explicitly gathers Category A (Historical Event), Category B (Industry Playbook), and Category C (Entity Track Record) precedent data. `x_style_guide.md` and `drafting_prompt.mjs` now output 3 sub-variations (Draft 1a, Draft 1b, Draft 1c) alongside Draft 2 (Mechanism), Draft 3 (Rhetorical Q&A), and Draft 4 (Crisis).
* **July 25, 2026**: Integrated **Universal Breaking News & Short Insight Template (Draft 1 - Max 60 Words)** into `x_style_guide.md` and `prompts/drafting_prompt.mjs`. Draft 1 now delivers top 1 WHAT + top 1 WHEN fact paired with the #1 selected insight (WHY, HOW, or WHO) in under 60 words with zero filler. Expanded Event News output to 4 distinct drafts.
* **July 25, 2026**: Updated Original Style Base formatting rules in `x_style_guide.md`: replaced 8-10 word comma-fragmentation line rules with **33-word max sentence limit per block** while preserving Option A (1 sentence per block separated by `\n\n`).
* **July 25, 2026**: Restored Original Style Base (`x_style_guide.md`, `prompts/drafting_prompt.mjs` from `Configuration/backup/`) for step-by-step iterative testing. Mario Style (4-Draft system) is safely backed up in `Configuration/backup/2026-07-25/` and `Configuration/backup/*_2026-07-25.*`.
* **July 25, 2026**: Built **Centralized Settings Engine & Ad Astra UI Controls** (`x-pipeline/00-Settings.md`, `services/pipeline_config.mjs`, `server/routes/dashboard.mjs`, and `SosmedCenter.jsx`). Added interactive toggle card to Ad Astra Sosmed Center for `YouTube Video Clipper` and `Glossary Automation` features with 3-tier override cascade (Note Frontmatter > Global Settings File > Safe System Fallbacks).
* **July 24–25, 2026**: Fully upgraded `x_style_guide.md` and `prompts/drafting_prompt.mjs` to **Mario Style** (visual badges, dynamic spacing, 3 archetypes, 10 Mid-Post Turn menu, rationale metadata tag, separated EN/ID engines with contextual vocabulary rules, Universal Thesis-Driven Fact Selection + "So What?" rules across all archetypes, Single-Concept rule for Archetype 1, Archetype 3 Reader Grounding rule, Archetype 2 Multi-Angle Framing Transition Lines, Data-Gated Angle Selection, 3-Draft Angle Distribution Rule (Top 3 Neutral Angles for Drafts 1 & 2, Wildcard for Draft 3), Seamless Narrative Bridges (eliminating orphan slogans), Visual Container Flexibility, X-Compatible Unicode Bullets (`• `), Mandatory 1-Blank-Line List Spacing, Fact-Gated Bullet Scope (including a 2nd consequence only if explicitly grounded as major brief data, preventing forced/speculative fluff), Headline Parenthetical Formatting Rule (using `(...)` for inline headline context instead of em-dashes), Bullet Line Break Rule (splitting text after full stop into standalone paragraph block if bullet exceeds ~25 words), Concise Spoken Noun Phrases (trimming optional prepositions/kata depan), Explicit Temporal Contrast Pacing (present-time conjunctions & pronominal suffixes for comparisons), Concessive Conditional Pacing & Anaphoric Pronouns (using concessive conjunctions like *even if* & conversational pronouns), Universal Spoken Active Verb Principle (stripping `me-`/`mem-`/`men-`/`meng-`/`memper-` active prefixes from action and motion verbs across headlines and body text, while retaining `-i`/`-kan` suffixes like `hindari` & `hentikan`, passive `di-`/`ter-`, and noun-converting verbs like `memicu`), Untranslated Global Jargon Principle (retaining all software, tech, internet, and financial practitioner terms—both single-word and multi-word terms—in English), 2-Beat Conversational Cadence rule (`[Noun]-nya [Metric], ini [Evaluation]`), 3 Contextual Sentence Variations, Vivid Mechanism Verbs, Flexible Cause-and-Effect Sentence Linking, and direct 1-sentence closings). Added **YouTube Clip Finder & Precision Cutter Skill** (`Configuration/scripts/yt_clip_finder.py`, `utils/youtube_clipper.mjs`, and `~/.gemini/antigravity-cli/skills/youtube-clip-finder/SKILL.md`) integrated into Research Phase, outputting trimmed `.mp4` video clips directly into `x-pipeline/00-Media-Vault/`. Original backups saved in `Configuration/backup/`.

