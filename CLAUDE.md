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
- ファビコン（IR_favicon.png）、ナビバーロゴ（IR_favicon.png）
- Skills: C++, C#, DirectX, JavaScript, HTML, Unity, Unreal Engine, Visual Studio, VS Code, Blender, Maya, MMD, PMXEditor, AviUtl, YMM4, Studio One 6（ゲームプログラマー重要度順ソート済み）
- ナビバーメニュー：常時表示ドロップダウン（右上ハンバーガー）。内部「オプション」に背景モーションON/OFFトグル（localStorage保存）
- 背景アニメは `window.bgAnimation = { start, stop }` API経由で制御。デフォルトON
- About〜Contactリンクはスマホ含め常時バナー表示（画面幅に応じて gap/font-size を段階的に縮小）
- apple-touch-icon: `IR_favicon_white.jpg` をルートに配置、`<link rel="apple-touch-icon">` で参照済み
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
- ダウンロード用ファイルを`games/`フォルダに格納（SandTetris.zip / ConsoleSTG.zip）
- Sand Tetrisの説明文を技術詳細込みの長文に刷新（セルオートマトン物理、最適化手法、AI協業方針）
- ConsoleSTG（旧称：コンソールシューティング）の説明文を刷新（制作経緯・ASCII描画方針・WriteConsoleOutputAダブルバッファ・ゲーム構成・AI協業方針）
- ぺったんメイカー（2026, Unity/C#, 課題制作:チーム）追加: PV動画（`videos/PettanMaker_PV.mp4`）、スクリーンショット6枚（Title/ConceptArt/Logo/GamePlay/Sticker/Clear）、説明文（敵をシール化→からだに貼って効果発動でボス撃破、ステージごとに童話モチーフ、STAGE1=不思議の国のアリス／ハートの女王、HAL3年次チーム制作 NullPointerGames）
- 「制作中」タグ（`.tag-wip` 黄色ハイライト #ffb800）追加。`workData.tags` に `{ja:'制作中', en:'In Development'}` を含めると Works一覧・モーダル両方で黄色表示。モーダル側は `openModal` の tag レンダリングで `t.ja === '制作中'` を判定して `tag-wip` クラスを付与
- モーダル説明文の改行対応（white-space: pre-line）
- CIRCLESTRIKERのロゴをスクリーンショットとして追加
- ミニゲーム: ボス召喚スポナーを破壊可能化（HP30、プレイヤー弾・ボムでダメージ可、撃破・寿命いずれもアイテム/スコア無し）
- ミニゲーム: 弾数の難易度別スケーリング実装（DIFFに aimedCount / wayCount を追加、自機狙い 1/3/5/7 発、連射 3/5/7/9 発、way5・fan・ボスphase3way・大技1狙いは wayCount+2 or aimedCount+2）
- ミニゲーム: タイトルに「プラクティス」ボタン追加（道中11パターン＋ボス4種×6攻撃を個別練習）
- ミニゲーム: 道中パターンを 13 → 11 に整理（2体しか出ないパターン削除＋左右対称を別パターンに分割＋隊列名付与「滝／グミ撃ち／護衛編隊／重戦車隊／双砲台／弧月L,R／蛇行L,R／稲妻L,R」）
- ミニゲーム: ESCでポーズ機能追加（本編・プラクティス両対応。再開／リスタート／(プラクティス時のみ)パターン選択へ戻る／タイトルへの選択肢。ランキング登録は経由しない）
- ミニゲーム: メニュー操作で `keydown` の自動リピート（`e.repeat`）を無視。長押しで決定が誤発火する不具合を回避
- ミニゲーム: プラクティス選択画面の十字キーを2Dグリッドナビゲーションに変更（`getBoundingClientRect` で方向最近傍を選ぶ）。難易度ボタンも同じナビ対象に含める
- ミニゲーム: プラクティスの初期Powerは道中=1（MIN_POWER）／ボス=4（MAX_POWER）
- ミニゲーム: 弾幕スプライトを新素材（東方風弾幕素材 Ver.3）に全面差替え（small/wedge/ice/seal/small_star=16色16x16, star/large/medium=8色32x32, items=8種16x16）
- ミニゲーム: プレイヤー弾を「弾幕素材_プレイヤー」中段一番左の札型スプライトに差替え。札弾も進行方向に回転（氷弾と同じ）
- ミニゲーム: ボムを全面刷新（4秒滞在、wrap0.5秒→spread→homing、各オーブ敵1体に1ヒット制限、攻撃対象なし時は敵弾を追尾、敵弾消去はボム弾接触時のみ、反時計回り回転）。見た目はプレイヤーシート下部の虹色グロー画像（`bomb_orb.png`）使用
- ミニゲーム: 中型HP 15→30 / 大型HP 50→100 / dualTurret大型HP 40→80 に上方修正
- ミニゲーム: 被弾時アイテムドロップを 3段階挙動に修正（fan60F斜め発射→rise60F垂直浮上→fall重力落下）
- ミニゲーム: アイテムを `items.png` スプライト描画に統一（P/大P/点/大点/1UP/フルパワー対応）
- ミニゲーム: 1UP を本ボス撃破時に必ず1個ドロップ、残機上限を8に
- ミニゲーム: コンティニュー機能（1ゲーム中1回、ゲームオーバー時に Z=はい/X=いいえ）。「はい」で残機3・ボム2に復帰し、死亡位置にフルパワー×5 を出現。コンティニュー使用後はランキング登録不可（GO画面はリトライ／タイトルへのみ表示）
- ミニゲーム: 弾の当たり判定を本家準拠に調整（`bulletHitRadius` で type 別、丸弾 size×0.7／星・楔・氷・札 size×0.55／敵接触 size×0.5／ボス接触 size×0.55）
- ミニゲーム: 未実装弾種 17種（laser/small1/rice_w/kunai/shot/rice_b/small3/mini_mix/medium1/butterfly/knife/rice_large/huge/heart/arrow/fire_red_pink/fire_purple_yellow）を切り抜き、`assets/game/` に保存・座標表をCLAUDE.md に記録
- スマホ／狭い画面（max-width: 768px）でのヒーロー名前を `clamp(2.2rem, 8.5vw, 3.6rem)` で拡大
- About: 履歴書ダウンロードボタン削除（PDF配置の予定もキャンセル）
- Works: GAMMA+（2026, C++/DirectX/リメイク/個人制作）と RM Engine（2026, C++/DirectX/個人制作）を追加。両方とも開発環境は VS/DX11/Claude Code Pro、説明文は「準備中…」、スクリーンショット・動画なし
- ミニゲーム: ランキングのセキュリティ強化（`firestore.rules` でスキーマ・型・値域を縛り update/delete 禁止、`game-firebase.js` の `submitScore` でクライアント側にも値域バリデーション、`index.html` に Firebase App Check 用 SDK と `APP_CHECK_SITE_KEY` ゲート組込み）。Firebase Console 側の Rules 公開・App Check Site Key 設定はユーザ作業として残（未完了・予定セクションに記載）
- About: プロフィール写真追加（`images/profile.webp`、200×260枠、`object-fit: cover` + `object-position: center top` で上寄せクロップ、STARTボタン同等の `1px solid var(--accent)` 赤細枠付き）
- About: 志望職種に「ゲームシナリオライター」「エンジニア」を追記（表記: 「ゲームプログラマー、ゲームシナリオライター、エンジニア」）
- About: 資格欄の表記整理（J検 → 「情報検定（J検）」と正式名称＋通称併記、ビジネス文書実務検定試験 1級から「（文書部門・速度部門）」のカッコ削除）
- 全ファイル名を英字に統一（日本語ファイル名を完全廃止）: `IRファビコン.png` → `IR_favicon.png`、`IRファビコン（白背景）.jpg` → `IR_favicon_white.jpg`、`images/東方春三校_*.png` → `Touhou_*.webp`、`images/コンソールシューティング_*.png` → `ConsoleSTG_*.webp`。SNS/クローラのURLエンコード失敗リスクを排除
- 重い画像7枚をwebp化（合計約10.5MB → 約955KB、9割削減）: profile / PettanMaker_ConceptArt / CircleStrikerLogo / PettanMaker_Logo / Touhou_GamePlay / Touhou_Title / gamma_screenshot。profile.png は 400×520 にリサイズしてから webp 化
- OGPメタタグ強化: `og:image` を英字ファイル名 `IR_favicon.png` に差し替え、`twitter:card` を `summary` → `summary_large_image` に変更
- モーダル動画欄: 動画なし作品（`video.type === 'placeholder'`）でも `screenshots[0]` を `object-fit: contain` + 黒letterbox で表示（クラス `.work-detail-video-thumb`）。screenshots も無いときのみ「準備中…」表示
- ライトボックスの alt を動的生成: `buildSSAlt(idx)` で `作品名 - N枚目` (ja) / `作品名 - N/M` (en) を生成。`openModal` / `openLightbox` / `changeScreenshot` / `lightboxNav` 全経路で同期、`currentWorkTitle` を保持
- ミニゲーム: プラクティス選択画面で `.practice-btn` ホバー時に4個ぶん左の難易度ボタンが選択判定になっていたバグを修正。`getMenuItems()` は `.practice-diff-btn`(4個) + `.practice-btn` 結合順で返るのに `.practice-btn` 内ローカル idx をそのまま `hoverSelect` に渡していたのが原因。`hoverSelect(idx + diffCount)` に修正＋難易度ボタン側も `hoverSelect` でハイライト連動
- RM Engine: アイコン（赤丸ロゴ）/ ロゴ / エディタ4スクショ（Launcher / SceneView / UIView / GameView）追加。サムネはロゴ表示、`制作中` タグ付与
- RM Engine 紹介文を追加（コンセプト「このソフトひとつで何でも作れる」/ プラグイン拡張型 / ECS / 起動の軽さ / 自作物理 / 3D&2D両対応 / エディタタブ構成 / ImGui→独自GUI移行方針 / 周辺ツールのプラグイン化方針）
- GAMMA+ 紹介文を追加（2年次GAMMAの個人ブラッシュアップ、操作感改善・各種バグ修正・攻撃/被弾/演出エフェクト追加・STAGE/UI全面刷新）
- GAMMA 紹介文を追加（初のチーム制作、肺気胸からの復帰、リーダー補佐のTA（テクニカルアーティスト）役、デザイナー素材取り決め・UI制作・ストーリー構成、プログラマーとしてプレイヤー操作実装＋全体バグ修正、未受賞だが完走経験が以後のチーム制作観の土台に）
- 東方春三校 紹介文を追加（記念すべき1作目、東方Projectファン由来のジャンル選定、Unityビジュアルスクリプティング、原作準拠の比率/解像度/自機速度、意欲賞受賞）
- CIRCLESTRIKER 紹介文を追加（2作目、無双系から方向転換、ステージ全体回転による疑似横移動・透明壁による進行ライン固定、Unity-chan+公式ボイスでの世界観統一、構成力賞受賞経緯）
- ConsoleSTG（旧コンソールシューティング）に改名（日英共通）。新スクショ3枚（Title / StageSelect / GamePlay）に差し替え（webp化済み）、配布用 `games/ConsoleSTG.zip`（約89KB）追加。カード desc の「遊びごたえのある作品に仕上がった」を「全3ステージ構成のミニゲームとして1日で完成させた」に統合し自己評価表現を事実ベースに調整
- Sand Tetris: 配布形式を `SandTetris.exe` → `SandTetris.zip` に変更（`games/SandTetris.zip` 約20KB）。カード desc に「同色の砂がフィールド左壁から右壁まで連結したときにライン消去となる独自の消去ルールを持つ」の一文を追記（data-ja 属性と表示テキストの不整合を解消）
- RE:GAMMA を完全削除（GAMMA+ に統合済み）: `workData.regamma` 削除、HTML側のコメントアウト版 RE:GAMMA カード削除
- Works 並び順を更新: ぺったんメイカー / RM Engine / GAMMA+ / Sand Tetris / ConsoleSTG / GAMMA / CIRCLESTRIKER / 東方春三校（年表tooltipも同順）
- ミニゲーム: 難易度・出現パターン・ボムを東方準拠に調整。①難易度=`DIFF`に `fireRateMul` を追加し発射間隔（旧 `基準F / bullets`）を密度と分離→`基準F × fireRateMul`、Easy/Hard/Lunaticのカーブを引き直し（Normalは数値現状維持）。②出現パターン=`buildWaveScript` を振り付け型に改良（同時出現最大2かつ軽量のみ／重編成・砲台は単独スロットで連続禁止＋間隔確保／stage・難易度で重み付け／stage上限5でクランプ）。③ボム=`launchBombOrbs` 発動時に画面上の敵弾を全消去（緊急回避ボム準拠、以降はオーブが追撃掃討）

