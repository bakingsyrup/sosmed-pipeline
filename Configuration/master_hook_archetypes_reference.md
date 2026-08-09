# Master Reference: The 7 Cover & Hook Layout Archetypes in Global Media (`master_hook_archetypes_reference.md`)

**Created:** August 8, 2026  
**Status:** Architecture Reference & Visual Design Taxonomy  
**Parent System Guide:** [repurposing_guide.md](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/repurposing_guide.md)  

---

## 🏛️ Executive Summary

This reference document defines the complete 7-part visual hook taxonomy used across digital publishing (*Bloomberg, Vox, Wall Street Journal, Visual Capitalist, TechCrunch, Hormozi Media*). It serves as the visual layout blueprint for rendering Instagram/LinkedIn carousels and video cover frames via HTML/CSS + Playwright.

---

## 📐 The 7 Master Cover / Hook Layout Archetypes

```
┌──────────────────────────────────────────────────────────────────────────┐
│             THE 7 MASTER COVER & HOOK LAYOUT ARCHETYPES                  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
 ┌───────────┬───────────┬───────────┼───────────┬───────────┬───────────┐
 ▼           ▼           ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 1. PUNCHY│ │ 2. EX-  │ │ 3. HERO │ │ 4. EVENT│ │ 5. PER- │ │ 6. DATA │ │ 7. DUAL │
│ TEXT-   │ │ PLAINER │ │ OBJECT  │ │ SCENE   │ │ SONA    │ │ CHART   │ │ VERSUS  │
│ ONLY    │ │ SUBTEXT │ │ CUTOUT  │ │ (Full-  │ │ PORTRAIT│ │ HERO    │ │ SHOWDOWN│
│         │ │         │ │         │ │ Bleed)  │ │         │ │         │ │ (50/50) │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

### 1. Typography-Only / Punchy Statement (Text-Dominant)
* **CSS Class**: `.hook-layout-punchy-text`
* **Visual Spec**: Giant 54pt–72pt typography, 3 to 6 words max, high-contrast dark/light background, no secondary subtext.
* **Best Suited For**: Viral reach (TOFU), mega-numbers, contrarian myths, high-stakes claims.
* **Example**: `"99% OF TRADERS REKT IN 2026."`

---

### 2. Contextual Explainer (Headline + Subtext Paragraph)
* **CSS Class**: `.hook-layout-explainer-subtext`
* **Visual Spec**: Medium headline (32pt–40pt) + 1-2 sentence subtext paragraph explaining the problem/promise + category pill badge.
* **Best Suited For**: Step-by-step SOPs, tutorials, historical backtests, complex educational topics.
* **Example**: *"Bitcoin Sideways 2 Bulan: Ini Trik Amankan Porto Pas Crash"* + subtext paragraph.

---

### 3. Subject & Hero Object Spotlight (3D Cutout Asset)
* **CSS Class**: `.hook-layout-object-hero`
* **Visual Spec**: Isolated PNG cutout of a specific object, nation flag, hardware device, coin, or plant floating in the center/right + overlay headline text.
* **Best Suited For**: Hardware reviews (Nvidia H100 chip, Ledger wallet), specific tokens (Solana coin), entity spotlights (US Dollar bill, rare plant, corporate logo).
* **Example**: Cutout of an Nvidia GPU chip with headline *"The $300B AI Hardware Monopoly"*.

---

### 4. Breaking Event & Scene Atmosphere (Full-Bleed Photographic Background)
* **CSS Class**: `.hook-layout-event-scene`
* **Visual Spec**: Full-bleed photographic/cinematic background image (earthquake destruction, stock market crash floor, volcanic eruption, Fed press room) + dark gradient vignette overlay + crisp bold headline text.
* **Best Suited For**: Macro events, geopolitical crises, market crashes, natural disasters, regulatory crackdowns, environmental events.
* **Example**: Background photo of Tokyo Stock Exchange floor with headline *"Japan Yields Curve Collapse: What Happens Next?"*.

---

### 5. Persona & Authority Spotlight (Human Portrait / Avatar)
* **CSS Class**: `.hook-layout-persona-portrait`
* **Visual Spec**: Human cutout / portrait photo (founder, CEO, creator avatar, historical figure) + quotation badge + headline.
* **Best Suited For**: Founder retrospectives, opinion pieces, master investor quotes (Ray Dalio, Stanley Druckenmiller, Elon Musk), brand authority.
* **Example**: Portrait cutout of Stanley Druckenmiller with headline *"The 1 Macro Liquidity Rule That Built a $3B Fund"*.

---

### 6. Data Chart & Infographic Hero (Chart / Map Focus)
* **CSS Class**: `.hook-layout-data-chart`
* **Visual Spec**: Prominent chart graphic, map, or data visualization taking up 60% of the slide space + 1-line key takeaway headline at top or bottom.
* **Best Suited For**: Visual Capitalist style infographics, M2 liquidity charts, global maps, yield curve inversions.
* **Example**: Global M2 expansion chart with headline *"Global Liquidity Just Hit an All-Time High"*.

---

### 7. Dual Versus Showdown (50/50 Split-Screen)
* **CSS Class**: `.hook-layout-versus-showdown`
* **Visual Spec**: 50/50 split-screen layout comparing 2 entities side-by-side with a central "VS" badge.
* **Best Suited For**: Binary debates (USA vs. China, Gold vs. Bitcoin, Spot vs. Futures, AI vs. Human).
* **Example**: Left side Gold coin vs Right side Bitcoin coin with headline *"Gold vs Bitcoin: The 2026 Safe Haven Battle"*.

---

## 🤖 Programmatic Classifier Rules for AI Engine

When classifying input content, the AI agent tags the `hook_archetype` property based on the following taxonomy:

```yaml
---
hook_archetype: event_scene # punchy_text | explainer_subtext | object_hero | event_scene | persona_portrait | data_chart | versus_showdown
broll_visual_cue: "Full-bleed photo of earthquake destruction with dark gradient"
---
```

---
*End of Reference (`master_hook_archetypes_reference.md`)*
