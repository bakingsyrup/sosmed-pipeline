# Beidou & Iroi Documentation Maintenance Rule

This workspace rule governs how documentation for **Iroi** and **Beidou** (`iroi_brief.md`, `beidou_brief.md`, and `beidou_guide.md`) is maintained and updated.

---

## Target Documentation Files
1. **[Configuration/iroi_brief.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/iroi_brief.md)**: Business ecosystem & closed-loop overview.
2. **[Configuration/beidou_brief.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/beidou_brief.md)**: AI-facing technical context, schemas, and diagnostic rules.
3. **[Configuration/beidou_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/beidou_guide.md)**: Human-facing operational runbook.

---

## 1. End-of-Session Wrap-Up Protocol
Whenever the user requests a session wrap-up, session summary, or documentation update for Beidou/Iroi (e.g., *"wrap up session"*, *"update docs"*):
1. Review all code changes, data schemas, or diagnostic math rules developed during the session.
2. Update technical architecture, rules, and rolling changelog in `beidou_brief.md`.
3. Update business closed-loop status in `iroi_brief.md`.
4. Update workflows and operator instructions in `beidou_guide.md`.

---

## 2. Anti-Bloat Rules (`beidou_brief.md`)
* **Hard Limit**: Maintain `beidou_brief.md` under **200 lines max**.
* **Pointer Principle**: Use relative markdown links to schemas and code.
* **Rolling Changelog**: Maintain only the top 5 recent updates in the changelog.
