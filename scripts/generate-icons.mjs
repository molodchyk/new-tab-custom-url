import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { deflateSync } from "node:zlib";
import { crc32 } from "./crc32.mjs";

const root = process.cwd();
const outDir = path.join(root, "assets");
const sizes = [16, 32, 48, 128];

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = size * 0.43;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const inside = distance <= radius;
      const edge = Math.abs(distance - radius) < size * 0.035;
      const bar = x > size * 0.28 && x < size * 0.42 && y > size * 0.24 && y < size * 0.76;
      const top = x > size * 0.28 && x < size * 0.72 && y > size * 0.24 && y < size * 0.38;
      const arrow = x > size * 0.48 && x < size * 0.72 && y > size * 0.48 && y < size * 0.62;

      if (!inside) {
        pixels[offset + 3] = 0;
      } else if (bar || top || arrow) {
        pixels[offset] = 255;
        pixels[offset + 1] = 255;
        pixels[offset + 2] = 255;
        pixels[offset + 3] = 255;
      } else if (edge) {
        pixels[offset] = 15;
        pixels[offset + 1] = 118;
        pixels[offset + 2] = 110;
        pixels[offset + 3] = 255;
      } else {
        pixels[offset] = 20;
        pixels[offset + 1] = 184;
        pixels[offset + 2] = 166;
        pixels[offset + 3] = 255;
      }
    }
  }

  return pixels;
}

function encodePng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  const pixels = drawIcon(size);
  const scanlines = Buffer.alloc(size * (1 + size * 4));

  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  for (let y = 0; y < size; y += 1) {
    const sourceStart = y * size * 4;
    const targetStart = y * (1 + size * 4);
    scanlines[targetStart] = 0;
    pixels.copy(scanlines, targetStart + 1, sourceStart, sourceStart + size * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  await writeFile(path.join(outDir, `icon-${size}.png`), encodePng(size));
}

console.log(`Generated ${sizes.length} icons in ${path.relative(root, outDir)}.`);

