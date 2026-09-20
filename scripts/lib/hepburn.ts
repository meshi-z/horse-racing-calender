/**
 * ヘボン式ローマ字変換ユーティリティ
 * 競馬レース名向けに競馬用語（賞、記念、優駿等）や地名・漢字語彙の変換を最適化。
 */

// よく使われる競馬レース名の漢字・語彙マッピング
const KANJI_VOCABULARY: [RegExp, string][] = [
  // 都道府県・地方名・競馬場名・地名
  [/北海道/g, 'Hokkaido '],
  [/道営/g, 'Doei '],
  [/北海/g, 'Hokkai '],
  [/東北/g, 'Tohoku '],
  [/岩手県/g, 'Iwateken '],
  [/岩手/g, 'Iwate '],
  [/盛岡/g, 'Morioka '],
  [/水沢/g, 'Mizusawa '],
  [/南関東/g, 'Minami Kanto '],
  [/浦和/g, 'Urawa '],
  [/船橋/g, 'Funabashi '],
  [/大井/g, 'Oi '],
  [/川崎/g, 'Kawasaki '],
  [/東京/g, 'Tokyo '],
  [/金沢/g, 'Kanazawa '],
  [/北陸/g, 'Hokuriku '],
  [/笠松/g, 'Kasamatsu '],
  [/名古屋/g, 'Nagoya '],
  [/東海/g, 'Tokai '],
  [/中日本/g, 'Nakanihon '],
  [/西日本/g, 'Nishinihon '],
  [/東日本/g, 'Higashinihon '],
  [/北日本/g, 'Kitanihon '],
  [/園田/g, 'Sonoda '],
  [/姫路/g, 'Himeji '],
  [/兵庫/g, 'Hyogo '],
  [/高知県/g, 'Kochiken '],
  [/高知/g, 'Kochi '],
  [/佐賀/g, 'Saga '],
  [/九州/g, 'Kyushu '],
  [/帯広/g, 'Obihiro '],
  [/十勝/g, 'Tokachi '],

  // 競馬用語（接頭・接尾）
  [/スプリント/g, ' Sprint '],
  [/マイラーズ/g, ' Milers '],
  [/マイル/g, ' Mile '],
  [/クラシック/g, ' Classic '],
  [/チャンピオンシップ/g, ' Championship '],
  [/チャンピオン/g, ' Champion '],
  [/ダービー/g, ' Derby '],
  [/オークス/g, ' Oaks '],
  [/グランプリ/g, ' Grand Prix '],
  [/トロフィー/g, ' Trophy '],
  [/カップ/g, ' Cup '],
  [/ゴールド/g, ' Gold '],
  [/シルバー/g, ' Silver '],
  [/ブロンズ/g, ' Bronze '],
  [/ジュニア/g, ' Junior '],
  [/クイーンズ/g, ' Queens '],
  [/クイーン/g, ' Queen '],
  [/レディス/g, ' Ladies '],
  [/レディー/g, ' Lady '],
  [/スター/g, ' Star '],
  [/オータム/g, ' Autumn '],
  [/サマー/g, ' Summer '],
  [/スプリング/g, ' Spring '],
  [/ウインター/g, ' Winter '],
  [/チャレンジ/g, ' Challenge '],
  [/オープン/g, ' Open '],
  [/ネクスト/g, ' Next '],

  // カタカナ外来語
  [/ブルーリボン/g, ' Blue Ribbon '],
  [/ブリーダーズ/g, ' Breeders\' '],
  [/グランシャリオ/g, ' Grand Chariot '],
  [/ファンセレクト/g, ' Fan Select '],
  [/フォーマルハウト/g, ' Fomalhaut '],
  [/サラブレッド/g, ' Thoroughbred '],
  [/フロイライン/g, ' Fraulein '],
  [/スパーキング/g, ' Sparking '],
  [/ジェムストーン/g, ' Gemstone '],
  [/ジュベナイル/g, ' Juvenile '],
  [/ビギナーズ/g, ' Beginners '],
  [/ルーキーズ/g, ' Rookies '],
  [/セレクション/g, ' Selection '],
  [/プリンセス/g, ' Princess '],
  [/シンデレラ/g, ' Cinderella '],
  [/ダイヤモンド/g, ' Diamond '],
  [/ペガサス/g, ' Pegasus '],
  [/サンライズ/g, ' Sunrise '],
  [/ブロッサム/g, ' Blossom '],
  [/フローラル/g, ' Floral '],
  [/エトワール/g, ' Etoile '],
  [/サファイア/g, ' Sapphire '],
  [/ポラリス/g, ' Polaris '],
  [/フェアリー/g, ' Fairy '],
  [/ヴィーナス/g, ' Venus '],
  [/クラウン/g, ' Crown '],
  [/グローリー/g, ' Glory '],
  [/ウイナー/g, ' Winner '],
  [/トリトン/g, ' Triton '],
  [/フルール/g, ' Fleur '],
  [/ブルーム/g, ' Bloom '],
  [/ロータス/g, ' Lotus '],
  [/トパーズ/g, ' Topaz '],
  [/ローレル/g, ' Laurel '],
  [/サザン/g, ' Southern '],
  [/ウィング/g, ' Wing '],
  [/カペラ/g, ' Capella '],
  [/マーチ/g, ' March '],
  [/ノース/g, ' North '],
  [/リリー/g, ' Lily '],
  [/オパール/g, ' Opal '],
  [/ユース/g, ' Youth '],
  [/ヤング/g, ' Young '],
  [/ベイ/g, ' Bay '],
  [/イヤー/g, ' Year '],

  // 漢字競馬用語
  [/大賞典/g, ' Daishoten '],
  [/記念/g, ' Kinen '],
  [/優駿牝馬/g, ' Yushun Himba '],
  [/優駿/g, ' Yushun '],
  [/金賞/g, ' Kinsho '],
  [/栄冠賞/g, ' Eikan Sho '],
  [/争覇/g, ' Soha '],
  [/賞典/g, ' Shoten '],
  [/王冠/g, ' Okan '],
  [/若駒/g, ' Wakakoma '],
  [/知事賞/g, ' Chijisho '],
  [/知事杯/g, ' Chijihai '],
  [/新春/g, ' Shinshun '],
  [/菊花賞/g, ' Kikuka Sho '],
  [/桜花賞/g, ' Oka Sho '],
  [/皐月賞/g, ' Satsuki Sho '],
  [/賞/g, ' Sho '],
  [/杯/g, ' Hai '],
  [/冠/g, ' Kan '],
  [/特別/g, ' Tokubetsu '],
  [/競馬/g, ' Keiba ']
];

