# ポートフォリオサイト - CLAUDE.md

## プロジェクト概要
- 色川陸登（HAL東京 ゲーム4年制学科 プログラマーコース）の就職用ポートフォリオ
- GitHub Pages: https://irokawarikuto.github.io/
- リポジトリ: https://github.com/IrokawaRikuto/IrokawaRikuto.github.io
- 構成: HTML/CSS/JS のみ（フレームワークなし）

## 完了済み
- ダークテーマ（紫アクセント #6c63ff）のデザイン
- セクション: Hero, About, Skills, Works（6作品・2列グリッド）, Timeline, Contact, Footer
- 言語切り替え（JP/EN）: data-ja/data-en属性方式
- 作品クリックでモーダル表示（動画/スクリーンショット/説明/タグ/受賞/DLリンク対応）
- モーダル閉じたとき動画停止
- メール送信フォーム（FormSubmit.co, IRcola777@gmail.com）
- 背景アニメーション（青い直線の棒が画面を横断、近未来風）
- スクロールフェードインアニメーション（IntersectionObserver）
- ハンバーガーメニュー（モバイル）
- トップに戻るボタン（右下、スクロールで出現）
- スクロールバー非表示（ガタつき防止）
- Skills: C++, C#, Unity, HTML/CSS, Blender, Maya, MMD, YMM4, AviUtl, Studio One 6
- GAMMAのPV動画（videos/gamma_pv.mp4）とスクリーンショット（images/gamma_screenshot.jpg）追加済み
- スクリーンショットは配列形式（screenshots: [...]）で複数枚対応
- スクリーンショットクリックでライトボックス拡大表示、複数枚時は左右矢印ナビ付きカルーセル
- Worksカードには1枚目のスクリーンショットをサムネイル表示（object-fit: contain）

## 作品一覧（workData）
| ID | タイトル | 年 | タグ | 動画 | SS | DL |
|----|---------|-----|------|------|----|----|
| touhou | 東方春三校 | 2024 | Unity, 個人制作 | - | - | - |
| circlestriker | CIRCLESTRIKER | 2024 | Unity, C#, 個人制作 | - | - | - |
| gamma | GAMMA | 2025 | C++, DirectX, チーム制作 | ✅ | ✅ | - |
| regamma | RE:GAMMA | 2026 | C++, DirectX, リメイク, 個人制作 | - | - | - |
| sand-tetris | Sand Tetris | 2026 | 個人制作 | - | - | - |
| console-shooter | コンソールシューティング | 2026 | C++, 個人制作 | - | - | - |

## 未完了・予定
- Web制作の仕事実績をWorksに追加予定
- 各作品のPV動画・スクリーンショット・ダウンロードURL追加
- プロフィール写真（現在プレースホルダー）
- ファビコン
- FormSubmit.co の初回メール認証
