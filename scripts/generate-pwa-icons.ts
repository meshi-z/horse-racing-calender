import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crcBuf]);
}

/**
 * 簡易PNG生成（RGBA）
 */
function generatePng(
  width: number,
  height: number,
  drawPixel: (x: number, y: number, w: number, h: number) => [number, number, number, number]
): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * トロフィーアイコンを描画する関数
 */
function drawTrophyIcon(isMaskable = false) {
  return (x: number, y: number, w: number, h: number): [number, number, number, number] => {
    const nx = x / w; // 0 to 1
    const ny = y / h; // 0 to 1

    // 角丸背景（maskable は角丸なし全塗り、通常版は角丸）
    if (!isMaskable) {
      const r = 0.18; // corner radius ratio
      const left = nx < r;
      const right = nx > 1 - r;
      const top = ny < r;
      const bottom = ny > 1 - r;

      if ((left && top) || (right && top) || (left && bottom) || (right && bottom)) {
        const cx = left ? r : 1 - r;
        const cy = top ? r : 1 - r;
        const dist = Math.hypot(nx - cx, ny - cy);
        if (dist > r) {
          return [0, 0, 0, 0]; // 透明
        }
      }
    }

    // 背景色グラデーション (#2563eb -> #1d4ed8)
    const bgR = Math.round(37 - ny * 8);
    const bgG = Math.round(99 - ny * 21);
    const bgB = Math.round(235 - ny * 19);

    // トロフィーの中心座標とサイズ
    const scale = isMaskable ? 0.6 : 0.72;
    const cx = 0.5;
    const cy = 0.5;
    const tx = (nx - cx) / scale + 0.5; // トロフィー座標系 (0 to 1)
    const ty = (ny - cy) / scale + 0.5;

    let isGold = false;
    let isGoldInner = false;

    if (tx >= 0.15 && tx <= 0.85 && ty >= 0.15 && ty <= 0.85) {
      // 1. カップ本体
      const cupTop = 0.22;
      const cupBottom = 0.55;
      const cupLeft = 0.32;
      const cupRight = 0.68;

      if (ty >= cupTop && ty <= cupBottom) {
        const cupW = (cupRight - cupLeft) * (1 - 0.25 * ((ty - cupTop) / (cupBottom - cupTop)) ** 2);
        const curLeft = 0.5 - cupW / 2;
        const curRight = 0.5 + cupW / 2;
        if (tx >= curLeft && tx <= curRight) {
          isGold = true;
          // ふち・外枠判定
          if (
            tx - curLeft < 0.04 ||
            curRight - tx < 0.04 ||
            ty - cupTop < 0.03 ||
            cupBottom - ty < 0.04
          ) {
            isGold = true;
          } else {
            isGoldInner = true;
          }
        }
      }

      // 2. 取手 (ハンドル)
      const handleTop = 0.26;
      const handleBottom = 0.44;
      if (ty >= handleTop && ty <= handleBottom) {
        // 左ハンドル
        const lDist = Math.hypot(tx - 0.28, ty - 0.35);
        if (lDist >= 0.07 && lDist <= 0.12 && tx < 0.35) {
          isGold = true;
        }
        // 右ハンドル
        const rDist = Math.hypot(tx - 0.72, ty - 0.35);
        if (rDist >= 0.07 && rDist <= 0.12 && tx > 0.65) {
          isGold = true;
        }
      }

      // 3. 支柱 (ステム)
      if (ty >= 0.54 && ty <= 0.68 && Math.abs(tx - 0.5) <= 0.035) {
        isGold = true;
      }

      // 4. 台座 (ベース)
      if (ty >= 0.68 && ty <= 0.76) {
        const baseW = 0.28 + (ty - 0.68) * 0.8;
        if (Math.abs(tx - 0.5) <= baseW / 2) {
          isGold = true;
        }
      }
    }

    if (isGold) {
      if (isGoldInner) {
        return [234, 179, 8, 255];
      }
      return [253, 224, 71, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. icon-192.png
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generatePng(192, 192, drawTrophyIcon(false)));

// 2. icon-512.png
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generatePng(512, 512, drawTrophyIcon(false)));

// 3. icon-maskable.png (512x512 maskable)
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), generatePng(512, 512, drawTrophyIcon(true)));

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generatePng(180, 180, drawTrophyIcon(false)));

// 5. SVGアイコン & favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(106, 106) scale(0.5859375)" fill="none" stroke="url(#gold)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <path d="M120 40 H392 V190 C392 265 330 326 256 326 C182 326 120 265 120 190 Z" fill="url(#gold)" fill-opacity="0.25"/>
    <path d="M120 40 H392 V190 C392 265 330 326 256 326 C182 326 120 265 120 190 Z"/>
    <path d="M120 90 H70 C47.9 90 30 107.9 30 130 C30 174.2 65.8 210 110 210 H124"/>
    <path d="M392 90 H442 C464.1 90 482 107.9 482 130 C482 174.2 446.2 210 402 210 H388"/>
    <path d="M256 326 V410"/>
    <path d="M166 470 H346"/>
    <path d="M196 410 H316"/>
  </g>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.resolve(process.cwd(), 'public/favicon.svg'), svgContent, 'utf-8');

console.log('PWA icons successfully generated in public/icons and public/favicon.svg');
