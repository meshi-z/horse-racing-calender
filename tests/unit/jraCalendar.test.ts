import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  extractZipEntries,
  extractIcsFromZip,
  resolveJraZipUrl,
  ensureJraIcs,
} from '../../scripts/lib/jra-calendar';

/**
 * テスト用インメモリZIPバッファ生成ヘルパー
 */
function createMockZip(files: Array<{ name: string; content: string; method?: 0 | 8 }>): Buffer {
  const localHeaders: Buffer[] = [];
  const cdHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const method = file.method ?? 8;
    const nameBuf = Buffer.from(file.name, 'utf-8');
    const rawData = Buffer.from(file.content, 'utf-8');
    const compData = method === 8 ? zlib.deflateRawSync(rawData) : rawData;

    // Local Header
    const localHeader = Buffer.alloc(30 + nameBuf.length + compData.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(method, 8); // compression method
    localHeader.writeUInt16LE(0, 10); // time
    localHeader.writeUInt16LE(0, 12); // date
    localHeader.writeUInt32LE(0, 14); // crc32
    localHeader.writeUInt32LE(compData.length, 18); // compSize
    localHeader.writeUInt32LE(rawData.length, 22); // uncompSize
    localHeader.writeUInt16LE(nameBuf.length, 26); // nameLen
    localHeader.writeUInt16LE(0, 28); // extraLen
    nameBuf.copy(localHeader, 30);
    compData.copy(localHeader, 30 + nameBuf.length);

    // Central Directory Header
    const cdHeader = Buffer.alloc(46 + nameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0); // signature
    cdHeader.writeUInt16LE(20, 4); // version made by
    cdHeader.writeUInt16LE(20, 6); // version needed
    cdHeader.writeUInt16LE(0, 8); // flags
    cdHeader.writeUInt16LE(method, 10); // method
    cdHeader.writeUInt16LE(0, 12); // time
    cdHeader.writeUInt16LE(0, 14); // date
    cdHeader.writeUInt32LE(0, 16); // crc32
    cdHeader.writeUInt32LE(compData.length, 20); // compSize
    cdHeader.writeUInt32LE(rawData.length, 24); // uncompSize
    cdHeader.writeUInt16LE(nameBuf.length, 28); // nameLen
    cdHeader.writeUInt16LE(0, 30); // extraLen
    cdHeader.writeUInt16LE(0, 32); // commentLen
    cdHeader.writeUInt16LE(0, 34); // diskNum
    cdHeader.writeUInt16LE(0, 36); // intAttr
    cdHeader.writeUInt32LE(0, 38); // extAttr
    cdHeader.writeUInt32LE(offset, 42); // localHeaderOffset
    nameBuf.copy(cdHeader, 46);

    localHeaders.push(localHeader);
    cdHeaders.push(cdHeader);
    offset += localHeader.length;
  }

  const cdOffset = offset;
  const cdBuf = Buffer.concat(cdHeaders);
  const cdSize = cdBuf.length;

  // EOCD
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // diskNum
  eocd.writeUInt16LE(0, 6); // startDisk
  eocd.writeUInt16LE(files.length, 8); // totalEntriesDisk
  eocd.writeUInt16LE(files.length, 10); // totalEntries
  eocd.writeUInt32LE(cdSize, 12); // cdSize
  eocd.writeUInt32LE(cdOffset, 16); // cdOffset
  eocd.writeUInt16LE(0, 20); // commentLen

  return Buffer.concat([...localHeaders, cdBuf, eocd]);
}