- ミニゲーム: 道中をプラクティスの11パターンのみに限定（`buildWaveScript` の lightPool から `formation`＝横断隊列を除外）。降下狙撃系を改修＝停止Y(targetY)をウェーブ共通にして横一列に揃え、`fireSnipeShot` で射撃を一新。滝(旧降下狙撃)=真下に20発スキマなく連射、グミ撃ち(旧重降下狙撃)=自機狙い1way×40発。いずれも撃ち終わったら無射撃でまっすぐ降りて退場。プラクティスのボタン名も「滝／グミ撃ち」に変更

- ミニゲーム: 自機・敵・ボスのキャラ描画をスプライト対応パイプラインに（東方寄せの素材差し替え準備）。`CHAR_SPRITES` 設定＋`drawCharSprite(img,cfg,cx,cy,targetW,targetH)` ヘルパーを追加し、`drawPlayer`/`drawEnemies`/`drawBoss`(本体)で「スプライトがあれば使用・無ければ従来の図形にフォールバック」。`loadSprite` の onerror で欠損時 null になる仕組みを利用し、PNGを `assets/game/` に置くだけで自動有効化（置くまでは図形のまま＝見た目不変、ただしDL試行で404がコンソールに出る）。配置すべきファイル: `player.png` / `enemy_small.png` / `enemy_medium.png` / `enemy_large.png` / `boss.png`。単一画像はそのまま（アスペクト比保持）、横並びアニメは `CHAR_SPRITES` の frameW/frames/animFps を素材に合わせて設定。サイズは player=drawW/drawH(px)、敵/ボス=drawScale(当たり半径 e.size/boss.size への倍率)で調整
- ミニゲーム: ボス弾幕を種別ごとに差別化（`fireBossBullets` を `boss.bulletKind` で分岐＝星=螺旋/回転、楔=高速自機狙い/横ウォール、氷=雪結晶対称/吹雪、札=隙間壁/格子）。共通ヘルパー `bossAimedFan`/`bossRing` を追加
- ミニゲーム: タイトルの「SHOOTING」を赤グロー＋白い芯の二段描画で視認性UP、「- Portfolio Mini Game -」サブ表記を削除
- ミニゲーム: 難易度選択画面に「戻る」ボタン追加（`#difficulty-back-btn`、クリックでタイトルへ。ESC/Xも従来通り対応）
- ミニゲーム: 効果音を多重再生対応（`playSE` を `cloneNode()` 方式に変更。選択SE連打で前の音が途切れず重なって鳴る）
- ミニゲーム: 弾の当たり判定を弾種ごとに微調整（楔弾 0.55→0.42＝中央の丸芯のみ・( 部分は判定なし、札弾 0.55→0.45＝グラフィックより気持ち小さめ。星弾/氷弾は 0.55 維持）
- ミニゲーム: ボスの瞬間移動バグ修正（figure8 移動＝攻撃4/phase3 を直接代入から lerp 追従に変更。フェーズ突入時やプラクティスのループで moveTimer=0 リセット時に中央へワープしていた不具合を解消）
- ミニゲーム: 滝パターン調整（弾速は元の 2.2×diff.speed、発射数 20、弾サイズ2.25）。弾同士の隙間が弾サイズの約0.75ぶんになるよう `shotInterval` を弾速追従で算出（`shotInterval = round(直径×1.75 / 弾速)`、Easy=9 / Normal=7 / Hard=6 / Lunatic=5）
- ミニゲーム: 滝を弾速グラデーション化＋難易度設計を変更。①難易度では敵数だけ増加（Easy=7/Normal=8/Hard=9/Lunatic=10）、弾数(20)・弾速・間隔は難易度非依存に。②弾速グラデーション＝各滝弾は等速だが発射順に弾速を `WF_V0`(1.5)→`WF_VMAX`(3.5) へ線形に上げる。後発の速い弾が先発の遅い弾を追い越し、プレイフィールド中央(y≈224)あたりで最後の弾が最初の弾を追い越す。間隔は重視せず `WF_INTERVAL`(3) 固定（追い越し位置を優先）
- ミニゲーム: 滝の弾速グラデーションを「加速方式」から「発射順の固定速度グラデーション」に変更。各弾は等速のまま発射順に WF_V0(1.5)→WF_VMAX(3.5) へ線形増速し、後発の速い弾が先発の遅い弾を追い越す。中央(y≈224)あたりで最後の弾が最初の弾を追い越すよう WF_INTERVAL=3 に調整（間隔は重視しない）。旧 accelY/vMaxY 加速ロジックは撤去
- ミニゲーム: 滝の弾速を倍に（WF_V0 1.5→3.0 / WF_VMAX 3.5→7.0）。倍速で追い越し位置が下にずれるため WF_INTERVAL を 3→2 に詰めて追い越しを中央〜やや下(y≈260)に維持
- ミニゲーム: グミ撃ち(topAimedHeavy)を全面刷新。中型9体固定（難易度非依存）。左右どちらかから順に上から出現して発射タイミングをずらし、退場降下は全員一斉(`descendAtAge`)。射撃を自機狙い7発バースト×3回(計21発)に変更し、各バーストは1発目で自機方向を固定（以降プレイヤーが動いても同じ向き、`burstAim`）。バースト内弾速は遅→速グラデーション(GM_V0 3.0→GM_VMAX 7.0、滝の旧グラデの2倍速相当・滝とは独立)。6発目で次バーストが始まる(`GUMMI_SCHEDULE`/`GUMMI_NEXT_BURST_AT`、バースト同士が1発ぶん重なる)。`fireGummiShot` 追加、旧 aimed(`fireSnipeShot` else分岐)は撤去

## 作品一覧（workData）表示順：新しい順（Works並び）
| ID | タイトル | 年 | タグ | 開発環境 | 動画 | SS | DL |
|----|---------|-----|------|----------|------|----|----|
| pettan-maker | ぺったんメイカー | 2026 | Unity, C#, 課題制作：チーム, 制作中 | Unity / VS | ✅ PV | ✅ 6枚 | - |
| rm-engine | RM Engine | 2026 | C++, DirectX, 個人制作, 制作中 | VS / DX11 / Claude Code Pro | - | ✅ 6枚 | - |
| gamma-plus | GAMMA+ | 2026 | C++, DirectX, リメイク, 個人制作 | VS / DX11 / Claude Code Pro | - | - | - |
| sand-tetris | Sand Tetris | 2026 | C++, 個人制作 | VS / Claude Code Pro | - | ✅ 2枚 | ✅ SandTetris.zip |
| console-shooter | ConsoleSTG | 2026 | C++, 個人制作 | VS / Claude Code Pro | - | ✅ 3枚 | ✅ ConsoleSTG.zip |
| gamma | GAMMA | 2025 | C++, DirectX, 課題制作：チーム | VS / DX11 | ✅ PV | ✅ 1枚 | - |
| circlestriker | CIRCLESTRIKER | 2024 | Unity, C#, 課題制作：個人 | Unity / VS Code | - | ✅ ロゴ | - |
| touhou | 東方春三校 | 2024 | Unity, 課題制作：個人 | Unity | - | ✅ 2枚 | - |

※ GAMMA+ はモーダル動画欄が「準備中…」になる（screenshots / video 未追加）。RM Engine は screenshots[0]=Logo がモーダル動画欄にも自動表示される

## 隠しミニゲーム（東方風シューティング）
- フッターの START ボタンから起動
- HTML5 Canvas + JavaScript（640x480、4:3、東方原作スタイルのフィールド+HUD）
- 構成: js/game.js, js/game-firebase.js, css/game.css, assets/game/（スプライト素材）
- Firebase Firestore によるオンラインランキング（localStorage ミラー＋フォールバック付き）
  - 送信: Firebase成否に関わらず常にlocalStorageにもミラー保存
  - 取得: `where('difficulty','==',x)` のみでFirestoreから取得し、score降順ソート・件数制限はクライアント側で実施（複合インデックス不要）。結果にlocal側の直近送信分を name+score キーで重複除去マージ
  - Firebase読込/書込失敗は `console.error('[Ranking] ...')` で可視化
  - セキュリティ: `firestore.rules` でスキーマ・型・値域（name 1-12文字 / score 0-99999999 int / difficulty ∈ {easy,normal,hard,lunatic} / date == request.time）を縛り、update/delete は全面禁止。クライアント側でも `submitScore` で同じ値域に丸める二重防御。Firebase App Check (reCAPTCHA v3) を index.html に組み込み済み（`APP_CHECK_SITE_KEY` が空の間は無効、Site Key を入れると自動有効化）
  - Firebase Web SDK の apiKey は Firebase の設計上「公開前提」（プロジェクト識別子であって認可キーではない）。隠すのではなく Security Rules + App Check で防御する方針
- 4難易度（Easy/Normal/Hard/Lunatic）。ボスHPは固定600（難易度非依存）。Normalを基準(=1.0)に東方準拠で再設計した `DIFF`：弾幕密度（bullets: 0.55/1.0/1.45/1.95）、発射間隔倍率（fireRateMul: 1.5/1.0/0.74/0.6 ＝ 小さいほど速射。発射間隔 = 基準F × fireRateMul）、弾速（speed: 0.82/1.0/1.18/1.35）、自機狙い弾数（aimedCount: 1/3/5/7）、連射弾数（wayCount: 3/5/7/9）。発射間隔は従来 `基準F / bullets` だったが、密度と発射頻度を分離するため `基準F × fireRateMul` に変更（Normalは数値上現状維持）
- 難易度配色: Easy=緑 #44ff44 / Normal=青 #44aaff / Hard=赤 #ff4444 / Lunatic=紫 #c466ff。難易度選択ボタン・ランキングタブ・HUDのSTAGE表示すべてで共通（JS側 `DIFF_COLORS` も同値）
- ランキング画面レイアウト: 難易度タブを左に縦並び（`.ranking-body` flex 内、tabs幅84px）、右にスコアリストを表示。Back/Retry/Title などのボタンは `.ranking-body` の下に `text-align: right` で右下配置
- ランキング表示件数: クリア後（`rankingFrom === 'gameover'`）は上位3名＋「その時の結果」（`lastResult` を保持、上位3外なら末尾に別行 `.rank-own-extra` で実順位付き追加、上位3内なら該当行を `.rank-own` でハイライト）。タイトルメニューからは上位10名。`loadRanking` が `rankingFrom`/`lastResult` を見て件数と自スコア表示を切替
- スマホ対応スクロール: `.game-canvas-wrap` の `overflow:hidden` で低い画面だと overlay 内がクリップされるため、`#game-ranking-screen` に `max-height:100% + overflow-y:auto`、`.practice-list` は従来どおり内部スクロール（両方 `-webkit-overflow-scrolling: touch`）
- モバイル対応（スライドパッド + BOMB/SLOWボタン、自動発射、キャンバス直下・詳細情報の上に配置）。表示条件は `@media (hover: none) and (pointer: coarse)` のタッチ端末のみ（PCで窓を狭めても出ない）
- HUD英語表記: HI SCORE, SCORE, PLAYER, BOMB, POWER, GRAZE, STAGE
- ゲーム情報レイアウト（2カラム grid）:
  - 左: 操作方法 / 制作年 / 開発環境 / 使用素材
  - 右: スクリーンショット（4:3 枠、現状は「準備中…」プレースホルダ）/ 概要
- `.game-body` の padding-top を 56px に拡大し、ウィンドウ幅が細い時に右上の閉じる×ボタンが canvas（HUD領域）と重ならないように調整済み（モバイル時も padding-top: 56px を維持）

### 自機
- 低速移動時の集中ショット、アイテム引き寄せ（本家準拠挙動）
- 自機両側にオプション（陰陽玉風オーブ）。永夜抄のホーミングアミュレット参照の追尾弾を発射（`fireOptionAmulets`→`pBullets` に `homing:true`、`updatePBullets` で最近接の敵/ボスへ旋回角 `HOMING_TURN`=0.13rad/F 制限で緩やかに追尾、速度 `HOMING_SPEED`=7.5、寿命 `HOMING_LIFE`=100F、発射間隔 `OPTION_INTERVAL`=10F）。追尾弾は半透明（drawPBullets で globalAlpha=0.5）で描画、ダメージは通常ショットの1/4（`dmg:0.25`、衝突は `e.hp -= (b.dmg||1)`）→ 弱すぎたため 1/2（`dmg:0.5`）に戻し。オプションは Power Lv3以上で2対(4基)・未満で1対(2基)。配置は `getOptionOffsets`：通常時は両側展開、低速時は前方に台形配置（前に2＝狭め前方/斜め後ろに2＝広め）。本ショット（`firePlayerShot`）は従来どおり別途発射。オプションの見た目は陰陽玉シート `assets/game/option_orb.png`（240x840, 7行×大小のユーザー素材）の最下段＝白黒(大) を `OPTION_ORB_SRC`(sx22,sy742,75x75) で切り出し16pxで描画、未ロード時は簡易オーブにフォールバック
- 当たり判定はPLAYER_HITBOX=2（中央の赤い丸のみ）
- 残機: 初期3 (`MAX_LIVES`)、上限8 (`LIFE_CAP`)。0で被弾→コンティニュー選択 or ゲームオーバー
- ボム: 初期2、被弾時に初期値(2)にリセット（多く持ってても失う、0でも2に戻る）
- 1UP は本ボス撃破で必ず1個ドロップ（取得で残機+1, 上限8）。フルパワーはコンティニュー時のみ出現（取得でPower=MAX_POWER）

### コンティニュー
- 1ゲーム中1回だけ、ゲームオーバー時に「コンティニューしますか？」を表示（state=`CONTINUE_PROMPT`、Z=はい / X=いいえ）
- 「はい」: `usedContinue=true`、`lives=MAX_LIVES (3)`、`bombs=MAX_BOMBS (2)`、死亡位置に**フルパワー×5** を `spawnDeathPowerItems` で発生して再開。Power はそのまま（フルパワー取得で MAX_POWER）
- 「いいえ」: 通常のゲームオーバー画面へ
- コンティニュー使用時はランキング登録不可。ゲームオーバー画面に「※ コンティニュー使用のためランキング登録不可」を表示し、名前入力欄／送信ボタン／送信せず戻るを全て非表示にして、代わりに「リトライ」「タイトルへ」のみ表示（Z=リトライ, X=タイトル）
- `usedContinue` は `resetGame()` でリセット

### ボム（夢想封印）
- 6個の虹色オーブを発射、画面に**4秒間（240F）**滞在し続ける
- 3フェーズ: wrap（30F=0.5秒、自機を纏うように追尾しつつ周回）→ spread（20F、放射状に広がる）→ homing（残り、追尾）
- 見た目は `assets/game/bomb_orb.png`（プレイヤーシート下部の虹色グロー、100x100）を使用。サイズは半径×3.2 で描画（旧 procedural と同等の大きさ）。常に**反時計回り**で回転（描画用 `spin` を毎フレーム減算 → `ctx.rotate`）。スプライト未ロード時は radial gradient 2層のフォールバック
- ホーミング: 攻撃対象（敵/ボス）優先、いない場合は敵弾を追尾
- **各オーブは敵1体に対し最大1回しかダメージ判定を持たない**（`hitRefs` で重複防止）。ヒット後はその場で減速し次ターゲットを探す
- 雑魚ダメージ: 8/接触、ボスダメージ: 18/接触（6オーブが全員ヒットすれば累計48 / 108、難易度非依存。中型HP30=4オーブ、大型HP100=ボム単発不可）
- **発動した瞬間に画面上の敵弾を全消去**（東方の緊急回避ボム準拠。`launchBombOrbs` 冒頭で `eBullets` を全 `spawnDeleteEffect`＋score加算してクリア）。その後の新規弾は虹色オーブが追撃で掃討
- 発動後に新たに撃たれた敵弾の消去は、ボム弾と直接接触したときのみ（爆発による範囲消去は廃止）
- 画面端で軽くバウンドして留まる
- ボム中プレイヤー無敵（240F、bomb残時間と同じ）
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
- 小型HP=2.5、中型HP=15、大型HP=50、dualTurret大型HP=75、スポナーHP=40、ボスHP=600固定（中型・大型のHPバー非表示）。プレイヤー通常ショット=1ダメージ/発、追尾弾=0.5、ボム=雑魚8/ボス18（1接触）
- 敵弾の当たり判定は本家準拠の `bulletHitRadius(b)`：丸弾(small/medium/large) `b.size*0.7`、星弾 `b.size*0.55`（中央コアのみ＝先端は判定なし）、氷弾 `b.size*0.55`、楔弾 `b.size*0.42`（中央の丸い芯のみ＝外側の ( 部分は判定なし）、札弾 `b.size*0.45`（グラフィックより気持ち小さめ）。敵接触は `e.size*0.5`、ボス接触は `boss.size*0.55`
- 星弾は常時ゆっくり回転（frame*0.04 + 個別spin）、見た目サイズは b.size*3（大型化）、ボスPhase1の全方位回転星弾も同仕様
- 弾スプライトは新素材（東方風弾幕素材 Ver.3）を使用。色 index 0 始まり：
  - 16x16 系（`bullet_small/wedge/ice/seal/small_star`）: 256x16, 16色（0=灰, 1=赤橙, 2=赤, 3=桃, 4=紫, 5=青紫, 6=青, 7=水, 8=淡水, 9=緑, 10=淡緑, 11=黄緑, 12=黄, 13=黃橙, 14=橙, 15=灰）
  - 32x32 系（`bullet_star/large/medium`）: 256x32, 8色（0=灰, 1=赤, 2=紫, 3=青, 4=水, 5=緑, 6=黃, 7=白）
  - `BOSS_ACCENT_COL` = { star: 1, wedge: 4, ice: 8, seal: 12 }
- 切り抜き済みだが未実装の弾種（`assets/game/` に配置、使用時に `loadSprite` + `drawEBullets` 分岐を追加）：
  | ファイル | 元シート行 | サイズ | 色/フレーム数 | 用途メモ |
  |----------|-----------|--------|--------------|----------|
  | `bullet_laser.png` | ①row 0 | 256x16 | 16色 | レーザー本体。先端と末尾を `bullet_small.png` (小弾2 同色) で塞いで尖らせる |
  | `bullet_small1.png` | ①row 2 | 256x16 | 16色 | 小弾1（小弾2より太め） |
  | `bullet_rice_white.png` | ①row 4 | 256x16 | 16色 | 米弾（白縁） |
  | `bullet_kunai.png` | ①row 5 | 256x16 | 16色 | クナイ弾。進行方向回転推奨 |
  | `bullet_shot.png` | ①row 8 | 256x16 | 16色 | ショット弾 |
  | `bullet_rice_black.png` | ①row 9 | 256x16 | 16色 | 米弾（黒縁） |
  | `bullet_small3.png` | ①row 11 | 256x16 | 16色 | 小弾3 |
  | `bullet_mini_mix.png` | ①row 12 | 256x16 | 混在 | 胞子弾／ミニ弾／銭弾（同行内に種類混在、8x8系） |
  | `bullet_medium1.png` | ①rows 13-14 | 256x32 | 8色 | 中弾1（②row 5 と同等） |
  | `bullet_butterfly.png` | ②row 2 | 256x32 | 8色 | 蝶弾 |
  | `bullet_knife.png` | ②row 3 | 256x32 | 8色 | ナイフ弾 |
  | `bullet_rice_large.png` | ②row 4 | 256x32 | 8色 | 大米弾（白） |
  | `bullet_huge.png` | ②rows 6-7 | 256x64 | 4色 | 特大弾（64x64セル）。爆発系の大技などに |
  | `bullet_heart.png` | ③row 0 | 256x32 | 8色 | ハート弾 |
  | `bullet_arrow.png` | ③row 1 | 256x32 | 8色 | 矢弾 |
  | `bullet_fire_red_pink.png` | ③row 4 | 256x32 | 4F赤+4Fピンク | 炎弾アニメ。仮 6F/コマ で使用予定 |
  | `bullet_fire_purple_yellow.png` | ③row 5 | 256x32 | 4F紫+4F黃 | 炎弾アニメ |
  - 未使用: ①row 15（使わない弾）、③ items行の col 4(黒星)/6(S星)、③row 4(UFO)、③rows 6-7(ダイヤ/ぎざぎざ)
- その他切り抜き予備: `nc402378_霊夢の陰陽玉2.png`（自機オプション用、240x840）、`nc10263_警告音.wav`（警告音）も `シューティング素材/` 内に保管。実装時に移動
- 氷弾・楔弾・札弾は進行方向に回転（`Math.atan2(vy, vx) + π/2`）。氷弾はランダム16色で発射
- プレイヤー弾はプレイヤースプライト（中段一番左の小さな札型）を `bullet_player_main.png` として切り出して使用
- アイテムスプライトは `assets/game/items.png` (256x16, 16x16セル) を使用。`ITEM_SPRITE_COL`: powerS=0(P), scoreS=1(点), power=2(大P), score=3(大点), life=5(1UP), fullpower=7(F)。col 4(黒星) / 6(S星) / 右の▲・UFOは未使用
- ボス級撃破時は `life` を必ず1個ドロップ（+ ボム1個、score×5、scoreS×10、power×3）
- スプライト素材: 弾（小・中・大・星・楔・氷・札）、ボス魔法陣、弾消去エフェクト、ボスHPバー

### 敵出現パターン（Wave Script）
- ウェーブ生成（`buildWaveScript`）は「振り付け」型に改良：同時出現は最大2かつ両方とも軽量パターンのときのみ。重編成（mediumEscort/largeTank/topAimedHeavy）と砲台（dualTurret）は必ず単独スロットで、連続させず直後に長めの間隔を取る。使えるパターンと出現確率は stage（ループ回数）と難易度で重み付け。ループ毎の難易度上昇（stage）は上限5でクランプ（無限上昇による破綻を防止）
- 1面（stage 0）から mediumEscort / largeTank も基本プールに含まれ、中型・大型が登場
- formation: 横断隊列（7-11体、`spawnDriftFormation`）
- topAimed=滝: 上部に降下→停止位置(targetY)はウェーブ共通で横一列に揃う→規定数だけ射撃→撃ち終わったら `descendDelay`(165F≒2.75秒)待機後に無射撃でまっすぐ降りて退場。弾は小弾（素材①の丸弾, bulletType:'small', size2.25）。均等配置・真下に各20発連射。敵数だけ難易度で増加（Easy=7 / Normal=8 / Hard=9 / Lunatic=10、`executeWaveEvent` の topAimed で `7 + diffW`）。弾数・弾速・間隔は難易度非依存。弾速グラデーション＝発射順に弾速を `WF_V0`(3.0, 最初/最遅) → `WF_VMAX`(7.0, 最後/最速) へ線形に上げる（各弾は等速）。後発の速い弾が先発の遅い弾を追い越し、プレイフィールド中央〜やや下(y≈260)あたりで最後の弾が最初の弾を追い越す。発射間隔 `WF_INTERVAL`(2) 固定（間隔は重視せず追い越し位置優先）。色はウェーブごとに1色だけ抽選し全弾同色（`spawnTopAimedWave` で `snipeColor=Math.random*16` を決め `fireSnipeShot` が使用）
- topAimedHeavy=グミ撃ち: 中型9体固定（難易度非依存）。左右どちらか(`fromLeft`)から順に上から出現して発射タイミングをずらし、退場(降下)は全員同じ `descendAtAge` で一斉。自機狙い**7発バースト×3回**（計21発）。各バーストは1発目(shot===0)で自機方向を捕捉し以降プレイヤーが動いても同じ向きで撃つ（`burstAim[burst]`）。バースト内は弾速が遅→速グラデーション（`GM_V0`3.0→`GM_VMAX`7.0、滝とは独立した固定値）。**6発目(index5)が撃たれた時に次バーストが始まる**（`GUMMI_NEXT_BURST_AT`=5×`GUMMI_SHOT_INT`、バースト同士が1発ぶん重なる）。発射スケジュールは `GUMMI_SCHEDULE`（21エントリ t順ソート、最大t=80）を `burstTimer`/`schedIdx` で消化。色 index1（赤）, 弾 size2.25。`GUMMI_STAGGER`=12 で出現間隔
- mediumEscort=護衛編隊: 中型1+小型5の護衛編成
- largeTank=重戦車隊: 大型1+小型3
- dualTurret=双砲台: 画面上部左右に大型2体固定、自機狙い全方位(中弾)+回転全方位(大弾、左右逆回転)
- invertedUL/UR=弧月L/R: 片側の下から∩を描いて反対側へ抜ける（6-7体、小弾、L=左→右 / R=右→左）
- sCurveL/R=蛇行L/R: 片側の上から正弦波S字で降下（7-9体、自機狙い、L=左から / R=右から）
- zCurveL/R=稲妻L/R: 片側の上からジグザグZ字で降下（7-9体、下向き、L=左から / R=右から）
- 被弾時Powerばらまき: fan(60F、約120°斜めに発射 spd=3〜4) → rise(60F、vx=0/vy=-1.5で垂直浮上) → fall(重力 vy+=0.1, 終端3) の3段階。`spawnDeathPowerItems` が `deathPhase` を付けて `updateItems` 側で分岐
- 敵撃破アイテムは真上に飛んでから通常の自由落下
- 回収エリア（画面上部）のアイテム引き寄せ速度=12
- Powerアイテム出率: 小型 powerS 45%（＋10%で powerS+scoreS 両方＝powerS入り計55%）、中型 powerS×2 必ず＋power 50%、大型 power×2 + powerS×4 を必ずドロップ

### ボス
- Wave終了後に出現。道中拡大済み（eventCount 14-22、間隔360F、padding 300F）
- ボス種類4種（出現毎にランダム選択）: 星弾（赤）/楔弾（紫）/氷弾（水色）/札弾（金）。本体色・弾スプライトに加え、**弾幕の撃ち方そのものが種別で異なる**（`fireBossBullets` が `boss.bulletKind` で `fireBossStar/Wedge/Ice/Seal` に分岐。共通ヘルパー `bossAimedFan`/`bossRing`）。移動モード(sine/center/dash/figure8)とスペルカードは全種共通
- 星弾ボスの弾は `pushBossBullet` 内で vx/vy を 0.8倍して少し減速
- 氷弾ボスの弾は 9色からランダム選択され虹色弾幕に
- HPバー: `boss_hpbar.png` をクリップして残HP分だけ表示。12時からCW方向に視覚的に削れる。欠け部分も薄く表示。HP残量で色変化: 赤→橙→黄
- HPバー着色はオフスクリーン canvas 上で `source-atop` を適用してから本体 ctx に描画（clip 領域内の他描画へ漏れるのを防止）
- 魔法陣: 射撃中のみボス背面に拡大表示（通常4.8倍、大技5.8倍）。大技中は逆回転の二重魔法陣
- 通常4フェーズ（360Fで循環。移動は phase で sine/center/dash/figure8）。各フェーズの弾幕は種別ごとに性格が異なる:
  - 星弾: 多腕スパイラル / 全方位2層逆回転 / 自機狙い扇＋螺旋オーブ / 大型全方位リングのパルス
  - 楔弾: 細く速い自機狙いストリーム / 左右交互の横ウォール / 回転十字＋自機狙い / 超高速自機狙いバースト
  - 氷弾: 6方向×2層の雪結晶 / 吹雪ランダム散布 / 密な全方位リング / 自機狙い＋左右対称扇
  - 札弾: 隙間付きの落下ウォール / 回転リング＋自機狙い / 揺れる縦格子 / 自機狙い扇＋逆回転リング
- 大技（スペルカード）2種: HP70%で大技1（中央固定、逆回転2層リング＋自機狙いバースト aimedCount+2発）、HP35%で大技2（ワープ移動＋放射爆発＋回転リング＋自機狙い aimedCount発）。発動時は画面の敵弾を一掃＋光波紋エフェクト、約9秒持続。**スペル発動中はボスへの被ダメージを×0.5に軽減**（撃ち切り即終了を防ぎ、高パワーでもスペル弾幕が見られるように。通常ショット・ボム両方に適用）
- スポナー召喚: 定期的（15-18秒間隔）にボスが2体のスポナーを召喚。白い大弾＋小さい魔法陣で表示、**破壊可能**（HP40、HPバー非表示）。寿命約12秒で自然消滅。ボスと同じ弾種でリング弾幕＋自機狙い(aimedCount発)を発射。破壊・寿命消滅いずれの場合もアイテム・スコアを落とさず消えるだけ。ボス撃破で自動除去
- スポナーの白い大弾は `bullet_large.png` の col=7 (32x32, 白) を切り抜き正方形で描画し、魔法陣と視覚中心が一致するよう調整
- sine/hover敵はフィールド内にクランプ（画面端の出入り防止）

### ポーズ
- ゲーム中（本編／プラクティス問わず）に `Escape` でポーズ画面を表示
- ボタン: 「ゲームに戻る」「リスタート」「(プラクティス時のみ)パターン選択へ戻る」「タイトルに戻る」
- ポーズ中は `cancelAnimationFrame` でゲームループを停止（弾・敵が完全停止）。`keys`/`mobileKeys` は復帰時の暴走防止のためクリア
- リスタート: 本編は `startGame()`、プラクティスは `startPractice(practicePatternKey)` を呼び直す
- タイトルへ戻った場合 `gameOver` を経由しないため、現在のスコアはランキングに登録されない（`startGame`/`resetGame` で score=0 にリセットされる）

### プラクティスモード
- タイトル → 「プラクティス」ボタンから入る
- 上部に難易度切替（Easy/Normal/Hard/Lunatic、デフォルトは現在の `diffKey` か Normal）
- 道中パターン11種（プラクティスは隊列名で表示。`executeWaveEvent` のキー: topAimed=滝/topAimedHeavy=グミ撃ち/mediumEscort=護衛編隊/largeTank=重戦車隊/dualTurret=双砲台/invertedUL=弧月L/invertedUR=弧月R/sCurveL=蛇行L/sCurveR=蛇行R/zCurveL=稲妻L/zCurveR=稲妻R）
- ボス4種（A=星弾/B=楔弾/C=氷弾/D=札弾）× 6攻撃（攻撃1〜4=phase0〜3、大技1〜2=spell0〜1）
- 仕様: ライフ1・ボム0、被弾即終了、敵ドロップ無し、スポナー召喚無効、ボススペル/フェーズは固定（HPでの自動遷移なし、スペルは時間で自動ループ）
- 初期Power: 道中=MIN_POWER（Lv1）／ボス=MAX_POWER（Lv4）
- 終了条件: 道中=敵が全消滅（撃破 or 画面外退場） / ボス=HP0で撃破 / 共通=1ミスで失敗
- 結果画面: CLEAR（緑）/ MISS（赤）＋ 「リトライ」「パターン選択へ」「タイトルへ」
- 命名は仮（パターン名や本ボス名は今後決定）

### 音声（SE）
- assets/game/se_decide.mp3（決定音）、se_select.mp3（選択音）を使用
- `playSE` は `cloneNode()` で都度新しいインスタンスを再生 → 同じSEが連続/重複しても前の音が途切れず重なって鳴る
- 選択SE: 矢印キー移動、マウスホバー（直前と同じ項目では鳴らさない）、ランキングタブホバー
- 決定SE: Z/Enter/Escape、クリック全般（タイトルメニュー/難易度/ランキングタブ/リトライ/戻る/スコア送信/スキップ）
- キャンセルSE未対応（未用意）

## 未完了・予定
- PV動画追加: RM Engine / GAMMA+ / Sand Tetris / ConsoleSTG / CIRCLESTRIKER / 東方春三校（現状は静止画のみ。ぺったんメイカー・GAMMA は追加済み）
- 配布物追加: ぺったんメイカー / GAMMA+ / RM Engine（Sand Tetris と ConsoleSTG は zip 配布済み）
- GAMMA+ のスクリーンショット追加（紹介文は完了、現状はモーダル動画欄が「準備中…」表示）
- ミニゲーム使用素材クレジット（現在 Coming Soon）
- ミニゲームの敵キャラ動作（途中）：出現パターン・移動挙動・弾幕密度などの調整継続中
- ミニゲームの自機・敵・ボスのキャラ素材（東方寄せ）：スプライト描画パイプラインは実装済み。`assets/game/` に `player.png` / `enemy_small.png` / `enemy_medium.png` / `enemy_large.png` / `boss.png` を配置すれば自動でスプライト表示に切替（未配置の間は図形フォールバック）。版権フリーのSTGドット素材 or 東方キャラ素材を入手して差し替え予定
- Firebase Console 側の手動作業:
  - Firestore Database → ルール画面に `firestore.rules` の内容を貼り付けて公開
  - App Check 設定（reCAPTCHA v3 サイトキー取得 → `index.html` の `APP_CHECK_SITE_KEY` に設定 → Firebase Console で reCAPTCHA シークレット登録 → APIs タブで Cloud Firestore を Monitor → 問題なければ Enforce）
