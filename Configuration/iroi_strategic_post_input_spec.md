# Iroi Strategic Post Input Architecture & Priority Spec (`iroi_strategic_post_input_spec.md`)
**Created:** August 3, 2026  
**Status:** Active Architectural Blueprint  
**Parent Strategy:** [iroi_strategy_roadmap.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_strategy_roadmap.md)  
**Parent Engine:** [lulua_brief.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/lulua_brief.md)  

---

## 🏛️ 1. Core Architectural Distinction

In the **Iroi Business Architecture**, content creation is divided into two distinct operational paradigms:

| Metric / Attribute | 🔴 Event Posts (Shinku Engine) | 🟣 Strategic Posts (Lulua Engine) |
| :--- | :--- | :--- |
| **Primary Trigger** | Real-time breaking news, market events, or macro announcements. | Strategic business objectives, evergreen value, affiliate monetization, & audience expansion. |
| **Input Source** | Curated raw news notes / RSS / link clippings dropped in `x-pipeline/01-Inbox/`. | 4-Tier Hybrid Input Priority System (Manual, Outliers, Revenue Rotation, Curriculum/Taxonomy Tree). |
| **Blueprint Format** | Standard 7-Draft Copywriting System (Drafts 1a, 1b, 1c, 2, 3, 4, 5). | Standardized 3-Part Style Bank Wireframe: Part 1 (Dissection Matrix), Part 2a (Reference Source), Part 2b (Indonesian Cross-Domain), Part 3 (Elastic Blueprint). |
| **Primary Goal** | Real-time narrative hijacking, market timeliness, & immediate audience reach. | High utility saves (bookmarks), debate engagement, lead-gen opt-ins, & direct revenue yield. |

---

## ⚙️ 2. 4-Tier Hybrid Priority Input System

To maintain a continuous, zero-stoppage stream of Strategic Posts while guaranteeing high signal quality, input topics are selected via a deterministic 4-tier fallthrough hierarchy:

```
                              ┌──────────────────────────────────┐
                              │ Strategic Post Input Processor   │
                              └─────────────────┬────────────────┘
                                                │
       ┌───────────────────────────────┬────────┴──────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼                               ▼
┌──────────────┐               ┌──────────────┐                ┌──────────────┐                ┌──────────────┐
│  Priority 1  │               │  Priority 2  │                │  Priority 3  │                │  Priority 4  │
│  User Inbox  │               │ Outlier Topic│                │ Revenue/Value│                │ Taxonomy Tree│
│  (Manual)    │               │ Mining (Beidou)              │ Rotation     │                │ Grounding    │
└──────────────┘               └──────────────┘                └──────────────┘                └──────────────┘
  Direct human                   Empirical competitor            Scheduled monetization           Master knowledge
  curation (when available).     viral topics (automated).      & lead-gen rotation.             taxonomy Markdown trees.
```

### Priority 1: User Manual Inbox (`01-Inbox/`)
* **Trigger**: Human operator stumbles upon a topic or has a specific narrative angle, editing `_NEW_STRATEGIC_INPUT.md` inside `01-Inbox/` and flipping `status: draft` ➔ `status: ready`.
* **Execution**: If present, overrides all automated options instantly.
* **Role**: Highest signal, 100% human intent.

### Priority 2: Beidou Competitor Outlier Topic Extractor
* **Trigger**: Scans Beidou's daily metric snapshot for competitor posts exceeding Virality Filters ($\text{View Yield} \ge 2.5\times$, $\text{Bookmarks} \ge 0.5\%$, or $\text{Replies} \ge 0.3\%$).
* **Execution**: Extracts the **core underlying topic, premise, and friction point** (stripping original copy) and packages it as an input payload for a matching Lulua Style Bank category.
* **Role**: Empirical market validation; capitalizes on topics already proven to engage the target niche.

### Priority 3: Revenue Anchor & Verified Tool Rotation Matrix
* **Trigger**: Automated schedule matching the 35-point Revenue Catalog ([`iroi_revenue_list.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_revenue_list.md)) and Verified Brand Register ([`iroi_verified_tools.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_verified_tools.md)).
* **Execution**: Pairs a verified tool (e.g. Bybit Spot Grid Bot, TradingView) or core asset with a `ClientAds`, `OwnedLeadGen`, or `HighUtility` wireframe. Non-product posts default to Zero-Friction Engagement CTAs (`Bookmark`, `Follow`, `Repost`).
* **Role**: Guarantees authentic, high-trust monetization without promoting unfamiliar tools.

### Priority 4: Curriculum Dissection & Knowledge Taxonomy Tree Grounding
* **Trigger**: Fallback engine activated when Priorities 1–3 yield no pending topics for the schedule.
* **Execution**: Traverses master knowledge taxonomy Markdown files in [`Configuration/taxonomies/`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/) ([`ai_taxonomy.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/ai_taxonomy.md), [`crypto_taxonomy.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/crypto_taxonomy.md), [`macro_taxonomy.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/macro_taxonomy.md), [`solopreneur_taxonomy.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/solopreneur_taxonomy.md)), using Gemini Search Grounding to populate bracketed wireframe slots with live, verifiable 2026 data.
* **Role**: Universal continuous fallback, ensuring the pipeline never halts or runs out of topics.

