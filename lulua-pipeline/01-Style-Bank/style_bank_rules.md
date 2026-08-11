# Style Bank Note Writing & Universality Rules

## Core Objective
Every Style Bank template file in `01-Style-Bank` MUST be written in **100% domain-agnostic, universal language**. This prevents AI agent bias and guarantees that any style template can be seamlessly applied to ANY niche (SaaS, AI, fintech, health, productivity, design, e-commerce, etc.) without the agent inappropriately carrying over niche-specific jargon.

---

## 1. Section Universal Audit & Boundaries

| Section | Domain Requirement | Standard Rule |
| :--- | :---: | :--- |
| **Frontmatter & Metadata** | 🌐 **UNIVERSAL** | All metadata keys (`authority_persona`, `funnel_stage`, `target_metric`) must be domain-neutral. |
| **Part 0: Source Reference** | 🎯 **SPECIFIC** | **The ONLY specific section.** Contains the raw text of the original post. |
| **Part 1 & 2: Triggers & Levers** | 🌐 **UNIVERSAL** | Psychological levers must be described in generic human emotional terms. |
| **Part 3: Micro-Rhythm & Pacing** | 🌐 **UNIVERSAL** | Word count caps, line-break density, and whitespace rules must be domain-agnostic. |
| **Part 4: Wireframe Blueprint** | 🌐 **STRICTLY UNIVERSAL** | The core skeleton. MUST use 100% abstract placeholders with ZERO niche jargon. |
| **Part 5: Illustrative Sample** | 💡 **CONCRETE + WARNING** | Concrete example MUST be preceded by a mandatory **Anti-Bias Directive**. |

---

## 2. Frontmatter Rules (Universal)
- Every style file frontmatter MUST include:
  ```yaml
  ---
  style_name: "FormatName_v1"
  authority_persona: "Tool Mechanic" # (Tool Mechanic | Data Journalist | Risk Manager | Framework Curator)
  funnel_stage: "MOFU" # (TOFU | MOFU | BOFU)
  target_metric: "Outbound_CTR_and_Tool_Adoption"
  elasticity: "dynamic (3 to 15 cards / posts)"
  supported_output_formats: ["thread", "article", "ig_carousel", "yt_shorts", "linkedin"]
  ---
  ```

---

## 3. Psychological Levers & Triggers (Universal)
- Describe emotional drivers using generic human behavioral psychology:
  - **CORRECT (Universal):** *"Time-Bound Automation & Skill Elevation"*, *"False Security Warning & Risk Mitigation"*, *"Effort Compression"*, *"Reciprocal Gratitude"*.
  - **INCORRECT (Biased):** *"FOMO on banking accumulation cycles"*, *"RSI indicator divergence warning"*.

---

## 4. Plug-and-Play Wireframe Blueprint Rules (Strictly Universal)
- **Part 4 (Wireframe Blueprint)** is the primary execution engine for AI generation. It MUST NOT contain niche-specific nouns or industry-locked jargon.
- **Mandatory Placeholder Standard:**

| Industry-Locked Term (PROHIBITED) | Abstract Universal Placeholder (MANDATORY) |
| :--- | :--- |
| `[Asset A]` / `[Stock B]` | `[Primary Subject A]` / `[Alternative Subject B]` |
| `[Market Force]` / `[Macro Cycle]` | `[Industry Phenomenon / Trend]` |
| `[Terminal Name]` / `[Broker Code]` | `[Primary Tool / System Name]` |
| `[Broker Flow]` / `[Order Book]` | `[Key Operational Task / Data Source]` |
| `[DCA Accumulation]` | `[Baseline Metric / Core Process]` |
| `[Trader / Investor]` | `[Target Audience / User Entity]` |

- **Example Wireframe Block:**
  ```markdown
  ### Part 4: Plug-and-Play Wireframe Blueprint

  **[Hook: Pattern]**
  [Mandatory: State a contrarian industry observation or surprising status-quo insight].
  [Mandatory: Mention the specific analytical methodology or workflow being applied].
  [Mandatory: Sequence indicator (e.g. 1/X)].

  **[Setup / Evidence: Pattern]**
  [Mandatory: Present baseline performance metrics for [Subject A]].
  [Mandatory: Contrast [Subject A] with [Alternative B] to highlight a broader shift].
  [Adaptive: Insert observation regarding [Industry Phenomenon / User Shift]].

  **[Core Mechanism: Step-by-Step]**
  [Mandatory: Introduce the [Primary Tool / System Name] used to execute the workflow].
  [Mandatory: Explain the [Key Operational Task] required to achieve the outcome].
  [Adaptive: Show proof of [Target Audience / User Entity] behavioral shift].

  **[Synthesis & CTA]**
  [Mandatory: Reiterate why [Primary Tool / System Name] saves time/friction].
  [Mandatory: Provide the [Resource / Tool Link] for the reader].
  ```

---

## 5. Mandatory Anti-Bias Directive for Sample Implementations
If Part 5 includes a concrete sample implementation (for context or few-shot prompt training), it **MUST** be preceded by this exact warning block:

```markdown
> ⚠️ **ANTI-BIAS DIRECTIVE FOR AI AGENTS**: The sample implementation below is provided purely for illustration and context. You MUST NOT copy or default to the specific topic, industry vocabulary, or niche terms (e.g., finance, banking, crypto, trading) used in this example when generating content for other niches! Dynamically adapt all placeholders to the user's target topic.
```
