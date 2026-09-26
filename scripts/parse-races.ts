import fs from 'node:fs';
import path from 'node:path';
import { ensureJraIcs } from './lib/jra-calendar';
import {
  parseNarScheduleHtml,
  fetchNarScheduleHtml,
} from './lib/nar-schedule';
import { loadFranceRaceMaster, getFranceRaces } from './lib/france-races';
import { loadUkRaceMaster, getUkRaces } from './lib/uk-races';
import { loadUsRaceMaster, getUsRaces } from './lib/us-races';
import { loadHkRaceMaster, getHkRaces } from './lib/hk-races';
import { loadIrelandRaceMaster, getIrelandRaces } from './lib/ireland-races';

// --- Type Definitions (Pattern A: Localized Object) ---
export interface LocalizedString {
  ja: string;
  en: string;
  fr?: string;
  zh?: string;
}

export interface HandicapInfo {
  code: 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';
  ja: string;
  en: string;
}

export interface LocalizedConstraint<T extends string> {
  code: T;
  label: LocalizedString;
}

export interface RaceOutput {
  id: string;
  organization: string;
  country_code?: string;
  name: LocalizedString;
  grade: string;
  date: string;
  start_time: string;
  is_time_confirmed: boolean;
  is_rescheduled?: boolean;
  original_date?: string;
  course: LocalizedString;
  distance: number;
  track_type: 'turf' | 'dirt' | 'obstacle' | 'banei' | 'aw';
  sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up' | '4yo';
  handicap: HandicapInfo;
}

export interface RaceMasterItem {
  name: LocalizedString;
  organization: string;
  course: LocalizedString;
  default_time_jst: string;
  sex_constraint: LocalizedConstraint<'none' | 'filly_and_mare' | 'colt_and_filly'>;
  age_constraint: LocalizedConstraint<'2yo' | '3yo' | '3yo_and_up' | '4yo_and_up'>;
  track_type: LocalizedConstraint<'turf' | 'dirt' | 'obstacle'>;
  distance: number;
  handicap: {
    code: 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';
    label: LocalizedString;
  };
}

// --- English Dictionaries ---
const COURSE_EN: Record<string, string> = {
  '東京': 'Tokyo',
  '中山': 'Nakayama',
  '京都': 'Kyoto',
  '阪神': 'Hanshin',
  '中京': 'Chukyo',
  '新潟': 'Niigata',
  '福島': 'Fukushima',
  '小倉': 'Kokura',
  '札幌': 'Sapporo',
  '函館': 'Hakodate',
};

const COURSE_FR: Record<string, string> = {
  '東京': 'Tokyo',
  '中山': 'Nakayama',
  '京都': 'Kyoto',
  '阪神': 'Hanshin',
  '中京': 'Chukyo',
  '新潟': 'Niigata',
  '福島': 'Fukushima',
  '小倉': 'Kokura',
  '札幌': 'Sapporo',
  '函館': 'Hakodate',
};

