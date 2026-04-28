# ポートフォリオサイト - CLAUDE.md

## プロジェクト概要
- 色川陸登（HAL東京 ゲーム4年制学科 プログラマーコース）の就職用ポートフォリオ
- GitHub Pages: https://irokawarikuto.github.io/
- リポジトリ: https://github.com/IrokawaRikuto/IrokawaRikuto.github.io
- 構成: HTML/CSS/JS のみ（フレームワークなし）

## 完了済み
- ダークテーマ（赤アクセント #ff4444）のデザイン
- セクション: Hero, About, Skills, Works（5作品表示・2列グリッド・新しい順）, Timeline, Contact, Footer
- 言語切り替え（JP/EN）: data-ja/data-en属性方式
- 作品クリックでモーダル表示（動画/スクリーンショット/説明/タグ/受賞/開発環境/DLリンク対応）
- モーダルURL対応（#work-gammaなどで直接モーダルが開く、面接官間の共有用）
- モーダル閉じたとき動画停止
- メール送信フォーム（FormSubmit.co, IRcola777@gmail.com、autocomplete対応済み）
- FormSubmit.co の初回メール認証済み
- 背景アニメーション（赤い直線の棒が画面を横断、近未来風）
- スクロールフェードインアニメーション（IntersectionObserver）
- ハンバーガーメニュー（モバイル）
- トップに戻るボタン（右下、48px、スクロールで出現）
- スクロールバー非表示（ガタつき防止）
- ファビコン（IRファビコン.png）、ナビバーロゴ（IRファビコン.png）
- Skills: C++, C#, DirectX, JavaScript, HTML, Unity, Visual Studio, VS Code, Blender, Maya, MMD, PMXEditor, AviUtl, YMM4, Studio One 6（ゲームプログラマー重要度順ソート済み）
- ナビバーメニュー：常時表示ドロップダウン（右上ハンバーガー）。内部「オプション」に背景モーションON/OFFトグル（localStorage保存）
- 背景アニメは `window.bgAnimation = { start, stop }` API経由で制御。デフォルトON
- About〜Contactリンクはスマホ含め常時バナー表示（画面幅に応じて gap/font-size を段階的に縮小）
- apple-touch-icon: `IRファビコン（白背景）.jpg` をルートに配置、`<link rel="apple-touch-icon">` で参照済み
- Aboutに履歴書ダウンロードボタン（`pdf/resume.pdf` を参照、PDF本体は未配置）
- 画像には loading="lazy" 付加済み（スキルアイコン・ワークカードサムネイル・スクリーンショット）
- Skillsカテゴリのホバーエフェクト削除済み（クリック不可のため）
- About: 学校、志望職種、受賞歴、資格、自己紹介文
- スクリーンショットは配列形式（screenshots: [...]）で複数枚対応
- スクリーンショットクリックでライトボックス拡大表示、複数枚時は左右矢印ナビ付きカルーセル（左右キー対応）
- Worksカードには1枚目のスクリーンショットをサムネイル表示（object-fit: contain）
- 背景ラインが画面内に1pxでも残っていれば消えない（先頭＋尾の両方が画面外で初めてリセット）
- ナビバーのリンク（About/Skills/Works/Contact）を画面中央に固定配置（position: absolute）
- 言語ボタン（JP/EN）の幅を40px固定で切替時のズレ解消
- Aboutテキスト部分に丸角（12px）の薄い背景（rgba白4%）を追加
- 自己紹介文を添削済み（実践重視のスタイル・3Dモデリング・実務経験を明確化）
- 作品情報の年表示を「制作年：20XX」形式に変更（英語時は「Year: 20XX」）
- 作品情報に開発環境を表示（「開発環境：」形式）
- 作品タグを整理（課題制作：個人、課題制作：チーム、個人制作）
- Contactリンクの幅固定（min-width: 180px）で言語切替時のズレ解消
- meta description / OGPタグ追加済み
- モバイル時の年表を縦ライン形式に変更（中央ライン、左に年号、右に吹き出し、タッチ対応）
- 作品カードのscroll-margin-top: 80px（ナビバーに隠れない）
- ダウンロード用ファイルを`games/`フォルダに格納（SandTetris.exe）
- Sand Tetrisの説明文を技術詳細込みの長文に刷新（セルオートマトン物理、最適化手法、AI協業方針）
- コンソールシューティングの説明文を刷新（制作経緯・ASCII描画方針・WriteConsoleOutputAダブルバッファ・ゲーム構成・AI協業方針）
- モーダル説明文の改行対応（white-space: pre-line）
- CIRCLESTRIKERのロゴをスクリーンショットとして追加
- ミニゲーム: ボス召喚スポナーを破壊可能化（HP30、プレイヤー弾・ボムでダメージ可、撃破・寿命いずれもアイテム/スコア無し）
- ミニゲーム: 弾数の難易度別スケーリング実装（DIFFに aimedCount / wayCount を追加、自機狙い 1/3/5/7 発、連射 3/5/7/9 発、way5・fan・ボスphase3way・大技1狙いは wayCount+2 or aimedCount+2）
- ミニゲーム: タイトルに「プラクティス」ボタン追加（道中13パターン＋ボス4種×6攻撃を個別練習）
- ミニゲーム: ESCでポーズ機能追加（本編・プラクティス両対応、再開／リスタート／タイトルへ戻るの3択。ランキング登録は経由しない）
- ミニゲーム: メニュー操作で `keydown` の自動リピート（`e.repeat`）を無視。長押しで決定が誤発火する不具合を回避
- ミニゲーム: プラクティス選択画面の十字キーを2Dグリッドナビゲーションに変更（`getBoundingClientRect` で方向最近傍を選ぶ）
- ミニゲーム: プラクティスの初期Powerは道中=1（MIN_POWER）／ボス=4（MAX_POWER）
- スマホ／狭い画面（max-width: 768px）でのヒーロー名前を `clamp(2.2rem, 8.5vw, 3.6rem)` で拡大

