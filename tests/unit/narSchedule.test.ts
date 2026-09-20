import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadNarRaceMaster,
  normalizeNarGrade,
  normalizeNarCourse,
  normalizeNarEligibility,
  parseNarScheduleHtml,
} from '../../scripts/lib/nar-schedule';
import { kanaToHepburn, romanizeJapaneseRaceName } from '../../scripts/lib/hepburn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('NAR Race Master (nar_race_master.json)', () => {
  it('15競馬場の情報が完全に定義されていること', () => {
    const master = loadNarRaceMaster();
    const expectedVenues = [
      '門別', '盛岡', '水沢', '浦和', '船橋', '大井', '川崎',
      '金沢', '笠松', '名古屋', '園田', '姫路', '高知', '佐賀', '帯広'
    ];

    for (const venue of expectedVenues) {
      expect(master.venues[venue]).toBeDefined();
      expect(master.venues[venue].ja).toBe(venue);
      expect(master.venues[venue].en).toBeTruthy();
      expect(master.venues[venue].default_time_jst).toMatch(/^\d{2}:\d{2}$/);
    }

    // ナイター / 昼間 / ばんえいの時刻設定検証
    expect(master.venues['大井'].default_time_jst).toBe('20:05');
    expect(master.venues['大井'].is_nighter).toBe(true);
    expect(master.venues['浦和'].default_time_jst).toBe('16:30');
    expect(master.venues['浦和'].is_nighter).toBe(false);
    expect(master.venues['帯広'].default_time_jst).toBe('19:30');
    expect(master.venues['帯広'].is_nighter).toBe(true);
  });

  it('主要重賞の英語名称が定義されていること', () => {
    const master = loadNarRaceMaster();
    expect(master.races['東京大賞典']).toBe('Tokyo Daishoten');
    expect(master.races['川崎記念']).toBe('Kawasaki Kinen');
    expect(master.races['帝王賞']).toBe('Teio Sho');
    expect(master.races['東京ダービー']).toBe('Tokyo Derby');
    expect(master.races['ばんえい記念']).toBe('Banei Kinen');
    expect(master.races['帯広記念']).toBe('Obihiro Kinen');
    expect(master.races['マーキュリーカップ']).toBe('Mercury Cup');
    expect(master.races['マリーンカップ']).toBe('Marine Cup');
    expect(master.races['フリオーソレジェンドカップ']).toBe('Furioso Legend Cup');
    expect(master.races['ビューチフルドリーマーカップ']).toBe('Beautiful Dreamer Cup');
    expect(master.races['レジーナディンヴェルノ賞']).toBe("Regina d'Inverno Sho");
    expect(master.races['ル・プランタン賞']).toBe('Le Printemps Sho');
  });
});

describe('Hepburn Romanization (hepburn.ts)', () => {
  it('ひらがな・カタカナをヘボン式ローマ字に正しく変換すること', () => {
    expect(kanaToHepburn('とうきょう')).toBe('tokyo');
    expect(kanaToHepburn('きっぷ')).toBe('kippu');
    expect(kanaToHepburn('しんばし')).toBe('shimbashi');
    expect(kanaToHepburn('スプリント')).toBe('supurinto');
  });

  it('未登録の日本語レース名をヘボン式Title Case英名に変換すること', () => {
    expect(romanizeJapaneseRaceName('佐賀若駒賞')).toBe('Saga Wakakoma Sho');
    expect(romanizeJapaneseRaceName('高知県知事賞')).toBe('Kochiken Chijisho');
    expect(romanizeJapaneseRaceName('新春賞')).toBe('Shinshun Sho');
    expect(romanizeJapaneseRaceName('オータムティアラ')).toBe('Autumn Tiara');
  });

  it('カタカナ外来語を含むレース名を適切な英単語表記に置換すること', () => {
    expect(romanizeJapaneseRaceName('新春ペガサスカップ')).toBe('Shinshun Pegasus Cup');
    expect(romanizeJapaneseRaceName('兵庫クイーンセレクション')).toBe('Hyogo Queen Selection');
    expect(romanizeJapaneseRaceName('東京プリンセス賞')).toBe('Tokyo Princess Sho');
    expect(romanizeJapaneseRaceName('九州クラウン')).toBe('Kyushu Crown');
    expect(romanizeJapaneseRaceName('東京シンデレラマイル')).toBe('Tokyo Cinderella Mile');
    expect(romanizeJapaneseRaceName('兵庫ユースカップ')).toBe('Hyogo Youth Cup');
    expect(romanizeJapaneseRaceName('ダイヤモンドカップ')).toBe('Diamond Cup');
    expect(romanizeJapaneseRaceName('川崎スパーキングスプリント')).toBe('Kawasaki Sparking Sprint');
    expect(romanizeJapaneseRaceName('ブルーリボンマイル')).toBe('Blue Ribbon Mile');
    expect(romanizeJapaneseRaceName('フロイラインスプリント')).toBe('Fraulein Sprint');
    expect(romanizeJapaneseRaceName('金沢ファンセレクトカップ2026')).toBe('Kanazawa Fan Select Cup 2026');
  });

  it('和名・植物名・鳥名等のレース名はヘボン式ローマ字を維持すること', () => {
    expect(romanizeJapaneseRaceName('コウノトリ賞')).toBe('Konotori Sho');
    expect(romanizeJapaneseRaceName('佐賀がばいスプリント')).toBe('Saga Gabai Sprint');
    expect(romanizeJapaneseRaceName('ノトキリシマ賞')).toBe('Notokirishima Sho');
    expect(romanizeJapaneseRaceName('ヒダカソウカップ')).toBe('Hidakaso Cup');
    expect(romanizeJapaneseRaceName('ハヤテスプリント')).toBe('Hayate Sprint');
  });
});