---

## 🧠 3. Topic Sophistication Hierarchy & Input Sourcing Window

Strategic Posts are categorized into 3 levels of topic sophistication, each requiring a specific input sourcing method and time horizon:

| Level | Topic Nature | Primary Sourcing Method | Time Horizon Window | Primary Target Metric & Goal |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Basic / Evergreen** | Timeless definitions, core mechanics, static concepts (e.g. *"LLM Context Window Basics"*). | **Historical Archives & Local Vault Indexing** (`06-Glossaries/`, `00-Outliers/`, Site Syllabus). | **1–5 Years Past Data** *(Near-zero decay)* | Top-of-Funnel Reach & Broad Search Discovery. |
| **Level 2: Intermediate** | Practical workflows, tool playbooks, step-by-step systems (e.g. *"Ollama + Open-WebUI Dev Setup"*). | **Medium-Term Playbooks & Vendor Catalogs** (Product docs, 3–6 mo. top tutorials). | **3–6 Months Past Data** *(Quarterly updates)* | High Utility Bookmarks / Saves ($\ge 0.5\%$). |
| **Level 3: Advanced** | Counter-intuitive macro/tech analysis, edge-case architectures, spicy debates. | **Real-Time Outlier & Authority Scans** (Beidou live scans, breaking papers, X debates). | **0–7 Days Live Data** *(Fast decay)* | Peer Authority, Replies ($\ge 0.3\%$), & High-Ticket B2B Conversion. |

---

## 🌐 4. Continuous Taxonomy Processing & Screening Workflow

To turn the master taxonomy Markdown files into a continuous, zero-friction post engine without forcing the human operator to post about unfamiliar terms, the system follows a 4-step execution loop:

```
┌──────────────────────────────┐
│ 1. Taxonomy Curation & Gloss │ ◄── Human reviews/flags topics; Agent explains unfamiliar terms
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 2. Level Rotation Scheduler  │ ◄── Rotates 40% L1 (Basic) / 40% L2 (Interm) / 20% L3 (Adv)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 3. Gemini Live Grounding     │ ◄── Fetches up-to-date 2026 facts, stats & software names
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 4. Wireframe Draft & UI      │ ◄── Injects into Style Bank wireframe; 1-click human approval
└──────────────────────────────┘
```

### Step 1: Human-in-the-Loop Curation & Term Screening
* **Simple Markdown Tagging**: The operator can annotate any topic inside [`Configuration/taxonomies/`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/taxonomies/):
  * `[x]` **Active**: Approved for automated generation.
  * `[-]` **Archived/Skip**: Excluded from generation (obscure or off-brand).
  * `[?]` **Explain Needed**: Triggers the agent to append a 2-line ELI5 explanation under the topic in the file.
* **On-Demand ELI5 Command**: Operator can prompt Lulua in chat: `"Explain [Topic_ID] in 2 sentences and why it matters to my audience."`
* **Step 1b (Weekly Schedule Lock Rule)**: Once the operator and AI align on the week's post angles in chat, the AI MUST log the active schedule into Module 2 of [`iroi_command_center.md`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_command_center.md) BEFORE generating any post payloads or drafts.

### Step 2: Automated Level Rotation Scheduler
* **Execution Cadence**: Background scheduler (`scripts/strategic_post_scheduler.mjs` or Lulua Engine) runs on a weekly rotation matching `iroi_command_center.md`:
  * **Monday**: **Level 1 (Basic/Evergreen)** — Broad reach, top-of-funnel discovery (`HighUtility`).
  * **Wednesday**: **Level 2 (Intermediate)** — Practical system/tool playbook, high saves (`HighUtility` / `ClientAds`).
  * **Friday**: **Level 3 (Advanced)** — Deep strategic debate, peer respect (`DebateEngagement` / `BrandIdentity`).
* Selects the next unused `[x] Active` topic node matching the target difficulty level.

### Step 3: Live 2026 Grounding & Payload Packaging
* **Grounding Check**: Agent runs Gemini Search Grounding on the selected topic node to fetch current 2026 software releases, API changes, or market metrics.
* **Payload Packaging**: Constructs an Input Payload JSON containing the verified facts, core topic, target metric, and target Style Bank wireframe.

### Step 4: Wireframe Generation & 1-Click UI Approval
* **Drafting Engine**: `wireframe_drafting_prompt.mjs` populates bracketed slots (`[Hook]`, `[Setup]`, `[Body]`, `[Closing]`) of the selected Style Bank template using the Pragmatic Analyst voice (`x_style_guide.md`).
* **Human Approval**: Finished draft is placed into `x-pipeline/03-Ready/00-Strategic-Drafts/` and displayed on the Ad Astra Sosmed Center UI for 10-second human review & 1-click publishing.

---

## 📊 5. Closed-Loop Topic Execution & Yield Tracker (`topic_history_log.json`)