const RACE_NAME_EN: Record<string, string> = {
  '中山金杯': 'Nakayama Kimpai',
  '京都金杯': 'Kyoto Kimpai',
  'フェアリーステークス': 'Fairy Stakes',
  'シンザン記念': 'Nikkan Sports Sho Shinzan Kinen',
  '愛知杯': 'Aichi Hai',
  '京成杯': 'Keisei Hai',
  '日経新春杯': 'Nikkei Shinshun Hai',
  'アメリカジョッキークラブカップ': 'American Jockey Club Cup',
  '東海ステークス': 'Tokai TV Hai Tokai Stakes',
  '根岸ステークス': 'Negishi Stakes',
  'シルクロードステークス': 'Silk Road Stakes',
  'きさらぎ賞': 'Kisaragi Sho',
  '東京新聞杯': 'Tokyo Shimbun Hai',
  'クイーンカップ': 'Daily Hai Queen Cup',
  '共同通信杯': 'Kyodo News Hai',
  '京都記念': 'Kyoto Kinen',
  'ダイヤモンドステークス': 'Diamond Stakes',
  '京都牝馬ステークス': 'Kyoto Himba Stakes',
  'フェブラリーステークス': 'February Stakes',
  '小倉大賞典': 'Kokura Daishoten',
  '中山記念': 'Nakayama Kinen',
  '阪急杯': 'Hankyu Hai',
  'オーシャンステークス': 'Yukan Fuji Sho Ocean Stakes',
  'チューリップ賞': 'Tulip Sho',
  '弥生賞ディープインパクト記念': 'Hochi Hai Yayoi Sho Deep Impact Kinen',
  '中山牝馬ステークス': 'Nakayama Himba Stakes',
  '金鯱賞': 'Kinko Sho',
  'フィリーズレビュー': 'Hochi Hai Fillies\' Revue',
  'フラワーカップ': 'Flower Cup',
  'ファルコンステークス': 'Chunichi Sports Sho Falcon Stakes',
  'スプリングステークス': 'Fuji TV Sho Spring Stakes',
  '阪神大賞典': 'Hanshin Daishoten',
  '日経賞': 'Nikkei Sho',
  '毎日杯': 'Mainichi Hai',
  'マーチステークス': 'March Stakes',
  '高松宮記念': 'Takamatsunomiya Kinen',
  'ダービー卿チャレンジトロフィー': 'Lord Derby Challenge Trophy',
  '大阪杯': 'Osaka Hai',
  'ニュージーランドトロフィー': 'New Zealand Trophy',
  '阪神牝馬ステークス': 'Sankei Sports Hai Hanshin Himba Stakes',
  '桜花賞': 'Oka Sho (Japanese 1000 Guineas)',
  '中山グランドジャンプ': 'Nakayama Grand Jump',
  'アーリントンカップ': 'Arlington Cup',
  '皐月賞': 'Satsuki Sho (Japanese 2000 Guineas)',
  'アンタレスステークス': 'Antares Stakes',
  '福島牝馬ステークス': 'Fukushima Himba Stakes',
  'フローラステークス': 'Sankei Sports Sho Flora Stakes',
  'マイラーズカップ': 'Yomiuri Milers Cup',
  '青葉賞': 'TV Tokyo Hai Aoba Sho',
  '天皇賞（春）': 'Tenno Sho (Spring)',
  '京都新聞杯': 'Kyoto Shimbun Hai',
  '新潟大賞典': 'Niigata Daishoten',
  'NHKマイルカップ': 'NHK Mile Cup',
  '京王杯スプリングカップ': 'Keio Hai Spring Cup',
  'ヴィクトリアマイル': 'Victoria Mile',
  '平安ステークス': 'Heian Stakes',
  '優駿牝馬': 'Yushun Himba (Japanese Oaks)',
  '優駿牝馬（オークス）': 'Yushun Himba (Japanese Oaks)',
  '葵ステークス': 'Aoi Stakes',
  '東京優駿': 'Tokyo Yushun (Japanese Derby)',
  '東京優駿（日本ダービー）': 'Tokyo Yushun (Japanese Derby)',
  '日本ダービー': 'Tokyo Yushun (Japanese Derby)',
  '目黒記念': 'Meguro Kinen',
  '鳴尾記念': 'Naruo Kinen',
  '安田記念': 'Yasuda Kinen',
  'エプソムカップ': 'Epsom Cup',
  '函館スプリントステークス': 'Hakodate Sprint Stakes',
  '東京ジャンプステークス': 'Tokyo Jump Stakes',
  '宝塚記念': 'Takarazuka Kinen',
  'ラジオNIKKEI賞': 'Radio NIKKEI Sho',
  '北九州記念': 'TV Nishinippon Corp.Sho Kitakyushu Kinen',
  'テレビ西日本賞北九州記念': 'TV Nishinippon Corp.Sho Kitakyushu Kinen',
  '七夕賞': 'Tanabata Sho',
  'プロキオンステークス': 'Procyon Stakes',
  '函館2歳ステークス': 'Hakodate Nisai Stakes',
  '函館記念': 'Hakodate Kinen',
  '中京記念': 'Toyota Sho Chukyo Kinen',
  'アイビスサマーダッシュ': 'Ibis Summer Dash',
  'クイーンステークス': 'Hokkaido Shimbun Hai Queen Stakes',
  'レパードステークス': 'Leopard Stakes',
  'エルムステークス': 'Elm Stakes',
  '関屋記念': 'Sekiya Kinen',
  '小倉記念': 'Kokura Kinen',
  'CBC賞': 'CBC Sho',
  '札幌記念': 'Sapporo Kinen',
  '新潟ジャンプステークス': 'Niigata Jump Stakes',
  'キーンランドカップ': 'Keeneland Cup',
  '新潟2歳ステークス': 'Niigata Nisai Stakes',
  '札幌2歳ステークス': 'Sapporo Nisai Stakes',
  '新潟記念': 'Niigata Kinen',
  '小倉2歳ステークス': 'Kokura Nisai Stakes',
  '紫苑ステークス': 'Shion Stakes',
  '京成杯オータムハンデキャップ': 'Keisei Hai Autumn Handicap',
  'セントウルステークス': 'Sankei Sho Centaur Stakes',
  '阪神ジャンプステークス': 'Hanshin Jump Stakes',
  'ローズステークス': 'Kansai Telecasting Corp.Sho Rose Stakes',
  'セントライト記念': 'Asahi Hai St. Lite Kinen',
  'オールカマー': 'Sankei Sho All Comers',
  '神戸新聞杯': 'Kobe Shimbun Hai',
  'シリウスステークス': 'Sirius Stakes',
  'スプリンターズステークス': 'Sprinters Stakes',
  'サウジアラビアロイヤルカップ': 'Saudi Arabia Royal Cup',
  '毎日王冠': 'Mainichi Okan',
  '京都大賞典': 'Kyoto Daishoten',
  '府中牝馬ステークス': 'Fuchu Himba Stakes',
  'アイルランドトロフィー府中牝馬ステークス': 'Ireland Trophy Fuchu Himba Stakes',
  'アイルランドトロフィー': 'Ireland Trophy',
  '秋華賞': 'Shuka Sho',
  '富士ステークス': 'Fuji Stakes',
  '菊花賞': 'Kikuka Sho (Japanese St. Leger)',
  'アルテミスステークス': 'Artemis Stakes',
  'スワンステークス': 'MBS Sho Swan Stakes',
  '天皇賞（秋）': 'Tenno Sho (Autumn)',
  'ファンタジーステークス': 'KBS Kyoto Sho Fantasy Stakes',
  '京王杯2歳ステークス': 'Keio Hai Nisai Stakes',
  'アルゼンチン共和国杯': 'Copa Republica Argentina',
  'みやこステークス': 'Miyako Stakes',
  '武蔵野ステークス': 'Musashino Stakes',
  'デイリー杯2歳ステークス': 'Daily Hai Nisai Stakes',
  'エリザベス女王杯': 'Queen Elizabeth II Cup',
  '福島記念': 'Fukushima Kinen',
  '東京スポーツ杯2歳ステークス': 'Tokyo Sports Hai Nisai Stakes',
  'マイルチャンピオンシップ': 'Mile Championship',
  '京都2歳ステークス': 'Radio NIKKEI Hai Kyoto Nisai Stakes',
  'ジャパンカップ': 'Japan Cup',
  '京阪杯': 'Keihan Hai',
  'ステイヤーズステークス': 'Sports Nippon Sho Stayers Stakes',
  'チャレンジカップ': 'Challenge Cup',
  'チャンピオンズカップ': 'Champions Cup',
  '中日新聞杯': 'Chunichi Shimbun Hai',
  'カペラステークス': 'Capella Stakes',
  '阪神ジュベナイルフィリーズ': 'Hanshin Juvenile Fillies',
  'ターコイズステークス': 'Turquoise Stakes',
  '朝日杯フューチュリティステークス': 'Asahi Hai Futurity Stakes',
  '中山大障害': 'Nakayama Daishogai',
  '阪神カップ': 'Hanshin Cup',
  '有馬記念': 'Arima Kinen (The Grand Prix)',
  'ホープフルステークス': 'Hopeful Stakes',
  '京都ジャンプステークス': 'Kyoto Jump Stakes',
  '小倉サマージャンプ': 'Kokura Summer Jump',
  '小倉牝馬ステークス': 'Kokura Himba Stakes',
  '阪神スプリングジャンプ': 'Hanshin Spring Jump',
  'チャーチルダウンズカップ': 'Churchill Downs Cup',
  '東海テレビ杯金鯱賞': 'Kinko Sho',

  // 冠名付き正式名称・表記ゆれ対応
  '日刊スポーツ賞中山金杯': 'Nikkan Sports Sho Nakayama Kimpai',
  'スポーツニッポン賞京都金杯': 'Sports Nippon Sho Kyoto Kimpai',
  '日刊スポーツ賞シンザン記念': 'Nikkan Sports Sho Shinzan Kinen',
  'デイリー杯クイーンカップ': 'Daily Hai Queen Cup',
  'ローレル競馬場賞中山牝馬ステークス': 'Laurel R.C. Sho Nakayama Himba Stakes',
  '報知杯フィリーズレビュー': 'Hochi Hai Fillies\' Revue',
  '報知杯弥生賞ディープインパクト記念': 'Hochi Hai Yayoi Sho Deep Impact Kinen',
  'フジテレビ賞スプリングステークス': 'Fuji TV Sho Spring Stakes',
  '中日スポーツ賞ファルコンステークス': 'Chunichi Sports Sho Falcon Stakes',
  'サンケイスポーツ杯阪神牝馬ステークス': 'Sankei Sports Hai Hanshin Himba Stakes',
  '読売マイラーズカップ': 'Yomiuri Milers Cup',
  'サンケイスポーツ賞フローラステークス': 'Sankei Sports Sho Flora Stakes',
  'テレビ東京杯青葉賞': 'TV Tokyo Hai Aoba Sho',
  '天皇賞(春)': 'Tenno Sho (Spring)',
  '北海道新聞杯クイーンステークス': 'Hokkaido Shimbun Hai Queen Stakes',
  '産経賞セントウルステークス': 'Sankei Sho Centaur Stakes',
  '関西テレビ放送賞ローズステークス': 'Kansai Telecasting Corp.Sho Rose Stakes',
  '朝日杯セントライト記念': 'Asahi Hai St. Lite Kinen',
  '産経賞オールカマー': 'Sankei Sho All Comers',
  'MBS賞スワンステークス': 'MBS Sho Swan Stakes',
  '天皇賞(秋)': 'Tenno Sho (Autumn)',
  'KBS京都賞ファンタジーステークス': 'KBS Kyoto Sho Fantasy Stakes',
  'ラジオNIKKEI杯京都2歳ステークス': 'Radio NIKKEI Hai Kyoto Nisai Stakes',
  'スポーツニッポン賞ステイヤーズステークス': 'Sports Nippon Sho Stayers Stakes',

  // 新規・障害・追加重賞
  '小倉ジャンプステークス': 'Kokura Jump Stakes',
  'ユニコーンステークス': 'Unicorn Stakes',
  '京都ハイジャンプ': 'Kyoto High-Jump',
  'オークス': 'Yushun Himba (Japanese Oaks)',
  'しらさぎステークス': 'Shirasagi Stakes',
  '中京2歳ステークス': 'Chukyo Nisai Stakes',
  '東京ハイジャンプ': 'Tokyo High-Jump',
};