// ひらがな・カタカナからヘボン式ローマ字への変換テーブル
const KANA_TO_HEPBURN: Record<string, string> = {
  // 拗音・促音
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',

  キャ: 'kya', キュ: 'kyu', キョ: 'kyo',
  シャ: 'sha', シュ: 'shu', ショ: 'sho',
  チャ: 'cha', チュ: 'chu', チョ: 'cho',
  ニャ: 'nya', ニュ: 'nyu', ニョ: 'nyo',
  ヒャ: 'hya', ヒュ: 'hyu', ヒョ: 'hyo',
  ミャ: 'mya', ミュ: 'myu', ミョ: 'myo',
  リャ: 'rya', リュ: 'ryu', リョ: 'ryo',
  ギャ: 'gya', ギュ: 'gyu', ギョ: 'gyo',
  ジャ: 'ja', ジュ: 'ju', ジョ: 'jo',
  ビャ: 'bya', ビュ: 'byu', ビョ: 'byo',
  ピャ: 'pya', ピュ: 'pyu', ピョ: 'pyo',

  // 清音・濁音・半濁音
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',

  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'o', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',

  // 促音・小文字
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o',
  っ: 'tsu', ッ: 'tsu',
  ヴ: 'vu',
  ティ: 'ti', ディ: 'di',
  トゥ: 'tu', ドゥ: 'du',
  ファ: 'fa', フィ: 'fi', フェ: 'fe', フォ: 'fo',
  ウィ: 'wi', ウェ: 'we', ウォ: 'wo',
};

/**
 * かな文字列をヘボン式ローマ字に変換
 */
export function kanaToHepburn(kana: string): string {
  let result = '';
  let i = 0;

  while (i < kana.length) {
    // 2文字（拗音・外来音）のチェック
    if (i + 1 < kana.length) {
      const two = kana.slice(i, i + 2);
      if (KANA_TO_HEPBURN[two]) {
        result += KANA_TO_HEPBURN[two];
        i += 2;
        continue;
      }
    }

    const char = kana[i];

    // 促音「っ」「ッ」の処理（次の子音を重ねる。ただし ch の前は t）
    if (char === 'っ' || char === 'ッ') {
      if (i + 1 < kana.length) {
        const nextTwo = i + 2 <= kana.length ? kana.slice(i + 1, i + 3) : '';
        const nextRomaji = KANA_TO_HEPBURN[nextTwo] || KANA_TO_HEPBURN[kana[i + 1]] || '';
        if (nextRomaji) {
          const firstLetter = nextRomaji[0];
          result += (firstLetter === 'c' ? 't' : firstLetter);
          i++;
          continue;
        }
      }
    }

    // 長音記号「ー」の処理
    if (char === 'ー') {
      i++;
      continue;
    }

    // 撥音「ん」「ン」の処理（b, m, p の前は m）
    if (char === 'ん' || char === 'ン') {
      if (i + 1 < kana.length) {
        const nextTwo = i + 2 <= kana.length ? kana.slice(i + 1, i + 3) : '';
        const nextRomaji = KANA_TO_HEPBURN[nextTwo] || KANA_TO_HEPBURN[kana[i + 1]] || '';
        if (nextRomaji && /^[bmp]/.test(nextRomaji)) {
          result += 'm';
          i++;
          continue;
        }
      }
      result += 'n';
      i++;
      continue;
    }

    if (KANA_TO_HEPBURN[char]) {
      result += KANA_TO_HEPBURN[char];
    } else {
      result += char;
    }
    i++;
  }

  // ヘボン式の長音省略規則（ou -> o, oo -> o, uu -> u）
  result = result
    .replace(/ou/g, 'o')
    .replace(/oo/g, 'o')
    .replace(/uu/g, 'u');

  return result;
}

/**
 * 日本語レース名をヘボン式ローマ字英名にフォールバック変換
 */
export function romanizeJapaneseRaceName(name: string): string {
  let text = name;

  // 1. 競馬用語・地名の漢字置換
  for (const [pattern, replacement] of KANJI_VOCABULARY) {
    text = text.replace(pattern, replacement);
  }

  // 2. 残りのひらがな・カタカナ部分をヘボン式ローマ字に変換
  text = text.replace(/[\u3040-\u309F\u30A0-\u30FF]+/g, match => kanaToHepburn(match));

  // 3. 数字や記号の整形
  text = text
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/５/g, '5')
    .replace(/[（(]/g, ' (')
    .replace(/[）)]/g, ') ')
    .replace(/[・]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. 単語ごとに Capitalize
  return text
    .split(' ')
    .filter(Boolean)
    .map(w => {
      // 括弧で囲まれている場合
      if (w.startsWith('(') && w.endsWith(')')) {
        const inner = w.slice(1, -1);
        return `(${inner.charAt(0).toUpperCase() + inner.slice(1)})`;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
