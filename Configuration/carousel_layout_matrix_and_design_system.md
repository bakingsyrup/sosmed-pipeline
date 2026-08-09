# Instagram Carousel Layout Matrix & Design System Specification

## 1. System Overview & Design Philosophy

This document defines the architectural specification for the automated **Instagram Carousel Layout Matrix & Design System**.

### Core Problem Solved
Traditional fluid CSS layouts attempt to stretch or compress arbitrary text into generic containers, resulting in severe visual scale imbalance (e.g. tiny text inside a giant box, large empty black voids on 1080x1350px canvas, or small 20px arrows between massive cards).

### The Solution: Tokenized Proportion Matrix Engine
Instead of fluid layout guessing, the system uses a **Proportion Matrix Engine** mapping every **Card Archetype x Item Count x Character Capacity Tier**. 

Copywriters and AI agents write copy freely. `designer_agent.mjs` measures the character/word volume, matches it to the corresponding **Character Capacity Tier**, and injects pre-engineered token metrics (font size, box padding, badge size, arrow scale, grid columns) into the Master HTML Template.

---

## 2. Exhaustive Instagram Carousel Card Catalog

The system supports **18 distinct Card Archetypes** organized across **5 Functional Categories**:

### 🟢 Category A: Cover & Hook Cards (Slide 1)
1. **Bold Typography Hook**: Single massive headline with 2–3 sentence subtext and high-contrast dark background.
2. **Media/Chart Overlay Cover**: Large headline over an annotated chart, screenshot, or background image with a dark gradient overlay.
3. **The "Problem Statement" Hook**: Emphasizes a severe pain point, myth, or financial trap (*"Stop Doing X If You Want Y"*).
4. **Table of Contents / Roadmap Index**: Displays a structured list of what the carousel covers (*"5 Steps, 3 Tools, 1 Golden Rule"*).

### 🔵 Category B: Process & Sequential Cards (Flow & Tutorials)
5. **Vertical Timeline / Step-by-Step Flow**: Sequential numbered cards (`01`, `02`, `03`) connected by vertical arrows or line connectors.
6. **Horizontal Progress / Milestone Card**: Multi-stage progress bar across the card showing workflow stages (`Phase 1 ➔ Phase 2 ➔ Phase 3`).
7. **Before & After / Progress Transition**: Highlights state changes (*Portofolio Awal ➔ Eksekusi SOP ➔ Hasil Akhir*).