const HANDICAP_RACE_NAMES = new Set([
  '日経新春杯',
  '小倉大賞典',
  '中山牝馬ステークス',
  'マーチステークス',
  'ダービー卿チャレンジトロフィー',
  '福島牝馬ステークス',
  '新潟大賞典',
  '目黒記念',
  'エプソムカップ',
  'マーメイドステークス',
  '七夕賞',
  '函館記念',
  '中京記念',
  '関屋記念',
  '小倉記念',
  'CBC賞',
  '新潟記念',
  '京成杯オータムハンデキャップ',
  'シリウスステークス',
  'アルゼンチン共和国杯',
  '福島記念',
  '中日新聞杯',
  'チャレンジカップ',
  '新潟ジャンプステークス',
]);

const RACE_ALIASES: Record<string, string[]> = {
  'アメリカジョッキークラブカップ': ['AJCC', 'アメリカJCC'],
  'ダービー卿チャレンジトロフィー': ['ダービー卿CT'],
  'ニュージーランドトロフィー': ['NZT'],
  '阪神ジュベナイルフィリーズ': ['阪神JF', '阪神ジュベナイルF'],
  '東京スポーツ杯2歳ステークス': ['東スポ杯2歳S'],
  'アイルランドトロフィー': ['アイルランドT'],
  '東京優駿': ['日本ダービー'],
  '優駿牝馬': ['オークス'],
  'テレビ西日本賞北九州記念': ['北九州記念'],
  '東海テレビ杯金鯱賞': ['金鯱賞'],
  'チャーチルダウンズカップ': ['チャーチルダウンズC'],
};