> **Live Implementation:** The logging system, schema, and dedup pipeline are now active. See [published_content_log_spec.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/published_content_log_spec.md) for the current schema and operational workflow. The cooldown is 10 posts per platform (not 30 days).

To prevent audience reader fatigue, enforce a **30-day topic cooldown**, and track metric yields per taxonomy node, the system logs every published post into a centralized closed-loop database at [`Configuration/topic_history_log.json`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/topic_history_log.json):

```
 ┌───────────────────────────┐
 │ 1. Topic Scheduled        │ ◄── Topic ID `solo_p2_i01` selected from taxonomy
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ 2. Post Published         │ ◄── Assigned Published Post ID `#1823901923`
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ 3. Beidou Scrapes Metrics │ ◄── Attaches 7-day Views, Bookmarks & Retweets to Post ID
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ 4. Topic History Logger   │ ◄── Appends record to Configuration/topic_history_log.json
 └─────────────┬─────────────┘
```

### Log Record Schema (`topic_history_log.json`):

```json
{
  "post_history": [
    {
      "topic_id": "solo_p2_i01",
      "niche": "Solopreneurship",
      "topic_name": "Make.com Multi-App Automation & Error Handling Modules",
      "sophistication_level": "Level_2_Intermediate",
      "style_category": "ClientAds",
      "published_at": "2026-08-03",
      "platform": "X",
      "post_id": "1823901923",
      "cooldown_until": "2026-09-02",
      "metrics_7d": {
        "views": 18400,
        "view_yield": "3.1x",
        "bookmarks": 210,
        "bookmark_ratio": "1.14%",
        "replies": 42
      }
    }
  ]
}
```

### Closed-Loop Rules:
1. **30-Day Anti-Fatigue Cooldown Gate**: Before the scheduler selects any topic node from `Configuration/taxonomies/*.md`, it checks `topic_history_log.json`. If the topic was published within the last 30 days (`cooldown_until`), it is skipped automatically to protect reader retention.
2. **Taxonomy Yield Ranking**: Beidou diagnostic engine aggregates metrics by `topic_id` and `sophistication_level` to report which taxonomy pillars yield the highest bookmarks and retweets.
3. **Command Center Status Sync**: When Beidou detects a live published post, it auto-flips the status in `iroi_command_center.md` Module 2 from `Scheduled` ➔ `Published`.

---

## 📋 6. Data Flow & Wireframe Payload Schema

When an input topic is selected, it is converted into a standardized **Input Payload JSON** passed to `wireframe_drafting_prompt.mjs`:

```json
{
  "priority_source": "Priority_4_Taxonomy_Grounding",
  "sophistication_level": "Level_2_Intermediate",
  "category_target": "HighUtility",
  "wireframe_templates": [
    "style-HighUtility_Thread_CaseStudyExample_v1.md",
    "style-HighUtility_Thread_HowToPlaybook_Bookmarks_v1.md",
    "style-DebateEngagement_Thread_BinaryChoice_v1.md",
    "style-BrandIdentity_Thread_ContrarianManifesto_v1.md",
    "style-HighUtility_Thread_MasterCheatSheet_v1.md"
  ],
  "input_payload": {
    "topic_id": "solo_p2_i01",
    "core_topic": "Make.com Multi-App Automation & Error Handling Modules",
    "target_metric": "Bookmarks",
    "primary_lever": "Utility / Efficiency",
    "key_entities": ["Make.com", "N8N", "Webhooks", "Notion API"],
    "verified_facts": ["Error break routers prevent scenario crashes", "Automatic retry loops for 5xx errors"],
    "source_reference_url": "Configuration/taxonomies/solopreneur_taxonomy.md",
    "revenue_anchor_link": "https://www.make.com/en/affiliate-program"
  }
}
```

---

## 🚀 7. Actionable Build Roadmap for Input Pipeline

1. **Phase 5.1 (Wireframe Drafting Engine)**: ✅ Complete. `draft_agent.mjs` + `wireframe_drafting_prompt.mjs` with 5-step Planner→Researcher→Drafter ping-pong pipeline. Monitors `_NEW_STRATEGIC_INPUT.md` in `x-pipeline/01-Inbox/00-Strategic-Inputs/`, auto-selects 4 wireframes from `style-index.md`. **Only the X (Twitter) pipeline is wired.** Templates at `ig-pipeline/`, `tiktok-pipeline/`, `linkedin-pipeline/`, and `yt-pipeline/` exist but are not watched — future work.
2. **Priority 1 Handler**: Implement `01-Inbox/` note watcher frontmatter parser (`style_wireframe` selector).
3. **Priority 3 Handler**: Connect `iroi_command_center.md` Module 3 revenue rotation schedule into automated prompt generator.
4. **Priority 2 Handler**: Build Lulua outlier topic extraction parser on top of Beidou daily snapshots.
5. **Priority 4 Taxonomy Scheduler**: Build `scripts/strategic_post_scheduler.mjs` to traverse `Configuration/taxonomies/*.md` and generate payloads for `wireframe_drafting_prompt.mjs`.
