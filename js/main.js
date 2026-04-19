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

// ナビバーのスクロール時の効果
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 60) {
        navbar.style.borderBottomColor = 'rgba(108, 99, 255, 0.2)';
    } else {
        navbar.style.borderBottomColor = 'var(--border)';
    }
});

// ===== モーダル（作品クリック時） =====
const modal = document.getElementById('work-modal');
const modalClose = modal.querySelector('.modal-close');
const modalBackdrop = modal.querySelector('.modal-backdrop');

// 作品ごとのデータ
const workData = {
    'touhou': {
        title: { ja: '東方春三校', en: 'Touhou Harusankou' },
        year: '2024',
        tags: ['Unity', 'C#', { ja: '個人制作', en: 'Solo' }],
        award: { ja: '3校合同コンテスト（夏） 意欲賞 受賞', en: '3-School Joint Contest (Summer) — Enthusiasm Award' },
        desc: {
            ja: '1年次の3校合同コンテスト（夏）にて制作した縦スクロール弾幕シューティング。東方Project原作を意識した弾幕パターンやゲーム性を再現。同コンテストにて意欲賞を受賞。',
            en: 'A vertical-scrolling bullet hell shooter created for the 3-School Joint Contest (Summer, 1st year). Recreated bullet patterns and gameplay inspired by the Touhou Project series. Won the Enthusiasm Award.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
        download: '',
    },
    'circlestriker': {
        title: { ja: 'CIRCLESTRIKER', en: 'CIRCLESTRIKER' },
        year: '2024',
        tags: ['Unity', 'C#', { ja: '個人制作', en: 'Solo' }],
        award: { ja: '3校合同コンテスト（冬） 構成力賞 受賞', en: '3-School Joint Contest (Winter) — Composition Award' },
        desc: {
            ja: '1年次の3校合同コンテスト（冬）にて制作。筒を倒したようなステージを回転させながらジャンプで進むアクションゲーム。同コンテストにて構成力賞を受賞。',
            en: 'Created for the 3-School Joint Contest (Winter, 1st year). An action game where you jump through a cylindrical stage that rotates as you progress. Won the Composition Award.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
        download: '',
    },
    'gamma': {
        title: { ja: 'GAMMA', en: 'GAMMA' },
        year: '2025',
        tags: ['C++', 'DirectX', { ja: 'チーム制作', en: 'Team' }],
        award: null,
        desc: {
            ja: '2年次HEWでチーム制作したパズルアクションゲーム。影に変身し、物体の影を足場にして本来届かない場所へ進むコンセプト。キャラクター操作・バグ修正・コンフリクト修正・紹介動画制作・マネジメント補佐を担当。',
            en: 'A puzzle-action game developed as a team project at HEW (2nd year). Transform into a shadow and use object shadows as platforms to reach otherwise inaccessible areas. Responsible for character controls, bug fixes, conflict resolution, promotional video, and management support.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
        download: '',
    },
    'regamma': {
        title: { ja: 'RE:GAMMA', en: 'RE:GAMMA' },
        year: '2026',
        tags: ['C++', 'DirectX', { ja: 'リメイク', en: 'Remake' }, { ja: '個人制作', en: 'Solo' }],
        award: null,
        desc: {
            ja: 'チーム制作したGAMMAを個人で完全リメイク。ゲームコンセプトはそのままに、プログラムの全面修正・操作感の改善・演出の強化に注力した作品。',
            en: 'A complete solo remake of the team-developed GAMMA. Retaining the original game concept, this version focuses on full code refactoring, improved controls, and enhanced visual effects.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
        download: '',
    },
    'sand-tetris': {
        title: { ja: 'Sand Tetris', en: 'Sand Tetris' },
        year: '2026',
        tags: [{ ja: '個人制作', en: 'Solo' }],
        award: null,
        desc: {
            ja: '既存作品を自分の手で再現する試み。砂の物理演算とテトリスのルールを組み合わせたユニークなパズルゲーム。',
            en: 'An attempt to recreate an existing concept by hand. A unique puzzle game combining sand physics simulation with Tetris rules.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
        download: '',
    },
    'console-shooter': {
        title: { ja: 'コンソールシューティング', en: 'Console Shooter' },
        year: '2026',
        tags: ['C++', { ja: '個人制作', en: 'Solo' }],
        award: null,
        desc: {
            ja: 'コンソール表示のみでグラディウス風の横スクロールシューティングを制作。1年次の課題を3年で作り直し、制約の中で表現力を追求。',
            en: 'A Gradius-style horizontal scrolling shooter built entirely in console output. Revisited a 1st-year assignment in the 3rd year, pushing expressiveness within console constraints.'
        },
        video: { type: 'placeholder', src: '' },
        screenshot: '',
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
    modal.querySelector('.work-detail-year').textContent = data.year;

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

    // スクリーンショット
    const ssArea = modal.querySelector('.work-detail-screenshot');
    if (data.screenshot) {
        ssArea.innerHTML = '<img src="' + data.screenshot + '" alt="screenshot">';
    } else {
        ssArea.innerHTML = '<div class="media-placeholder">SCREENSHOT</div>';
    }

    // 説明文
    modal.querySelector('.work-detail-desc').textContent =
        typeof data.desc === 'object' ? data.desc[lang] : data.desc;

    modal.classList.add('active');
    document.body.style.overflowY = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflowY = '';
}

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
        closeModal();
        closeEmailModal();
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