function normalizeGrade(rawGrade: string): string {
  const g = rawGrade.trim();
  if (g.includes('J・G')) {
    if (g.includes('III') || g.includes('Ⅲ') || g.includes('3') || g.includes('３') || g.includes('&#8546;')) return 'J.G3';
    if (g.includes('II') || g.includes('Ⅱ') || g.includes('2') || g.includes('２') || g.includes('&#8545;')) return 'J.G2';
    if (g.includes('I') || g.includes('Ⅰ') || g.includes('1') || g.includes('１') || g.includes('&#8544;')) return 'J.G1';
    return 'J.G';
  }
  if (g.includes('III') || g.includes('Ⅲ') || g.includes('3') || g.includes('３') || g.includes('&#8546;')) return 'G3';
  if (g.includes('II') || g.includes('Ⅱ') || g.includes('2') || g.includes('２') || g.includes('&#8545;')) return 'G2';
  if (g.includes('I') || g.includes('Ⅰ') || g.includes('1') || g.includes('１') || g.includes('&#8544;')) return 'G1';
  return g;
}

function gradeToIdKey(grade: string): string {
  switch (grade) {
    case 'G1': return 'g1';
    case 'G2': return 'g2';
    case 'G3': return 'g3';
    case 'J.G1': return 'jg1';
    case 'J.G2': return 'jg2';
    case 'J.G3': return 'jg3';
    default: return grade.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}

interface IcsRace {
  date: string;
  month: number;
  day: number;
  course: string;
  rawName: string;
  cleanName: string;
  grade: string;
}

function parseIcs(content: string): IcsRace[] {
  const races: IcsRace[] = [];
  const eventBlocks = content.split('BEGIN:VEVENT').slice(1);

  for (const block of eventBlocks) {
    const dtMatch = block.match(/DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/);
    const locMatch = block.match(/LOCATION:([^\r\n]+)/);
    const sumMatch = block.match(/SUMMARY:([^\r\n]+)/);

    if (!dtMatch || !locMatch || !sumMatch) continue;

    const year = dtMatch[1];
    const month = parseInt(dtMatch[2], 10);
    const day = parseInt(dtMatch[3], 10);
    const date = `${year}-${dtMatch[2]}-${dtMatch[3]}`;

    const rawCourse = locMatch[1].trim();
    const course = rawCourse.replace(/競馬場$/, '');

    const rawSummary = sumMatch[1].trim();
    const summaryMatch = rawSummary.match(/^(.*?)[\(（]([^\)）]+)[\)）]$/);
    const cleanName = summaryMatch ? summaryMatch[1].trim() : rawSummary;
    const rawGrade = summaryMatch ? summaryMatch[2].trim() : '';
    const grade = normalizeGrade(rawGrade);

    races.push({
      date,
      month,
      day,
      course,
      rawName: rawSummary,
      cleanName,
      grade,
    });
  }

  return races;
}

interface HtmlRace {
  month: number;
  day: number;
  course: string;
  raceName: string;
  gradeIconText: string;
  ageText: string;
  courseText: string;
  sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
  track_type: 'turf' | 'dirt' | 'obstacle';
  distance: number;
}

function parseHtml(htmlContent: string): HtmlRace[] {
  const races: HtmlRace[] = [];
  const trMatches = htmlContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);

  for (const trMatch of trMatches) {
    const row = trMatch[1];
    if (!row.includes('class="race"')) continue;

    const dateMatch = row.match(/<td class="date">(\d+)月(\d+)日/);
    const raceMatch = row.match(/<td class="race">([\s\S]*?)<\/td>/);
    const placeMatch = row.match(/<td class="place">([^<]+)<\/td>/);
    const ageMatch = row.match(/<td class="age">([^<]+)<\/td>/);
    const courseMatch = row.match(/<td class="course">([\s\S]*?)<\/td>/);

    if (!dateMatch || !raceMatch || !placeMatch || !ageMatch || !courseMatch) continue;

    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const course = placeMatch[1].trim();
    const ageText = ageMatch[1].trim();
    const courseText = courseMatch[1].trim();

    const raceInner = raceMatch[1];
    const gradeMatch = raceInner.match(/<span class="grade_icon[^"]*">([\s\S]*?)<\/span>/);
    const gradeIconText = gradeMatch ? gradeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    let raceName = raceInner.replace(/<span class="grade_icon[^"]*">[\s\S]*?<\/span>/, '');
    raceName = raceName.replace(/<[^>]+>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();

    // 1. sex_constraint
    let sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly' = 'none';
    if (/牡・牝|牡・牝馬/.test(ageText)) {
      sex_constraint = 'colt_and_filly';
    } else if (/牝/.test(ageText)) {
      sex_constraint = 'filly_and_mare';
    } else {
      sex_constraint = 'none';
    }

    // 2. age_constraint
    let age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up' = '3yo_and_up';
    if (/3歳以上/.test(ageText)) {
      age_constraint = '3yo_and_up';
    } else if (/4歳以上/.test(ageText)) {
      age_constraint = '4yo_and_up';
    } else if (/2歳/.test(ageText)) {
      age_constraint = '2yo';
    } else if (/3歳/.test(ageText)) {
      age_constraint = '3yo';
    }

    // 3. track_type
    let track_type: 'turf' | 'dirt' | 'obstacle' = 'turf';
    if (/障害|J・G|障/.test(courseText) || /障害|J・G/.test(gradeIconText)) {
      track_type = 'obstacle';
    } else if (/ダート|ダ/.test(courseText)) {
      track_type = 'dirt';
    } else {
      track_type = 'turf';
    }

    // 4. distance
    const cleanCourse = courseText.replace(/,/g, '');
    const distMatch = cleanCourse.match(/(\d{4})m?/);
    const distance = distMatch ? parseInt(distMatch[1], 10) : 0;

    races.push({
      month,
      day,
      course,
      raceName,
      gradeIconText,
      ageText,
      courseText,
      sex_constraint,
      age_constraint,
      track_type,
      distance,
    });
  }

  return races;
}