## 作品一覧（workData）表示順：新しい順
| ID | タイトル | 年 | タグ | 開発環境 | 動画 | SS | DL |
|----|---------|-----|------|----------|------|----|----|
| sand-tetris | Sand Tetris | 2026 | C++, 個人制作 | VS / Claude Code Pro | - | ✅ | ✅（games/） |
| console-shooter | コンソールシューティング | 2026 | C++, 個人制作 | VS / Claude Code Pro | - | ✅ | - |
| regamma | RE:GAMMA | 2026 | C++, DirectX, リメイク, 個人制作 | VS / DX11 / Claude Code Pro | - | - | - |
| gamma | GAMMA | 2025 | C++, DirectX, 課題制作：チーム | VS / DX11 | ✅ | ✅ | - |
| circlestriker | CIRCLESTRIKER | 2024 | Unity, C#, 課題制作：個人 | Unity / VS Code | - | ✅ | - |
| touhou | 東方春三校 | 2024 | Unity, 課題制作：個人 | Unity / VS Code | - | ✅ | - |

※ RE:GAMMAは製作中のため非表示（HTMLコメントアウト）

## 隠しミニゲーム（東方風シューティング）
- フッターの START ボタンから起動
- HTML5 Canvas + JavaScript（640x480、4:3、東方原作スタイルのフィールド+HUD）
- 構成: js/game.js, js/game-firebase.js, css/game.css, assets/game/（スプライト素材）
- Firebase Firestore によるオンラインランキング（localStorage ミラー＋フォールバック付き）
  - 送信: Firebase成否に関わらず常にlocalStorageにもミラー保存
  - 取得: `where('difficulty','==',x)` のみでFirestoreから取得し、score降順ソート・件数制限はクライアント側で実施（複合インデックス不要）。結果にlocal側の直近送信分を name+score キーで重複除去マージ
  - Firebase読込/書込失敗は `console.error('[Ranking] ...')` で可視化
