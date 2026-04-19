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

document.querySelectorAll('.work-card, .skill-category, .about-grid, .contact-content').forEach(el => {
    el.classList.add('fade-in');
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
const modalBody = modal.querySelector('.modal-body');
const modalClose = modal.querySelector('.modal-close');
const modalBackdrop = modal.querySelector('.modal-backdrop');

// 作品ごとのメディア設定（後で差し替え）
// type: 'video' | 'gif' | 'youtube'
// src: ファイルパス or YouTube埋め込みURL
const workMedia = {
    'gamma':            { type: 'placeholder', src: '' },
    'touhou':           { type: 'placeholder', src: '' },
    'circlestriker':    { type: 'placeholder', src: '' },
    'mario':            { type: 'placeholder', src: '' },
    'sand-tetris':      { type: 'placeholder', src: '' },
    'console-shooter':  { type: 'placeholder', src: '' },
};

function openModal(workId) {
    const media = workMedia[workId];
    modalBody.innerHTML = '';

    if (!media || media.type === 'placeholder' || !media.src) {
        modalBody.innerHTML = '<p class="modal-placeholder">紹介動画・プレイ動画・GIF をここに設定してください</p>';
    } else if (media.type === 'video') {
        const video = document.createElement('video');
        video.src = media.src;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        modalBody.appendChild(video);
    } else if (media.type === 'gif') {
        const img = document.createElement('img');
        img.src = media.src;
        img.alt = workId;
        modalBody.appendChild(img);
    } else if (media.type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = media.src;
        iframe.width = '100%';
        iframe.height = '450';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = '4px';
        modalBody.appendChild(iframe);
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    modalBody.innerHTML = '';
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
    if (e.key === 'Escape') closeModal();
});