function raceNameMatches(icsName: string, htmlName: string): boolean {
  if (icsName === htmlName) return true;
  if (RACE_ALIASES[icsName]?.includes(htmlName)) return true;
  for (const [k, vList] of Object.entries(RACE_ALIASES)) {
    if (vList.includes(htmlName) && k === icsName) return true;
  }

  const simplify = (s: string) => s
    .replace(/ステークス/g, 'S')
    .replace(/カップ/g, 'C')
    .replace(/オータムハンデキャップ/g, 'オータムH')
    .replace(/オータムH/g, 'オータムH')
    .replace(/トロフィー/g, 'T')
    .replace(/記念/g, '記念')
    .replace(/[\s\(\)（）・]/g, '');

  const nI = simplify(icsName);
  const nH = simplify(htmlName);
  return nI === nH || nI.includes(nH) || nH.includes(nI);
}

// Handicap calculation with localized info
function determineHandicap(raceName: string, grade: string, ageConstraint: string): HandicapInfo {
  if (raceName.includes('ハンデ') || raceName.endsWith('H') || HANDICAP_RACE_NAMES.has(raceName)) {
    return {
      code: 'handicap',
      ja: 'ハンデ',
      en: 'Handicap',
    };
  }
  if (grade === 'G1' || grade === 'J.G1') {
    return {
      code: 'weight_for_age',
      ja: '定量',
      en: 'Weight for Age',
    };
  }
  if (ageConstraint === '2yo') {
    return {
      code: 'special_weight',
      ja: '馬齢',
      en: 'Special Weight',
    };
  }
  return {
    code: 'set_weight',
    ja: '別定',
    en: 'Set Weight',
  };
}

function determineDefaultTimeJst(trackType: string, course: string, grade: string): string {
  if (trackType === 'obstacle') {
    if (grade === 'J.G1') return '14:45';
    return '13:50';
  }
  if (course === '京都' || course === '阪神' || course === '中京' || course === '小倉') {
    return '15:45';
  }
  if (course === '札幌' || course === '函館') {
    return '15:35';
  }
  return '15:40';
}

function toIsoUtc(dateStr: string, timeJst: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeJst.split(':').map(Number);
  const jstDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));
  return jstDate.toISOString();
}

function resolveRaceNameEn(icsName: string, htmlName: string): string {
  // 1. 完全一致
  if (RACE_NAME_EN[icsName]) return RACE_NAME_EN[icsName];
  if (RACE_NAME_EN[htmlName]) return RACE_NAME_EN[htmlName];

  // 2. 括弧（全角/半角）正規化
  const normIcs = icsName.replace(/（/g, '(').replace(/）/g, ')');
  if (RACE_NAME_EN[normIcs]) return RACE_NAME_EN[normIcs];
  const fullIcs = icsName.replace(/\(/g, '（').replace(/\)/g, '）');
  if (RACE_NAME_EN[fullIcs]) return RACE_NAME_EN[fullIcs];

  // 3. 冠名（「○○賞」「○○杯」等）を除去したベース名称でマッチ
  const baseName = icsName.replace(/^.+?[賞杯]\s*/, '');
  if (RACE_NAME_EN[baseName]) return RACE_NAME_EN[baseName];

  // 4. HTML側プレフィックス等の除去（例: GⅡ京都ハイジャンプ -> 京都ハイジャンプ）
  const cleanHtml = htmlName.replace(/^G[ⅠⅡⅢ&#0-9;]+/, '').trim();
  if (RACE_NAME_EN[cleanHtml]) return RACE_NAME_EN[cleanHtml];

  // 5. エイリアス辞書の参照
  for (const [canonical, aliases] of Object.entries(RACE_ALIASES)) {
    if (aliases.includes(icsName) || aliases.includes(htmlName) || aliases.includes(baseName)) {
      if (RACE_NAME_EN[canonical]) return RACE_NAME_EN[canonical];
    }
  }

  // 6. 辞書内のキーで部分一致
  for (const [key, val] of Object.entries(RACE_NAME_EN)) {
    if (icsName.includes(key) || key.includes(icsName)) {
      return val;
    }
  }

  throw new Error(`Failed to resolve English race name for "${icsName}" (HTML: "${htmlName}")`);
}

const RACE_NAME_FR: Record<string, string> = {
  '日本ダービー': 'Derby Japonais',
  '東京優駿': 'Derby Japonais',
  'ジャパンカップ': 'Coupe du Japon (Japan Cup)',
  '優駿牝馬': 'Oaks Japonais',
  'オークス': 'Oaks Japonais',
  '有馬記念': 'Arima Kinen (Grand Prix)',
  '天皇賞(春)': 'Tenno Sho (Printemps)',
  '天皇賞(秋)': 'Tenno Sho (Automne)',
  '菊花賞': 'Kikuka Sho (St. Léger Japonais)',
  '皐月賞': 'Satsuki Sho (2000 Guinées Japonaises)',
  '桜花賞': 'Oka Sho (1000 Guinées Japonaises)',
  '宝塚記念': 'Takarazuka Kinen',
  '安田記念': 'Yasuda Kinen',
  'マイルチャンピオンシップ': 'Mile Championship',
  'スプリンターズステークス': 'Sprinters Stakes',
  '大阪杯': 'Osaka Hai',
  '高松宮記念': 'Takamatsunomiya Kinen',
  'エリザベス女王杯': 'Queen Elizabeth II Cup',
  '秋華賞': 'Shuka Sho',
  'チャンピオンズカップ': 'Champions Cup',
  'フェブラリーステークス': 'February Stakes',
  'ホープフルステークス': 'Hopeful Stakes',
  '阪神ジュベナイルフィリーズ': 'Hanshin Juvenile Fillies',
  '朝日杯フューチュリティステークス': 'Asahi Hai Futurity Stakes',
  '中山大障害': 'Nakayama Daishogai',
  '中山グランドジャンプ': 'Nakayama Grand Jump',
};

function resolveRaceNameFr(icsName: string, htmlName: string): string | undefined {
  if (RACE_NAME_FR[icsName]) return RACE_NAME_FR[icsName];
  if (RACE_NAME_FR[htmlName]) return RACE_NAME_FR[htmlName];
  const baseName = icsName.replace(/^.+?[賞杯]\s*/, '');
  if (RACE_NAME_FR[baseName]) return RACE_NAME_FR[baseName];
  return undefined;
}

interface CliOptions {
  year: number;
  force: boolean;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  let year = parseInt(process.env.TARGET_YEAR || '2026', 10);
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg.startsWith('--year=')) {
      year = parseInt(arg.slice('--year='.length), 10);
    } else if (arg === '--year' || arg === '-y') {
      if (args[i + 1]) {
        year = parseInt(args[++i], 10);
      }
    } else if (/^\d{4}$/.test(arg)) {
      year = parseInt(arg, 10);
    }
  }

  if (isNaN(year)) {
    throw new Error('Invalid year provided in arguments or TARGET_YEAR environment variable');
  }

  return { year, force };
}

