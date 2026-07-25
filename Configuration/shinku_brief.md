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
* **July 25, 2026**: Added **Narrative Alignment & Logical Bridge Rule** across `research_prompt.mjs`, `x_style_guide.md`, and `drafting_prompt.mjs`. Historical precedents MUST logically match the directional premise of current news (e.g. surge ➔ past surge), requiring explicit logical bridges when contrasting counter-mechanisms.
* **July 25, 2026**: Enforced **Data-Gated Historical Outcome Rule** across `research_prompt.mjs`, `x_style_guide.md`, and `drafting_prompt.mjs`. Historical precedents in Draft 1a, 1b, and 1c MUST be backed by concrete quantitative data points (exact percentages, dollar amounts, basis points, or index metrics), strictly eliminating vague qualitative claims.
* **July 25, 2026**: Updated Style Markers in `x_style_guide.md` to explicitly forbid "AS" when referring to the United States and mandate "US" (e.g. `pemerintah US`, `bursa saham US`).
* **July 25, 2026**: Enforced **Sentence Case Headline Formatting** in `x_style_guide.md` (DOs & Section 4) and added `CRITICAL HEADLINE FORMATTING DIRECTIVE` to `drafting_prompt.mjs` (overriding LLM pre-training Title Case bias).
* **July 25, 2026**: Upgraded Drafting Pipeline to **7-Draft System**: Draft 1a (Historical Event), Draft 1b (Industry Playbook), Draft 1c (Entity Track Record), Draft 2 (Standard Breaking News - Max 60 words), Draft 3 (Mechanism), Draft 4 (Rhetorical Q&A), and Draft 5 (Crisis).

