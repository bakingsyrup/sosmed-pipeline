# Instagram Carousel Rendering Stack (`instagram_carousel_rendering_stack.md`)

**Created:** August 9, 2026  
**Status:** Active Production & Technical Architecture Specification  
**Parent Framework:** [repurposing_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/repurposing_guide.md)  

---

## 🎯 1. Overview & Architectural Purpose

This document provides the complete, authoritative technical specifications for the **Programmatic HTML5 Playwright Rendering Engine** used to generate high-CTR Instagram carousels (1080×1350 px, 4:5 ratio).

The rendering stack processes copy across 3 distinct density tiers (Tier 1: Minimalist, Tier 2: Standard, Tier 3: High-Density Paragraphs) across 5 core HTML body card templates, 4 cover layouts, and 1 outro card.

---

## 📐 2. Tier Density Specifications

### Tier 1: Ultra-Minimalist Density (15–50 chars per item)
* **Goal**: Maximized visual punchiness, ultra-large text, and heavy whitespace.
* **Target Character Range**: `15–50 chars` / `3–8 words` per point or block.
* **Template Path**: `Configuration/templates/instagram/body_cards/tier1_minimalist/`
* **Calibrated Proportions**:
  * **Bullet SOP (`Format_1_BulletSOP.html`)**: Headline `54px`, Bullet lead `42px`, Body `32px`, Bullet dot `46px`, Padding `56px 52px`.
  * **Key-Value Table (`Format_2_KeyValueTable.html`)**: Headline `54px`, Badge `32px`, Description `40px`, Card padding `76px 60px`.
  * **Arrow Flow (`Format_3_ArrowFlow.html`)**: Headline `56px`, Step Title `40px`, Step Desc `32px`, Number badge `96px × 96px` (`46px` font), Arrow divider `56px`.
  * **Q&A Split (`Format_4_QASplit.html`)**: Headline `58px`, Question `42px`, Answer `36px`, Card padding `62px 56px`.
  * **Narrative Block (`Format_5_NarrativeBlock.html`)**: Headline `64px`, Quote lead `52px`, Body text `40px`, Quote icon `180px`, Card padding `40px 48px`.

---

### Tier 2: Standard Density (50–140 chars per item)
* **Goal**: Balanced high readability, commanding card structure, and standard bullet/table/flow items.
* **Target Character Range**: `50–140 chars` / `10–25 words` per point or block.
* **Template Path**: `Configuration/templates/instagram/body_cards/tier2_standard/`
* **Calibrated Proportions & Approved Specs**:
  * **Format 1: Bullet SOP (`Format_1_BulletSOP_T2.html`)**:
    * Headline: `58px`
    * Bullet Lead: `40px` (font-weight 800)
    * Body Text: `34px` (font-weight 500)
    * Bullet Dot Icon: `46px`
    * Card Padding: `44px 44px`, Item Gap: `20px`
  * **Format 2: Key-Value Comparison Table (`Format_2_KeyValueTable_T2.html`)**:
    * Headline: `56px`
    * Card Badge: `34px` (font-weight 900)
    * Card Description: `40px` (font-weight 600)
    * Card Padding: `76px 60px`, Internal Gap: `28px`, Grid Gap: `32px`
  * **Format 3: Directional Arrow Flow (`Format_3_ArrowFlow_T2.html`)**:
    * Headline: `56px`
    * Step Number Badge: `96px × 96px`, font size `46px` (font-weight 900)
    * Step Title: `40px` (font-weight 800)
    * Step Description: `32px` (font-weight 500)
    * Arrow Divider: `56px`
    * Card Padding: `50px 48px`, Container Gap: `16px`
  * **Format 4: Q&A Split (`Format_4_QASplit_T2.html`)**:
    * Headline: `58px`
    * Question Text: `42px` (font-weight 800)
    * Answer Text: `36px` (font-weight 500)
    * Card Padding: `62px 56px`, Answer Top Padding: `24px`
  * **Format 5: Narrative Quote Block (`Format_5_NarrativeBlock_T2.html`)**:
    * Headline: `64px`
    * Quote Lead: `52px` (font-weight 800)
    * Body Text: `40px` (font-weight 500)
    * Quote Icon: `180px`
    * Card Padding: `40px 48px`, Internal Gap: `20px`

---

### Tier 3: High-Density Paragraphs (140–300+ chars per item)
* **Goal**: Maximum readable text scaling for long educational paragraphs and detailed SOP breakdowns.
* **Target Character Range**: `140–300+ chars` / `25–60 words` per point or block.
* **Template Path**: `Configuration/templates/instagram/body_cards/tier3_dense/`
* **Calibrated Proportions & Approved Specs**:
  * **Format 1: Bullet SOP (`Format_1_BulletSOP_T3.html`)**: Headline `54px`, Lead `36px`, Body `30px`, Icon `44px`, Padding `46px 44px`, Gap `14px`.
  * **Format 2: Key-Value Comparison Table (`Format_2_KeyValueTable_T3.html`)**: Headline `54px`, Badge `34px`, Desc `36px`, Padding `64px 52px`, Gap `22px`.
  * **Format 3: Directional Arrow Flow (`Format_3_ArrowFlow_T3.html`)**: Headline `64px`, Badge `130px`, Step Title `38px`, Step Desc `28px`, Arrow `48px`, Padding `38px 40px`, Gap `8px`.
  * **Format 4: Q&A Split (`Format_4_QASplit_T3.html`)**: Headline `58px`, Question `42px`, Answer `34px`, Padding `54px 50px`, Gap `20px`.
  * **Format 5: Narrative Quote Block (`Format_5_NarrativeBlock_T3.html`)**: Headline `64px`, Quote Lead `54px`, Body Text `42px`, Quote Icon `130px`, Padding `36px 36px`.

---

## 🖼️ 3. Output Preview Repositories

* **Tier 1 Gallery**: `/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates/instagram/previews/tier1_gallery/`
* **Tier 2 Gallery**: `/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/Configuration/templates/instagram/previews/tier2_gallery/`

---

## 🛠️ 4. Test Runners & Automation Scripts

* **Tier 1 Test Runner**: `Configuration/test_render_tier1_stage2.mjs`
* **Tier 2 Test Runner**: `Configuration/test_render_tier2_stage2.mjs`

To re-render all calibrated PNGs on demand:
```bash
node Configuration/test_render_tier2_stage2.mjs
```
