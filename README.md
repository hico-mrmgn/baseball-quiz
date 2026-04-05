# 野球クイズ - 状況判断トレーニング

野球の試合状況を読み取り、最適なプレーを選択する判断力トレーニングアプリです。

## 機能

- **ポジション別クイズ** - サード・セカンド・ショート・ピッチャー・コーチ判断から選択、ランダムモードも対応
- **4段階の難易度** - 初級 / 中級 / 上級 / プロ級
- **コンボシステム** - 連続正解でコンボが加算、マイルストーンごとにメッセージ表示
- **フィールド図** - SVGによる守備位置・走者位置・アウトカウントの可視化
- **キャリアティア** - スコアに応じた11段階のランク判定（「卓球部に転部」〜「ドラフト1位指名！」）
- **戦績管理** - LocalStorageによる履歴保存、通算成績・最高スコア・最高コンボの表示

## 技術スタック

- React 19 + Vite
- Tailwind CSS
- LocalStorage（状態永続化）

## セットアップ

```bash
npm install
npm run dev
```

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルドのプレビュー |
| `npm run lint` | ESLintによるコード検査 |

## ディレクトリ構成

```
src/
├── App.jsx                 # メイン画面遷移管理
├── components/
│   ├── TopScreen.jsx       # トップ画面（テーマ・難易度選択）
│   ├── QuizScreen.jsx      # クイズ画面
│   ├── ResultScreen.jsx    # 結果画面（スコア・キャリアティア）
│   ├── HistoryScreen.jsx   # 戦績画面
│   └── FieldDiagram.jsx    # 野球フィールド図（SVG）
├── data/
│   └── questions.js        # 問題データ・テーマ定義
└── utils/
    ├── career.js           # キャリアティア判定
    ├── history.js          # 履歴のLocalStorage管理
    └── parseSituation.js   # 状況テキスト → フィールドデータ変換
```
