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
- Skills: C++, C#, JavaScript, Unity, HTML/CSS, Visual Studio, VS Code, Blender, Maya, MMD, PMXEditor, YMM4, AviUtl, Studio One 6
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
- モーダル説明文の改行対応（white-space: pre-line）
- CIRCLESTRIKERのロゴをスクリーンショットとして追加

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
- Firebase Firestore によるオンラインランキング（localStorage フォールバック付き）
- 4難易度（Easy/Normal/Hard/Lunatic）
- モバイル対応（タッチD-Pad + アクションボタン、キャンバス直下・詳細情報の上に配置）
- HUD英語表記: HI SCORE, SCORE, PLAYER, BOMB, POWER, GRAZE, STAGE
- ゲーム情報: 操作方法（方向キー/Z/X/Shift）→概要（制作経緯・東方春三校との差分）の順で表示

### 自機
- 低速移動時の集中ショット、アイテム引き寄せ（本家準拠挙動）
- 当たり判定はPLAYER_HITBOX=2（中央の赤い丸のみ）
- 残機: 初期3、0で被弾→ゲームオーバー
- ボム: 初期2、被弾時に初期値(2)にリセッ���（多く持ってても失う、0でも2に戻る）

### ボム（夢想封印）
- 6個の虹色オーブが放射状に散開→最寄りの敵を追尾→到達で爆発
- 3フェーズ: spread（散らばり減速）→ homing（追尾旋回）→ explode（範囲爆発）
- 爆発半径70px、40ダメージ、範囲内の敵弾全消去
- 移動中も触れた敵弾を消去（弾消しエフェクト付き）
- ボム中プレイヤ��無敵（180F）
- 発動時にアイテム全回収

### 敵・弾幕
- 弾幕パターン: down, way3, way5, circle, aimed, diagonal, random, spread, turretDual
- 小型HP=1、中型HP=15、大型HP=50（中型・大型のHPバー非表示）
- 敵弾の当たり判定は見た目の40%（中央の白い部分のみ）
- スプライト素材: 弾（小・中・大）、星弾（ボス全方位用）、ボス魔法陣、弾消去エフェクト

### 敵出現パターン（Wave Script）
- 最大3パターン同時出現
- streamL/streamR: 横断隊列（6-11体）
- crossStream: 左右同時横断（各5-8体）
- topAimed/topAimedHeavy: 上部停止→自機狙い一斉射撃→退場
- sineWave: サインウェーブ編隊（7-11体）
- mediumEscort: 中型1+小型5の護衛編成
- largeTank: 大型1+���型3
- dualTurret: 画面上部左右に大型2体固定、自機狙い全方位(中弾)+回転全方位(大弾、左右逆回転)
- massRush: 40体が5列で左右からランダム横断、全員自機狙い
- 被弾時Power扇状ばらまき（画面内に収まる）、敵撃破アイテム真上→自由落下
- 回収エリア（画面上部）のアイテム引き寄せ速度=12

### ボス
- Wave終了後に出現（bossInterval拡大済み）
- HPバー: ボス周囲の円形リング（12時始まり、時計回りに減少、HP残量で色変化: 赤→橙→黄）
- 魔法陣: 射撃中のみボス背面に表示、時計回り回転
- 3フェーズ攻撃: 自機狙い扇状(中弾)→全方位回転(星弾)→ランダム散らし(星弾)
- sine/hover敵はフィールド内にクランプ（画面端の出入り防止）

## 未完了・予定
- プロフィール写真（現在プレースホルダー）
- 各作品のPV動画追加
- 各作品のダウンロードURL追加
- ミニゲーム使用素材クレジット（現在 Coming Soon）