- 4難易度（Easy/Normal/Hard/Lunatic）。ボスHPは固定600（難易度非依存）、変化するのは弾幕密度（bullets）、速度（speed）、自機狙い弾数（aimedCount: 1/3/5/7）、連射弾数（wayCount: 3/5/7/9）
- 難易度配色: Easy=緑 #44ff44 / Normal=青 #44aaff / Hard=赤 #ff4444 / Lunatic=紫 #c466ff。難易度選択ボタン・ランキングタブ・HUDのSTAGE表示すべてで共通（JS側 `DIFF_COLORS` も同値）
- ランキング画面レイアウト: 難易度タブを左に縦並び（`.ranking-body` flex 内、tabs幅84px）、右にスコアリストを表示。Back/Retry/Title などのボタンは `.ranking-body` の下に `text-align: right` で右下配置
- モバイル対応（スライドパッド + BOMB/SLOWボタン、自動発射、キャンバス直下・詳細情報の上に配置）。表示条件は `@media (hover: none) and (pointer: coarse)` のタッチ端末のみ（PCで窓を狭めても出ない）
- HUD英語表記: HI SCORE, SCORE, PLAYER, BOMB, POWER, GRAZE, STAGE
- ゲーム情報レイアウト（2カラム grid）:
  - 左: 操作方法 / 制作年 / 開発環境 / 使用素材
  - 右: スクリーンショット（4:3 枠、現状は「準備中…」プレースホルダ）/ 概要
- `.game-body` の padding-top を 56px に拡大し、ウィンドウ幅が細い時に右上の閉じる×ボタンが canvas（HUD領域）と重ならないように調整済み（モバイル時も padding-top: 56px を維持）

### 自機
- 低速移動時の集中ショット、アイテム引き寄せ（本家準拠挙動）
- 当たり判定はPLAYER_HITBOX=2（中央の赤い丸のみ）
- 残機: 初期3、0で被弾→ゲームオーバー
- ボム: 初期2、被弾時に初期値(2)にリセッ���（多く持ってても失う、0でも2に戻る）

### ボム（夢想封印）
- 6個の虹色オーブが放射状に散開→最寄りの敵を追尾→到達で爆発
- 3フェーズ: spread（散らばり減速）→ homing（追尾旋回）→ explode）
- オーブ半径60px、爆発時の弾消し範囲140px（弾消しは範囲内、ダメージは画面内全敵に作用）
- 雑魚ダメージ: 8/オーブ × 6 = 累計48（小型・中型は確殺、大型HP50は生存＝大型はボム単発で倒せない）
- ボスダメージ: 18/オーブ × 6 = 累計108（固定値、難易度非依存）
- 移動中も触れた敵弾を消去（弾消しエフェクト付き、オーブ径が大きいので接触範囲も広い）
- ボム中プレイヤー無敵（180F）
- 発動時にアイテム全回収

### 敵・弾幕
- 弾幕パターン: down, way3, way5, circle, aimed, diagonal, random, spread, cross, fan, split, turretDual
- cross=十字4方向+自機狙い(aimedCount発)、fan=下向き広角扇(wayCount+2発)、split=左右平行ストリーム+真下
- 難易度別の弾数スケーリング（`DIFF.aimedCount` / `DIFF.wayCount`）:
  - 自機狙い (aimed, cross のaimed部分, spawnerRing のaimed部分, ボス phase0/phase3): Easy=1 / Normal=3 / Hard=5 / Lunatic=7
  - 連射系 (down, way3): Easy=3 / Normal=5 / Hard=7 / Lunatic=9
  - way5, fan, ボス phase3 の way部分: wayCount+2 (Easy=5 / Normal=7 / Hard=9 / Lunatic=11)
  - turretDual の自機狙い扇: aimedCount+2 (Easy=3 / Normal=5 / Hard=7 / Lunatic=9)
  - Easy で aimed=1 のとき単発、それ以外は扇形で発射（弾数増加に応じて spread を広げる）
