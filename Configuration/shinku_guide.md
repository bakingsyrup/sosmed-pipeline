# Shinku Operator Guide (`shinku_guide.md`)
**Human-Facing Operational Manual**

---

## Section 1: Overview & Prerequisites

### Overview
**Shinku** is an automated social media content, video script skeleton, and technical glossary drafting pipeline. It monitors an Obsidian vault inbox, executes real-time web fact-verification via Gemini, drafts high-performing social posts and video skeletons using DeepSeek v4 Pro, maintains a bilingual A-Z technical glossary database, and feeds status cards in the Ad Astra Sosmed Center UI.

### Prerequisites
Before operating Shinku, ensure the following are configured and running:
* **Node.js**: v18+ installed on host system.
* **PM2**: Global process manager installed (`npm install -g pm2`).
* **API Credentials**: `DEEPSEEK_API_KEY` and `GEMINI_API_KEY` configured in `Configuration/.env`.
* **Obsidian Vault & UI**: Pipeline directory structure (`x-pipeline/`) connected to your Obsidian vault and Ad Astra Sosmed Center UI dashboard.

---

## Section 2: Workflows & Folder Pipeline Map

### Workflows Summary
1. **Standard Event News Drafting**: Fact-verifies incoming news notes and drafts publication-ready social media posts.
2. **Morning Briefing Drafting**: Aggregates overnight approved news notes (8:00 PM yesterday to present SGT) into a single morning brief thread.
3. **Bilingual Glossary Automation**: Extracts technical terms, appends database entries to `06-Glossaries/`, and drafts bilingual X threads.
4. **Video Skeleton Drafting**: Transforms topic inputs into structured video script skeletons.
5. **How-To Guide Drafting**: Generates actionable step-by-step instructional social posts.

### Folder Pipeline Map (`x-pipeline/`)
* 📊 **`00-Status.md`**: Live dashboard file read by Ad Astra Sosmed Center UI.
* 📥 **`01-Inbox/`**: Place raw curated news notes or how-to notes here.
* 🎥 **`01-Inbox/00-Video-Inputs/`**: Place video topic notes here.
* 💡 **`01a-Idea-Pitches/`**: Draft idea pitch storage.
* ⏳ **`02-Researching/`**: Active processing lock directory.
* 📤 **`03-Ready/`**: Output folder for completed Event News, Morning Briefings, and How-To drafts.
* 📤 **`03-Ready/00-Glossary-Drafts/`**: Output folder for generated X Glossary posts.
* 🎬 **`03-Ready/00-Video-Skeletons/`**: Output folder for completed video script skeletons.
* 📦 **`05-Archive/video-skeletons/`**: Automated archive folder for processed video topic inputs.
* 📚 **`06-Glossaries/`**: Master living database (`Glossary-[Category]-[EN/ID].md`).

---

## Section 3: Execution, Troubleshooting & Note Preparation

### Operating Platform
* **Execution & Daemons**: Node.js managed via **PM2**.
* **Engine Models**: **DeepSeek v4 Pro** (Drafting) & **Gemini 2.5 Flash** (Research Grounding).
* **Storage & Dashboard**: **Obsidian Vault** & **Ad Astra Sosmed Center UI**.

### Step-by-Step Commands

#### Start Shinku Daemon
```bash
pm2 start Configuration/draft_agent.mjs --name x-draft-agent
```

#### Check Status & Live Logs
```bash
pm2 status
pm2 logs x-draft-agent
```

#### Stop or Restart Daemon
```bash
pm2 stop x-draft-agent
pm2 restart x-draft-agent
```

### Input Note Preparation Checklist
* **Standard Event News**: Drop note into `01-Inbox/` with title, source link (`url: ...`), and handle (`handle: ...`).
* **Morning Briefing**: Create note in `01-Inbox/` with frontmatter `type: X - Morning Briefing`.
* **Video Skeleton**: Drop note into `01-Inbox/00-Video-Inputs/` with frontmatter `status: ready` and `type: Video - Topic Input`.

### Troubleshooting
* **File Stuck in `02-Researching/`**: If a run crashed, move the note from `02-Researching/` back to `01-Inbox/` (or `01-Inbox/00-Video-Inputs/`) and run `pm2 restart x-draft-agent`.
* **DeepSeek Peak Hours Pause**: If drafting pauses or switches to Gemini, check if it's SGT peak hour (Morning 8:50 AM–12:10 PM or Afternoon 1:50 PM–6:10 PM). The pipeline automatically routes to fallback model or resumes off-peak.
* **Daily Glossary Cap**: Max 6 terms (3 posts) per SGT calendar day. Resumes automatically on the next SGT date.

---

## Section 4: Agent Roster & Operational Rules

### Agent Roster
* **`x-draft-agent`**: Main PM2 daemon running `draft_agent.mjs`. Handles folder watching, Gemini search grounding, DeepSeek v4 Pro drafting, style guide application, glossary sorting, video skeleton routing, and Ad Astra UI status sync.

### Operational & Pricing Rules
* **DeepSeek Peak Hour Pricing Rules**:
  * **Morning Window**: 8:50 AM – 12:10 PM SGT
  * **Afternoon Window**: 1:50 PM – 6:10 PM SGT
  * During peak hours, drafting calls automatically route to Gemini to avoid peak billing.
* **API Retry System**: Native HTTPS retries (up to 3 attempts with exponential backoff) for API timeouts.
