import fs from 'fs';
import path from 'path';
import process from 'process';
import console from 'console';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'Configuration', '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const colonIndex = trimmed.indexOf('=');
          if (colonIndex !== -1) {
            const key = trimmed.slice(0, colonIndex).trim();
            let val = trimmed.slice(colonIndex + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
      }
      break;
    }
  }
}
loadEnv();

/**
 * Uses Gemini 2.0 Flash Vision API with JSON mode to extract visual saliency,
 * subject bounding box center, and content density for any image type.
 */
export async function analyzeImageSaliency(imagePath, retries = 3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Vision Analyzer] GEMINI_API_KEY is missing. Falling back to default layout.');
    return getFallbackVisionData();
  }

  if (!fs.existsSync(imagePath)) {
    console.warn(`[Vision Analyzer] File not found: ${imagePath}. Falling back to default layout.`);
    return getFallbackVisionData();
  }

  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const base64Data = fileBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    if (ext === '.webp') mimeType = 'image/webp';

    const model = process.env.GEMINI_RESEARCH_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `You are an expert graphic designer and computer vision engineer.
Analyze the input image for automated social media cover placement.
Identify the primary focal subject (person, coin, chart/graph, animal, product, or infographic).
Return a JSON object measuring the focal center coordinates and content density.`;

    const prompt = `Analyze this image for visual saliency framing and return JSON matching the specified schema.
Determine:
1. subject_type: "person", "coin_crypto", "financial_chart", "animal", "product", or "text_infographic".
2. saliency_x_percent: Integer 0-100 representing horizontal focal center.
3. saliency_y_percent: Integer 0-100 representing vertical focal center.
4. subject_width_ratio: Number 0.0-1.0 representing main subject width relative to image width.
5. has_critical_text_or_data: Boolean true if image contains charts, financial numbers, or readable text that must not be cropped.
6. recommended_accent_hex: Vibrant HEX color extracted from image highlights (e.g. #10B981, #F59E0B, #3B82F6, #EC4899).`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            subject_type: { 
              type: "STRING", 
              enum: ["person", "coin_crypto", "financial_chart", "animal", "product", "text_infographic"] 
            },
            saliency_x_percent: { type: "INTEGER" },
            saliency_y_percent: { type: "INTEGER" },
            subject_width_ratio: { type: "NUMBER" },
            has_critical_text_or_data: { type: "BOOLEAN" },
            recommended_accent_hex: { type: "STRING" }
          },
          required: [
            "subject_type",
            "saliency_x_percent",
            "saliency_y_percent",
            "subject_width_ratio",
            "has_critical_text_or_data",
            "recommended_accent_hex"
          ]
        }
      }
    };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[Vision Analyzer] Gemini API error (attempt ${i + 1}): ${errText}`);
          continue;
        }

        const resData = await response.json();
        const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          console.log(`[Vision Analyzer] Successfully analyzed ${path.basename(imagePath)}:`, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Vision Analyzer] Attempt ${i + 1} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[Vision Analyzer] Fatal error analyzing ${imagePath}:`, err);
  }

  return getFallbackVisionData();
}

function getFallbackVisionData() {
  return {
    subject_type: "person",
    saliency_x_percent: 50,
    saliency_y_percent: 50,
    subject_width_ratio: 0.5,
    has_critical_text_or_data: false,
    recommended_accent_hex: "#10B981"
  };
}

/**
 * Universal Rule Engine: Computes layout placement, objectPosition, and objectFit based on vision analysis.
 */
export function selectUniversalLayout(visionData) {
  const { 
    subject_type, 
    saliency_x_percent, 
    saliency_y_percent, 
    subject_width_ratio, 
    has_critical_text_or_data 
  } = visionData;

  const xPos = Math.max(10, Math.min(90, saliency_x_percent));
  const yPos = Math.max(10, Math.min(90, saliency_y_percent));

  // RULE 1: Financial Chart & Data Protection (Zero-Crop Guarantee)
  if (subject_type === 'financial_chart' || has_critical_text_or_data) {
    return {
      placement: 'bottom',                 // Full 1080px canvas width
      objectPosition: 'center center',
      objectFit: 'contain'                // Ensures 0% data/axis cropping
    };
  }

  // RULE 2: Large/Wide Subject Veto Threshold (Learned from Human Close-Up Testing)
  // If face, coin, or product fills > 60% of original width, 620px side windows will cut edges.
  if (subject_width_ratio > 0.60) {
    return {
      placement: 'bottom',                 // Fallback to full 1080px width
      objectPosition: `${xPos}% ${yPos}%`,
      objectFit: 'cover'
    };
  }

  // RULE 3: Dynamic Side Window Framing (Coins, Mascots, People, Products)
  // If subject is on left half (X < 50%), put text on left and image window on right (left-split)
  // If subject is on right half (X >= 50%), put text on right and image window on left (right-split)
  const placement = (xPos < 50) ? 'left-split' : 'right-split';

  return {
    placement: placement,
    objectPosition: `${xPos}% ${yPos}%`,
    objectFit: 'cover'
  };
}
