import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export interface UnzippedFile {
  filename: string;
  data: Buffer;
}

/**
 * Node.js組み込み（node:zlib）のみを用いたZIP展開処理
 * Central Directoryをパースし、非圧縮(0)およびDEFLATE(8)に対応。
 */
export function extractZipEntries(buf: Buffer): Record<string, Buffer> {
  // End of Central Directory Record (EOCD) の探索
  let eocdOffset = -1;
  const minEocdLen = 22;
  const maxSearchLen = Math.min(buf.length, 65535 + minEocdLen);

  for (let i = buf.length - minEocdLen; i >= buf.length - maxSearchLen; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP archive: End of Central Directory record (EOCD) not found');
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const files: Record<string, Buffer> = {};
  let cur = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    const sig = buf.readUInt32LE(cur);
    if (sig !== 0x02014b50) {
      throw new Error(`Invalid Central Directory header signature at offset ${cur}`);
    }

    const method = buf.readUInt16LE(cur + 10);
    const compSize = buf.readUInt32LE(cur + 20);
    const nameLen = buf.readUInt16LE(cur + 28);
    const extraLen = buf.readUInt16LE(cur + 30);
    const commentLen = buf.readUInt16LE(cur + 32);
    const localHeaderOffset = buf.readUInt32LE(cur + 42);

    const filename = buf.toString('utf-8', cur + 46, cur + 46 + nameLen);

    // ディレクトリやMac特有の__MACOSXメタデータは除外
    if (!filename.endsWith('/') && !filename.includes('__MACOSX')) {
      const localSig = buf.readUInt32LE(localHeaderOffset);
      if (localSig !== 0x04034b50) {
        throw new Error(`Invalid Local File Header signature at offset ${localHeaderOffset}`);
      }

      const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;

      const compData = buf.subarray(dataOffset, dataOffset + compSize);
      let uncompData: Buffer;

      if (method === 0) {
        uncompData = compData;
      } else if (method === 8) {
        uncompData = zlib.inflateRawSync(compData);
      } else {
        throw new Error(`Unsupported compression method (${method}) for file: ${filename}`);
      }

      files[filename] = uncompData;
    }

    cur += 46 + nameLen + extraLen + commentLen;
  }

  return files;
}

/**
 * ZIPバッファから目的の .ics ファイルを抽出する
 */
export function extractIcsFromZip(zipBuf: Buffer, year: number): { filename: string; content: string } {
  const entries = extractZipEntries(zipBuf);
  const candidateNames = Object.keys(entries);

  if (candidateNames.length === 0) {
    throw new Error('No files found inside the downloaded ZIP archive');
  }

  // 1. 完全一致: `jrarace${year}.ics`
  const exactTarget = `jrarace${year}.ics`;
  const exactKey = candidateNames.find(name => path.basename(name).toLowerCase() === exactTarget.toLowerCase());
  if (exactKey) {
    return {
      filename: path.basename(exactKey),
      content: entries[exactKey].toString('utf-8'),
    };
  }

  // 2. 重賞レース名を含む .ics (例: `jrarace*.ics`)
  const jraRaceKey = candidateNames.find(name => {
    const base = path.basename(name).toLowerCase();
    return base.startsWith('jrarace') && base.endsWith('.ics');
  });
  if (jraRaceKey) {
    return {
      filename: path.basename(jraRaceKey),
      content: entries[jraRaceKey].toString('utf-8'),
    };
  }

  // 3. 任意の .ics ファイル
  const anyIcsKey = candidateNames.find(name => name.toLowerCase().endsWith('.ics'));
  if (anyIcsKey) {
    return {
      filename: path.basename(anyIcsKey),
      content: entries[anyIcsKey].toString('utf-8'),
    };
  }

  throw new Error(`Could not find any .ics file in ZIP archive. Found files: ${candidateNames.join(', ')}`);
}

/**
 * JRA公式サイト案内ページからカレンダーzipのダウンロードURLを解決する
 */
export async function resolveJraZipUrl(
  year: number,
  customPageUrl?: string
): Promise<string> {
  const pageUrl = customPageUrl || `https://www.jra.go.jp/keiba/common/calendar/ics${year}.html`;
  const fallbackUrl = `https://www.jra.go.jp/keiba/common/calendar/jrarace${year}.zip`;

  try {
    const res = await fetch(pageUrl);
    if (!res.ok) {
      console.warn(`[JRA Calendar] Failed to fetch calendar page (${pageUrl}): ${res.status} ${res.statusText}. Falling back to default URL.`);
      return fallbackUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // JRA公式サイトはShift-JISが多いためShift-JISでデコード、失敗時はUTF-8
    let htmlText = '';
    try {
      htmlText = new TextDecoder('shift-jis').decode(buffer);
    } catch {
      htmlText = buffer.toString('utf-8');
    }

    // 重賞カレンダーzipのリンクを探す (例: href="jrarace2026.zip" または href="/keiba/.../jrarace2026.zip")
    const zipMatches = [...htmlText.matchAll(/href=["']([^"']*(?:jrarace[^"']*\.zip))["']/gi)];
    if (zipMatches.length > 0) {
      const matchedHref = zipMatches[0][1];
      const resolvedUrl = new URL(matchedHref, pageUrl).toString();
      return resolvedUrl;
    }

    console.warn(`[JRA Calendar] Could not find jrarace zip link in ${pageUrl}. Falling back to ${fallbackUrl}`);
    return fallbackUrl;
  } catch (err) {
    console.warn(`[JRA Calendar] Error resolving zip URL from page: ${(err as Error).message}. Falling back to ${fallbackUrl}`);
    return fallbackUrl;
  }
}

export interface EnsureJraIcsOptions {
  force?: boolean;
  pageUrl?: string;
  customZipUrl?: string;
}

/**
 * ローカルキャッシュを検証し、未配置または強制更新時にJRA公式サイトから取得・展開する
 */
export async function ensureJraIcs(
  year: number,
  destPath: string,
  options: EnsureJraIcsOptions = {}
): Promise<string> {
  const exists = fs.existsSync(destPath);

  if (exists && !options.force) {
    console.log(`[JRA Calendar] Loading ICS from local cache: ${destPath}`);
    return fs.readFileSync(destPath, 'utf-8');
  }

  console.log(`[JRA Calendar] ${options.force ? 'Forced refresh requested' : 'Local ICS not found'}. Fetching from JRA official site...`);

  const zipUrl = options.customZipUrl || (await resolveJraZipUrl(year, options.pageUrl));
  console.log(`[JRA Calendar] Downloading ZIP from: ${zipUrl}`);

  const res = await fetch(zipUrl);
  if (!res.ok) {
    throw new Error(`Failed to download JRA ZIP from ${zipUrl}: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  const { filename, content } = extractIcsFromZip(zipBuffer, year);
  console.log(`[JRA Calendar] Extracted ${filename} (${content.length} characters)`);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`[JRA Calendar] Saved ICS to ${destPath}`);

  return content;
}
