import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import zlib from 'zlib';

const rootDir = process.cwd();
const masterPath = path.resolve(rootDir, 'docs/assets/new_icon_master.png');
const iconsDir = path.resolve(rootDir, 'public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(masterPath)) {
  console.error(`Master icon not found at: ${masterPath}`);
  process.exit(1);
}

console.log('[Icon Generator] Generating PNG assets from master image...');

// 1. 各解像度PNGの生成 (PowerShell System.Drawing 高品質リサイズ)
const psScript = `
Add-Type -AssemblyName System.Drawing
$srcPath = "${masterPath.replace(/\\/g, '\\\\')}"
$iconsDir = "${iconsDir.replace(/\\/g, '\\\\')}"
$srcImage = [System.Drawing.Image]::FromFile($srcPath)

function Save-Resized-Png($width, $height, $destName) {
    $destPath = Join-Path $iconsDir $destName
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($srcImage, 0, 0, $width, $height)
    $graphics.Dispose()
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "  -> Generated $destName ($width x $height)"
}

Save-Resized-Png 512 512 "icon-512.png"
Save-Resized-Png 512 512 "icon-maskable.png"
Save-Resized-Png 192 192 "icon-192.png"
Save-Resized-Png 180 180 "apple-touch-icon.png"

$srcImage.Dispose()
`;

try {
  execSync('powershell -ExecutionPolicy Bypass -NoProfile -Command -', {
    input: psScript,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
} catch (e) {
  console.warn('[Icon Generator] PowerShell resize failed, fallback check:', e);
}

// 2. ベクターSVG（favicon.svg, icons/icon.svg）の生成
console.log('[Icon Generator] Generating vector SVG favicon & icon...');

// 512x512 PNG から白シンボルの輪郭パスを抽出
const icon512Path = path.join(iconsDir, 'icon-512.png');
const buf = fs.readFileSync(icon512Path);
let offset = 8;
const idatBuffers: Buffer[] = [];
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.slice(offset + 4, offset + 8).toString('ascii');
  if (type === 'IDAT') idatBuffers.push(buf.slice(offset + 8, offset + 8 + len));
  offset += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatBuffers));
const w = 512, h = 512, rowLen = w * 4 + 1;

const mask = new Uint8Array(w * h);
for (let y = 0; y < h; y++) {
  const rOffset = y * rowLen;
  for (let x = 0; x < w; x++) {
    const px = rOffset + 1 + x * 4;
    if (raw[px] > 210 && raw[px + 1] > 210 && raw[px + 2] > 210) {
      mask[y * w + x] = 1;
    }
  }
}

interface Edge { x1: number; y1: number; x2: number; y2: number; }
const hEdges: Map<string, Edge> = new Map();
const vEdges: Map<string, Edge> = new Map();

for (let y = 0; y <= h; y++) {
  for (let x = 0; x <= w; x++) {
    const top = y > 0 && x < w ? mask[(y - 1) * w + x] : 0;
    const bottom = y < h && x < w ? mask[y * w + x] : 0;
    const left = x > 0 && y < h ? mask[y * w + (x - 1)] : 0;
    const right = x < w && y < h ? mask[y * w + x] : 0;

    if (top !== bottom) {
      if (bottom === 1) {
        hEdges.set(`${x},${y}`, { x1: x, y1: y, x2: x + 1, y2: y });
      } else {
        hEdges.set(`${x + 1},${y}`, { x1: x + 1, y1: y, x2: x, y2: y });
      }
    }
    if (left !== right) {
      if (right === 1) {
        vEdges.set(`${x},${y + 1}`, { x1: x, y1: y + 1, x2: x, y2: y });
      } else {
        vEdges.set(`${x},${y}`, { x1: x, y1: y, x2: x, y2: y + 1 });
      }
    }
  }
}

const outgoing: Map<string, Edge[]> = new Map();
for (const e of [...hEdges.values(), ...vEdges.values()]) {
  const k = `${e.x1},${e.y1}`;
  if (!outgoing.has(k)) outgoing.set(k, []);
  outgoing.get(k)!.push(e);
}

const loops: [number, number][][] = [];
const visited = new Set<Edge>();

for (const edgeList of outgoing.values()) {
  for (const startEdge of edgeList) {
    if (visited.has(startEdge)) continue;
    const loop: [number, number][] = [[startEdge.x1, startEdge.y1]];
    let curr = startEdge;
    visited.add(curr);
    let maxSteps = 20000;
    while (maxSteps-- > 0) {
      loop.push([curr.x2, curr.y2]);
      if (curr.x2 === startEdge.x1 && curr.y2 === startEdge.y1) break;
      const nextList = outgoing.get(`${curr.x2},${curr.y2}`) || [];
      const nextEdge = nextList.find((e) => !visited.has(e));
      if (!nextEdge) break;
      visited.add(nextEdge);
      curr = nextEdge;
    }
    if (loop.length > 20) loops.push(loop);
  }
}

function rdp(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const num = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
    const den = Math.hypot(y2 - y1, x2 - x1);
    const d = den === 0 ? Math.hypot(x - x1, y - y1) : num / den;
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const r1 = rdp(points.slice(0, index + 1), epsilon);
    const r2 = rdp(points.slice(index), epsilon);
    return r1.slice(0, -1).concat(r2);
  }
  return [points[0], points[points.length - 1]];
}

const pathStrings = loops.map((loop) => {
  const simplified = rdp(loop, 1.2);
  let d = `M ${simplified[0][0]} ${simplified[0][1]}`;
  for (let i = 1; i < simplified.length; i++) {
    d += ` L ${simplified[i][0]} ${simplified[i][1]}`;
  }
  d += ' Z';
  return d;
});

const vectorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#01A350" />
      <stop offset="40%" stop-color="#16A34A" />
      <stop offset="100%" stop-color="#8BCA3D" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <path d="${pathStrings.join(' ')}" fill="#FFFFFF" fill-rule="evenodd"/>
</svg>
`;

fs.writeFileSync(path.resolve(rootDir, 'public/favicon.svg'), vectorSvg, 'utf-8');
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), vectorSvg, 'utf-8');

console.log('[Icon Generator] All PWA and favicon assets successfully generated!');
