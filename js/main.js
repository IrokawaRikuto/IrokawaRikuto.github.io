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

// ハンバーガーメニュー
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// ナビリンクをクリックしたらメニューを閉じる
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
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
            ja: '準備中…',
            en: 'Coming soon...'
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
            ja: '準備中…',
            en: 'Coming soon...'
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
            ja: '準備中…',
            en: 'Coming soon...'
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
        videoArea.innerHTML = '<div class="media-placeholder">VIDEO</div>';
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
        return '<span class="tag">' + text + '</span>';
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
        ssArea.innerHTML = '<div class="media-placeholder">SCREENSHOT</div>';
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