### 🟡 Category C: Comparative & Structural Cards (Analysis & SOPs)
8. **Split 2-Column Comparison (Do vs Don't / Mitos vs Fakta)**: Side-by-side vertical split comparing bad practices (Red) against best practices (Green).
9. **Rhetorical Q&A Stack**: Stacked conversational boxes simulating an interview or micro-dialogue between a beginner and an expert.
10. **4-Quadrant Matrix (2×2 Grid)**: Compares 4 items across two axes (*High Risk vs Low Risk / High Reward vs Low Reward*).
11. **Feature Checklist / Bullet List**: Clean single-column list with checkmarks (`✓`), crossmarks (`✗`), or bullet icons (`•`).
12. **Key-Value Data Metric Highlight**: Giant numeric callout (`+142%`, `$60,000`, `3.5x`) in a display font paired with explanatory micro-copy.

### 🟣 Category D: Narrative & Technical Deep-Dive Cards
13. **Editorial Pull-Quote / Story Block**: Single styled block with large quotation marks (`“...”`), bold lead-in sentence, and author attribution.
14. **Annotated Screenshot / UI Breakdown**: High-resolution image/chart in the center with visual pointer badges calling out technical details.
15. **Glossary / Concept Definition**: Single complex term at the top with phonetics/definition, followed by an actionable SOP breakdown.

### 🔴 Category E: Outro & Conversion Cards (Final Slide)
16. **Summary / Recapitulation Card**: Key takeaways recap summarizing the entire slide deck into 3–4 bullet points.
17. **Pure CTA / Social Proof Card**: Clean closing card with creator avatar, handle, Save/Bookmark icon, Share prompt, and action command (*"Simpan thread ini & follow..."*).
18. **Lead Magnet / Resource Card**: Promotes a downloadable guide, link-in-bio, or newsletter.

---

## 3. Character Capacity Tiers & Scale Proportions

Every card format is bound to **5 Character Capacity Tiers** to maintain 100% visual scale harmony on the 1080x1350px viewport:

```
Configuration/templates/instagram/
├── covers/                       <-- Cover & Hook Card Archetypes
├── body_cards/                   <-- Body Card Templates Grouped by Tier
│   ├── tier1_punchy/             <-- Tier 1 (20–50 chars) Master Variants
│   ├── tier2_standard/           <-- Tier 2 (50–140 chars) Master Variants
│   ├── tier3_executive/          <-- Tier 3 (140–250 chars) Master Variants
│   └── tier4_high_density/       <-- Tier 4 (250–500 chars 2-Column Grid)
├── outro/                        <-- Outro CTA Archetypes
└── previews/                     <-- Visual PNG Preview Render Galleries
    └── tier1_gallery/            <-- Tier 1 Gallery Outputs
```

| Tier Name | Character Range | Word Count Range | Typography Strategy | Container & Asset Scaling Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Punchy** | 20 – 50 chars | 4 – 10 words | Title: **38px – 48px**<br>Body: **26px – 32px** | Box Padding: **44px – 52px**<br>Badge/Icon: **64px – 72px**<br>Max white space, 1-column. |
| **Tier 2: Standard** | 50 – 140 chars | 10 – 25 words | Title: **28px – 32px**<br>Body: **22px – 24px** | Box Padding: **36px – 40px**<br>Badge/Icon: **48px – 56px**<br>Standard 3-box vertical stack. |
| **Tier 3: Executive** | 140 – 250 chars | 25 – 45 words | Title: **22px – 24px**<br>Body: **18px – 20px** | Box Padding: **24px – 28px**<br>Badge/Icon: **36px – 44px**<br>Compact micro-copy, tight gaps. |
| **Tier 4: High-Density** | 250 – 500+ chars | 45 – 90+ words | Title: **20px – 22px**<br>Body: **15px – 18px** | Box Padding: **20px–36px**<br>Badge/Icon: **28px – 38px**<br>Compact multi-box / narrative block. |

---

## 4. Tokenized Proportion Matrix Configuration Schema

In `designer_agent.mjs`, template styling is driven by this programmatic matrix:

```javascript
const PROPORTION_MATRIX = {
  FORMAT_3_ARROWFLOW: {
    '3_BOXES': {
      TIER_1: { chars: [20, 50],   fontTitle: '36px', fontDesc: '26px', boxPadding: '44px', badgeSize: '72px', arrowSize: '36px', gap: '24px' },
      TIER_2: { chars: [50, 140],  fontTitle: '30px', fontDesc: '22px', boxPadding: '36px', badgeSize: '64px', arrowSize: '28px', gap: '20px' },
      TIER_3: { chars: [140, 250], fontTitle: '24px', fontDesc: '18px', boxPadding: '28px', badgeSize: '54px', arrowSize: '22px', gap: '16px' },
      TIER_4: { chars: [250, 500], fontTitle: '20px', fontDesc: '15px', boxPadding: '20px', badgeSize: '44px', arrowSize: '16px', gap: '12px', layout: '2-column-grid' },
    }
  },
  FORMAT_4_QASPLIT: {
    '3_PAIRS': {
      TIER_1: { chars: [20, 50],   fontQ: '32px', fontA: '26px', padding: '32px', tagSize: '16px', gap: '24px' },
      TIER_2: { chars: [50, 140],  fontQ: '26px', fontA: '22px', padding: '24px', tagSize: '14px', gap: '18px' },
      TIER_3: { chars: [140, 250], fontQ: '22px', fontA: '18px', padding: '18px', tagSize: '12px', gap: '14px' },
      TIER_4: { chars: [250, 500], fontQ: '18px', fontA: '15px', padding: '14px', tagSize: '11px', gap: '10px', layout: '2-column-grid' },
    }
  }
};
```

---

## 5. Multi-Session Workflow Integration

1. **Upstream Draft Agent (`draft_agent.mjs`)**: Writers write naturally. If a section exceeds Tier 4 (>500 chars), `draft_agent.mjs` automatically creates a 2-part card sequence.
2. **Designer Agent (`designer_agent.mjs`)**: Measures character volume per card, queries `PROPORTION_MATRIX`, and injects token variables into Playwright HTML headers.
3. **Master HTML Templates (`templates/body_cards/*.html`)**: Consume CSS variables (`var(--font-title)`, `var(--box-padding)`, `var(--badge-size)`) to achieve 100% pixel harmony.

---

## 6. Card-Level Density Budgeting, Bottleneck Determinism & Auto-Splitting Rules

### 6.1 The Bottleneck Principle (Max-Character Determinism)
When a card contains multiple sub-elements (e.g. 3 SOP bullets or 2–4 Q&A pairs) with varying character lengths, the engine **evaluates density at the Card Level**:

* **Rule**: A single card MUST maintain visual typography harmony (uniform font sizes across sister elements).
* **Determinism Logic**: The longest sub-element on a card governs the template tier for all items on that card:
  $$\text{maxItemChars} = \max(\text{length}(\text{item}_1), \text{length}(\text{item}_2), \dots, \text{length}(\text{item}_n))$$
* **Routing**:
  - `maxItemChars <= 50` $\rightarrow$ `tier1_punchy`
  - `maxItemChars <= 140` $\rightarrow$ `tier2_standard`
  - `maxItemChars <= 250` $\rightarrow$ `tier3_executive`
  - `maxItemChars <= 500` $\rightarrow$ `tier4_high_density`

### 6.2 Total Card Capacity Load & Auto-Splitting Engine
To prevent squishing or vertical clipping on a $1080 \times 1350\text{px}$ canvas, the engine enforces a **Total Card Character Budget**:

* **Max Single Card Capacity Load**: 350 characters total across all headline + items.
* **Max Item Count Budget**: 3 bullets / 2 Q&A pairs (or max 4 compact Tier 1 items).
* **Auto-Split Trigger**:
  If $\sum \text{itemChars} > 350$ OR $\text{itemCount} > 4$, the engine automatically splits the slide into two sequential slides:
  - Slide N.1: `Headline (Part 1)` $\rightarrow$ First half of items
  - Slide N.2: `Headline (Part 2)` $\rightarrow$ Second half of items

### 6.3 Development Implementation Order
1. **Templates First**: Complete and visually validate master HTML templates for Tiers 1, 2, 3, and 4.
2. **Engine Wiring Second**: Code `processCardLayout()` (Bottleneck + Auto-Split algorithm) into `designer_agent.mjs`.

