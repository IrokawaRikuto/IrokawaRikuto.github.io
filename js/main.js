// ===== 言語切り替え =====
let currentLang = 'ja';
const langBtn = document.getElementById('lang-toggle');

function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    langBtn.textContent = lang === 'ja' ? 'EN' : 'JP';

    document.querySelectorAll('[data-ja][data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });

    // placeholder切り替え
    document.querySelectorAll('[data-placeholder-ja][data-placeholder-en]').forEach(el => {
        el.placeholder = el.getAttribute('data-placeholder-' + lang);
    });
}

langBtn.addEventListener('click', () => {
    setLang(currentLang === 'ja' ? 'en' : 'ja');
});

// ===== ナビメニュー（ドロップダウン） =====
const navToggle = document.querySelector('.nav-toggle');
const navDropdown = document.querySelector('.nav-dropdown');

function openDropdown() {
    navDropdown.hidden = false;
    requestAnimationFrame(() => navDropdown.classList.add('open'));
    navToggle.setAttribute('aria-expanded', 'true');
}

function closeDropdown() {
    navDropdown.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
        if (!navDropdown.classList.contains('open')) navDropdown.hidden = true;
    }, 200);
}

navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navDropdown.classList.contains('open')) closeDropdown();
    else openDropdown();
});

// 外側クリックで閉じる
document.addEventListener('click', (e) => {
    if (navDropdown.classList.contains('open') && !e.target.closest('.nav-menu')) {
        closeDropdown();
    }
});

// Escで閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDropdown.classList.contains('open')) closeDropdown();
});

// ===== 背景モーションON/OFF =====
const bgToggle = document.getElementById('bg-anim-toggle');
const bgSaved = localStorage.getItem('bgAnimEnabled');
let bgEnabled = bgSaved !== 'false';
bgToggle.setAttribute('aria-checked', bgEnabled ? 'true' : 'false');

bgToggle.addEventListener('click', () => {
    bgEnabled = !bgEnabled;
    bgToggle.setAttribute('aria-checked', bgEnabled ? 'true' : 'false');
    localStorage.setItem('bgAnimEnabled', bgEnabled ? 'true' : 'false');
    if (window.bgAnimation) {
        if (bgEnabled) window.bgAnimation.start();
        else window.bgAnimation.stop();
    }
});

// スクロールアニメーション（フェードイン）
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// フェードイン対象を登録
document.querySelectorAll('.section-title, .about-grid, .skill-category, .timeline, .contact-content').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Worksカードは2列なので交互にstaggerをつける
document.querySelectorAll('.work-card').forEach((el, i) => {
    el.classList.add('fade-in');
    el.classList.add(i % 2 === 0 ? 'stagger-1' : 'stagger-2');
    observer.observe(el);
});

// ナビバーのスクロール時の効果 & トップに戻るボタン
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 60) {
        navbar.style.borderBottomColor = 'rgba(108, 99, 255, 0.2)';
    } else {
        navbar.style.borderBottomColor = 'var(--border)';
    }

    if (window.scrollY > 400) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

// ===== スクリーンショットカルーセル状態 =====
let currentScreenshots = [];
let currentSSIndex = 0;

function changeScreenshot(dir) {
    if (currentScreenshots.length <= 1) return;
    currentSSIndex = (currentSSIndex + dir + currentScreenshots.length) % currentScreenshots.length;
    const img = document.querySelector('.work-detail-screenshot img');
    if (img) img.src = currentScreenshots[currentSSIndex];
}

// ===== ライトボックス =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('.lightbox-img');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');
const lightboxPrev = lightbox.querySelector('.lightbox-prev');
const lightboxNext = lightbox.querySelector('.lightbox-next');

function openLightbox(index) {
    currentSSIndex = index;
    lightboxImg.src = currentScreenshots[currentSSIndex];
    lightboxPrev.style.display = currentScreenshots.length > 1 ? '' : 'none';
    lightboxNext.style.display = currentScreenshots.length > 1 ? '' : 'none';
    lightbox.classList.add('active');
}