describe('jra-calendar utility', () => {
  describe('extractZipEntries', () => {
    it('DEFLATE圧縮されたエントリーを正しく展開できること', () => {
      const mockZip = createMockZip([
        { name: 'test.ics', content: 'BEGIN:VCALENDAR\nSUMMARY:Sample\nEND:VCALENDAR', method: 8 },
      ]);

      const entries = extractZipEntries(mockZip);
      expect(entries['test.ics']).toBeDefined();
      expect(entries['test.ics'].toString('utf-8')).toBe('BEGIN:VCALENDAR\nSUMMARY:Sample\nEND:VCALENDAR');
    });

    it('非圧縮(STORE)エントリーを正しく展開できること', () => {
      const mockZip = createMockZip([
        { name: 'raw.txt', content: 'Plain text data', method: 0 },
      ]);

      const entries = extractZipEntries(mockZip);
      expect(entries['raw.txt']).toBeDefined();
      expect(entries['raw.txt'].toString('utf-8')).toBe('Plain text data');
    });

    it('__MACOSX やディレクトリは除外されること', () => {
      const mockZip = createMockZip([
        { name: 'target.ics', content: 'ics data', method: 8 },
        { name: '__MACOSX/._target.ics', content: 'mac junk', method: 8 },
      ]);

      const entries = extractZipEntries(mockZip);
      expect(Object.keys(entries)).toEqual(['target.ics']);
    });

    it('不正なZIPデータの場合にエラーをスローすること', () => {
      const invalidBuf = Buffer.from('Not a zip file at all');
      expect(() => extractZipEntries(invalidBuf)).toThrow(/Invalid ZIP archive/);
    });
  });

  describe('extractIcsFromZip', () => {
    it('対象年度の jrarace{year}.ics を優先して抽出すること', () => {
      const mockZip = createMockZip([
        { name: 'other.ics', content: 'other data', method: 8 },
        { name: 'jrarace2026.ics', content: '2026 data', method: 8 },
      ]);

      const result = extractIcsFromZip(mockZip, 2026);
      expect(result.filename).toBe('jrarace2026.ics');
      expect(result.content).toBe('2026 data');
    });

    it('.ics ファイルが見つからない場合はエラーをスローすること', () => {
      const mockZip = createMockZip([
        { name: 'document.txt', content: 'text', method: 8 },
      ]);

      expect(() => extractIcsFromZip(mockZip, 2026)).toThrow(/Could not find any \.ics file/);
    });
  });

  describe('resolveJraZipUrl', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('HTMLページ内から jrarace2026.zip のリンクを解決すること', async () => {
      const fakeHtml = `
        <html>
          <body>
            <a href="jrarace2026.zip">重賞カレンダー</a>
            <a href="jrakaisai2026.zip">開催カレンダー</a>
          </body>
        </html>
      `;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () => Buffer.from(fakeHtml, 'utf-8'),
      } as unknown as Response);

      const url = await resolveJraZipUrl(2026, 'https://www.jra.go.jp/keiba/common/calendar/ics2026.html');
      expect(url).toBe('https://www.jra.go.jp/keiba/common/calendar/jrarace2026.zip');
    });

    it('フェッチが失敗した場合はフォールバックURLを返すこと', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      const url = await resolveJraZipUrl(2026);
      expect(url).toBe('https://www.jra.go.jp/keiba/common/calendar/jrarace2026.zip');
    });
  });

  describe('ensureJraIcs', () => {
    const testDestDir = path.join(process.cwd(), 'tests', 'fixtures');
    const testDestPath = path.join(testDestDir, 'temp_test.ics');

    beforeEach(() => {
      vi.restoreAllMocks();
      if (fs.existsSync(testDestPath)) {
        fs.unlinkSync(testDestPath);
      }
    });

    afterEach(() => {
      if (fs.existsSync(testDestPath)) {
        fs.unlinkSync(testDestPath);
      }
    });

    it('ローカルファイルが存在し force でない場合はローカルファイルを読み込むこと', async () => {
      fs.mkdirSync(testDestDir, { recursive: true });
      fs.writeFileSync(testDestPath, 'LOCAL_ICS_CONTENT', 'utf-8');

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const content = await ensureJraIcs(2026, testDestPath, { force: false });

      expect(content).toBe('LOCAL_ICS_CONTENT');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('ローカルファイルが存在しない場合はZIPをダウンロード・展開して保存すること', async () => {
      const mockZip = createMockZip([
        { name: 'jrarace2026.ics', content: 'DOWNLOADED_ICS_CONTENT', method: 8 },
      ]);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () => mockZip,
      } as unknown as Response);

      const content = await ensureJraIcs(2026, testDestPath, {
        customZipUrl: 'https://example.com/jrarace2026.zip',
      });

      expect(content).toBe('DOWNLOADED_ICS_CONTENT');
      expect(fs.existsSync(testDestPath)).toBe(true);
      expect(fs.readFileSync(testDestPath, 'utf-8')).toBe('DOWNLOADED_ICS_CONTENT');
    });
  });
});