- diagonal / random / split / spread / circle は従来通り（パターン構造維持 or `diff.bullets` 倍率依存）
- 中型は中弾、大型は大弾を放つ（bulletType=medium/large、サイズ自動切替）
- 小型HP=1、中型HP=15、大型HP=50（中型・大型のHPバー非表示）
- 敵弾の当たり判定は見た目の40%（中央の白い部分のみ）
- 星弾は常時ゆっくり回転（frame*0.04 + 個別spin）、見た目サイズは b.size*3（大型化）、ボスPhase1の全方位回転星弾も同仕様
- 星弾スプライト: `bullet_star.png`（288x32, 32x32×9色）を使用。切り出しは 32x32 で他の16x16系と異なるので注意
- 氷弾・楔弾は進行方向に回転（`Math.atan2(vy, vx) + π/2`）、氷弾・札弾スプライトは 144x16（16x16×9色）
- スプライト素材: 弾（小・中・大・星・楔・氷・札）、ボス魔法陣、弾消去エフェクト、ボスHPバー

### 敵出現パターン（Wave Script）
- 最大3パターン同時出現
- 1面（stage 0）から mediumEscort / largeTank も基本プールに含まれ、中型・大型が登場
- formation: 横断隊列（7-11体、`spawnDriftFormation`）
- topAimed/topAimedHeavy: 上部停止→自機狙い一斉射撃→退場
- mediumEscort: 中型1+小型5の護衛編成
- largeTank: 大型1+小型3
- dualTurret: 画面上部左右に大型2体固定、自機狙い全方位(中弾)+回転全方位(大弾、左右逆回転)
- invertedU_L / invertedU_R: 片側の下から∩を描いて反対側へ抜ける（6-7体、小弾、L=左→右 / R=右→左）
- sCurve_L / sCurve_R: 片側の上から正弦波S字で降下（7-9体、自機狙い、L=左から / R=右から）
- zCurve_L / zCurve_R: 片側の上からジグザグZ字で降下（7-9体、下向き、L=左から / R=右から）
- 被弾時Power扇状ばらまき（画面内に収まる）、敵撃破アイテム真上→自由落下
- 回収エリア（画面上部）のアイテム引き寄せ速度=12
- Powerアイテム出率: 小型 powerS 35%（稀に powerS+scoreS 両方）、中型 powerS×2 必ず＋power 50%、大型 power×2 + powerS×4 を必ずドロップ

### ボス
- Wave終了後に出現。道中拡大済み（eventCount 14-22、間隔360F、padding 300F）
- ボス種類4種（出現毎にランダム選択）: 星弾（赤）/楔弾（紫）/氷弾（水色）/札弾（金）。本体色・弾スプライトが切り替わる
- 星弾ボスの弾は `pushBossBullet` 内で vx/vy を 0.8倍して少し減速
- 氷弾ボスの弾は 9色からランダム選択され虹色弾幕に
- HPバー: `boss_hpbar.png` をクリップして残HP分だけ表示。12時からCW方向に視覚的に削れる。欠け部分も薄く表示。HP残量で色変化: 赤→橙→黄
- HPバー着色はオフスクリーン canvas 上で `source-atop` を適用してから本体 ctx に描画（clip 領域内の他描画へ漏れるのを防止）
- 魔法陣: 射撃中のみボス背面に拡大表示（通常4.8倍、大技5.8倍）。大技中は逆回転の二重魔法陣
- 通常4フェーズ（360Fで循環）
  - Phase 0: 自機狙い扇 (aimedCount発) + sine移動
  - Phase 1: 全方位回転2層（逆回転、弾は大型化） + 中央固定
  - Phase 2: ランダム散らし + dashワープ移動
  - Phase 3: way (wayCount+2発) + 自機狙い (aimedCount発) + figure-8移動