function closeLightbox() {
    lightbox.classList.remove('active');
}

function lightboxNav(dir) {
    if (currentScreenshots.length <= 1) return;
    currentSSIndex = (currentSSIndex + dir + currentScreenshots.length) % currentScreenshots.length;
    lightboxImg.src = currentScreenshots[currentSSIndex];
    // モーダル側のサムネイルも同期
    const modalImg = document.querySelector('.work-detail-screenshot img');
    if (modalImg) modalImg.src = currentScreenshots[currentSSIndex];
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxBackdrop.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxNav(-1));
lightboxNext.addEventListener('click', () => lightboxNav(1));

// ===== モーダル（作品クリック時） =====
const modal = document.getElementById('work-modal');
const modalClose = modal.querySelector('.modal-close');
const modalBackdrop = modal.querySelector('.modal-backdrop');

// 作品ごとのデータ
const workData = {
    'touhou': {
        title: { ja: '東方春三校', en: 'Touhou Harusankou' },
        year: '2024',
        tags: ['Unity', { ja: '課題制作：個人', en: 'Assignment: Solo' }],
        award: { ja: 'おもしろゲームづくり学内コンテスト 意欲賞 受賞', en: 'Fun Game Making In-School Contest — Enthusiasm Award' },
        env: 'Unity',
        desc: {
            ja: 'プログラマーとして本格的に取り組んだ、記念すべき1作目。元々東方Projectのファンだったことから、ジャンルは迷わずシューティングを選んだ。プレイヤーへの自機狙い、敵の挙動パターン、残機システムなど、シューティングに必要な基本要素を一通り実装。Unityのビジュアルスクリプティングで構築したため作業効率は決して高くなく、調べながらの試行錯誤が続いたが、当時の自分なりに「できることを全部詰め込もう」と取り組んだ意欲が評価され、初出展のコンテストで賞を頂くことができた。\n\n工夫した点は、画面の比率・解像度を東方Project原作に合わせて4:3で構成したこと、フリー素材を集めて見た目の雰囲気を原作寄りに統一したこと、自機の移動速度を調整して操作感まで原作に寄せたこと。プログラマーとしてのスタート地点であり、「ゲームを最後まで作りきる」体験を初めて得た作品。',
            en: 'My very first complete project as a programmer. Being a fan of the Touhou Project series, I naturally settled on a shoot \'em up. The build covers the genre fundamentals — aimed shots toward the player, enemy behavior patterns, and a lives system — all implemented through Unity\'s Visual Scripting. The workflow leaned heavily on visual scripting and constant lookups, so iteration was slow, but the determination to "cram in everything I could do at the time" came through, and the project earned an award at the very first contest I ever submitted to.\n\nThe areas I focused on were authenticity to the source material. The screen aspect ratio and resolution were tuned to Touhou Project\'s 4:3 layout, free assets were curated to align the look with the original, and even the player ship\'s movement speed was adjusted so the feel matched the source. This was my starting line as a programmer — and the first time I experienced "finishing a game all the way through."'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/東方春三校_Title.png', 'images/東方春三校_GamePlay.png'],
        download: '',
    },
    'circlestriker': {
        title: { ja: 'CIRCLESTRIKER', en: 'CIRCLESTRIKER' },
        year: '2024',
        tags: ['Unity', 'C#', { ja: '課題制作：個人', en: 'Assignment: Solo' }],
        award: { ja: 'オリジナルTPS学内コンペ 構成力賞 受賞', en: 'Original TPS In-School Competition — Composition Award' },
        env: 'Unity / Visual Studio Code',
        desc: {
            ja: '2作目はUnity / C#でフルスクラッチした3Dアクションゲーム。当初は剣で敵をなぎ倒す無双系を構想していたが、開発過程で方向転換し、筒状の巨大ステージを進んでゴールを目指すコース型アクションゲームへと作り直した。\n\n本作の特徴はカメラとプレイヤーの位置関係。プレイヤー自身は左右に動かず、ステージ全体が回転することで疑似的に横移動を再現している。プレイヤーの左右には透明な壁を配置して進行ラインを固定し、視点をそのままにステージ側がスクロールする操作感が成立する設計にした。キャラクターには Unity-chan アセットを採用し、それに合わせて公式ボイス素材も組み込むことで、世界観の統一感を出している。\n\n敵キャラクターやエフェクトの追加までは手が回らず実装を断念したが、3D空間における移動・カメラ制御・ステージ構成を実装し切った経験が、その後の作品に繋がる土台となった作品。『巨大ステージそのものを回転させる』というアイデアが評価され、オリジナルTPS学内コンペでは『構成力賞』を頂くことができた。',
            en: 'My second project, built from scratch in Unity / C#. The original concept was a hack-and-slash where you mow down enemies with a sword, but partway through development I pivoted to a course-based 3D action game where the player advances through a giant cylindrical stage toward a goal.\n\nThe defining design feature is the camera-and-player relationship. The player character does not move sideways at all — instead, the entire stage rotates around them, reproducing horizontal movement in a pseudo way. Invisible walls placed to the player\'s left and right lock the lane of travel, so visually the stage scrolls past while the camera stays put. The character uses the Unity-chan asset, paired with official voice clips to keep the world consistent.\n\nI had wanted to add enemy characters and combat effects but ran out of bandwidth, leaving it as a pure course-style game. Even so, fully implementing 3D movement, camera control, and stage construction laid the foundation that carried into my later projects. The core idea — rotating the entire massive stage itself — was recognized at the Original TPS In-School Competition, where the project earned the Composition Award.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/CircleStrikerLogo.png'],
        download: '',
    },
    'gamma': {
        title: { ja: 'GAMMA', en: 'GAMMA' },
        year: '2025',
        tags: ['C++', 'DirectX', { ja: '課題制作：チーム', en: 'Assignment: Team' }],
        award: null,
        env: 'Visual Studio / DirectX11',
        desc: {
            ja: '準備中…',
            en: 'Coming soon...'
        },
        video: { type: 'video', src: 'videos/gamma_pv.mp4' },
        screenshots: ['images/gamma_screenshot.jpg'],
        download: '',
    },
    'regamma': {
        title: { ja: 'RE:GAMMA', en: 'RE:GAMMA' },
        year: '2026',
        tags: ['C++', 'DirectX', { ja: 'リメイク', en: 'Remake' }, { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / DirectX11 / Claude Code Pro',
        desc: {
            ja: '準備中…',
            en: 'Coming soon...'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'gamma-plus': {
        title: { ja: 'GAMMA+', en: 'GAMMA+' },
        year: '2026',
        tags: ['C++', 'DirectX', { ja: 'リメイク', en: 'Remake' }, { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / DirectX11 / Claude Code Pro',
        desc: {
            ja: '2年次のチーム制作『GAMMA』を、当時の心残りを踏まえて個人でブラッシュアップしたリメイク作品。ゲームコンセプトはそのままに、操作感の改善、各種バグの修正、攻撃・被弾・演出系のエフェクト追加、STAGE構成とUIの全面刷新を行い、ゲームとしての完成度を一段引き上げた。「当時もっとこうしたかった」を一つずつ潰し、見た目と触り心地の両面から仕上げ直した一作。',
            en: 'A solo remake of GAMMA, the team project I worked on in my 2nd year, revisited and brushed up with everything I had learned since. The core game concept is unchanged, but controls have been refined, bugs squashed, attack/hit/presentation effects added, and the stage layout and UI fully redesigned — addressing the issues I could not resolve back then and pushing the overall polish another step forward.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'rm-engine': {
        title: { ja: 'RM Engine', en: 'RM Engine' },
        year: '2026',
        tags: ['C++', 'DirectX', { ja: '個人制作', en: 'Personal' }, { ja: '制作中', en: 'In Development' }],
        award: null,
        env: 'Visual Studio / DirectX11 / Claude Code Pro',
        desc: {
            ja: '「このソフトひとつで何でも作れる」をコンセプトに開発を進めている、プラグイン拡張型のゲームエンジン。既存のゲームエンジンは起動やデバッグ実行に時間がかかるという課題を解消するため、ECS（Entity Component System）アーキテクチャを採用して処理を軽量化し、エディタ起動からゲーム実行までを数秒で完結できる軽快さを目標にしている。\n\n物理挙動は外部ライブラリに頼らず C++ ですべて自作しており、3D物理シミュレーションはもちろん2Dゲームも同一エンジンで開発できる構成にしている。エディタは「シーンビュー / ゲームビュー / UIビュー / アニメーター」のタブ切替式で、ヒエラルキー・インスペクター・アセットブラウザを備え、Position / Rotation / Scale / Color / Texture などをスライダーや数値入力からリアルタイムに編集できる。GUIは現在 ImGui をベースにしているが、最終的には自前のGUIフレームワークへ置き換える方針。UIビューでは独自実装のUIウィンドウを通じてHPバーや各種ゲージなどのレイアウトを直感的に配置でき、解像度に合わせた比率調整や透明度などの細かい調整もインスペクターから行える。\n\n加えて、ゲーム開発に必要な周辺ツールもすべてエンジン内で完結させるべく、作曲ツール・画像編集・3Dモデリング・ストーリープロット・シェーダー作成・ペイントツールなどをプラグイン形式で順次搭載していく予定。外部依存をできる限り減らし、コアからツール群まで一貫して自前で組み上げていくことを開発方針としている。',
            en: 'A plugin-extensible game engine in development under the concept of "a single tool that can build anything." Built around an Entity Component System (ECS) architecture to keep runtime processing light, the engine aims to solve a long-standing pain point with existing engines — slow startup and debug iteration — by reaching from editor launch to in-game playback in just a few seconds.\n\nPhysics is implemented from scratch in C++ without relying on external libraries, and the same engine handles both 3D physics simulation and 2D games. The editor uses a tab-switched layout — Scene View / Game View / UI View / Animator — with hierarchy, inspector, and asset browser panels that let Position / Rotation / Scale / Color / Texture and more be edited in real time via sliders and numeric input. The GUI is currently built on ImGui but will be replaced with a custom in-house GUI framework. The UI View uses an original UI window implementation, letting HUD elements like HP bars and gauges be placed intuitively, with fine-grained control over aspect-ratio fitting and opacity from the inspector.\n\nOn top of that, all the peripheral tools normally required for game development — music composition, image editing, 3D modeling, story plotting, shader authoring, paint tools — are planned to be folded into the engine as plugins. The development policy is to minimize external dependencies and build everything from the core to the toolset in-house, end to end.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [
            'images/RMEngine_Logo.png',
            'images/RMEngine_Icon.png',
            'images/RMEngine_Launcher.png',
            'images/RMEngine_SceneView.png',
            'images/RMEngine_UIView.png',
            'images/RMEngine_GameView.png'
        ],
        download: '',
    },
    'pettan-maker': {
        title: { ja: 'ぺったんメイカー', en: 'Pettan Maker' },
        year: '2026',
        tags: ['Unity', 'C#', { ja: '課題制作：チーム', en: 'Assignment: Team' }, { ja: '制作中', en: 'In Development' }],
        award: null,
        env: 'Unity / Visual Studio',
        desc: {
            ja: '敵をつぶしてシールにし、そのシールをからだに貼ることで効果を発動してボスを倒していく3Dアクションゲーム。ステージごとに童話をモチーフにした世界観が用意されており、STAGE1は「不思議の国のアリス」をテーマに、ボスとして「ハートの女王」が登場する。HAL東京の3年次チーム制作（NullPointerGames）として現在開発中。',
            en: 'A 3D action game where you defeat enemies, turn them into stickers, and stick them onto your body to activate their effects and take down bosses. Each stage is themed around a fairy tale — STAGE 1 is inspired by "Alice in Wonderland," featuring the Queen of Hearts as a boss. Currently in development as a 3rd-year team project at HAL Tokyo (NullPointerGames).'
        },
        video: { type: 'video', src: 'videos/PettanMaker_PV.mp4' },
        screenshots: [
            'images/PettanMaker_Title.webp',
            'images/PettanMaker_ConceptArt.png',
            'images/PettanMaker_Logo.png',
            'images/PettanMaker_GamePlay.webp',
            'images/PettanMaker_Sticker.webp',
            'images/PettanMaker_Clear.webp'
        ],
        download: '',
    },
    'sand-tetris': {
        title: { ja: 'Sand Tetris', en: 'Sand Tetris' },
        year: '2026',
        tags: ['C++', { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / Claude Code Pro',
        desc: {
            ja: 'テトリスの派生ルール「サンドテトリス」をC++で再現したゲーム。テトロミノが着地すると砂粒に分解され、セルオートマトンによる物理挙動で崩れ落ちる。同色の砂がフィールド左壁から右壁まで連結したときにライン消去となる独自の消去ルールを持つ。\n\n本作はAI支援コーディングツール（Claude Code）の実力を検証する目的で制作した。自分では一文字もコードを書かず、完全にClaude Codeのみで実装を行ったが、生成されるコードを逐一確認しながら進めることで、ブラックボックス化を避けた。NEXT表示やランキング機能（TOP5をファイル保存、日時付き）、タイトル画面やゲームオーバー演出も実装し、ゲームとしての完成度を高めた。\n\n描画にはシェーダー（HLSL）を使わず、Direct2DのFillRectangleのみで全画面を構成している。GPUパイプラインの設定が不要なため実装が簡潔で、依存関係も軽い。砂物理シミュレーションでは全7,200セルを毎フレーム走査するのではなく、activeフラグとdirty範囲で動く可能性のあるセルだけを処理することで、全砂静止時の計算コストをO(1)に抑えた。BFSによる消去判定でも配列全体のmemsetを避け、キューに記録された訪問セルだけをクリアする方式でメモリ書き込み量を削減している。フォントリソースは起動時に一度だけ生成してキャッシュし、毎フレームのCOM生成・解放を排除。BGMは外部音声ファイルを持たず、コロブチカの旋律を矩形波としてプログラム上で合成しメモリから直接再生するため、実行ファイル以外の外部リソースを必要としない。BFSキューやエフェクト配列もすべて固定長で確保し、動的メモリ確保によるヒープ断片化を排除している。これらの工夫により、単一ソースファイル約1,240行という小規模な構成でありながら、低負荷で安定した動作を実現した。',
            en: 'A C++ recreation of "Sand Tetris," a Tetris variant. When a tetromino lands, it disintegrates into sand particles that collapse under cellular automaton physics. Lines are cleared when same-colored sand forms a connected path from the left wall to the right wall — a unique clearing mechanic.\n\nThis project was created to evaluate the capabilities of the AI-assisted coding tool Claude Code. I did not write a single line of code myself — all implementation was done entirely by Claude Code, but I reviewed every line of generated code to avoid black-box development. The game includes NEXT display, a ranking system (top 5 saved to file with timestamps), a title screen, and game-over effects.\n\nRendering uses only Direct2D FillRectangle calls without shaders (HLSL), eliminating GPU pipeline setup for a simple and lightweight implementation. The sand physics simulation avoids scanning all 7,200 cells every frame — instead, only cells marked with an active flag within a dirty range are processed, reducing computation to O(1) when all sand is at rest. BFS-based line clear detection avoids memset over the entire array, clearing only visited cells recorded in the queue. Font resources are created once at startup and cached, eliminating per-frame COM creation/release. BGM requires no external audio files — the Korobeiniki melody is synthesized as a square wave in code and played directly from memory. All BFS queues and effect arrays use fixed-size allocation, eliminating heap fragmentation from dynamic memory. These optimizations achieve stable, low-overhead performance within a single source file of approximately 1,240 lines.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/SANDTETRIS_Title.png', 'images/SANDTETRIS_GamePlay.png'],
        download: 'games/SandTetris.exe',
    },
    'console-shooter': {
        title: { ja: 'コンソールシューティング', en: 'Console Shooter' },
        year: '2026',
        tags: ['C++', { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / Claude Code Pro',
        desc: {
            ja: '「グラディウス」のような横スクロール型シューティングを、コンソール画面上で実装したC++製ゲーム。学内のゲーム発表で1年生のお題が「コンソールゲーム」だったことをきっかけに、自分が1年生の頃に取り組んだ課題を、当時よりも一段踏み込んだ形で作り直したいと考えたのが制作の出発点。「画像素材を一切使わず、コンソールウィンドウだけでどこまでゲームとして成立させられるか」をテーマに、自機・敵・弾・爆発エフェクト・背景の星まで、すべてをASCII文字と色情報のみで表現している。\n\n描画にはWindows APIのWriteConsoleOutputAを採用し、画面全体をCHAR_INFOバッファとして一括転送するダブルバッファ方式を実装。printfベースの描画で発生するちらつきを排除し、80×25の文字画面でも滑らかなスクロールを実現した。さらにフォントサイズを36pxに引き上げた上でSW_MAXIMIZEによる全画面化を行い、「小さなコンソール画面」という印象も払拭している。\n\nゲーム部分は、タイトル → ステージ選択（3面）→ プレイ → リザルトまでを1本のループとして構築。敵は直進型・上下移動型・蛇行型の3種類を実装し、各ステージの最後にはHPゲージ付きのボスが登場する。自機側もパワーアップ最大3段階によるショット数増加、被弾時の無敵時間、残機制、チャージショット中は自機の向きが反転する演出など、操作感と手応えを両立させるための細部まで作り込んだ。\n\n開発にはAI支援ツール（Claude Code）を活用しつつ、自分でもコードを書きながら完成させた。生成されたコードを読み解き、修正・統合していく過程で、Windows APIによるコンソール制御や描画最適化への理解を一段深められた作品となっている。',
            en: 'A side-scrolling shooter inspired by "Gradius," built entirely inside a Windows console window in C++. The project began at an in-school showcase where the theme assigned to first-year students was "console games," prompting me to revisit an assignment from my own first year and rebuild it with everything I had learned since. The guiding theme was: "How far can a game be taken using only the console window, with no image assets at all?" — so the player ship, enemies, bullets, explosion effects, and even the background stars are all expressed using ASCII characters and color information alone.\n\nRendering is built on the Windows API call WriteConsoleOutputA, transferring the entire screen as a single CHAR_INFO buffer per frame in a double-buffered approach. This eliminates the flicker inherent to printf-based output and produces smooth scrolling even at 80×25 character resolution. The font size is also raised to 36px and the window is maximized via SW_MAXIMIZE, dispelling the impression of a "small console window."\n\nThe game flow runs as a single loop: title → stage select (3 stages) → play → result. Three enemy archetypes are implemented — straight-line, vertical-strafing, and weaving — and each stage ends with a boss equipped with an HP gauge. The player ship features up to three power-up tiers that increase shot count, post-hit invincibility, a lives system, and a presentational touch where the ship faces backward while charging a shot — details added so that nothing about the controls feels rough.\n\nDevelopment combined the AI-assisted tool Claude Code with hand-written code, weaving the two together. Reading, modifying, and integrating the generated code line by line deepened my understanding of Windows API console control and rendering optimization.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/コンソールシューティング_Title.png', 'images/コンソールシューティング_GamePlay.png'],
        download: '',
    },
};

function openModal(workId) {
    const data = workData[workId];
    if (!data) return;

    const lang = currentLang;

    // タイトル
    modal.querySelector('.work-detail-title').textContent =
        typeof data.title === 'object' ? data.title[lang] : data.title;

    // 動画エリア
    const videoArea = modal.querySelector('.work-detail-video');
    videoArea.innerHTML = '';
    const vid = data.video;
    if (!vid || vid.type === 'placeholder' || !vid.src) {
        // 動画が無い作品は、1枚目のサムネ画像をそのまま動画欄に表示（無ければ「準備中…」）
        if (data.screenshots && data.screenshots.length > 0) {
            const img = document.createElement('img');
            img.src = data.screenshots[0];
            img.alt = workId;
            img.className = 'work-detail-video-thumb';
            videoArea.appendChild(img);
        } else {
            videoArea.innerHTML = '<div class="media-placeholder">' + (currentLang === 'ja' ? '準備中…' : 'Coming soon...') + '</div>';
        }
    } else if (vid.type === 'video') {
        const v = document.createElement('video');
        v.src = vid.src; v.controls = true; v.autoplay = true;
        videoArea.appendChild(v);
    } else if (vid.type === 'gif') {
        const img = document.createElement('img');
        img.src = vid.src; img.alt = workId;
        videoArea.appendChild(img);
    } else if (vid.type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = vid.src; iframe.width = '100%'; iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        videoArea.appendChild(iframe);
    }

    // タグ
    const tagsEl = modal.querySelector('.work-detail-tags');
    tagsEl.innerHTML = data.tags.map(t => {
        const text = typeof t === 'object' ? t[lang] : t;
        const isWip = typeof t === 'object' && t.ja === '制作中';
        return '<span class="tag' + (isWip ? ' tag-wip' : '') + '">' + text + '</span>';
    }).join('');

    // 作品情報：年号
    const yearLabel = currentLang === 'ja' ? '制作年：' : 'Year: ';
    modal.querySelector('.work-detail-year').textContent = yearLabel + data.year;

    // 作品情報：開発環境
    const envEl = modal.querySelector('.work-detail-env');
    if (data.env) {
        const envLabel = currentLang === 'ja' ? '開発環境：' : 'Environment: ';
        envEl.textContent = envLabel + data.env;
    } else {
        envEl.textContent = '';
    }

    // 作品情報：受賞
    const awardEl = modal.querySelector('.work-detail-award');
    if (data.award) {
        awardEl.textContent = typeof data.award === 'object' ? data.award[lang] : data.award;
    } else {
        awardEl.textContent = '';
    }

    // 作品配布：ダウンロードURL
    const dlSection = modal.querySelector('.work-detail-download-section');
    const dlLink = modal.querySelector('.work-detail-download');
    if (data.download) {
        dlSection.classList.add('has-link');
        dlLink.href = data.download;
        dlLink.textContent = 'Download';
    } else {
        dlSection.classList.remove('has-link');
    }

    // セクションタイトルの言語切替
    modal.querySelectorAll('[data-ja][data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });

    // スクリーンショット（カルーセル）
    const ssArea = modal.querySelector('.work-detail-screenshot');
    const screenshots = data.screenshots || [];
    currentScreenshots = screenshots;
    currentSSIndex = 0;
    ssArea.innerHTML = '';
    if (screenshots.length > 0) {
        const img = document.createElement('img');
        img.src = screenshots[0];
        img.alt = 'screenshot';
        img.loading = 'lazy';
        img.addEventListener('click', () => openLightbox(currentSSIndex));
        ssArea.appendChild(img);
        if (screenshots.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'screenshot-nav prev';
            prevBtn.innerHTML = '&#8249;';
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); changeScreenshot(-1); });
            const nextBtn = document.createElement('button');
            nextBtn.className = 'screenshot-nav next';
            nextBtn.innerHTML = '&#8250;';
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); changeScreenshot(1); });
            ssArea.appendChild(prevBtn);
            ssArea.appendChild(nextBtn);
        }
    } else {
        ssArea.innerHTML = '<div class="media-placeholder">' + (currentLang === 'ja' ? '準備中…' : 'Coming soon...') + '</div>';
    }

    // 説明文
    modal.querySelector('.work-detail-desc').textContent =
        typeof data.desc === 'object' ? data.desc[lang] : data.desc;

    modal.classList.add('active');
    document.body.style.overflowY = 'hidden';
    history.replaceState(null, '', '#work-' + workId);
}

function closeModal() {
    closeLightbox();
    // 再生中の動画を停止
    const video = modal.querySelector('video');
    if (video) { video.pause(); video.currentTime = 0; }
    modal.classList.remove('active');
    document.body.style.overflowY = '';
    if (location.hash.startsWith('#work-')) {
        history.replaceState(null, '', location.pathname);
    }
}

// URLハッシュから作品モーダルを開く
function openModalFromHash() {
    const hash = location.hash;
    if (hash.startsWith('#work-')) {
        const workId = hash.replace('#work-', '');
        if (workData[workId]) openModal(workId);
    }
}
window.addEventListener('load', openModalFromHash);
window.addEventListener('hashchange', openModalFromHash);

// 作品カードのクリックイベント
document.querySelectorAll('.work-card[data-work]').forEach(card => {
    card.addEventListener('click', () => {
        openModal(card.dataset.work);
    });
});

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (lightbox.classList.contains('active')) {
            closeLightbox();
        } else {
            closeModal();
            closeEmailModal();
        }
    }
    // ライトボックス内の左右キー
    if (lightbox.classList.contains('active')) {
        if (e.key === 'ArrowLeft') lightboxNav(-1);
        if (e.key === 'ArrowRight') lightboxNav(1);
    }
});

// ===== Worksカードにサムネイル表示 =====
document.querySelectorAll('.work-card[data-work]').forEach(card => {
    const data = workData[card.dataset.work];
    if (data && data.screenshots && data.screenshots.length > 0) {
        const mediaDiv = card.querySelector('.work-media');
        const placeholder = mediaDiv.querySelector('.media-placeholder');
        if (placeholder) {
            const img = document.createElement('img');
            img.src = data.screenshots[0];
            img.alt = card.dataset.work;
            img.className = 'work-card-thumb';
            img.loading = 'lazy';
            placeholder.replaceWith(img);
        }
    }
});

// ===== メール送信モーダル =====
const emailModal = document.getElementById('email-modal');
const emailForm = document.getElementById('email-form');
const emailBtn = document.getElementById('email-btn');
const emailCancel = document.getElementById('email-cancel');
const emailStatus = document.getElementById('email-status');
const emailModalClose = emailModal.querySelector('.modal-close');
const emailModalBackdrop = emailModal.querySelector('.modal-backdrop');

function openEmailModal() {
    emailModal.classList.add('active');
    document.body.style.overflowY = 'hidden';
    emailStatus.hidden = true;
    emailForm.reset();
}

function closeEmailModal() {
    emailModal.classList.remove('active');
    document.body.style.overflowY = '';
}

emailBtn.addEventListener('click', openEmailModal);
emailCancel.addEventListener('click', closeEmailModal);
emailModalClose.addEventListener('click', closeEmailModal);
emailModalBackdrop.addEventListener('click', closeEmailModal);

// ===== タイムライン吹き出しのタッチ対応 =====
document.querySelectorAll('.timeline-year').forEach(year => {
    year.addEventListener('click', (e) => {
        // リンククリック時は閉じない
        if (e.target.closest('.tooltip-link')) return;
        const isActive = year.classList.contains('tooltip-active');
        // 他の吹き出しを閉じる
        document.querySelectorAll('.timeline-year.tooltip-active').forEach(y => y.classList.remove('tooltip-active'));
        if (!isActive) year.classList.add('tooltip-active');
    });
});
// 吹き出し外タップで閉じる
document.addEventListener('click', (e) => {
    if (!e.target.closest('.timeline-year')) {
        document.querySelectorAll('.timeline-year.tooltip-active').forEach(y => y.classList.remove('tooltip-active'));
    }
});

emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sendBtn = emailForm.querySelector('.btn-send');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    emailStatus.hidden = true;

    const formData = new FormData(emailForm);

    try {
        const res = await fetch('https://formsubmit.co/ajax/IRcola777@gmail.com', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData,
        });

        if (res.ok) {
            emailStatus.textContent = '送信しました。';
            emailStatus.className = 'email-status success';
            emailStatus.hidden = false;
            emailForm.reset();
            setTimeout(closeEmailModal, 1500);
        } else {
            throw new Error('送信に失敗しました');
        }
    } catch (err) {
        emailStatus.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
        emailStatus.className = 'email-status error';
        emailStatus.hidden = false;
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
});
