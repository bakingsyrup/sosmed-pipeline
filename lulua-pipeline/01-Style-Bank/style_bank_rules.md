# Style Bank Note Writing & 3-Part Architecture Rules

## Core Objective
Every Style Bank template file in `01-Style-Bank` MUST follow Lulua's Standardized **3-Part Architecture** written in **100% domain-agnostic, universal language**. This guarantees that any style template can be seamlessly applied to ANY niche (SaaS, AI, fintech, health, crypto, productivity, e-commerce) without AI agent bias or fixed post-count limits.

---

## 1. Standard 3-Part Architecture Overview

| Section | Domain Requirement | Purpose & Format |
| :--- | :---: | :--- |
| **Part 1: Dissection Matrix** | 🎯 **SOURCE-SPECIFIC** | Post-by-Post 5-Point Dissection Table mapping the original source post across Role, Payload, Closing Line, Trigger, and Variable Slot. |
| **Part 2a: Reference Text** | 🎯 **EXACT SOURCE CONTENT** | Reproduces the exact original reference text (post, thread, or article) being dissected. |
| **Part 2b: Cross-Domain Output** | 🎲 **RANDOM UNRELATED DOMAIN** | Human-readable example output applying the wireframe to a **completely different, randomly selected industry** (e.g. Skincare, SaaS, Coffee, Fitness, Real Estate). |
| **Part 3: Master Blueprint** | 🌐 **STRICTLY UNIVERSAL** | 100% topic-agnostic, Phase-based wireframe template for drafting agents (Shinku) with explicit Elastic Scaling Directives. |

---

## 2. Frontmatter Rules (Universal)
Every style note frontmatter MUST include:
```yaml
---
style_name: "CategoryName_Format_HookArchetype_ConversionDriver"
authority_persona: "Risk Manager" # (Risk Manager | Tool Mechanic | Data Journalist | Framework Curator)
funnel_stage: "TOFU" # (TOFU | MOFU | BOFU)
target_metric: "Profile_Visits_and_Retention"
elasticity: "dynamic (3 to 25 posts)"
supported_output_formats: ["thread", "article", "ig_carousel", "yt_shorts", "linkedin"]
---
```

---

## 3. Part 1: Post-by-Post Dissection Matrix Rules (5-Point Schema)
Part 1 MUST construct a Markdown table mapping every post of the source reference across 5 dimensions:
1. **Structural Arc Role**: Functional purpose (e.g. *High-Stakes Hook, Problem Setup, Term Explainer Block, Red Flag Checklist, Conversion CTA*).
2. **Core Message Payload**: The literal narrative event, data point, or fact.
3. **Closing Bridge Line**: The exact cliffhanger / transition line driving the next scroll.
4. **Psychological Trigger**: Target emotional state (*Shock, Curiosity, Relief, Caution, etc.*).
5. **Topic-Agnostic Wireframe Variable**: Abstract parameter slot (e.g., `[Slot: Thesis Statement & Teaser]`).

---

## 4. Part 2a & 2b Demonstration Rules (Anti-Bias Cross-Domain Standard)
- **Part 2a (Reference Text)**: Reproduces the **exact original reference text** (post, thread, or article) that was scraped or pasted.
  * *URL Input*: If the input was a URL, include a clickable header right at the top of Part 2a:  
    `> 🔗 **Source Reference**: [https://x.com/...](https://x.com/...)`
  * *Pasted Text Input*: If the input was raw pasted text, omit the link header and display only the original reference text.
- **Part 2b (Cross-Domain Output)**: Demonstrates how the exact wireframe applies to a **randomly selected, completely unrelated industry** (e.g., if source post is Crypto/Finance ➔ Part 2b MUST be Skincare, SaaS, Coffee, Fitness, or Real Estate).
- Part 2b MUST be preceded by this mandatory Anti-Bias Warning Block:

```markdown
> ⚠️ **ANTI-BIAS DIRECTIVE FOR AI AGENTS**: The sample implementation in Part 2b is provided purely for multi-domain illustration. You MUST NOT copy or default to the specific topic, industry vocabulary, or niche terms used in this example when generating content for other niches! Dynamically adapt all placeholders to the user's target topic.
```

---

## 5. Part 3: Master Universal Wireframe Blueprint Rules (Elastic Narrative Phases)
- **Part 3** is the primary execution engine for AI generation (Shinku). It MUST NOT contain niche-specific nouns or industry-locked jargon.
- **Phase-Based Structure**: Organize content into Elastic Narrative Phases rather than hardcoded post numbers. Adapt Phase names dynamically to match the style's core archetype:
  * *Example for Client Ads / Problem Solution*: Phase 1: Thesis Hook ➔ Phase 2: Flaw & Data Evidence [Adaptive] ➔ Phase 3: Product Drop ➔ Phase 4: 💡 101 Explainer Module [Adaptive] ➔ Phase 5: Conversion CTA.
  * *Example for Story Narrative / Event Sagas*: Phase 1: High-Stakes Hook ➔ Phase 2: Incident Backstory & Setup ➔ Phase 3: Unfamiliar Term Drop ➔ Phase 4: 💡 101 Explainer Block [Adaptive] ➔ Phase 5: Red Flag Checklist ➔ Phase 6: Golden Takeaway & Share CTA.

- **Mandatory Dynamic Scaling Directive Banner**:
  Part 3 MUST begin with this exact operational directive:
  ```markdown
  > ⚠️ **DYNAMIC CONTENT SCALING DIRECTIVE FOR DRAFTING AGENT (SHINKU)**:  
  > 1. **ANALYZE INPUT DEPTH FIRST**: Before drafting, analyze the source research brief to count the total distinct data points, assets, flaws, or technical terms to be covered.  
  > 2. **DYNAMICALLY SCALE ADAPTIVE PHASES**: Do NOT force output to a fixed post count. Scale any Phase or Module marked `[Adaptive: Dynamic 1 to N]` to match the input's actual information depth (e.g. 1 asset = 1 post; 3 assets = 3 sequential posts).  
  > 3. **SET DYNAMIC THREAD COUNTER `(1/N ... N/N)`**: Calculate the final generated post count dynamically and apply step indicators across the thread. Maintain `\n\n` spacing between every sentence block and strip active verb prefixes (*kata dasar*).
  ```

