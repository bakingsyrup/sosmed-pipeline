import process from 'process';
import console from 'console';
import https from 'https';

/**
 * DeepSeek API caller using Node's native 'https' module with retry logic.
 * Bypasses undici/fetch's default 30-second headersTimeout to accommodate DeepSeek's thinking times.
 */
export async function callDeepSeek(prompt, systemInstruction, modelName = 'deepseek-v4-pro', retries = 3, delay = 2000) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set. Please set it in your environment or in a .env file.');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({
      role: 'system',
      content: systemInstruction
    });
  }
  messages.push({
    role: 'user',
    content: prompt
  });

  const payload = JSON.stringify({
    model: modelName,
    messages: messages,
    temperature: 0.7
  });

  const options = {
    hostname: 'api.deepseek.com',
    port: 443,
    path: '/chat/completions',
    method: 'POST',
    agent: false,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 300000 // 5 minutes timeout to support deep-thinking models
  };

  for (let i = 0; i < retries; i++) {
    try {
      const responseText = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`DeepSeek API error (${res.statusCode}): ${data}`));
            }
          });
          res.on('error', (err) => {
            req.destroy();
            reject(err);
          });
        });

        req.setTimeout(300000);

        req.on('error', (err) => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('DeepSeek API request timed out after 5 minutes'));
        });

        req.write(payload);
        req.end();
      });

      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`Attempt ${i + 1} to call DeepSeek model ${modelName} failed: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
