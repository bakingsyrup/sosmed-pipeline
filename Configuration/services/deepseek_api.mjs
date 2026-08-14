import process from 'process';
import console from 'console';
import https from 'https';

const httpsAgent = new https.Agent({ keepAlive: true, timeout: 300000 });

/**
 * DeepSeek API caller using Node's native 'https' module with streaming & retry logic.
 * Streams response internally to prevent socket idle timeouts (ECONNRESET) on long outputs.
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
    temperature: 0.7,
    stream: true
  });

  const options = {
    hostname: 'api.deepseek.com',
    port: 443,
    path: '/chat/completions',
    method: 'POST',
    agent: httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const responseText = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            let errBody = '';
            res.on('data', (chunk) => { errBody += chunk; });
            res.on('end', () => {
              reject(new Error(`DeepSeek API error (${res.statusCode}): ${errBody}`));
            });
            return;
          }

          let fullContent = '';
          let buffer = '';

          res.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep potential incomplete line segment

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  fullContent += delta;
                } catch (e) {}
              }
            }
          });

          res.on('end', () => {
            if (buffer.trim().startsWith('data: ')) {
              const dataStr = buffer.trim().slice(6);
              if (dataStr !== '[DONE]') {
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  fullContent += delta;
                } catch (e) {}
              }
            }
            resolve(fullContent);
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

      return { choices: [{ message: { content: responseText } }] };
    } catch (err) {
      console.warn(`Attempt ${i + 1} to call DeepSeek model ${modelName} failed: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
