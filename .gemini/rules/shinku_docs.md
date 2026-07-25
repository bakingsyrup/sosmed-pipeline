# Shinku Documentation Maintenance Rule

This workspace rule governs how documentation for the **Shinku** project (`shinku_brief.md` and `shinku_guide.md`) is created, maintained, and updated.

---

## Target Documentation Files
1. **[Configuration/shinku_brief.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/shinku_brief.md)**: AI-facing session briefing & technical context.
2. **[Configuration/shinku_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/shinku_guide.md)**: Human-facing operational runbook.

---

## 1. End-of-Session Wrap-Up Protocol
Whenever the user requests a session wrap-up, session summary, or documentation update (e.g., *"wrap up session"*, *"update docs"*):
1. Review all code changes, new scripts, or prompt adjustments made during the session.
2. Update technical architecture, rules, and rolling changelog in `shinku_brief.md`.
3. Update workflows, commands, and operator instructions in `shinku_guide.md` if any workflow was added or modified.

---

## 2. Anti-Bloat Rules (`shinku_brief.md`)
* **Hard Limit**: Maintain `shinku_brief.md` under **200 lines max**.
* **Pointer Principle**: Never paste full code or prompts. Use relative markdown links `[filename.mjs](file://...)`.
* **Rolling Changelog**: Maintain only the top 5 recent updates in the changelog. Prune or summarize older completed tasks.

---

## 3. Human Runbook Standards (`shinku_guide.md`)
* Keep `shinku_guide.md` strictly divided into the **4 standard sections**:
  - Section 1: Overview & Prerequisites
  - Section 2: Workflows & Folder Pipeline Map
  - Section 3: Execution, Troubleshooting & Note Preparation
  - Section 4: Agent Roster & Operational Rules
* Keep language clear, brief, and actionable for human operators.