describe('NAR Schedule Parser (nar-schedule.ts)', () => {
  describe('normalizeNarGrade', () => {
    it('国際G1（東京大賞典等）は G1 として正規化すること', () => {
      expect(normalizeNarGrade('GⅠ', '東京大賞典', 'nank ooi over3 over1600 GI')).toBe('G1');
      expect(normalizeNarGrade('', '東京大賞典', '')).toBe('G1');
    });

    it('ダートグレード (JpnⅠ〜Ⅲ) を Jpn1〜3 に正規化すること', () => {
      expect(normalizeNarGrade('JpnⅠ', '川崎記念', 'nank kawa over3 JpnI')).toBe('Jpn1');
      expect(normalizeNarGrade('JpnⅡ', 'ダイオライト記念', 'nank funa over3 JpnII')).toBe('Jpn2');
      expect(normalizeNarGrade('JpnⅢ', 'かきつばた記念', 'nago over3 JpnIII')).toBe('Jpn3');
    });

    it('南関東重賞 (SⅠ〜Ⅲ) を S1〜3 に正規化すること', () => {
      expect(normalizeNarGrade('SⅠ', '桜花賞', 'nank uraw age_3 SI')).toBe('S1');
      expect(normalizeNarGrade('SⅡ', '京成盃グランドマイラーズ', 'nank funa over3 SII')).toBe('S2');
      expect(normalizeNarGrade('SⅢ', '川崎マイラーズ', 'nank kawa over3 SIII')).toBe('S3');
    });

    it('その他地区重賞（BG, H, M, SP, 重賞, 空白等）は一律 local_grade に正規化すること', () => {
      expect(normalizeNarGrade('BG1', '帯広記念', 'obi obi over3 BG1')).toBe('local_grade');
      expect(normalizeNarGrade('BG2', 'ばんえい十勝オッズパーク杯', 'obi obi over3 BG2')).toBe('local_grade');
      expect(normalizeNarGrade('H1', '北海優駿', 'monb monb age_3 H1')).toBe('local_grade');
      expect(normalizeNarGrade('M1', '桐花賞', 'iwat mizu over3 M1')).toBe('local_grade');
      expect(normalizeNarGrade('SPⅠ', '東海桜花賞', 'touk nago over3 SPI')).toBe('local_grade');
      expect(normalizeNarGrade('重賞Ⅰ', '新春賞', 'hyou sono over3 JsI')).toBe('local_grade');
      expect(normalizeNarGrade('', '佐賀若駒賞', 'saga saga age_3')).toBe('local_grade');
    });
  });

  describe('normalizeNarCourse', () => {
    it('帯広競馬場は一律 track_type: banei かつ distance: 200 になること', () => {
      const res = normalizeNarCourse('200m', '帯広');
      expect(res.track_type).toBe('banei');
      expect(res.distance).toBe(200);
    });

    it('コースに「芝」が含まれる場合は track_type: turf になること', () => {
      const res = normalizeNarCourse('芝1700m', '盛岡');
      expect(res.track_type).toBe('turf');
      expect(res.distance).toBe(1700);
    });

    it('一般ダートコースは track_type: dirt になること', () => {
      const res = normalizeNarCourse('2100m', '川崎');
      expect(res.track_type).toBe('dirt');
      expect(res.distance).toBe(2100);
    });
  });

  describe('normalizeNarEligibility', () => {
    it('牝馬限定レースを判定できること', () => {
      const res1 = normalizeNarEligibility('nank uraw age_3 SI mare GDJ', '<div class="mare"><p class="icon --mare">牝馬</p></div>');
      expect(res1.sex_constraint).toBe('filly_and_mare');

      const res2 = normalizeNarEligibility('nank kawa over3 over1600 SIII', '<div class="mare"></div>');
      expect(res2.sex_constraint).toBe('none');
    });

    it('馬齢条件を判定できること', () => {
      expect(normalizeNarEligibility('age_2', '').age_constraint).toBe('2yo');
      expect(normalizeNarEligibility('age_3', '').age_constraint).toBe('3yo');
      expect(normalizeNarEligibility('over3', '').age_constraint).toBe('3yo_and_up');
      expect(normalizeNarEligibility('age_3-4', '').age_constraint).toBe('3yo_and_up');
      expect(normalizeNarEligibility('age_4', '').age_constraint).toBe('4yo_and_up');
      expect(normalizeNarEligibility('age_5', '').age_constraint).toBe('4yo_and_up');
    });
  });

  describe('parseNarScheduleHtml (HTML E2E Parsing)', () => {
    const mockHtml = `
      <div id="month_01" class="cellCol">
        <ul class="race cell clearfix">
          <li class="obi obi over3 under1500 BG1 display">
            <p class="date">1/2</p>
            <p class="dayoftheweek">金</p>
            <p class="name">帯広記念</p>
            <div class="class"><p class="icon --other">BG1</p></div>
            <p class="area">帯広</p>
            <p class="course">200m</p>
            <div class="mare"></div>
          </li>
          <li class="nank kawa over3 over1600 SIII display">
            <p class="date">1/3</p>
            <p class="dayoftheweek">土</p>
            <p class="name">川崎マイラーズ</p>
            <div class="class"><p class="icon --other">SⅢ</p></div>
            <p class="area">川崎</p>
            <p class="course">1600m</p>
            <div class="mare"></div>
          </li>
          <li class="nank kawa over3 over1600 JpnI DG haslink display">
            <a href="https://example.com">
              <p class="date">4/8</p>
              <p class="dayoftheweek">水</p>
              <p class="name">川崎記念</p>
              <div class="class"><p class="icon --grade">JpnⅠ</p></div>
              <p class="area">川崎</p>
              <p class="course">2100m</p>
              <div class="mare"></div>
            </a>
          </li>
          <li class="iwat mori over3 over1600 M1 display">
            <p class="date">7/12</p>
            <p class="dayoftheweek">日</p>
            <p class="name">せきれい賞</p>
            <div class="class"><p class="icon --other">M1</p></div>
            <p class="area">盛岡</p>
            <p class="course">芝2400m</p>
            <div class="mare"></div>
          </li>
          <li class="saga saga age_3 display">
            <p class="date">1/4</p>
            <p class="dayoftheweek">日</p>
            <p class="name">佐賀若駒賞</p>
            <div class="class"></div>
            <p class="area">佐賀</p>
            <p class="course">1750m</p>
            <div class="mare"></div>
          </li>
        </ul>
      </div>
    `;

    it('HTMLから複数レースを正確に抽出・正規化すること', () => {
      const races = parseNarScheduleHtml(mockHtml, 2026);
      expect(races.length).toBe(5);

      // 帯広記念（ばんえい）
      const obihiro = races.find(r => r.name.ja === '帯広記念')!;
      expect(obihiro).toBeDefined();
      expect(obihiro.date).toBe('2026-01-02');
      expect(obihiro.grade).toBe('local_grade');
      expect(obihiro.rawGrade).toBe('BG1');
      expect(obihiro.course.ja).toBe('帯広');
      expect(obihiro.course.en).toBe('Obihiro');
      expect(obihiro.track_type).toBe('banei');
      expect(obihiro.distance).toBe(200);
      expect(obihiro.default_time_jst).toBe('19:30');
      expect(obihiro.organization).toBe('nar');

      // 川崎マイラーズ（南関S3）
      const kawasakiMilers = races.find(r => r.name.ja === '川崎マイラーズ')!;
      expect(kawasakiMilers).toBeDefined();
      expect(kawasakiMilers.date).toBe('2026-01-03');
      expect(kawasakiMilers.grade).toBe('S3');
      expect(kawasakiMilers.track_type).toBe('dirt');
      expect(kawasakiMilers.distance).toBe(1600);
      expect(kawasakiMilers.default_time_jst).toBe('20:05');

      // 川崎記念（ダートグレード Jpn1）
      const kawasakiKinen = races.find(r => r.name.ja === '川崎記念')!;
      expect(kawasakiKinen).toBeDefined();
      expect(kawasakiKinen.date).toBe('2026-04-08');
      expect(kawasakiKinen.grade).toBe('Jpn1');
      expect(kawasakiKinen.name.en).toBe('Kawasaki Kinen');

      // せきれい賞（盛岡 芝コース）
      const sekirei = races.find(r => r.name.ja === 'せきれい賞')!;
      expect(sekirei).toBeDefined();
      expect(sekirei.track_type).toBe('turf');
      expect(sekirei.distance).toBe(2400);
      expect(sekirei.course.ja).toBe('盛岡');
      expect(sekirei.course.en).toBe('Morioka');
      expect(sekirei.default_time_jst).toBe('16:30');

      // 佐賀若駒賞（地方重賞、英語名ローマ字フォールバック）
      const wakakoma = races.find(r => r.name.ja === '佐賀若駒賞')!;
      expect(wakakoma).toBeDefined();
      expect(wakakoma.grade).toBe('local_grade');
      expect(wakakoma.name.en).toBe('Saga Wakakoma Sho');
      expect(wakakoma.course.ja).toBe('佐賀');
      expect(wakakoma.course.en).toBe('Saga');
      expect(wakakoma.default_time_jst).toBe('20:05');
    });

    it('実HTMLフィクスチャ（nar_schedule_2026.html）から全レースが例外なく正常にパースできること', () => {
      const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'nar_schedule_2026.html');
      const html = fs.readFileSync(fixturePath, 'utf8');
      const races = parseNarScheduleHtml(html, 2026);

      // 全344レースが抽出されること
      expect(races.length).toBe(344);

      const validGrades = new Set(['G1', 'Jpn1', 'Jpn2', 'Jpn3', 'S1', 'S2', 'S3', 'local_grade']);
      const validTrackTypes = new Set(['turf', 'dirt', 'banei']);
      const validSexConstraints = new Set(['none', 'filly_and_mare', 'colt_and_filly']);
      const validAgeConstraints = new Set(['2yo', '3yo', '3yo_and_up', '4yo_and_up']);

      for (const race of races) {
        // 日付フォーマット
        expect(race.date).toMatch(/^2026-\d{2}-\d{2}$/);
        // レース名
        expect(race.name.ja).toBeTruthy();
        expect(race.name.en).toBeTruthy();
        expect(race.name.en).not.toContain('undefined');
        // グレード
        expect(validGrades.has(race.grade)).toBe(true);
        // コース・馬場・距離
        expect(race.course.ja).toBeTruthy();
        expect(race.course.en).toBeTruthy();
        expect(validTrackTypes.has(race.track_type)).toBe(true);
        expect(race.distance).toBeGreaterThan(0);
        // 出走条件
        expect(validSexConstraints.has(race.sex_constraint)).toBe(true);
        expect(validAgeConstraints.has(race.age_constraint)).toBe(true);
        // 発走推定時刻
        expect(race.default_time_jst).toMatch(/^\d{2}:\d{2}$/);
        // 組織
        expect(race.organization).toBe('nar');
      }

      // ばんえい競馬（帯広）の全レース検証
      const baneiRaces = races.filter(r => r.course.ja === '帯広');
      expect(baneiRaces.length).toBeGreaterThan(20);
      for (const banei of baneiRaces) {
        expect(banei.track_type).toBe('banei');
        expect(banei.distance).toBe(200);
        expect(banei.course.en).toBe('Obihiro');
        expect(banei.default_time_jst).toBe('19:30');
      }

      // 盛岡芝レースの検証
      const turfRaces = races.filter(r => r.track_type === 'turf');
      expect(turfRaces.length).toBeGreaterThan(0);
      for (const turf of turfRaces) {
        expect(turf.course.ja).toBe('盛岡');
      }
    });
  });
});
