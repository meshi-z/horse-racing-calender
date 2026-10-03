## 概要 (Overview)
Closes #165

2026年アイルランド競馬（HRI）の過去開催（2026-10-03以前）全86重賞のうち、未登録となっていた34レースの勝ち馬データを公式実績（Sporting Life / HRI）から100%特定・同期し、過去レース登録率 **100%（86/86レース）** を達成しました。
あわせて、天候順延・カレンダー変更による実開催日乖離、競馬場移転、およびスポンサー冠名・別名による照合不一致を抜本的に是正しました。

---

## 変更内容 (Changes)

### 1. 34レースの勝ち馬データ同期 (`src/data/race_winners.json`, `public/data/races.json`)
- 未登録となっていたアイルランド34重賞の公式勝ち馬名・勝ちタイムを全件登録。
- 既存マスターに公式カタカナ名が存在する競走馬（`トゥルーラヴ`、`スカンジナビア`、`サングッデス`）は表記を完全統一。
- JRA-VAN等の公式日本語表記が存在しない外国馬については、架空のカタカナを創作せず原語英字名を保持（空値原則・一次ソース原則）。

### 2. 実開催日・天候順延・会場変更のマスター是正 (`src/data/ireland_race_master.json`, `public/data/races.json`)
- **天候順延・カレンダー変更**:
  - ダブリンレーシングフェスティバル等の悪天候順延（01-31 -> 02-02: アイリッシュゴールドC等4競走）
  - カラ競馬場の復活祭前後の開催日変更等、計23レースの実際の日程乖離を是正し、`is_rescheduled: true`, `original_date` を設定。
- **競馬場移転・会場入れ替え**:
  - ティペラリー改修に伴う移転: Fairy Bridge Stakes（ティペラリー -> コーク）
  - 開催入れ替え: Stanerra Stakes（レパーズタウン -> フェアリーハウス）、Brownstown Stakes（フェアリーハウス -> レパーズタウン）
- 日程変更後の全レースを `date`, `start_time`, `id` 昇順にソートし整合性を保護。

### 3. Sporting Life 名寄せ照合エンジンの拡充 (`scripts/lib/uk-syutsuba.ts`)
- `UK_STOP_WORDS` に共通協賛団体語句（`EBF`, `IRISH`, `EUROPEAN`, `BREEDERS`, `FUND`, `STALLION`, `FARMS`）を追加。
- `UK_RACE_ALIASES` にアイルランド重賞のスポンサー別名マッピングを拡充：
  - `Ridgewood Pearl Stakes` = `Lanwades Stud Stakes`
  - `Blue Wind Stakes` = `Jannah Rose Stakes`
  - `Champions Juvenile Stakes` = `Golden Fleece Stakes`
  - `Leopardstown 1,000 Guineas Trial` = `Priory Belle Stakes`
  - `Leopardstown 2,000 Guineas Trial` = `Red Rocks Stakes`
  - `Punchestown Champion Hurdle` = `Boodles Champion Hurdle`
  - `Spring Juvenile Hurdle` = `Gannon's Juvenile Hurdle`
  - `Flame of Tara Stakes` = `Newtownanner Stud Stakes`
  - `Fairy Bridge Stakes` = `Little Big Bear Stakes`
  - `Kilboy Estate Stakes` = `Meadow Court Stakes` / `Rathbride Stakes`

### 4. テスト・ドキュメント
- `tests/unit/foreignResultsOfficial.test.ts`: アイルランド過去全86重賞の勝者登録100%保証、日程順延・移転レースの属性保証テストを追加。
- `tests/unit/ukSyutsuba.test.ts`: アイルランド重賞のスポンサー名・別名照合テストを追加。
- `docs/PRD.md`（Step 67完了）、`docs/CHANGELOG.md`（Step 62完了）、`package.json`（v1.41.1）を更新しPRD PDFを再生成。

---

## 検証結果 (Verification)
- `npm test`: 全60テストファイル・570テスト全件パス
- `npm run type-check`: 型エラーなし
- `npm run build`: プロダクションビルド成功
- `Remaining missing Irish races: 0`（未登録ゼロ件）

Co-authored-by: Antigravity <antigravity@example.com>
