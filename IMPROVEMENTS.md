# 改善メモ（TODO）

ポートフォリオの伸びしろメモ。優先度順。チェックを付けながらいつでも着手できる。

## 優先度：高（採用担当の評価に直結）

- [ ] **GAMMA+ のスクリーンショット追加**
  - 現状 `workData['gamma-plus'].screenshots` が空配列のため、カード／モーダルともに「準備中…」表示。
  - 8作品中で唯一メディアが無い作品。SSを数枚 `images/` に置き、`js/main.js` の screenshots 配列に追加するだけで埋まる。
- [ ] **PV動画の追加**（静止画のみの作品）
  - 対象: RM Engine / GAMMA+ / Sand Tetris / ConsoleSTG / CIRCLESTRIKER / 東方春三校
  - 追加済み: ぺったんメイカー / GAMMA
  - `workData[...].video` を `{ type:'video', src:'videos/xxx.mp4' }` に変更。
- [ ] **作品説明文のトーン調整（プログラマー職向け）**
  - Sand Tetris の「自分では一文字もコードを書かず」など、AI主導を前面に出した表現は、プログラマー職の応募では自分の設計判断・検証観点を主語にした書き方の方が評価が安定する。
  - 「生成コードをどう読み解き・どう取捨選択したか」を強調する方向で微調整を検討。

## 優先度：中（性能・セキュリティ）

- [ ] **PettanMaker_PV.mp4 が約40MBと重い**
  - モーダルは `v.autoplay = true`（main.js openModal）なので、開いた瞬間に40MBの読み込みが走る。
  - 対策案: 動画を再エンコードで圧縮（720p / H.264 CRF調整）、`poster` 画像を付与、`preload="metadata"` 化、または外部ホスティング（YouTube埋め込みは `video.type:'youtube'` が既に実装済み）。
- [ ] **Firebase セキュリティ設定の本番反映**（CLAUDE.md 未完了セクションと重複）
  - Firestore Console に `firestore.rules` を貼って公開。
  - App Check: reCAPTCHA v3 サイトキー取得 → `index.html` の `APP_CHECK_SITE_KEY` に設定 → Console でシークレット登録 → Monitor 確認後 Enforce。
  - 現状 `APP_CHECK_SITE_KEY = ""` で無効、ルール未公開のため、ランキングのスパム／改ざん耐性が低い。
- [ ] **skillアイコンの devicon CDN を `@latest` から固定バージョンに**
  - `index.html` の `cdn.jsdelivr.net/gh/devicons/devicon@latest/...` は `@latest` 参照。
  - バージョン固定（例 `@v2.16.0`）にすると表示崩れ・キャッシュ効率のリスクを低減。可能なら自前ホスティングも検討。

## 優先度：低（細かな最適化・磨き込み）

- [ ] **重い画像のさらなる圧縮 / webp化**
  - `images/PettanMaker_GamePlay.webp`（約560KB）、`PettanMaker_ConceptArt.webp`（約380KB）、`PettanMaker_Title.webp`（約360KB）はまだ大きい。
  - `images/RMEngine_*.png`（Icon 約250KB / SceneView 約200KB / UIView 約185KB / GameView 約180KB）は PNG のまま。webp化で大幅削減可能。
- [ ] **配布物（zip）の追加**
  - 対象: ぺったんメイカー / GAMMA+ / RM Engine（Sand Tetris・ConsoleSTG は配布済み）。
- [ ] **ミニゲームの使用素材クレジット記載**
  - `index.html` ゲームモーダルの「使用素材」が現在 `Coming Soon`。
- [ ] **アクセシビリティ／演出の磨き込み**
  - `prefers-reduced-motion` で背景アニメを自動オフにする配慮。
  - キーボードフォーカスの可視化（`:focus-visible`）の見直し。

---

## 完了済みの主な改善（このメモ作成時）

- ファビコン軽量化: `IR_favicon.png` 1920×1920 / 約596KB → 512×512 PNG-8 / 約20KB（favicon・ナビロゴ・OGP兼用）。`IR_favicon_white.jpg`（apple-touch-icon）1920×1920 / 約120KB → 180×180 / 約3KB。合計 約716KB → 約23KB（約97%削減）。
- 「存在するのに未反映のファイル」の有無を全件検証 → 該当なし（`images`/`videos`/`games` の全ファイルが `workData` から参照済み。HTMLの「準備中…」は `js/main.js` が実行時にサムネイル画像へ差し替える仕様）。
