import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function createCutout(inputImagePath, outputPngPath) {
  console.log(`[Auto-Cutout Engine] Isolating subject from: ${path.basename(inputImagePath)}...`);
  
  if (fs.existsSync(outputPngPath)) {
    fs.unlinkSync(outputPngPath);
  }

  const pythonPy = `
from rembg import remove
from PIL import Image

inp = Image.open("${inputImagePath}")
out = remove(inp)
out.save("${outputPngPath}")
`;

  try {
    execSync(`python3 -c '${pythonPy}'`, { stdio: 'inherit' });
    console.log(`[Auto-Cutout Engine] Success! Transparent PNG saved to ➔ ${path.basename(outputPngPath)}`);
    return outputPngPath;
  } catch (err) {
    console.error(`[Auto-Cutout Engine] Error during subject isolation:`, err.message);
    throw err;
  }
}
