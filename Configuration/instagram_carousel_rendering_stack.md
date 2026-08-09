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

### Tier 1: Punchy Micro-Copy Density (20–50 chars per item)
* **Goal**: Maximized visual punchiness, ultra-large text, and heavy whitespace.
* **Target Character Range**: `20–50 chars` / `4–10 words` per point or block.
* **Template Path**: `Configuration/templates/instagram/body_cards/tier1_punchy/`
* **Calibrated Proportions & Approved Specs**:
  * **Bullet SOP (`Format_1_BulletSOP_T1.html`)**: Headline `72px`, Bullet lead `58px`, Body `48px`, Bullet icon `74px`, Card padding `46px 48px`, Gap `20px`.
  * **Key-Value Table (`Format_2_KeyValueTable_T1.html`)**: Headline `70px`, Badge `38px`, Description `52px`, Card padding `72px 60px`, Grid gap `24px`.
  * **Arrow Flow (`Format_3_ArrowFlow_T1.html`)**: Headline `74px`, Step Badge `124px × 124px` (`56px` font), Step Title `52px`, Step Desc `44px`, Arrow divider `68px`, Card padding `40px 42px`, Stack gap `6px`.
  * **Q&A Split (`Format_4_QASplit_T1.html`)**: Headline `78px`, Question `60px`, Answer `48px`, Card padding `40px 42px`, Stack gap `16px`.
  * **Narrative Block (`Format_5_NarrativeBlock_T1.html`)**: Headline `78px`, Quote lead `80px`, Body text `66px`, Quote icon `260px`, Card padding `52px 52px`, Gap `24px`.
  * **Outro CTA Card (`Outro_Card_CTA.html`)**: Headline `"Kamu Suka?"` (`84px` white `#FFFFFF`), Subtext `"Follow. Like. Comment"` (`52px` emerald green `#10B981`).

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

### Tier 4: Ultra-High Density (250–500 chars per item)
* **Goal**: Maximum readable typography scaling and compact container padding for extensive educational copy.
* **Target Character Range**: `250–500 chars` / `45–90 words` per point or block.
* **Template Path**: `Configuration/templates/instagram/body_cards/tier4_high_density/`
* **Calibrated Proportions & Approved Specs**:
  * **Format 1: Bullet SOP (`Format_1_BulletSOP_T4.html`)**: Headline `52px`, Lead `34px`, Body `28px`, Icon `38px`, Padding `26px 36px`, Gap `10px`.
  * **Format 2: Key-Value Comparison Table (`Format_2_KeyValueTable_T4.html`)**: Headline `52px`, Badge `32px`, Desc `32px`, Padding `56px 48px`, Gap `22px`.
  * **Format 3: Directional Arrow Flow (`Format_3_ArrowFlow_T4.html`)**: Headline `52px`, Step Badge `84px × 84px` (`40px` font), Step Title `36px`, Step Desc `27px`, Arrow `42px`, Padding `36px 36px`, Gap `6px`.
  * **Format 4: Q&A Split (`Format_4_QASplit_T4.html`)**: Headline `60px`, Question `42px`, Answer `33px`, Padding `44px 44px`, Gap `10px`.
  * **Format 5: Narrative Quote Block (`Format_5_NarrativeBlock_T4.html`)**: Headline `64px`, Quote Lead `48px`, Body Text `36px`, Quote Icon `100px`, Padding `28px 32px`.

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
