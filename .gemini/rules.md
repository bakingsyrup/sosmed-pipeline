# AGY Workspace Operational Rules

## 🛑 UNIVERSAL STYLE ABSTRACTION & WIREFRAME AGNOSTICISM RULE

Whenever extracting, defining, or editing writing styles, structural wireframes, prompt templates, or pattern abstractions from source material:

1. **Absolute Domain Agnosticism**:
   - **Zero Niche Leak**: Never leak specific terminology, brand names, tool names, industry terms, or topic keywords into template slots or illustrative parenthetical hints `(e.g., ...)`.
   - **Pure Structural Placeholders**: All variable placeholders and examples must represent pure structural abstractions (e.g., `[Primary Subject]`, `[Core Mechanism]`, `[Input A]`, `[Output Target]`).

2. **Strict Separation of Abstract Blueprint vs. Concrete Reference**:
   - **The Abstract Blueprint**: Must be 100% plug-and-play for any topic, industry, or domain without requiring topic substitution.
   - **Concrete Details**: Specific words from the source material must reside strictly within literal quote blocks or dedicated example sections.

3. **Prevention of Downstream LLM Bias**:
   - Treat any niche-specific word inside an abstract template slot as a critical system bug. Template slots must remain mathematically neutral to prevent downstream models from over-fitting or inheriting topic bias.
