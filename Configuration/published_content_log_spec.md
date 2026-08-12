# Published Content Log System (`published_content_log_spec.md`)
**Created:** August 12, 2026
**Status:** Active
**Parent Pipeline:** Sosmed-Pipeline (cross-pipeline infrastructure)

---

## Purpose

A centralized closed-loop logging system that tracks every published post across all platforms. Serves two consumers:

1. **Style Dedup** — Prevents the strategic post engine and repurposing agent from reusing the same narrative archetypes too frequently.
2. **Content Reuse** — Stores full post bodies so the repurposing pipeline can adapt content without scraping APIs (which break when platforms change their HTML).

One log file (`topic_history_log.json`) feeds both pipelines. One template (`_LOG_PUBLISHED_POST.md`) captures all published content.

---

## File Locations

| File | Path |
|---|---|
| Template | `Sosmed-Pipeline/01-Inbox/_LOG_PUBLISHED_POST.md` |
| Log database | `Sosmed-Pipeline/Configuration/topic_history_log.json` |
| Image archive | `Sosmed-Pipeline/01-Inbox/_LOG_PUBLISHED_IMAGES/{log_id}/` |
| Watcher script | `Sosmed-Pipeline/Configuration/published_log_watcher.mjs` |
| Style Bank | `Sosmed-Pipeline/lulua-pipeline/01-Style-Bank/` |

---

## Template Structure

```yaml
---
type: Published Post Log
status: draft
style: ""
content_type: ""
topic_id: ""
post_url: ""
published_at: ""
---

# Published Content Body

## Post 1

## Post 2

## Post 3
...
(up to Post 25)
```

### Properties

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | Select | Yes | `draft` → triggers nothing. `ready` → triggers watcher processing. |
| `style` | Text | Yes | Exact style filename from Style Bank (without `.md`). e.g. `style-ClientAds_Thread_ProblemSolution_AppDownload_v2` |
| `content_type` | Select | Yes | `x_thread`, `instagram_carousel`, `youtube_short`, `youtube_longform`, `tiktok`, `linkedin_article` |
| `topic_id` | Text | No | Taxonomy node ID (e.g. `crypto_p5_b01`) or source content slug. Used for cooldown. |
| `post_url` | Text | No | Direct link to the published post on the platform. |
| `published_at` | Text | Yes | ISO date string (`2026-08-12`). |

### Post Blocks

Each `## Post N` header is followed by one blank line for pasting. System counts only non-empty blocks. Empty headers with nothing below them are discarded automatically.

- **X Thread / LinkedIn / YouTube text posts:** Paste the full post body text.
- **Instagram Carousel:** Drag-and-drop images — Obsidian inserts `![[image.png]]`. One card image per Post block.
- **YouTube transcripts:** Paste the video transcript text.

---

## Usage Flow

```
1. Open _LOG_PUBLISHED_POST.md in Obsidian
2. Fill properties: style, content_type, published_at (topic_id and post_url optional)
3. Paste content into Post 1–N blocks (leave unused ones empty)
4. Flip status: draft → ready
5. Watcher processes within 5 seconds
6. Template auto-regenerates as a fresh blank
```

---

## Watcher Processing Pipeline

1. **Detect:** Polls `_LOG_PUBLISHED_POST.md` every 5 seconds. Triggers only on transition from non-ready → ready.
2. **Validate:** Checks `content_type` is in the valid enum, `style` file exists in Style Bank, `published_at` is present.
3. **Extract Archetype:** Deterministic parsing of style filename — split by `_`, third segment is the archetype token. e.g. `style-ClientAds_Thread_ProblemSolution_AppDownload_v2` → `ProblemSolution`.
4. **Parse Posts:** Counts non-empty Post blocks. Strips HTML comments. Collects image wiki-links.
5. **Archive Images:** Copies referenced local images to `_LOG_PUBLISHED_IMAGES/{log_id}/` for permanent storage.
6. **Log Entry:** Appends a record to `topic_history_log.json`.
7. **Regenerate Template:** Overwrites `_LOG_PUBLISHED_POST.md` with a fresh blank template.

---

## `topic_history_log.json` Schema

```json
[
  {
    "id": "log_20260812_1723456789",
    "published_at": "2026-08-12",
    "content_type": "x_thread",
    "topic_id": "crypto_p5_b01",
    "style": "style-ClientAds_Thread_ProblemSolution_AppDownload_v2",
    "style_archetype": "ProblemSolution",
    "platform": "X",
    "post_url": "https://x.com/KenalKripto/status/1823901923",
    "post_count": 7,
    "posts": [
      { "index": 1, "text": "First 500 chars...", "image_count": 0 },
      { "index": 2, "text": "First 500 chars...", "image_count": 1 }
    ],
    "archived_images": null
  }
]
```

| Field | Description |
|---|---|
| `content_type` | Format identifier (determines platform mapping) |
| `platform` | Display name: `X`, `Instagram`, `YouTube`, `TikTok`, `LinkedIn` |
| `style` | Full style filename (without `.md`) |
| `style_archetype` | Base narrative archetype token extracted from style filename |
| `posts[].text` | Truncated to 500 chars in the log (full text is in the template note body) |
| `archived_images` | Paths to copied image files, or `null` |

---

## Dedup Rules

### Strategic Post Style Selection (`draft_agent.mjs`)

Before the LLM selects wireframe styles for a new strategic post:
- Reads last 10 entries from `topic_history_log.json` where `platform === 'X'` and `style` is not null
- Passes those exact style filenames to the LLM as `EXCLUDED` — they must not be selected
- **Per-platform:** Only X-platform entries block X style selection. Instagram entries don't affect X selection.
- **User override:** If `custom_styles` has 4+ manual styles, dedup is skipped entirely.

### Repurposing Agent (`repurposing_agent.mjs`)

Before selecting the format/angle for a repurposed post:
- Reads last 5 entries with valid `style_archetype` values
- Passes compact `{topic_id, platform, style_archetype}` JSON to the LLM as cooldown reference
- LLM uses this to avoid repeating the same narrative angle on the same platform

### Archetype vs Full Filename

Dedup is at the archetype level, not exact filename. Posting `ProblemSolution_AppDownload_v2` blocks all `ProblemSolution` variants for the next 10 posts. Rationale: same narrative skeleton with different cosmetic details feels repetitive to the audience.

---

## Obsidian Setup (One-Time)

To get a dropdown for `content_type`:
1. Open `_LOG_PUBLISHED_POST.md` in Obsidian
2. Open the Properties panel (sidebar)
3. Click the type tag next to `content_type` → change to "Select"
4. Add options: `x_thread`, `instagram_carousel`, `youtube_short`, `youtube_longform`, `tiktok`, `linkedin_article`
5. Every future regenerated template inherits the dropdown automatically

Same for `status`: add `draft` and `ready` options.

---

## PM2 Daemon

```
published-log-watcher    online    fork    Polls every 5s
```

Saved to PM2 dump. Requires `pm2 save` after any reconfiguration.
