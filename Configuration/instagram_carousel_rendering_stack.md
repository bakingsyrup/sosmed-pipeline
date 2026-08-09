# Instagram Carousel Rendering & Asset Toolstack Standard

> **Document Version**: 1.0  
> **Status**: Active Production Reference  
> **Purpose**: Technical documentation of all software libraries, CLI tools, HTML/CSS templates, and AI background removal engines used to automatically generate high-resolution (1080×1350) Instagram carousels and cover hooks.

---

## 🛠️ 1. Core Toolstack Overview

| Component / Tool | Technology / Package | Purpose / Role |
| :--- | :--- | :--- |
| **Headless Renderer** | `playwright` (Chromium) | Renders HTML5/CSS3 templates into retina 2x scale PNG images (2160×2700 downscaled to 1080×1350) and PDF carousels. |
| **AI Vision Saliency** | Gemini Flash 2.0 API (`vision_analyzer.mjs`) | Analyzes visual saliency, subject bounding boxes, ratio tightness, and content density using structured JSON schema output. |
| **Universal Layout Engine** | Node.js Rule Matrix (`selectUniversalLayout`) | Deterministically routes images to optimal structural placements (`left-split`, `right-split`, `bottom`, `top`) and CSS variables (`--object-position`, `--object-fit`). |
| **Image Processing** | Node.js Base64 Data URI | Converts local images into fail-safe `data:image/...;base64` URIs to guarantee 100% path safety with spaced directories. |
| **Design Engine** | HTML5 + Vanilla CSS3 | Modular CSS templates utilizing modern typography (`Plus Jakarta Sans`, `Inter`), Option A split containers, and tokenized grids. |
| **Process Manager** | `pm2` | Runs `repurpose-agent` continuously in the background to watch inbox folders and trigger rendering pipeline. |

---

## 📐 2. Option A: Structural Container Split Cover Template Architecture

### 🎨 Master Template: `Option_A_SplitContainer.html`
* **File Location**: [`Configuration/templates/instagram/covers/Option_A_SplitContainer.html`](file:///mnt/data/Obsidian%20Docs/Image%20Prompt%20Db/Sosmed-Pipeline/Configuration/templates/instagram/covers/Option_A_SplitContainer.html)
* **Key Architecture & Benefits**:
  * **0% Face / Object Gradient Shadowing**: Copy zone is housed inside a solid `#06090E` container, physically separating text from photo windows.
  * **4 Structural Placements**: Supports `left-split` (Image Right), `right-split` (Image Left), `bottom` (Image Top), and `top` (Image Bottom).
  * **Dynamic CSS Variable Anchoring**: Driven by `--object-position: X% Y%` and `--object-fit: cover | contain`.

---

## 🧠 3. Universal AI Vision Saliency & Layout Rule Engine

### 🔍 Vision Service (`Configuration/services/vision_analyzer.mjs`)
* Executes Gemini Flash Vision with native JSON Schema enforcement (`responseSchema`).
* Returns normalized metrics:
  ```json
  {
    "subject_type": "person | coin_crypto | financial_chart | animal | product | text_infographic",
    "saliency_x_percent": 50,
    "saliency_y_percent": 45,
    "subject_width_ratio": 0.65,
    "has_critical_text_or_data": false,
    "recommended_accent_hex": "#10B981"
  }
  ```

### 🧠 Layout Selection Decision Matrix (`selectUniversalLayout`)
1. **Rule 1 (Chart & Infographic Zero-Crop Protection)**:
   If `subject_type === 'financial_chart'` or `has_critical_text_or_data === true`:
   * Forces `placement: 'bottom'`, `objectFit: 'contain'`.
   * Guarantees 0% cropping of numbers, axes, or graph data on full 1080px canvas width.

2. **Rule 2 (Tight Headshot & Large Subject Veto)**:
   If `subject_width_ratio > 0.60` (tight close-up face, large mascot, wide product):
   * Vetoes 620px side windows to prevent ear/cheek/edge slicing.
   * Forces `placement: 'bottom'`, `objectFit: 'cover'`.

3. **Rule 3 (Dynamic Side Window Framing)**:
   If `subject_width_ratio <= 0.60` (medium portrait, crypto coin, animal, product):
   * Selects `left-split` (if $X < 50\%$) or `right-split` (if $X \ge 50\%$).
   * Anchors `--object-position: ${x_percent}% ${y_percent}%`.

---

## 📷 4. Rendering Resolution & Export Settings

```javascript
// Playwright Browser Viewport Configuration
const context = await browser.newContext({
  viewport: { width: 1080, height: 1350 }, // Standard Instagram 4:5 Aspect Ratio
  deviceScaleFactor: 2                     // Output crisp 2160×2700 PNG image
});
```

* **Output Folder**: `ig-pipeline/03-Ready/rendered-carousels/`
* **Export Formats**: High-res `.png` images (for individual slides) and `.pdf` document (for multi-slide carousels).
