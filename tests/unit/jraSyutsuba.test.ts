import { describe, it, expect, vi } from 'vitest';
import {
  parseDateToYmd,
  parseTimeToHhMm,
  cleanRaceName,
  raceNameMatches,
  toIsoUtc,
  parseThisWeekHtml,
  parseSyutsubaDetailHtml,
  parseSyutsubaTopCnames,
  parseSyutsubaListTableHtml,
  fetchWithRetry,
} from '../../scripts/lib/jra-syutsuba';

describe('jra-syutsuba utility', () => {
  describe('parseDateToYmd', () => {
    it('年・月・日が含まれる文字列からYYYY-MM-DDを正しく抽出できること', () => {
      expect(parseDateToYmd('2026年9月19日（土曜） 4回中山5日')).toBe('2026-09-19');
      expect(parseDateToYmd('2026年10月4日')).toBe('2026-10-04');
    });

    it('年がなく月・日のみの場合はcurrentYearを補完してYYYY-MM-DDを返すこと', () => {
      expect(parseDateToYmd('9月19日（土曜）', 2026)).toBe('2026-09-19');
      expect(parseDateToYmd('12月27日', 2026)).toBe('2026-12-27');
    });

    it('日付が含まれない場合はnullを返すこと', () => {
      expect(parseDateToYmd('中山競馬場')).toBeNull();
    });
  });

  describe('parseTimeToHhMm', () => {
    it('「XX時XX分」形式からHH:mmに変換できること', () => {
      expect(parseTimeToHhMm('15時45分')).toBe('15:45');
      expect(parseTimeToHhMm('9時30分')).toBe('09:30');
      expect(parseTimeToHhMm('11時20分')).toBe('11:20');
    });

    it('コロン形式からHH:mmに変換できること', () => {
      expect(parseTimeToHhMm('15:45')).toBe('15:45');
      expect(parseTimeToHhMm('9:05')).toBe('09:05');
    });

    it('時刻形式に一致しない場合はnullを返すこと', () => {
      expect(parseTimeToHhMm('発走時刻未定')).toBeNull();
    });
  });

  describe('cleanRaceName', () => {
    it('HTMLタグや回数、グレード表記、指定区分を削除してレース名のみを抽出すること', () => {
      expect(cleanRaceName('阪神ジャンプステークス（J・GⅢ）')).toBe('阪神ジャンプステークス');
      expect(cleanRaceName('産経賞オールカマー（GⅡ）')).toBe('産経賞オールカマー');
      expect(cleanRaceName('第28回阪神ジャンプステークス<span class="grade_icon lg"><img src="..." alt="J･GⅢ" /></span>')).toBe('阪神ジャンプステークス');
      expect(cleanRaceName('ながつきステークス[指定]')).toBe('ながつきステークス');
    });
  });

  describe('raceNameMatches', () => {
    it('完全一致またはステークス/S、カップ/Cの略称表記揺れに対応すること', () => {
      expect(raceNameMatches('阪神ジャンプステークス', '阪神ジャンプステークス')).toBe(true);
      expect(raceNameMatches('阪神ジャンプステークス', '阪神ジャンプS')).toBe(true);
      expect(raceNameMatches('阪神ジャンプS', '阪神ジャンプステークス')).toBe(true);
      expect(raceNameMatches('産経賞オールカマー', 'オールカマー')).toBe(true);
      expect(raceNameMatches('京成杯オータムハンデキャップ', '京成杯オータムH')).toBe(true);
    });

    it('全く異なるレース名の場合はfalseを返すこと', () => {
      expect(raceNameMatches('阪神ジャンプステークス', 'オールカマー')).toBe(false);
    });
  });

  describe('toIsoUtc', () => {
    it('JST日時からUTC ISO 8601形式へ正しく変換されること（-9時間）', () => {
      expect(toIsoUtc('2026-09-19', '15:45')).toBe('2026-09-19T06:45:00.000Z');
      expect(toIsoUtc('2026-09-19', '11:20')).toBe('2026-09-19T02:20:00.000Z');
      expect(toIsoUtc('2026-09-20', '09:00')).toBe('2026-09-20T00:00:00.000Z');
    });
  });

  describe('parseThisWeekHtml', () => {
    it('「今週の注目レース」HTMLから各レース情報と出馬表リンクを抽出できること', () => {
      const mockHtml = `
<div class="race_unit grid3">
  <div class="head">
    <dl>
      <dt>9月19日（土曜）</dt>
      <dd>
        <div class="race_title">
          <div class="txt">
            <h3>阪神ジャンプステークス（J・G&#8546;）</h3>
          </div>
        </div>
      </dd>
    </dl>
  </div>
  <div class="content">
    <div class="menu">
      <div class="icon_unit" data-active="on">
        <a href="/JRADB/accessD.html?CNAME=pw01dde0109202604050420260919/59" class="sp_link_check">
          <div class="inner"><img src="img/icon_syutsuba_h.png" alt="出馬表"/></div>
        </a>
      </div>
    </div>
  </div>
</div><!-- /[.race_unit] -->
<div class="race_unit grid3">
  <div class="head">
    <dl>
      <dt>9月20日（日曜）</dt>
      <dd>
        <div class="race_title">
          <div class="txt">
            <h3>産経賞オールカマー（G&#8545;）</h3>
          </div>
        </div>
      </dd>
    </dl>
  </div>
  <div class="content">
    <div class="menu">
      <div class="icon_unit">
        <!-- 未公開のため出馬表リンクなし -->
        <span>準備中</span>
      </div>
    </div>
  </div>
</div><!-- /[.race_unit] -->
      `;

      const parsed = parseThisWeekHtml(mockHtml, 2026);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        raceName: '阪神ジャンプステークス',
        date: '2026-09-19',
        syutsubaPath: '/JRADB/accessD.html?CNAME=pw01dde0109202604050420260919/59',
      });
      expect(parsed[1]).toEqual({
        raceName: '産経賞オールカマー',
        date: '2026-09-20',
        syutsubaPath: undefined,
      });
    });
  });

  describe('parseSyutsubaDetailHtml', () => {
    it('出馬表詳細HTMLから発走時刻・開催日・レース名を正しくパースできること', () => {
      const mockDetailHtml = `
<div class="race_header">
  <div class="date_line">
    <div class="inner">
      <div class="cell date">2026年9月19日（土曜） 4回阪神5日</div>
      <div class="cell time">
        発走時刻：<strong>11時20分</strong>
      </div>
    </div>
  </div>
  <div class="race_title">
    <div class="txt">
      <h2>
        <span class="main">
          <span class="cap"><span class="num">第28回</span></span><span class="race_name">阪神ジャンプステークス<span class="grade_icon lg"><img src="/JRADB/img/grade/icon_grade_jg3.png" alt="J･G&#8546;" /></span></span>
        </span>
      </h2>
    </div>
  </div>
</div>
      `;

      const parsed = parseSyutsubaDetailHtml(mockDetailHtml, undefined, 2026);
      expect(parsed).not.toBeNull();
      expect(parsed?.date).toBe('2026-09-19');
      expect(parsed?.timeJst).toBe('11:20');
      expect(parsed?.rawTime).toBe('11時20分');
      expect(parsed?.raceName).toBe('阪神ジャンプステークス');
    });

    it('発走時刻が存在しない場合はnullを返すこと', () => {
      const parsed = parseSyutsubaDetailHtml('<div>発走時刻未定</div>');
      expect(parsed).toBeNull();
    });
  });

  describe('parseSyutsubaTopCnames', () => {
    it('出馬表トップのHTMLから各競馬場のpw01drl...リンクを重複なく抽出できること', () => {
      const mockHtml = `
        <a href="#" onclick="return doAction('/JRADB/accessD.html', 'pw01drl00062026040520260919/27');">4回中山5日</a>
        <a href="#" onclick="return doAction('/JRADB/accessD.html', 'pw01drl00092026040520260919/05');">4回阪神5日</a>
        <a href="#" onclick="return doAction('/JRADB/accessD.html', 'pw01drl00062026040520260919/27');">4回中山5日(重複)</a>
      `;
      const cnames = parseSyutsubaTopCnames(mockHtml);
      expect(cnames).toEqual([
        'pw01drl00062026040520260919/27',
        'pw01drl00092026040520260919/05',
      ]);
    });
  });

  describe('parseSyutsubaListTableHtml', () => {
    it('レース一覧テーブルから各レースの発走時刻とレース名を抽出できること', () => {
      const mockTableHtml = `
<div class="race_select">
  <div class="main">
    <h2>2026年9月19日（土曜） 4回阪神5日</h2>
  </div>
  <tbody>
    <tr>
      <td class="time">10時00分</td>
      <td class="race_name">
        <div><div>2歳未勝利</div></div>
      </td>
    </tr>
    <tr>
      <td class="time">11時20分</td>
      <td class="race_name">
        <div>
          <div class="stakes">阪神ジャンプS<span class="grade_icon"><img src="..." alt="J･G&#8546;" /></span></div>
        </div>
      </td>
    </tr>
  </tbody>
</div>
      `;

      const races = parseSyutsubaListTableHtml(mockTableHtml, undefined, 2026);
      expect(races).toHaveLength(2);
      expect(races[0]).toEqual({
        raceName: '2歳未勝利',
        date: '2026-09-19',
        timeJst: '10:00',
        rawTime: '10時00分',
      });
      expect(races[1]).toEqual({
        raceName: '阪神ジャンプS',
        date: '2026-09-19',
        timeJst: '11:20',
        rawTime: '11時20分',
      });
    });
  });

  describe('fetchWithRetry', () => {
    it('初回成功時はそのままレスポンスを返すこと', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      vi.stubGlobal('fetch', mockFetch);

      const res = await fetchWithRetry('https://example.com/test');
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.unstubAllGlobals();
    });

    it('500エラー時はリトライして成功すればレスポンスを返すこと', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      vi.stubGlobal('fetch', mockFetch);

      const res = await fetchWithRetry('https://example.com/test', undefined, 2, 10);
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.unstubAllGlobals();
    });
  });
});
