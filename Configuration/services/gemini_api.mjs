import process from 'process';
import console from 'console';

/**
 * Core Gemini API caller using native fetch with retry logic.
 */
export async function callGemini(prompt, systemInstruction, enableSearch = false, modelName = null, retries = 3, delay = 2000) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment or in a .env file.');
  }
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (enableSearch) {
    payload.tools = [
      {
        google_search: {}
      }
    ];
  }

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`Attempt ${i + 1} to call Gemini model ${model} failed: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