- 大技（スペルカード）2種: HP70%で大技1（中央固定、逆回転2層リング＋自機狙いバースト aimedCount+2発）、HP35%で大技2（ワープ移動＋放射爆発＋回転リング＋自機狙い aimedCount発）。発動時は画面の敵弾を一掃＋光波紋エフェクト、約9秒持続
- スポナー召喚: 定期的（15-18秒間隔）にボスが2体のスポナーを召喚。白い大弾＋小さい魔法陣で表示、**破壊可能**（HP30、HPバー非表示）。寿命約12秒で自然消滅。ボスと同じ弾種でリング弾幕＋自機狙い(aimedCount発)を発射。破壊・寿命消滅いずれの場合もアイテム・スコアを落とさず消えるだけ。ボス撃破で自動除去
- スポナーの白い大弾は `bullet_large.png` の中央 64x64 を切り抜き正方形で描画し、魔法陣と視覚中心が一致するよう調整
- sine/hover敵はフィールド内にクランプ（画面端の出入り防止）

### ポーズ
- ゲーム中（本編／プラクティス問わず）に `Escape` でポーズ画面を表示
- ボタン: 「ゲームに戻る」「リスタート」「タイトルに戻る」
- ポーズ中は `cancelAnimationFrame` でゲームループを停止（弾・敵が完全停止）。`keys`/`mobileKeys` は復帰時の暴走防止のためクリア
- リスタート: 本編は `startGame()`、プラクティスは `startPractice(practicePatternKey)` を呼び直す
- タイトルへ戻った場合 `gameOver` を経由しないため、現在のスコアはランキングに登録されない（`startGame`/`resetGame` で score=0 にリセットされる）

### プラクティスモード
- タイトル → 「プラクティス」ボタンから入る
- 上部に難易度切替（Easy/Normal/Hard/Lunatic、デフォルトは現在の `diffKey` か Normal）
- 道中パターン11種（列1〜11、`executeWaveEvent` のキー: topAimed/topAimedHeavy/mediumEscort/largeTank/dualTurret/invertedUL/invertedUR/sCurveL/sCurveR/zCurveL/zCurveR）
- ボス4種（A=星弾/B=楔弾/C=氷弾/D=札弾）× 6攻撃（攻撃1〜4=phase0〜3、大技1〜2=spell0〜1）
- 仕様: ライフ1・ボム0、被弾即終了、敵ドロップ無し、スポナー召喚無効、ボススペル/フェーズは固定（HPでの自動遷移なし、スペルは時間で自動ループ）
- 初期Power: 道中=MIN_POWER（Lv1）／ボス=MAX_POWER（Lv4）
- 終了条件: 道中=敵が全消滅（撃破 or 画面外退場） / ボス=HP0で撃破 / 共通=1ミスで失敗
- 結果画面: CLEAR（緑）/ MISS（赤）＋ 「リトライ」「パターン選択へ」「タイトルへ」
- 命名は仮（パターン名や本ボス名は今後決定）

### 音声（SE）
- assets/game/se_decide.mp3（決定音）、se_select.mp3（選択音）を使用
- 選択SE: 矢印キー移動、マウスホバー（直前と同じ項目では鳴らさない）、ランキングタブホバー
- 決定SE: Z/Enter/Escape、クリック全般（タイトルメニュー/難易度/ランキングタブ/リトライ/戻る/スコア送信/スキップ）
- キャンセルSE未対応（未用意）

## 未完了・予定
- プロフィール写真（現在プレースホルダー）
- 履歴書PDF本体の配置（`pdf/resume.pdf`）
- 各作品のPV動画追加
- 各作品のダウンロードURL追加
- ミニゲーム使用素材クレジット（現在 Coming Soon）
- ミニゲームの敵キャラ動作（途中）：出現パターン・移動挙動・弾幕密度などの調整継続中
