# Style Bank MOC Formatting Rules

## 1. File Format & Frontmatter
- The MOC file MUST be structured as an Obsidian Kanban Board.
- Frontmatter MUST contain:
  ```yaml
  ---
  type: MOC
  database: Lulua Style Bank
  kanban-plugin: board
  ---
  ```
- The bottom of the file MUST contain the settings block with `"list-collapse"` set to `true` for all columns:
  ```markdown
  %% kanban:settings
  ```
  {"kanban-plugin":"board","list-collapse":[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]}
  ```
  %%
  ```

## 2. 18 Master Categories (List Structure)
- List headers MUST use H2 level formatting: `## XX - Category Name`
- The board maintains an inspection column `00 - New` plus 17 master categories:
  - `00 - New` (Inspection Inbox — newly dissected styles dual-filed here for quick review)
  - `01 - Step-by-Step SOP`
  - `02 - Master Cheat Sheet`
  - `03 - Learn & Earn Walkthrough`
  - `04 - Historical Precedent`
  - `05 - Mega Number Alert`
  - `06 - Binary Choice Debate`
  - `07 - Friction Remover`
  - `08 - Contrarian Manifesto`
  - `09 - Master Framework`
  - `10 - Lead Magnet Giveaway`
  - `11 - Founder Retrospective`
  - `12 - Company PR & Milestones`
  - `13 - Memes & Industry Satire`
  - `14 - Live Recaps & AMAs`
  - `15 - Social Proof & UGC`
  - `16 - Daily Posts`
  - `17 - Story Narrative`

## 3. Card Formatting & Wikilink Alias Structure
- Each card MUST be a single-line checklist item:
  `- [ ] [[style-file-name|Hook Component → Body Component → Closing Component. Platform.PostType]]`
- **DO NOT** add separate bold title lines above cards.
- **DO NOT** add explicit words like `"link"` or icon links.
- The 3-part narrative flow description PLUS the `Platform.PostType` suffix ITSELF serves as the Wikilink alias text to the style note.

## 4. Platform Tag Rules (`Platform.PostType`)
- **Reference Post Rule:** `Platform.PostType` MUST be derived directly from an actual, concrete **Reference / Example Post** associated with that style note (e.g., `IG.Carousel`, `X.Article`, `YT.Shorts`).
- **No-Guessing Rule:** If no reference post exists (e.g., template synthesized from training data), DO NOT guess or stack multi-platform tags. **Ask the user first** what `Platform.PostType` to assign.
- **Fallback Rule:** All existing style bank notes without an explicit reference post default to `X.Thread`.

## 5. Column Minimization / Collapsing
- All 17 columns MUST remain collapsed by default (`"list-collapse": [true, true, ...]`) so the board stays visually compact and scannable as new entries are added over time.