async function ensureJyusyoHtml(filePath: string, year: number, force: boolean = false): Promise<string> {
  if (fs.existsSync(filePath) && !force) {
    console.log(`Loading HTML from local file: ${filePath}`);
    const buf = fs.readFileSync(filePath);
    return new TextDecoder('shift-jis').decode(buf);
  }

  const url = `https://www.jra.go.jp/datafile/seiseki/replay/${year}/jyusyo.html`;
  console.log(`Fetching jyusyo.html from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch jyusyo.html from ${url}: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return new TextDecoder('shift-jis').decode(buffer);
}

/**
 * 既存の races.json から確定済み発走予定時刻の情報を抽出し、
 * レース特定用キー（ID および "日付_レース名"）から時刻情報を引けるマップを構築する
 */
export function extractConfirmedRaceTimesMap(
  existingRaces: Array<{ id: string; name?: { ja?: string }; date: string; start_time: string; is_time_confirmed?: boolean }>
): Map<string, { start_time: string; is_time_confirmed: boolean }> {
  const map = new Map<string, { start_time: string; is_time_confirmed: boolean }>();
  for (const r of existingRaces) {
    if (r.is_time_confirmed) {
      const val = { start_time: r.start_time, is_time_confirmed: true };
      if (r.id) {
        map.set(r.id, val);
      }
      if (r.name?.ja && r.date) {
        map.set(`${r.date}_${r.name.ja}`, val);
      }
    }
  }
  return map;
}

async function main() {
  const { year, force } = parseCliArgs();
  console.log(`Building races data for year: ${year} (force: ${force})`);

  const rootDir = process.cwd();
  const icsPath = path.join(rootDir, 'src', 'data', `jrarace${year}.ics`);
  const htmlFileName = (year === 2026 && fs.existsSync(path.join(rootDir, 'src', 'data', 'jyusyo.html')) && !force)
    ? 'jyusyo.html'
    : `jyusyo${year === 2026 ? '' : year}.html`;
  const htmlPath = path.join(rootDir, 'src', 'data', htmlFileName);
  const publicOutPath = path.join(rootDir, 'public', 'data', 'races.json');
  const masterOutPath = path.join(rootDir, 'src', 'data', 'race_master.json');

  const icsContent = await ensureJraIcs(year, icsPath, { force });
  const htmlContent = await ensureJyusyoHtml(htmlPath, year, force);

  // 既存の races.json がある場合は確定済み発走予定時刻を引き継ぐ
  let confirmedTimesMap = new Map<string, { start_time: string; is_time_confirmed: boolean }>();
  if (fs.existsSync(publicOutPath)) {
    try {
      const existingRaces = JSON.parse(fs.readFileSync(publicOutPath, 'utf-8'));
      if (Array.isArray(existingRaces)) {
        confirmedTimesMap = extractConfirmedRaceTimesMap(existingRaces);
        console.log(`Preserving confirmed race times from existing races.json.`);
      }
    } catch (err) {
      console.warn(`[Warning] Failed to read existing races.json for confirmed times: ${(err as Error).message}`);
    }
  }

  const icsRaces = parseIcs(icsContent);
  const htmlRaces = parseHtml(htmlContent);

  console.log(`Parsed ${icsRaces.length} races from ICS.`);
  console.log(`Parsed ${htmlRaces.length} races from HTML.`);

  icsRaces.sort((a, b) => a.date.localeCompare(b.date));

  const usedHtmlIndices = new Set<number>();
  const gradeSeqCount: Record<string, number> = {};

  const racesOutput: RaceOutput[] = [];
  const raceMaster: Record<string, RaceMasterItem> = {};

  for (const ics of icsRaces) {
    let matchedIndex = -1;

    for (let i = 0; i < htmlRaces.length; i++) {
      if (usedHtmlIndices.has(i)) continue;
      if (raceNameMatches(ics.cleanName, htmlRaces[i].raceName)) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      for (let i = 0; i < htmlRaces.length; i++) {
        if (usedHtmlIndices.has(i)) continue;
        if (htmlRaces[i].month === ics.month && htmlRaces[i].day === ics.day && htmlRaces[i].course === ics.course) {
          matchedIndex = i;
          break;
        }
      }
    }

    if (matchedIndex === -1) {
      throw new Error(`Could not find matching HTML row for ICS race: ${ics.cleanName} (${ics.grade}) on ${ics.date}`);
    }

    usedHtmlIndices.add(matchedIndex);
    const htmlData = htmlRaces[matchedIndex];

    const gradeIdKey = gradeToIdKey(ics.grade);
    gradeSeqCount[gradeIdKey] = (gradeSeqCount[gradeIdKey] || 0) + 1;
    const seqStr = String(gradeSeqCount[gradeIdKey]).padStart(2, '0');
    const id = `${year}-jra-${gradeIdKey}-${seqStr}`;

    // HTMLの実績開催日（YYYY-MM-DD）と比較し代替開催を検知
    const htmlDateStr = `${year}-${String(htmlData.month).padStart(2, '0')}-${String(htmlData.day).padStart(2, '0')}`;
    const isRescheduled = ics.date !== htmlDateStr;
    const finalDate = isRescheduled ? htmlDateStr : ics.date;

    if (isRescheduled) {
      console.log(`[Rescheduled Race Detected] ${ics.cleanName}: original ${ics.date} -> actual ${finalDate}`);
    }

    const defaultTimeJst = determineDefaultTimeJst(htmlData.track_type, ics.course, ics.grade);
    let startTimeUtc = toIsoUtc(finalDate, defaultTimeJst);
    let isTimeConfirmed = false;

    const confirmedInfo = confirmedTimesMap.get(id) || confirmedTimesMap.get(`${finalDate}_${ics.cleanName}`);
    if (confirmedInfo) {
      startTimeUtc = confirmedInfo.start_time;
      isTimeConfirmed = confirmedInfo.is_time_confirmed;
    }

    const handicap = determineHandicap(ics.cleanName, ics.grade, htmlData.age_constraint);

    const nameEn = resolveRaceNameEn(ics.cleanName, htmlData.raceName);
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(nameEn)) {
      throw new Error(`English race name contains Japanese characters: "${nameEn}" for race "${ics.cleanName}"`);
    }
    const courseEn = COURSE_EN[ics.course] || ics.course;
    const courseFr = COURSE_FR[ics.course] || courseEn;
    const nameFr = resolveRaceNameFr(ics.cleanName, htmlData.raceName);

    const raceItem: RaceOutput = {
      id,
      organization: 'jra',
      country_code: 'JP',
      name: {
        ja: ics.cleanName,
        en: nameEn,
        ...(nameFr ? { fr: nameFr } : {}),
      },
      grade: ics.grade,
      date: finalDate,
      start_time: startTimeUtc,
      is_time_confirmed: isTimeConfirmed,
      ...(isRescheduled ? { is_rescheduled: true, original_date: ics.date } : {}),
      course: {
        ja: ics.course,
        en: courseEn,
        fr: courseFr,
      },
      distance: htmlData.distance,
      track_type: htmlData.track_type,
      sex_constraint: htmlData.sex_constraint,
      age_constraint: htmlData.age_constraint,
      handicap,
    };

    racesOutput.push(raceItem);

    // Build master entry
    const sexConstraintJa = htmlData.sex_constraint === 'filly_and_mare' ? '牝' : htmlData.sex_constraint === 'colt_and_filly' ? '牡・牝' : '制限なし';
    const sexConstraintEn = htmlData.sex_constraint === 'filly_and_mare' ? 'Fillies & Mares' : htmlData.sex_constraint === 'colt_and_filly' ? 'Colts & Fillies' : 'Open to All';

    const ageConstraintJa = htmlData.age_constraint === '2yo' ? '2歳' : htmlData.age_constraint === '3yo' ? '3歳' : htmlData.age_constraint === '3yo_and_up' ? '3歳以上' : '4歳以上';
    const ageConstraintEn = htmlData.age_constraint === '2yo' ? '2yo' : htmlData.age_constraint === '3yo' ? '3yo' : htmlData.age_constraint === '3yo_and_up' ? '3yo & Up' : '4yo & Up';

    const trackTypeJa = htmlData.track_type === 'turf' ? '芝' : htmlData.track_type === 'dirt' ? 'ダート' : '障害';
    const trackTypeEn = htmlData.track_type === 'turf' ? 'Turf' : htmlData.track_type === 'dirt' ? 'Dirt' : 'Jump';

    raceMaster[ics.cleanName] = {
      name: {
        ja: ics.cleanName,
        en: nameEn,
        ...(nameFr ? { fr: nameFr } : {}),
      },
      organization: 'jra',
      course: {
        ja: `${ics.course}競馬場`,
        en: `${courseEn} Racecourse`,
        fr: `${courseFr} Hippodrome`,
      },
      default_time_jst: defaultTimeJst,
      sex_constraint: {
        code: htmlData.sex_constraint,
        label: {
          ja: sexConstraintJa,
          en: sexConstraintEn,
        },
      },
      age_constraint: {
        code: htmlData.age_constraint,
        label: {
          ja: ageConstraintJa,
          en: ageConstraintEn,
        },
      },
      track_type: {
        code: htmlData.track_type,
        label: {
          ja: trackTypeJa,
          en: trackTypeEn,
        },
      },
      distance: htmlData.distance,
      handicap: {
        code: handicap.code,
        label: {
          ja: handicap.ja,
          en: handicap.en,
        },
      },
    };
  }

function narGradeToIdKey(grade: string): string {
  switch (grade) {
    case 'G1': return 'g1';
    case 'Jpn1': return 'jpn1';
    case 'Jpn2': return 'jpn2';
    case 'Jpn3': return 'jpn3';
    case 'S1': return 's1';
    case 'S2': return 's2';
    case 'S3': return 's3';
    default: return 'local';
  }
}

function determineNarHandicap(raceName: string, _grade: string, course: string): HandicapInfo {
  if (course === '帯広') {
    return {
      code: 'special_weight',
      ja: '別定',
      en: 'Set Weight',
    };
  }
  if (/ハンデ|ハンディ/.test(raceName)) {
    return {
      code: 'handicap',
      ja: 'ハンデ',
      en: 'Handicap',
    };
  }
  if (/東京大賞典|川崎記念|かしわ記念|帝王賞|JBCクラシック|JBCスプリント|JBCレディスクラシック|ジャパンダートクラシック/.test(raceName)) {
    return {
      code: 'weight_for_age',
      ja: '定量',
      en: 'Weight for Age',
    };
  }
  return {
    code: 'set_weight',
    ja: '別定',
    en: 'Set Weight',
  };
}

  // --- Process NAR Races ---
  console.log('Fetching and merging NAR races...');
  let narHtml: string;
  const narFixturePath = path.join(rootDir, 'tests', 'fixtures', 'nar_schedule_2026.html');
  if (fs.existsSync(narFixturePath)) {
    console.log(`[NAR Schedule] Using cached schedule: ${narFixturePath}`);
    narHtml = fs.readFileSync(narFixturePath, 'utf8');
  } else {
    console.log('[NAR Schedule] Fetching live schedule from keiba.go.jp...');
    narHtml = await fetchNarScheduleHtml(year);
  }

  const narRaces = parseNarScheduleHtml(narHtml, year);
  const narGradeSeqCount: Record<string, number> = {};

  for (const nar of narRaces) {
    const gradeIdKey = narGradeToIdKey(nar.grade);
    narGradeSeqCount[gradeIdKey] = (narGradeSeqCount[gradeIdKey] || 0) + 1;
    const seqStr = String(narGradeSeqCount[gradeIdKey]).padStart(2, '0');
    const id = `${year}-nar-${gradeIdKey}-${seqStr}`;

    const defaultTimeJst = nar.default_time_jst;
    let startTimeUtc = toIsoUtc(nar.date, defaultTimeJst);
    let isTimeConfirmed = false;

    const confirmedInfo = confirmedTimesMap.get(id) || confirmedTimesMap.get(`${nar.date}_${nar.name.ja}`);
    if (confirmedInfo) {
      startTimeUtc = confirmedInfo.start_time;
      isTimeConfirmed = confirmedInfo.is_time_confirmed;
    }

    const handicap = determineNarHandicap(nar.name.ja, nar.grade, nar.course.ja);

    const raceItem: RaceOutput = {
      id,
      organization: 'nar',
      country_code: 'JP',
      name: {
        ja: nar.name.ja,
        en: nar.name.en,
      },
      grade: nar.grade,
      date: nar.date,
      start_time: startTimeUtc,
      is_time_confirmed: isTimeConfirmed,
      course: {
        ja: nar.course.ja,
        en: nar.course.en,
      },
      distance: nar.distance,
      track_type: nar.track_type,
      sex_constraint: nar.sex_constraint,
      age_constraint: nar.age_constraint,
      handicap,
    };

    racesOutput.push(raceItem);
  }
  console.log(`Merged ${narRaces.length} NAR races into races output.`);

  // --- Process France Races ---
  console.log('Loading and merging France races...');
  const franceMaster = loadFranceRaceMaster(rootDir);
  const franceRaces = getFranceRaces(franceMaster, confirmedTimesMap);
  for (const fr of franceRaces) {
    racesOutput.push(fr);
  }
  console.log(`Merged ${franceRaces.length} France races into races output.`);

  // --- Process UK Races ---
  console.log('Loading and merging UK races...');
  const ukMaster = loadUkRaceMaster(rootDir);
  const ukRaces = getUkRaces(ukMaster, confirmedTimesMap);
  for (const uk of ukRaces) {
    racesOutput.push(uk);
  }
  console.log(`Merged ${ukRaces.length} UK races into races output.`);

  // --- Process US Races ---
  console.log('Loading and merging US races...');
  const usMaster = loadUsRaceMaster(rootDir);
  const usRaces = getUsRaces(usMaster, confirmedTimesMap);
  for (const us of usRaces) {
    racesOutput.push(us);
  }
  console.log(`Merged ${usRaces.length} US races into races output.`);

  // --- Process HK Races ---
  console.log('Loading and merging HK races...');
  const hkMaster = loadHkRaceMaster(rootDir);
  const hkRaces = getHkRaces(hkMaster, confirmedTimesMap);
  for (const hk of hkRaces) {
    racesOutput.push(hk);
  }
  console.log(`Merged ${hkRaces.length} HK races into races output.`);

  // --- Process Ireland Races ---
  console.log('Loading and merging Ireland races...');
  const irelandMaster = loadIrelandRaceMaster(rootDir);
  const irelandRaces = getIrelandRaces(irelandMaster, confirmedTimesMap);
  for (const ie of irelandRaces) {
    racesOutput.push(ie);
  }
  console.log(`Merged ${irelandRaces.length} Ireland races into races output.`);

  // Sort races by date, start_time, and organization
  racesOutput.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.start_time.localeCompare(b.start_time) ||
    a.organization.localeCompare(b.organization)
  );

  // Write output files
  fs.mkdirSync(path.dirname(publicOutPath), { recursive: true });
  fs.writeFileSync(publicOutPath, JSON.stringify(racesOutput, null, 2), 'utf-8');
  console.log(`Saved ${racesOutput.length} races to ${publicOutPath}`);

  fs.mkdirSync(path.dirname(masterOutPath), { recursive: true });
  fs.writeFileSync(masterOutPath, JSON.stringify(raceMaster, null, 2), 'utf-8');
  console.log(`Saved master dictionary (${Object.keys(raceMaster).length} races) to ${masterOutPath}`);

  console.log('Build completed successfully with Pattern A (Localized Object)!');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parse-races.ts')) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}