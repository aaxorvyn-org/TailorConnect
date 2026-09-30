import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width: number, height: number, bgColor: [number, number, number], innerColor: [number, number, number]): Buffer {
  // Simple uncompressed or raw PNG generator
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Truecolor (RGB)
  ihdr.writeUInt8(0, 10); // Compression method (0)
  ihdr.writeUInt8(0, 11); // Filter method (0)
  ihdr.writeUInt8(0, 12); // Interlace method (none)

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with 0 filter byte per scanline
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.4;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw circular emblem
      if (dist <= radius) {
        // Inner diamond/needle motif
        const isInner = Math.abs(dx) + Math.abs(dy) < radius * 0.55;
        if (isInner) {
          rawData[pxOffset] = innerColor[0];     // R
          rawData[pxOffset + 1] = innerColor[1]; // G
          rawData[pxOffset + 2] = innerColor[2]; // B
        } else {
          rawData[pxOffset] = bgColor[0];
          rawData[pxOffset + 1] = bgColor[1];
          rawData[pxOffset + 2] = bgColor[2];
        }
      } else {
        // Subtle outer border or background
        rawData[pxOffset] = 15;   // Deep navy background
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = data.length;
  const buffer = Buffer.alloc(4 + 4 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// Simple CRC32 for PNG chunks
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve('apps/web/public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Gold / Amber on Navy
const navy: [number, number, number] = [30, 41, 59];
const gold: [number, number, number] = [217, 119, 6];

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, 192, navy, gold));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, 512, navy, gold));
console.log('Generated PWA icons in apps/web/public/icons/');
