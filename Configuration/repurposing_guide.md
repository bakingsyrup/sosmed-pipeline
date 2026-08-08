# Master System Guide: Multi-Platform Content Repurposing Engine (`repurposing_guide.md`)

**Created:** August 8, 2026  
**Status:** Active System Specification & Operating Standard  
**Parent Framework:** [iroi_strategy_roadmap.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_strategy_roadmap.md)  

---

## 🎯 1. System Purpose & Core Operating Principles

This guide defines the authoritative system rules, prompt instructions, formatting requirements, and angle-mutation logic for transforming single-source published content (e.g. X threads, articles, videos) into **production-ready, native multi-platform assets** (YouTube Shorts, YouTube Long-Form, YouTube Community, Instagram, TikTok, LinkedIn).

### Core Directives:
1. **Zero-Slop Rule**: Outputs must require **<2 minutes of manual human editing**. Vague descriptions are strictly forbidden.
2. **Topic-Agnostic Engine**: Rules apply universally across all content niches (**AI, Crypto, Macroeconomics, Tech, Solopreneurship, Software Engineering, Business**).
3. **Native Angle Mutation**: Every platform receives a distinct psychological angle suited to its algorithm priority and user mindset.
4. **De-Sponsorship Control**: Strips or adapts client sponsorship programmatically based on user frontmatter configuration.

---

## 📥 2. Input Contract & Lifecycle Flow

All repurposing workflows begin by editing the master template [`_NEW_REPURPOSE_INPUT.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/x-pipeline/01-Inbox/00-Repurpose-Inputs/_NEW_REPURPOSE_INPUT.md).

### Frontmatter Schema:
```yaml
---
type: Content Repurpose Input
status: draft # draft | ready (changing to 'ready' triggers automated repurposing)
source_platform: x # x | youtube | instagram | tiktok | linkedin | blog | podcast
target_platform: instagram # instagram (default) | x | youtube | tiktok | linkedin
existing_sponsor: no # yes | no (Does the source content contain a client/sponsor? Default: no)
repurpose_sponsorship: no # yes | no (Should repurposed outputs actively promote a sponsor?)
target_language: id # id (Indonesian, default) | en (English)
---
```

### Complete Lifecycle Flow:
1. **Inbox Input (`01-Inbox/00-Repurpose-Inputs/`)**: User populates [`_NEW_REPURPOSE_INPUT.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/01-Inbox/00-Repurpose-Inputs/_NEW_REPURPOSE_INPUT.md) and changes `status: draft` ➔ `status: ready`.
2. **Locking & Instant Auto-Respawn (`02-Researching/`)**:
   * Watcher detects `status: ready` and renames input to `02-Researching/lock-repurpose-[timestamp].md`.
   * Watcher **instantly auto-spawns a fresh blank `_NEW_REPURPOSE_INPUT.md`** template back in `01-Inbox/00-Repurpose-Inputs/`.
3. **Processing & Output Dispatch (`03-Ready/`)**:
   * Single-platform targeted engine dispatches output files directly into the native platform `03-Ready/` folder (e.g. `ig-pipeline/03-Ready/`) with `status: ready`.
4. **Discard Temporary Lock**:
   * The temporary lock file in `02-Researching/` is **deleted/discarded**.
5. **User-Driven Archiving (`05-Archive/`)**:
   * User produces/publishes draft and manually changes `status: ready` ➔ `status: done`.
   * Watcher detects `status: done` and **automatically moves completed draft from `03-Ready/` ➔ `05-Archive/`**.

---

## 🧼 3. Sponsorship Control Matrix

The agent evaluates the `existing_sponsor` and `repurpose_sponsorship` frontmatter properties before generating any output:

| `existing_sponsor` | `repurpose_sponsorship` | Agent Processing Behavior |
| :---: | :---: | :--- |
| **`yes`** | **`no`** | **Purge & Sanitize**: Strips all existing client mentions, app links, promo codes, and sponsor CTAs. Replaces with owned channel CTAs (`Silvester Ad Astra`). |
| **`yes`** | **`yes`** | **Adapt & Transition**: Retains/adapts sponsor messaging across new formats based on the `# 🤝 Sponsorship Brief & Constraints` section in the input body. |
| **`no`** | **`yes`** | **Inject Sponsor**: Embeds a new sponsor into organic content based on the `# 🤝 Sponsorship Brief & Constraints` section. |
| **`no`** | **`no`** | **Pure Organic**: Retains 100% educational flow with standard owned CTAs. |

---

## 🗣️ 4. Voice, Tone & Style Enforcement

The voice is anchored directly in [`x_style_guide.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/x_style_guide.md): pragmatic macroeconomist and tech analyst—analytical yet highly conversational.

### Dynamic Rules:
* **Dynamic Prefix Stripping (Indonesian `id`)**: Strip prefixes (`me-`, `meng-`, `mem-`) from Indonesian verbs to use root words (*kata dasar*) for a punchy tone (e.g., *taruh*, *bangun*, *beli*, *jual*, *pantau*).
* **Pronouns**: Use `aku` / `kamu` / `kita` for peer-to-peer connection in Indonesian; use direct conversational pronouns in English.
* **Double Line Breaks**: Separate sentence blocks with double line breaks (`\n\n`) for scannability.
* **Headlines**: Sentence case ONLY (capitalize only the first word and proper nouns). Never use Title Case.
* **Dry & Cynical Endings**: Conclude cleanly with context-specific dry observations or ironic questions.
* **Anti-AI Banned Words List**:
  * ❌ *Forbidden*: "In today's fast-paced world", "game-changer", "let's dive in", "navigating the landscape", "unravel", "testament", "delve", "crucial", "vital".
  * ❌ *Forbidden*: Rhetorical lead-in questions in voiceovers (*"Have you ever wondered how...?"*).

---

## 🔄 5. Dynamic Angle Selection & Core Intent Preservation

### A. 2-Stage Targeted Wireframe Loader
1. **Stage 1 (Format & Intent Selection in Step 2)**: DeepSeek analyzes the raw input content, concludes its primary strategic intent, and selects the SINGLE BEST Master Wireframe Format out of 11 in `00-Style-Bank-MOC.md`.
2. **Stage 2 (Targeted File Loader in Step 4)**: The engine loads ONLY that 1 selected format markdown file from disk (`lulua-pipeline/01-Style-Bank/`), eliminating ~80% of input prompt bloat.

### B. Universal Core Intent Preservation Mandate
While presentation framing adapts per target platform, the AI is **strictly forbidden from inverting or contradicting the core thesis/solution of the source material**:
* **Preserve Solution**: If the source input is an Actionable SOP ("How to do X to achieve Y"), the output MUST remain an Actionable SOP.
* **Zero Message Inversion**: The AI must NEVER turn a positive solution guide into a warning/fear-mongering post that attacks the solution!

### C. Multi-Run Cooldown System (`topic_history_log.json`)
Before generating new drafts, the automation script reads [`Configuration/topic_history_log.json`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/topic_history_log.json).
* The prompt engine dynamically excludes angles used in the last **7 to 14 days** for that platform.

---

## 📐 6. Platform Format Specifications & Output Architecture

### A. Single Targeted Platform Mode (`target_platform`)
To prevent token truncation and maximize quality, each run targets **1 specific platform** selected via frontmatter (`target_platform: instagram` | `x` | `youtube` | `tiktok` | `linkedin`). 100% of the token limit is dedicated to that platform.

### B. Header Section: Angle Overview & Editorial Pitch (To Editor-in-Chief)
Every output file starts with a 2-part executive pitch written **STRICTLY IN ENGLISH** (regardless of the social copy language):
1. **`## 🎙️ Angle Overview & Editorial Pitch (To Editor-in-Chief)`**:
   * **Part 1 (Strategic Angle Rationale)**: 2–3 analytical paragraphs in English explaining the presentation rationale and how the core solution was preserved.
   * **Part 2 (Slide-by-Slide Executive Outline)**: A 1-line English micro-summary per card/section detailing its narrative role.

### C. Instagram Carousel (Dynamic Dual-Library Variation Engine)
* **Elastic Slide Budget**: Dynamically scales (3 to 15 cards) based on natural topic depth.
* **5 Combined Variations Per Card**: Under every card header (`### CARD [N]`), DeepSeek generates **all 5 Combined Variations** (`#### 🔵 Variation 1` to `#### 🟡 Variation 5`), pairing 1 Semantic Phrasing Style (Library A) with 1 Visual Delivery Format (Library B):
  * **Library A (Phrasing)**: Ultra-Compact & Direct, Fluid Conversational, Condition-Action-Outcome, Outcome & Metric First, Interrogative Q&A.
  * **Library B (Visual Formats)**: Compact Paragraph, Bullet List (•), Key-Value Table, Rhetorical Q&A Split, Directional Arrow Flow (➔).

### D. YouTube Shorts & TikTok (Vertical Short Video)
* **Word Count**: **130–145 words max** (55s duration at 150 WPM speech rate).
* **Sentence Length**: Max 12 words per sentence.
* **Structure**: 4-stage timestamp table with visual editing cues.

### E. YouTube Long-Form & Community
* **Long-Form**: 5-Chapter structured video essay outline + B-roll/graphic asset cues.
* **Community Post**: Bulleted text + visual card spec + discussion question.

### F. LinkedIn Post
* **Format**: PDF Carousel spec or long-text B2B article with 1–2 sentences per block.

---

## 🎨 7. Post-Approval Production & Media Rendering Standard

Once a draft in `03-Ready/` is approved by the human operator, media production transitions into one of 3 operational rendering levels:

### Level 1: Semi-Automated Canva Bulk Batching (2 Mins/Carousel)
* **Target Platforms**: Instagram Carousels & LinkedIn PDF Slide Decks.
* **Workflow**:
  1. Open master brand Canva template (dark background `#0F172A`, green `#10B981` / red `#F43F5E` accents).
  2. Use Canva's **"Bulk Create"** feature to import slide copy directly from the approved Markdown draft file.
  3. Spend 60 seconds reviewing text padding, drop in 1 chart/diagram screenshot, and export as 1080×1350 PNG/PDF bundle.

### Level 2: 100% Programmatic HTML-to-PDF & Image Rendering (Zero-Touch Agent)
* **Target Platforms**: High-volume, automated IG PNG slide carousels & LinkedIn PDF decks.
* **Workflow**:
  1. A Node.js Playwright script (`carousel_renderer.mjs` / `test_render_3_styles.mjs`) reads slide blocks & image assets from the Markdown draft file.
  2. If a cutout hook is required, Python `rembg` (`auto_cutout.mjs`) automatically strips the subject background in ~1s.
  3. Injects text & images into custom HTML5/CSS3 templates (`Style_A_FullBleed.html`, `Style_B_WhiteCard.html`, `Style_C_CutoutSplit.html`).
  4. Headless Chromium renders slides at 1080×1350 resolution (2x retina scale) and exports pixel-perfect PNG/PDF carousels.
* **Detailed Technical Documentation**:
  * See [`instagram_carousel_rendering_stack.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/instagram_carousel_rendering_stack.md) for the complete software dependencies and setup.
  * See [`master_hook_archetypes_reference.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/master_hook_archetypes_reference.md) for the 7 Cover Hook Layout Archetypes.

### Level 3: Short-Form Video Production (Shorts & TikTok)
* **Workflow A (Talking Head + AI Captions — 2 Mins)**:
  * Sync the 60s script to an AI Teleprompter app (Captions.ai / Teleprompter Premium) on mobile.
  * Record 1-take video into phone camera. Captions.ai auto-generates word-by-word animated captions, visual B-roll, and sound effects.
* **Workflow B (Faceless AI Video Assembly — 100% Automated)**:
  * Script audio generated via **ElevenLabs API** (`.mp3`).
  * **Remotion.dev** or **Shotstack API** programmatically stitches audio + auto-captions + TradingView chart clips + visual badges specified in the draft script table into a rendered `.mp4` vertical video.

---
*End of Guide (`repurposing_guide.md`)*




