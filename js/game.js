// ===== 東方風シューティングミニゲーム =====
(function () {
    var modal = document.getElementById('game-modal');
    if (!modal) return;

    // DOM
    var modalClose = modal.querySelector('.modal-close');
    var modalBackdrop = modal.querySelector('.modal-backdrop');
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    var overlay = document.getElementById('game-overlay');
    var titleScreen = document.getElementById('game-title-screen');
    var diffScreen = document.getElementById('game-difficulty-screen');
    var overScreen = document.getElementById('game-over-screen');
    var rankingScreen = document.getElementById('game-ranking-screen');
    var finalScoreEl = document.getElementById('game-final-score');
    var nameInput = document.getElementById('game-name');
    var startBtn = document.getElementById('game-start-btn');
    var submitBtn = document.getElementById('game-submit-btn');
    var skipBtn = document.getElementById('game-skip-btn');
    var rankingList = document.getElementById('game-ranking-list');
    var rankingBtns = document.getElementById('game-ranking-btns');
    var rankingTabs = document.getElementById('game-ranking-tabs');
    var practiceScreen = document.getElementById('game-practice-screen');
    var practiceResultScreen = document.getElementById('game-practice-result-screen');
    var practiceDiffSelect = document.getElementById('practice-diff-select');
    var practiceResultTitle = document.getElementById('practice-result-title');
    var practiceBackBtn = document.getElementById('practice-back-btn');
    var pauseScreen = document.getElementById('game-pause-screen');

    // Canvas & Field size (東方スタイル: 左にフィールド、右にHUD)
    var CANVAS_W = 640, CANVAS_H = 480;
    var FIELD_X = 32, FIELD_Y = 16;
    var W = 384, H = 448; // game field size
    var HUD_X = FIELD_X + W + 24;
    var HUD_W = CANVAS_W - HUD_X - 16;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // ===== Sprites =====
    var sprites = {};
    // HPバー着色用オフスクリーンキャンバス（source-atop が他描画に波及しないよう隔離）
    var hpTintCanvas = null;
    function loadSprite(key, src) {
        var img = new Image();
        img.src = src;
        img.onerror = function () { sprites[key] = null; };
        sprites[key] = img;
    }
    function isSpriteReady(key) {
        var img = sprites[key];
        return img && img.complete && img.naturalWidth > 0;
    }
    loadSprite('bulletS', 'assets/game/bullet_small.png');
    loadSprite('bulletM', 'assets/game/bullet_medium.png');
    loadSprite('bulletL', 'assets/game/bullet_large.png');
    loadSprite('bulletWedge', 'assets/game/bullet_wedge.png');
    loadSprite('bulletIce', 'assets/game/bullet_ice.png');
    loadSprite('bulletSeal', 'assets/game/bullet_seal.png');
    loadSprite('bulletStar', 'assets/game/bullet_star.png');
    loadSprite('bulletStarSmall', 'assets/game/bullet_small_star.png');
    loadSprite('magicCircle', 'assets/game/boss_magic_circle.png');
    loadSprite('deleteEffect', 'assets/game/bullet_delete_effect.png');
    loadSprite('bossHpBar', 'assets/game/boss_hpbar.png');
    // Sprite layout: small=16x16 x9, medium=64x32 x8, large=128x64 x8, wedge/ice/seal=16x16 x9
    // Colors: 0=red,1=orange,2=yellow,3=green,4=cyan,5=blue,6=purple,7=gray (8=white for 9-sprites)
    var BULLET_COLORS = { red: 0, orange: 1, yellow: 2, green: 3, cyan: 4, blue: 5, purple: 6, gray: 7 };

    // ===== Sound Effects =====
    var seAudio = {};
    function loadSE(key, src) {
        try {
            var a = new Audio(src);
            a.preload = 'auto';
            a.volume = 0.4;
            seAudio[key] = a;
        } catch (e) {}
    }
    loadSE('decide', 'assets/game/se_decide.mp3');
    loadSE('select', 'assets/game/se_select.mp3');
    function playSE(key) {
        var a = seAudio[key]; if (!a) return;
        try { a.currentTime = 0; a.play().catch(function(){}); } catch (e) {}
    }

    // ===== Constants =====
    var PLAYER_SPEED = 4;
    var PLAYER_SLOW_SPEED = 1.8;
    var PLAYER_SIZE = 10;
    var PLAYER_HITBOX = 2;
    var FIRE_INTERVAL = 4;
    var MAX_LIVES = 3;
    var MAX_BOMBS = 2;
    var MIN_POWER = 100;
    var MAX_POWER = 400;
    var INVINCIBLE_FRAMES = 180;
    var BOMB_DURATION = 60;
    var ITEM_ATTRACT_RADIUS = 36;
    var ITEM_AUTO_COLLECT_Y = 100;
    var GRAZE_RADIUS = 24;

    // aimedCount: 自機狙い弾の本数（1/3/5/7）
    // wayCount: way系連射弾の基準本数（3/5/7/9）。way5/fan 等は +2 して使う
    var DIFF = {
        easy:    { bullets: 0.5, speed: 0.8, aimedCount: 1, wayCount: 3, label: 'Easy' },
        normal:  { bullets: 1.0, speed: 1.0, aimedCount: 3, wayCount: 5, label: 'Normal' },
        hard:    { bullets: 1.5, speed: 1.2, aimedCount: 5, wayCount: 7, label: 'Hard' },
        lunatic: { bullets: 2.0, speed: 1.4, aimedCount: 7, wayCount: 9, label: 'Lunatic' }
    };

    // ===== State =====
    var state = 'TITLE';
    var animId = null;
    var titleAnimId = null;
    var frame = 0;
    var score = 0;
    var graze = 0;
    var lives = 0;
    var bombs = 0;
    var power = MIN_POWER;
    var invTimer = 0;
    var fireTimer = 0;
    var bombTimer = 0;
    var diff = DIFF.normal;
    var diffKey = 'normal';
    var waveTimer = 0;
    var waveIndex = 0;
    var bossActive = false;
    var boss = null;
    var bossInterval = 1200;
    var preBoss = false;
    var rankingFrom = 'title';
    var menuIndex = 0;
    var practiceMode = false;
    var practicePatternKey = null;

    var player = { x: W / 2, y: H - 60 };
    var pBullets = [];
    var enemies = [];
    var eBullets = [];
    var items = [];
    var particles = [];
    var deleteEffects = []; // bullet delete animations
    var bombOrbs = []; // 夢想封印オーブ

    var keys = {};

    // ===== Background Particles (東方風) =====
    var bgParticles = [];
    var titleParticles = [];

    function initBgParticles() {
        bgParticles = [];
        for (var i = 0; i < 25; i++) {
            bgParticles.push({
                x: Math.random() * W, y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.2 - Math.random() * 0.4,
                size: 1 + Math.random() * 2,
                alpha: 0.08 + Math.random() * 0.15,
                color: Math.random() > 0.6 ? '#ff4444' : '#882244'
            });
        }
    }

    function initTitleParticles() {
        titleParticles = [];
        var colors = ['#ff4444', '#ff6666', '#cc2244', '#ff8888', '#dd3355', '#aa2233'];
        for (var i = 0; i < 45; i++) {
            titleParticles.push({
                x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -0.5 - Math.random() * 0.8,
                size: 2 + Math.random() * 5,
                alpha: 0.1 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function updateBgParticles(arr, bw, bh) {
        bw = bw || W; bh = bh || H;
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.phase !== undefined) {
                p.x += Math.sin(p.phase + frame * 0.01) * 0.2;
            }
            if (p.y < -10) { p.y = bh + 10; p.x = Math.random() * bw; }
            if (p.x < -10) p.x = bw + 10;
            if (p.x > bw + 10) p.x = -10;
        }
    }

    function drawBgParticles(arr) {
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i];
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawGameBg() {
        var grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#0a0812');
        grd.addColorStop(0.5, '#0e0a18');
        grd.addColorStop(1, '#0a0812');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
        drawBgParticles(bgParticles);
    }

    function drawTitleBackground() {
        var grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grd.addColorStop(0, '#1a0e28');
        grd.addColorStop(0.4, '#241232');
        grd.addColorStop(0.7, '#1e0c28');
        grd.addColorStop(1, '#120818');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawBgParticles(titleParticles);

        // Title text (パーティクルの手前に描画、大きく表示)
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 54px "Courier New", monospace';
        ctx.fillText('SHOOTING', CANVAS_W / 2, CANVAS_H * 0.22);
        ctx.fillText('SHOOTING', CANVAS_W / 2, CANVAS_H * 0.22); // 二重描画で明るく
        ctx.shadowBlur = 0;
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,200,200,0.6)';
        ctx.fillText('- Portfolio Mini Game -', CANVAS_W / 2, CANVAS_H * 0.22 + 32);
        ctx.restore();
    }

    // ===== Player =====
    function updatePlayer() {
        var slow = keys['ShiftLeft'] || keys['ShiftRight'] || mobileKeys.slow;
        var spd = slow ? PLAYER_SLOW_SPEED : PLAYER_SPEED;
        var dx = 0, dy = 0;

        if (keys['ArrowLeft']) dx = -1;
        if (keys['ArrowRight']) dx = 1;
        if (keys['ArrowUp']) dy = -1;
        if (keys['ArrowDown']) dy = 1;

        // スライドパッド（アナログ入力）が操作中なら上書き
        if (mobileAxis.x !== 0 || mobileAxis.y !== 0) {
            dx = mobileAxis.x;
            dy = mobileAxis.y;
        } else if (dx !== 0 && dy !== 0) {
            // キーボードの対角移動を正規化
            dx *= 0.707; dy *= 0.707;
        }

        // アナログでも最大1に正規化
        var mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 1) { dx /= mag; dy /= mag; }

        player.x += dx * spd;
        player.y += dy * spd;
        if (player.x < PLAYER_SIZE) player.x = PLAYER_SIZE;
        if (player.x > W - PLAYER_SIZE) player.x = W - PLAYER_SIZE;
        if (player.y < PLAYER_SIZE) player.y = PLAYER_SIZE;
        if (player.y > H - PLAYER_SIZE) player.y = H - PLAYER_SIZE;

        if (invTimer > 0) invTimer--;

        // Fire: PCは Z 押下、タッチ端末は自動発射
        if (keys['KeyZ'] || isTouchDevice) {
            fireTimer++;
            if (fireTimer >= FIRE_INTERVAL) {
                fireTimer = 0;
                firePlayerShot();
            }
        } else {
            fireTimer = FIRE_INTERVAL - 1;
        }

        // Bomb（夢想封印）
        if ((keys['KeyX'] || mobileKeys.bomb) && bombTimer <= 0 && bombs > 0) {
            bombs--;
            launchBombOrbs();
        }
        if (bombTimer > 0) bombTimer--;

        attractItems(slow);
    }

    function firePlayerShot() {
        var slow = keys['ShiftLeft'] || keys['ShiftRight'] || mobileKeys.slow;
        var lvl = Math.floor(power / 100);
        var bx = player.x, by = player.y - PLAYER_SIZE;

        if (lvl <= 1) {
            pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 2) {
            pBullets.push({ x: bx - 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx + 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 3) {
            if (slow) {
                // 低速時: 集中ショット
                pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 4, h: 16 });
                pBullets.push({ x: bx - 6, y: by, vx: -0.1, vy: -10, w: 3, h: 14 });
                pBullets.push({ x: bx + 6, y: by, vx: 0.1, vy: -10, w: 3, h: 14 });
            } else {
                pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
                pBullets.push({ x: bx - 10, y: by, vx: -0.5, vy: -10, w: 3, h: 12 });
                pBullets.push({ x: bx + 10, y: by, vx: 0.5, vy: -10, w: 3, h: 12 });
            }
        } else {
            if (slow) {
                // 低速時: 高威力集中ショット
                pBullets.push({ x: bx - 3, y: by, vx: 0, vy: -10, w: 4, h: 16 });
                pBullets.push({ x: bx + 3, y: by, vx: 0, vy: -10, w: 4, h: 16 });
                pBullets.push({ x: bx - 8, y: by, vx: -0.1, vy: -10, w: 3, h: 14 });
                pBullets.push({ x: bx + 8, y: by, vx: 0.1, vy: -10, w: 3, h: 14 });
                pBullets.push({ x: bx - 13, y: by + 2, vx: -0.2, vy: -10, w: 3, h: 12 });
                pBullets.push({ x: bx + 13, y: by + 2, vx: 0.2, vy: -10, w: 3, h: 12 });
            } else {
                pBullets.push({ x: bx - 4, y: by, vx: 0, vy: -10, w: 4, h: 16 });
                pBullets.push({ x: bx + 4, y: by, vx: 0, vy: -10, w: 4, h: 16 });
                pBullets.push({ x: bx - 14, y: by, vx: -0.6, vy: -10, w: 3, h: 12 });
                pBullets.push({ x: bx + 14, y: by, vx: 0.6, vy: -10, w: 3, h: 12 });
                pBullets.push({ x: bx - 22, y: by + 4, vx: -1.2, vy: -9, w: 3, h: 10 });
                pBullets.push({ x: bx + 22, y: by + 4, vx: 1.2, vy: -9, w: 3, h: 10 });
            }
        }
    }

    function drawPlayer() {
        if ((invTimer > 0 || bombTimer > 0) && Math.floor(frame / 4) % 2 === 0) return;
        var slow = keys['ShiftLeft'] || keys['ShiftRight'] || mobileKeys.slow;

        ctx.save();
        ctx.translate(player.x, player.y);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -PLAYER_SIZE);
        ctx.lineTo(-PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.5);
        ctx.lineTo(0, PLAYER_SIZE * 0.2);
        ctx.lineTo(PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,68,68,0.7)';
        ctx.beginPath();
        ctx.arc(0, PLAYER_SIZE * 0.4, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();

        if (slow) {
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, PLAYER_HITBOX + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,68,68,0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, ITEM_ATTRACT_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255,68,68,0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_HITBOX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // (bombフラッシュは夢想封印オーブに置き換え)
    }

    // ===== Player Bullets =====
    function updatePBullets() {
        for (var i = pBullets.length - 1; i >= 0; i--) {
            var b = pBullets[i];
            b.x += b.vx; b.y += b.vy;
            if (b.y < -20 || b.x < -20 || b.x > W + 20) pBullets.splice(i, 1);
        }
    }
    function drawPBullets() {
        ctx.fillStyle = '#ff4444';
        for (var i = 0; i < pBullets.length; i++) {
            var b = pBullets[i];
            ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
        }
    }

    // ===== Items =====
    // 敵撃破時: 真上に飛んでから自由落下
    function spawnItems(x, y, type, count) {
        for (var i = 0; i < count; i++) {
            var spread = (count > 1) ? (i / (count - 1) - 0.5) * 20 : 0;
            items.push({
                x: x + spread, y: y,
                vx: 0, vy: -2.5 - Math.random() * 1.5,
                type: type, age: 0, attracted: false
            });
        }
    }

    // 被弾時パワーばらまき: プレイヤーから扇状に真上へ飛ばす（画面内に収める）
    function spawnDeathPowerItems(x, y, type, count) {
        var fanAngle = Math.PI * 0.4; // 扇の角度（狭めて画面内に収める）
        var baseAngle = -Math.PI / 2; // 真上
        for (var i = 0; i < count; i++) {
            var a = baseAngle - fanAngle / 2 + (count > 1 ? fanAngle * (i / (count - 1)) : 0);
            var spd = 3 + Math.random() * 1.5;
            var ix = Math.max(10, Math.min(W - 10, x));
            items.push({
                x: ix, y: y,
                vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                type: type, age: 0, attracted: false
            });
        }
    }

    function attractItems(slow) {
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var dx = player.x - it.x, dy = player.y - it.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var autoCollect = player.y < ITEM_AUTO_COLLECT_Y;
            if (autoCollect) it.attracted = true;
            if (slow && dist < ITEM_ATTRACT_RADIUS) it.attracted = true;
            if (it.attracted && dist > 1) {
                // 回収エリアでの引き寄せは高速
                var speed = autoCollect ? 12 : 4.5;
                it.vx = dx / dist * speed; it.vy = dy / dist * speed;
            }
        }
    }

    function forceCollectAllItems() {
        for (var i = 0; i < items.length; i++) items[i].attracted = true;
    }

    function updateItems() {
        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            it.age++;
            if (!it.attracted) { it.vy += 0.03; if (it.vy > 1.5) it.vy = 1.5; }
            it.x += it.vx; it.y += it.vy;
            // 画面内に収める（左右の壁で跳ね返り）
            if (it.x < 6) { it.x = 6; it.vx = Math.abs(it.vx) * 0.5; }
            if (it.x > W - 6) { it.x = W - 6; it.vx = -Math.abs(it.vx) * 0.5; }
            if (it.y < -40) { it.y = -40; it.vy = Math.abs(it.vy) * 0.3; }
            var dx = player.x - it.x, dy = player.y - it.y;
            if (dx * dx + dy * dy < 16 * 16) { collectItem(it); items.splice(i, 1); continue; }
            if (it.y > H + 20) items.splice(i, 1);
        }
    }

    function collectItem(it) {
        switch (it.type) {
            case 'scoreS': score += 100; break;
            case 'score':  score += 1000; break;
            case 'powerS': power = Math.min(MAX_POWER, power + 1); break;   // +0.01
            case 'power':  power = Math.min(MAX_POWER, power + 10); break;  // +0.10
            case 'bomb':   bombs = Math.min(MAX_BOMBS + 3, bombs + 1); break;
            case 'life':   lives++; break;
        }
    }

    function drawItems() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var big = (it.type === 'score' || it.type === 'power' || it.type === 'bomb' || it.type === 'life');
            var sz = big ? 10 : 6;
            var color, label;
            switch (it.type) {
                case 'scoreS': case 'score': color = '#4488ff'; label = '\u70B9'; break;
                case 'powerS': case 'power': color = '#ff4444'; label = 'P'; break;
                case 'bomb': color = '#44ff44'; label = 'B'; break;
                case 'life': color = '#aa44ff'; label = '1UP'; break;
            }
            ctx.fillStyle = color;
            ctx.fillRect(it.x - sz, it.y - sz, sz * 2, sz * 2);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.strokeRect(it.x - sz, it.y - sz, sz * 2, sz * 2);
            ctx.fillStyle = '#fff';
            ctx.font = (it.type === 'life') ? 'bold 6px sans-serif' : (big ? 'bold 8px sans-serif' : 'bold 6px sans-serif');
            ctx.fillText(label, it.x, it.y + 1);
        }
    }

    // ===== Collect Line =====
    function drawCollectLine() {
        var y = ITEM_AUTO_COLLECT_Y;
        ctx.strokeStyle = 'rgba(255,68,68,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,68,68,0.35)';
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left'; ctx.fillText('\u25B6', 2, y);
        ctx.textAlign = 'right'; ctx.fillText('\u25C0', W - 2, y);
    }

    // ===== Delete Effects =====
    function spawnDeleteEffect(x, y) {
        deleteEffects.push({ x: x, y: y, frame: 0, maxFrame: 16 });
    }
    function updateDeleteEffects() {
        for (var i = deleteEffects.length - 1; i >= 0; i--) {
            deleteEffects[i].frame++;
            if (deleteEffects[i].frame >= deleteEffects[i].maxFrame) deleteEffects.splice(i, 1);
        }
    }
    function drawDeleteEffects() {
        if (!isSpriteReady('deleteEffect')) return;
        var img = sprites.deleteEffect;
        // 256x32, 8 frames of 32x32
        for (var i = 0; i < deleteEffects.length; i++) {
            var de = deleteEffects[i];
            var fi = Math.min(7, Math.floor(de.frame / 2));
            ctx.globalAlpha = 1 - de.frame / de.maxFrame;
            ctx.drawImage(img, fi * 32, 0, 32, 32, de.x - 16, de.y - 16, 32, 32);
        }
        ctx.globalAlpha = 1;
    }

    // ===== Bomb Orbs（夢想封印） =====
    var BOMB_ORB_RADIUS = 60;
    var BOMB_ORB_COUNT = 6;
    var BOMB_ORB_EXPLODE_RADIUS = 140; // 弾消し範囲＆爆発見た目
    var BOMB_ORB_EXPLODE_DAMAGE = 8;   // 雑魚向け（6オーブ累計48: 中型は確殺、大型はHP50で生存）
    var BOMB_ORB_BOSS_DAMAGE = 18;     // ボス向け（6オーブ累計108）

    function launchBombOrbs() {
        bombOrbs = [];
        forceCollectAllItems(); // ボム発動時にアイテム全回収
        for (var i = 0; i < BOMB_ORB_COUNT; i++) {
            var a = (Math.PI * 2 / BOMB_ORB_COUNT) * i - Math.PI / 2;
            bombOrbs.push({
                x: player.x, y: player.y,
                vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
                radius: BOMB_ORB_RADIUS,
                life: 180,
                hue: (360 / BOMB_ORB_COUNT) * i,
                phase: 'spread', // spread → homing → explode
                spreadTimer: 20 + i * 3, // 散らばる時間（個体差）
                target: null,
                explodeTimer: 0
            });
        }
        bombTimer = 180;
        invTimer = Math.max(invTimer, 180);
    }

    function findNearestTarget(orb) {
        var best = null, bestDist = Infinity;
        // ボスを優先ターゲット
        if (boss && !boss.entering) {
            var dx = boss.x - orb.x, dy = boss.y - orb.y;
            var d = dx * dx + dy * dy;
            if (d < bestDist) { bestDist = d; best = { x: boss.x, y: boss.y, ref: 'boss' }; }
        }
        for (var j = 0; j < enemies.length; j++) {
            var e = enemies[j];
            if (e.y < -10) continue;
            var dx = e.x - orb.x, dy = e.y - orb.y;
            var d = dx * dx + dy * dy;
            if (d < bestDist) { bestDist = d; best = { x: e.x, y: e.y, ref: e }; }
        }
        return best;
    }

    function bombOrbExplode(orb) {
        // 爆発エフェクト
        spawnExplosion(orb.x, orb.y, '#ffffff', 15);
        for (var c = 0; c < 6; c++) {
            var hue = (orb.hue + c * 60) % 360;
            var color = 'hsl(' + hue + ',100%,70%)';
            spawnExplosion(orb.x, orb.y, color, 4);
        }
        // 爆発範囲の敵弾を消去
        for (var j = eBullets.length - 1; j >= 0; j--) {
            var b = eBullets[j];
            var dx = b.x - orb.x, dy = b.y - orb.y;
            if (dx * dx + dy * dy < BOMB_ORB_EXPLODE_RADIUS * BOMB_ORB_EXPLODE_RADIUS) {
                spawnDeleteEffect(b.x, b.y);
                eBullets.splice(j, 1);
                score += 10;
            }
        }
        // 画面内の敵全員にダメージ（範囲制限なし）
        for (var j = 0; j < enemies.length; j++) {
            var e = enemies[j];
            if (e.y < -10 || e.y > H + 20) continue; // 画面外は対象外
            e.hp -= BOMB_ORB_EXPLODE_DAMAGE;
        }
        if (boss && !boss.entering) {
            boss.hp -= BOMB_ORB_BOSS_DAMAGE;
        }
    }

    function updateBombOrbs() {
        for (var i = bombOrbs.length - 1; i >= 0; i--) {
            var orb = bombOrbs[i];
            orb.life--;
            orb.hue = (orb.hue + 4) % 360;

            if (orb.phase === 'spread') {
                // 散らばりフェーズ: 減速しながら広がる
                orb.x += orb.vx; orb.y += orb.vy;
                orb.vx *= 0.92; orb.vy *= 0.92;
                orb.spreadTimer--;
                if (orb.spreadTimer <= 0) orb.phase = 'homing';
            } else if (orb.phase === 'homing') {
                // 追尾フェーズ: 最も近い敵を追尾
                var target = findNearestTarget(orb);
                if (target) {
                    var dx = target.x - orb.x, dy = target.y - orb.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 20) {
                        // 到達→爆発
                        orb.phase = 'explode';
                        orb.explodeTimer = 8;
                        bombOrbExplode(orb);
                    } else {
                        // ホーミング（滑らかに旋回）
                        var homingSpeed = 5.5;
                        var targetVx = (dx / dist) * homingSpeed;
                        var targetVy = (dy / dist) * homingSpeed;
                        orb.vx += (targetVx - orb.vx) * 0.15;
                        orb.vy += (targetVy - orb.vy) * 0.15;
                        orb.x += orb.vx; orb.y += orb.vy;
                    }
                } else {
                    // ターゲットなし: まっすぐ上に飛んで爆発
                    orb.vy -= 0.2;
                    orb.x += orb.vx; orb.y += orb.vy;
                    if (orb.y < 10 || orb.life < 30) {
                        orb.phase = 'explode';
                        orb.explodeTimer = 8;
                        bombOrbExplode(orb);
                    }
                }
            } else if (orb.phase === 'explode') {
                orb.explodeTimer--;
            }

            // 移動中も敵弾を消去
            if (orb.phase !== 'explode') {
                for (var j = eBullets.length - 1; j >= 0; j--) {
                    var b = eBullets[j];
                    var dx = b.x - orb.x, dy = b.y - orb.y;
                    if (dx * dx + dy * dy < (orb.radius + b.size) * (orb.radius + b.size)) {
                        spawnDeleteEffect(b.x, b.y);
                        eBullets.splice(j, 1);
                        score += 10;
                    }
                }
            }

            // 消去判定
            if (orb.life <= 0 || (orb.phase === 'explode' && orb.explodeTimer <= 0)) {
                if (orb.phase !== 'explode') bombOrbExplode(orb);
                bombOrbs.splice(i, 1);
            }
        }
        if (bombOrbs.length === 0 && bombTimer > 0) bombTimer = 0;
    }

    function drawBombOrbs() {
        for (var i = 0; i < bombOrbs.length; i++) {
            var orb = bombOrbs[i];
            var alpha = Math.min(1, orb.life / 20);
            ctx.save();
            ctx.translate(orb.x, orb.y);

            var r = orb.radius;
            if (orb.phase === 'explode') {
                // 爆発: 急速に広がって消える
                var t = 1 - orb.explodeTimer / 8;
                r = orb.radius + BOMB_ORB_EXPLODE_RADIUS * t;
                alpha *= (1 - t);
            }

            // 虹色グロー（外側）
            var grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
            grd.addColorStop(0, 'hsla(' + orb.hue + ', 100%, 85%, ' + (alpha * 0.9) + ')');
            grd.addColorStop(0.3, 'hsla(' + ((orb.hue + 60) % 360) + ', 100%, 65%, ' + (alpha * 0.6) + ')');
            grd.addColorStop(0.6, 'hsla(' + ((orb.hue + 120) % 360) + ', 100%, 55%, ' + (alpha * 0.3) + ')');
            grd.addColorStop(1, 'hsla(' + ((orb.hue + 180) % 360) + ', 100%, 50%, 0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
            ctx.fill();

            // コア
            if (orb.phase !== 'explode') {
                var coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                coreGrd.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
                coreGrd.addColorStop(0.4, 'hsla(' + orb.hue + ', 100%, 80%, ' + (alpha * 0.9) + ')');
                coreGrd.addColorStop(1, 'hsla(' + ((orb.hue + 180) % 360) + ', 80%, 55%, ' + (alpha * 0.2) + ')');
                ctx.fillStyle = coreGrd;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ===== Enemies =====
    // Bullet patterns: 'down', 'way3', 'way5', 'circle', 'aimed', 'diagonal', 'random', 'spread'
    var BULLET_PATTERNS_SMALL = ['down', 'aimed', 'diagonal', 'split'];
    var BULLET_PATTERNS_MEDIUM = ['way3', 'aimed', 'diagonal', 'random', 'spread', 'fan', 'split'];
    var BULLET_PATTERNS_LARGE = ['way5', 'circle', 'way3', 'random', 'spread', 'fan', 'cross'];

    function pickBulletPattern(type) {
        var pool;
        if (type === 'small') pool = BULLET_PATTERNS_SMALL;
        else if (type === 'medium') pool = BULLET_PATTERNS_MEDIUM;
        else pool = BULLET_PATTERNS_LARGE;
        if (waveIndex >= 2 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3', 'split'];
        if (waveIndex >= 4 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3', 'random', 'spread', 'fan', 'split'];
        if (waveIndex >= 3 && type === 'medium') pool = ['way3', 'way5', 'aimed', 'diagonal', 'circle', 'random', 'spread', 'fan', 'split', 'cross'];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function spawnEnemy(type) {
        var e = {
            x: 30 + Math.random() * (W - 60), y: -20,
            hp: 1, maxHp: 1, speed: 1, type: type,
            pattern: 'straight', fireRate: 200,
            fireTimer: Math.floor(Math.random() * 60),
            size: 8, age: 0, baseX: 0,
            dir: Math.random() > 0.5 ? 1 : -1,
            bulletPattern: 'down'
        };
        var patRoll = Math.random();
        if (type === 'small') {
            e.hp = 1; e.maxHp = 1; e.size = 8;
            e.speed = 1.5 + Math.random() * 1;
            e.fireRate = Math.floor(120 / diff.bullets);
            e.bulletPattern = pickBulletPattern('small');
            if (patRoll > 0.7) { e.pattern = 'sine'; e.baseX = Math.max(50, Math.min(W - 50, e.x)); }
        } else if (type === 'medium') {
            e.hp = 15; e.maxHp = 15; e.size = 14;
            e.speed = 1 + Math.random() * 0.5;
            e.fireRate = Math.floor(70 / diff.bullets);
            e.bulletPattern = pickBulletPattern('medium');
            if (patRoll > 0.5) { e.pattern = 'sine'; e.baseX = Math.max(55, Math.min(W - 55, e.x)); }
        } else if (type === 'large') {
            e.hp = 50; e.maxHp = 50; e.size = 20; e.speed = 0.4;
            e.fireRate = Math.floor(45 / diff.bullets);
            e.bulletPattern = pickBulletPattern('large');
            e.pattern = 'hover'; e.targetY = 60 + Math.random() * 60;
        }
        enemies.push(e);
    }

    function spawnDriftFormation() {
        var count = 7 + Math.floor(Math.random() * 5); // 7-11体
        var dir = Math.random() > 0.5 ? 1 : -1;
        var baseY = 30 + Math.random() * 40;
        var startX = dir > 0 ? -15 : W + 15;
        var spd = 1.5 + Math.random() * 1;
        var spacing = 18;
        for (var i = 0; i < count; i++) {
            enemies.push({
                x: startX - dir * spacing * i,
                y: baseY,
                hp: 1, maxHp: 1, speed: spd, type: 'small',
                pattern: 'drift', fireRate: Math.floor(110 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 60),
                size: 8, age: 0, baseX: 0, dir: dir,
                bulletPattern: pickBulletPattern('small')
            });
        }
    }

    // 片側の下から出現し逆U字（∩）で反対側へ抜ける編隊。side=0 が左→右、side=1 が右→左
    function spawnInvertedU(side) {
        var countPerSide = 6 + Math.floor(Math.random() * 2); // 6-7体
        var peakY = 45 + Math.random() * 20;
        var duration = 180; // ∩を描ききるフレーム数
        var startX = side === 0 ? 40 : W - 40;
        var endX = side === 0 ? W - 40 : 40;
        for (var i = 0; i < countPerSide; i++) {
            enemies.push({
                x: startX, y: H + 30,
                hp: 1, maxHp: 1, speed: 1, type: 'small',
                pattern: 'arcPath',
                pathT: -i * 0.10,
                pathSpeed: 1 / duration,
                pathStartX: startX, pathEndX: endX, pathPeakY: peakY,
                fireRate: Math.floor(70 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 30),
                size: 8, age: 0, baseX: 0, dir: side === 0 ? 1 : -1,
                bulletPattern: 'down'
            });
        }
    }

    // 片側の上からS字を描いて降下する編隊。side=1 が左から、side=-1 が右から
    function spawnSCurveFormation(side) {
        var count = 7 + Math.floor(Math.random() * 3); // 7-9
        var startX = side > 0 ? 40 : W - 40;
        for (var i = 0; i < count; i++) {
            enemies.push({
                x: startX, y: -20 - i * 20,
                hp: 1, maxHp: 1, speed: 1.4, type: 'small',
                pattern: 'sCurve',
                entrySide: side, entryX: startX,
                fireRate: Math.floor(100 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 40),
                size: 8, age: 0, baseX: 0, dir: side,
                bulletPattern: 'aimed'
            });
        }
    }

    // 片側の上からZ字（ジグザグ）で降下する編隊。side=1 が左から、side=-1 が右から
    function spawnZCurveFormation(side) {
        var count = 7 + Math.floor(Math.random() * 3); // 7-9
        var startX = side > 0 ? 30 : W - 30;
        for (var i = 0; i < count; i++) {
            enemies.push({
                x: startX, y: -20 - i * 20,
                hp: 1, maxHp: 1, speed: 1.5, type: 'small',
                pattern: 'zCurve',
                entrySide: side, entryX: startX,
                fireRate: Math.floor(110 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 40),
                size: 8, age: 0, baseX: 0, dir: side,
                bulletPattern: 'down'
            });
        }
    }

    // 画面上部に出現して自機狙い一斉射撃後に退場
    function spawnTopAimedWave(count) {
        count = count || (5 + Math.floor(Math.random() * 4));
        var spacing = (W - 60) / (count - 1 || 1);
        for (var i = 0; i < count; i++) {
            var ex = 30 + spacing * i;
            enemies.push({
                x: ex, y: -15, hp: 1, maxHp: 1, speed: 1.0, type: 'small',
                pattern: 'topHover', fireRate: Math.floor(70 / diff.bullets),
                fireTimer: 0,
                size: 8, age: 0, baseX: ex, dir: 1,
                bulletPattern: 'aimed',
                targetY: 35 + Math.random() * 25,
                hoverTime: 0, maxHover: 150 + Math.floor(Math.random() * 60)
            });
        }
    }

    // 画面上部左右に大型2体が固定して弾幕を放つ
    function spawnDualTurrets() {
        var positions = [{ x: 60, y: 50, spin: 1 }, { x: W - 60, y: 50, spin: -1 }];
        for (var i = 0; i < 2; i++) {
            enemies.push({
                x: positions[i].x, y: -20,
                hp: 40, maxHp: 40, speed: 0.8, type: 'large',
                pattern: 'hover', fireRate: Math.floor(35 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 20),
                size: 20, age: 0, baseX: positions[i].x, dir: 1,
                bulletPattern: 'turretDual',
                spinDir: positions[i].spin, // 左=-1(左回転), 右=1(右回転)
                targetY: positions[i].y
            });
        }
    }

    // ===== Wave Script System =====
    var waveScript = [];
    var waveScriptIdx = 0;

    function buildWaveScript() {
        waveScript = [];
        waveScriptIdx = 0;
        var t = 30;
        var stage = waveIndex;
        var stageScale = 1 + stage * 0.15;

        // 基本パターンプール（1面から中型・大型も混ぜる）
        var pool = ['formation', 'sCurveL', 'sCurveR', 'zCurveL', 'zCurveR', 'mediumEscort', 'largeTank'];
        if (stage >= 1) { pool.push('topAimed', 'invertedUL', 'invertedUR'); }
        if (stage >= 2) { pool.push('sCurveL', 'sCurveR', 'zCurveL', 'zCurveR', 'dualTurret'); }
        if (stage >= 3) { pool.push('topAimedHeavy', 'invertedUL', 'invertedUR'); }

        // シャッフル
        var shuffled = [];
        var copy = pool.slice();
        while (copy.length > 0) shuffled.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);

        var eventCount = Math.min(22, 14 + stage);
        for (var i = 0; i < eventCount; i++) {
            // 最大3パターン同時出現
            var simultaneous = 1 + Math.floor(Math.random() * 3); // 1~3
            for (var s = 0; s < simultaneous && i + s < eventCount; s++) {
                var pat = shuffled[(i + s) % shuffled.length];
                waveScript.push({ time: t, pattern: pat });
            }
            i += simultaneous - 1;
            t += Math.max(150, Math.floor(360 / stageScale));
        }
        bossInterval = t + 300;
    }

    function executeWaveEvent(pat) {
        switch (pat) {
            case 'formation': spawnDriftFormation(); break;
            case 'topAimed': spawnTopAimedWave(); break;
            case 'topAimedHeavy': spawnTopAimedWave(6 + Math.floor(Math.random() * 3)); break;
            case 'mediumEscort':
                spawnEnemy('medium');
                for (var j = 0; j < 5; j++) spawnEnemy('small');
                break;
            case 'largeTank':
                spawnEnemy('large');
                for (var j = 0; j < 6; j++) spawnEnemy('small');
                break;
            case 'dualTurret':
                spawnDualTurrets();
                break;
            case 'invertedUL':
                spawnInvertedU(0);
                break;
            case 'invertedUR':
                spawnInvertedU(1);
                break;
            case 'sCurveL':
                spawnSCurveFormation(1);
                break;
            case 'sCurveR':
                spawnSCurveFormation(-1);
                break;
            case 'zCurveL':
                spawnZCurveFormation(1);
                break;
            case 'zCurveR':
                spawnZCurveFormation(-1);
                break;
        }
    }

    // ボス種類: 星弾/楔弾/氷弾/札弾
    var BOSS_KINDS = ['star', 'wedge', 'ice', 'seal'];
    var BOSS_BODY_COLORS = {
        star:  { main: '#cc2222', dark: '#991111', halo: '#ffaa88' },
        wedge: { main: '#6644cc', dark: '#3322aa', halo: '#aa88ff' },
        ice:   { main: '#3399dd', dark: '#1166aa', halo: '#aaddff' },
        seal:  { main: '#dd9922', dark: '#aa6600', halo: '#ffd888' }
    };
    // 新スプライト準拠の色 index
    //  Sheet1 (16色, 16x16, wedge/ice/seal/小弾/小星弾): 0=灰 1=赤橙 2=赤 3=桃 4=紫 5=青紫 6=青 7=水 8=淡水 9=緑 10=淡緑 11=黄緑 12=黄 13=黃橙 14=橙 15=灰
    //  Sheet2/3 (8色, 32x32, star/large/medium): 0=灰 1=赤 2=紫 3=青 4=水 5=緑 6=黃 7=白
    var BOSS_ACCENT_COL = { star: 1, wedge: 4, ice: 8, seal: 12 };

    function spawnBoss() {
        bossActive = true;
        var kind = BOSS_KINDS[Math.floor(Math.random() * BOSS_KINDS.length)];
        boss = {
            x: W / 2, y: -40,
            hp: 600,
            maxHp: 600,
            size: 30, phase: 0, phaseTimer: 0,
            fireTimer: 0, age: 0, entering: true, firing: false,
            // ボス種類
            bulletKind: kind,
            // 大技（スペルカード）
            spellActive: false, spellsUsed: [], spellIdx: -1,
            spellTimer: 0, spellDuration: 0, spellFlash: 0,
            // 移動モード
            moveMode: 'sine', moveTimer: 0,
            targetX: W / 2, targetY: 70,
            dashTargetX: W / 2, dashTargetY: 70,
            // スポナー召喚タイマー（最初の召喚までの時間）
            spawnerTimer: 540
        };
    }

    // ボスの弾属性を弾オブジェクト用の {bulletType, size, color, spin} に変換
    function bossBulletShape(sizeHint) {
        var k = (boss && boss.bulletKind) || 'star';
        if (k === 'star')  return { bulletType: 'star',  size: sizeHint + 2, color: BOSS_ACCENT_COL.star, spin: Math.random() * Math.PI * 2 };
        if (k === 'wedge') return { bulletType: 'wedge', size: sizeHint, color: BOSS_ACCENT_COL.wedge };
        if (k === 'ice')   return { bulletType: 'ice',   size: sizeHint, color: Math.floor(Math.random() * 16) };
        if (k === 'seal')  return { bulletType: 'seal',  size: sizeHint, color: BOSS_ACCENT_COL.seal };
        return { bulletType: 'medium', size: sizeHint, color: 0 };
    }

    function moveEnemy(e) {
        if (e.pattern === 'straight') { e.y += e.speed; }
        else if (e.pattern === 'sine') {
            e.y += e.speed;
            var target = e.baseX + Math.sin(e.age * 0.04) * 40;
            e.x = Math.max(e.size, Math.min(W - e.size, target));
        }
        else if (e.pattern === 'drift') { e.x += e.dir * e.speed * 1.5; e.y += Math.sin(e.age * 0.02) * 0.5; }
        else if (e.pattern === 'hover') {
            if (e.y < e.targetY) e.y += e.speed;
            e.x += Math.sin(e.age * 0.015) * 0.8;
            e.x = Math.max(e.size, Math.min(W - e.size, e.x));
        }
        else if (e.pattern === 'topHover') {
            if (e.y < e.targetY) { e.y += e.speed; }
            else { e.hoverTime++; if (e.hoverTime >= e.maxHover) e.y += e.speed * 1.5; }
        }
        else if (e.pattern === 'sineDrift') {
            e.x += e.dir * e.speed * 1.3;
            e.y = e.baseY + Math.sin(e.age * 0.05) * 30;
        }
        else if (e.pattern === 'arcPath') {
            e.pathT += e.pathSpeed;
            if (e.pathT < 0) {
                e.x = e.pathStartX; e.y = H + 30;
            } else if (e.pathT <= 1) {
                e.x = e.pathStartX + (e.pathEndX - e.pathStartX) * e.pathT;
                e.y = (H + 30) - Math.sin(e.pathT * Math.PI) * (H + 30 - e.pathPeakY);
            } else {
                e.y += 4;
            }
        }
        else if (e.pattern === 'sCurve') {
            e.y += e.speed;
            if (e.y > -10) {
                // S字: 上→中央寄り膨らみ→下へ。振幅を画面内に収める
                var u = Math.max(0, Math.min(1, e.y / H));
                var swing = Math.sin(u * Math.PI * 2) * 100;
                e.x = e.entryX + e.entrySide * swing;
                if (e.x < 20) e.x = 20;
                if (e.x > W - 20) e.x = W - 20;
            }
        }
        else if (e.pattern === 'zCurve') {
            e.y += e.speed;
            if (e.y > 0) {
                var zone = Math.floor(Math.min(H - 1, e.y) / (H / 3)); // 0,1,2
                var horzDir = (zone === 1) ? -e.entrySide : e.entrySide;
                e.x += horzDir * 1.7;
                if (e.x < 20) e.x = 20;
                if (e.x > W - 20) e.x = W - 20;
            }
        }
        else if (e.pattern === 'spawnerHover') {
            if (e.y < e.targetSy) e.y += e.speed;
            else e.x += Math.sin(e.age * 0.03) * 0.4;
        }
    }

    function updateEnemies() {
        if (bossActive) {
            updateBoss();
            // ボス戦中もスポナーは個別に更新（enemies配列に同居）
            for (var i = enemies.length - 1; i >= 0; i--) {
                var e = enemies[i];
                if (e.type !== 'spawner') { enemies.splice(i, 1); continue; }
                e.age++;
                moveEnemy(e);
                e.fireTimer++;
                if (e.fireTimer >= e.fireRate && e.y > 0) { e.fireTimer = 0; fireEnemyBullet(e); }
                if (e.lifetime !== undefined) { e.lifetime--; if (e.lifetime <= 0) e.hp = 0; }
                if (e.hp <= 0) { enemyDestroyed(e); enemies.splice(i, 1); continue; }
            }
            return;
        }
        waveTimer++;

        // プラクティス（道中パターン）: 既存敵が全滅したら成功
        if (practiceMode) {
            for (var i = enemies.length - 1; i >= 0; i--) {
                var e = enemies[i]; e.age++;
                moveEnemy(e);
                e.fireTimer++;
                if (e.fireTimer >= e.fireRate && e.y > 10 && e.y < H * 0.65) { e.fireTimer = 0; fireEnemyBullet(e); }
                if (e.hp <= 0) { enemyDestroyed(e); enemies.splice(i, 1); continue; }
                if (e.y > H + 40 || e.x < -40 || e.x > W + 40) enemies.splice(i, 1);
            }
            if (waveTimer > 5 && enemies.length === 0) practiceEnd('cleared');
            return;
        }

        if (preBoss) {
            // 新しい敵は出さない。既存の敵は通常移動のまま
            for (var i = enemies.length - 1; i >= 0; i--) {
                var e = enemies[i]; e.age++;
                moveEnemy(e);
                e.fireTimer++;
                if (e.fireTimer >= e.fireRate && e.y > 10 && e.y < H * 0.65) { e.fireTimer = 0; fireEnemyBullet(e); }
                if (e.hp <= 0) { enemyDestroyed(e); enemies.splice(i, 1); continue; }
                if (e.y > H + 40 || e.x < -40 || e.x > W + 40) enemies.splice(i, 1);
            }
            if (enemies.length === 0) {
                forceCollectAllItems();
                for (var j = 0; j < eBullets.length; j++) spawnDeleteEffect(eBullets[j].x, eBullets[j].y);
                eBullets = [];
                preBoss = false; spawnBoss();
            }
            return;
        }

        // Wave Script: 定義されたパターンに従って出現
        while (waveScriptIdx < waveScript.length && waveTimer >= waveScript[waveScriptIdx].time) {
            executeWaveEvent(waveScript[waveScriptIdx].pattern);
            waveScriptIdx++;
        }

        if (waveTimer >= bossInterval) {
            waveTimer = 0; waveIndex++;
            preBoss = true;
            return;
        }

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i]; e.age++;
            moveEnemy(e);

            e.fireTimer++;
            if (e.fireTimer >= e.fireRate && e.y > 10 && e.y < H * 0.65) { e.fireTimer = 0; fireEnemyBullet(e); }
            if (e.hp <= 0) { enemyDestroyed(e); enemies.splice(i, 1); continue; }
            if (e.y > H + 40 || e.x < -40 || e.x > W + 40) enemies.splice(i, 1);
        }
    }

    function fireEnemyBullet(e) {
        var angle = Math.atan2(player.y - e.y, player.x - e.x);
        var spd = (1.5 + Math.random() * 0.5) * diff.speed;
        var sz = e.type === 'small' ? 3 : e.type === 'medium' ? 5 : 6;
        var bt = e.type === 'large' ? 'large' : e.type === 'medium' ? 'medium' : 'small';
        var bp = e.bulletPattern || 'down';
        // Assign sprite color based on bullet pattern
        var col = bp === 'aimed' ? 0 : bp === 'way3' ? 3 : bp === 'way5' ? 4 :
                  bp === 'circle' ? 5 : bp === 'diagonal' ? 1 : bp === 'random' ? 6 :
                  bp === 'spread' ? 2 : bp === 'cross' ? 4 : bp === 'fan' ? 2 :
                  bp === 'split' ? 1 : 0;

        switch (bp) {
            case 'down': {
                // 縦方向の連射（Easy 3 / Normal 5 / Hard 7 / Lunatic 9）
                var base = Math.PI / 2;
                var n = diff.wayCount;
                var half = (n - 1) / 2;
                for (var i = 0; i < n; i++) {
                    var k = i - half;
                    var a = base + k * 0.12;
                    eBullets.push({ x: e.x + k * 6, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'way3': {
                var base = Math.PI / 2;
                var n = diff.wayCount;
                var half = (n - 1) / 2;
                for (var i = 0; i < n; i++) {
                    var k = i - half;
                    var a = base + k * 0.3;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'way5': {
                var base = Math.PI / 2;
                var n = diff.wayCount + 2; // way3より常に密度が高い
                var half = (n - 1) / 2;
                for (var i = 0; i < n; i++) {
                    var k = i - half;
                    var a = base + k * 0.25;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'circle': {
                var n = Math.max(3, Math.floor(5 * diff.bullets));
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + e.age * 0.03;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd * 0.8, vy: Math.sin(a) * spd * 0.8, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'aimed': {
                // 自機狙い: Easy 1 / Normal 3 / Hard 5 / Lunatic 7
                var n = diff.aimedCount;
                if (n <= 1) {
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: sz, grazed: false, color: col, bulletType: bt });
                } else {
                    var spread = 0.18 + 0.04 * (n - 3); // 弾数増加に合わせて扇を広げる
                    for (var i = 0; i < n; i++) {
                        var a = angle - spread + (spread * 2 / (n - 1)) * i;
                        eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col, bulletType: bt });
                    }
                }
                break;
            }
            case 'diagonal': {
                // 3方向: 自機側斜め、反対斜め、真下
                var dirX = e.x < W / 2 ? 1 : -1;
                eBullets.push({ x: e.x, y: e.y, vx: dirX * spd * 0.7, vy: spd * 0.7, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x, y: e.y, vx: -dirX * spd * 0.5, vy: spd * 0.85, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x, y: e.y, vx: 0, vy: spd, size: sz, grazed: false, color: col, bulletType: bt });
                break;
            }
            case 'random': {
                // 最低3発確保
                var n = e.type === 'large' ? 5 : (e.type === 'medium' ? 4 : 3);
                for (var i = 0; i < n; i++) {
                    var a = Math.PI * 0.15 + Math.random() * Math.PI * 0.7;
                    var s = spd * (0.7 + Math.random() * 0.6);
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'spread': {
                // 全方向バラマキ（弾幕STG風）
                var n = e.type === 'large' ? Math.floor(12 * diff.bullets) :
                        e.type === 'medium' ? Math.floor(8 * diff.bullets) :
                        Math.floor(5 * diff.bullets);
                var offset = e.age * 0.08; // 回転するバラマキ
                var s = spd * 0.7;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + offset;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'cross': {
                // 十字4方向 + 自機狙い（aimedCount発）
                var rot = e.age * 0.04;
                for (var i = 0; i < 4; i++) {
                    var a = rot + (Math.PI * 2 / 4) * i;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd * 0.9, vy: Math.sin(a) * spd * 0.9, size: sz, grazed: false, color: col, bulletType: bt });
                }
                var an = diff.aimedCount;
                if (an <= 1) {
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd * 1.1, vy: Math.sin(angle) * spd * 1.1, size: sz, grazed: false, color: 0, bulletType: bt });
                } else {
                    var asp = 0.18 + 0.04 * (an - 3);
                    for (var i = 0; i < an; i++) {
                        var aa = angle - asp + (asp * 2 / (an - 1)) * i;
                        eBullets.push({ x: e.x, y: e.y, vx: Math.cos(aa) * spd * 1.1, vy: Math.sin(aa) * spd * 1.1, size: sz, grazed: false, color: 0, bulletType: bt });
                    }
                }
                break;
            }
            case 'fan': {
                // 広角扇（下向き±60度）、弾数は wayCount+2（5/7/9/11）
                var base = Math.PI / 2;
                var half = Math.PI / 3;
                var n = diff.wayCount + 2;
                for (var i = 0; i < n; i++) {
                    var a = base - half + (half * 2 / (n - 1)) * i;
                    var s = spd * (0.8 + (i % 2) * 0.2);
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: sz, grazed: false, color: col, bulletType: bt });
                }
                break;
            }
            case 'split': {
                // 左右の平行ストリーム（各2発＝4発）＋真下1発
                var sideSpd = spd * 0.9;
                var sideAng = Math.PI / 2 + 0.5;
                var sideAng2 = Math.PI / 2 - 0.5;
                eBullets.push({ x: e.x - 6, y: e.y, vx: Math.cos(sideAng) * sideSpd, vy: Math.sin(sideAng) * sideSpd, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x - 10, y: e.y + 4, vx: Math.cos(sideAng) * sideSpd, vy: Math.sin(sideAng) * sideSpd, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x + 6, y: e.y, vx: Math.cos(sideAng2) * sideSpd, vy: Math.sin(sideAng2) * sideSpd, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x + 10, y: e.y + 4, vx: Math.cos(sideAng2) * sideSpd, vy: Math.sin(sideAng2) * sideSpd, size: sz, grazed: false, color: col, bulletType: bt });
                eBullets.push({ x: e.x, y: e.y, vx: 0, vy: spd, size: sz, grazed: false, color: col, bulletType: bt });
                break;
            }
            case 'spawnerRing': {
                // スポナー: 全方位リング（ボスの弾種で） + 自機狙い3発
                var kind = e.spawnerKind || 'star';
                var bulletMap = {
                    star:  { bulletType: 'star',  size: 5, color: BOSS_ACCENT_COL.star },
                    wedge: { bulletType: 'wedge', size: 4, color: BOSS_ACCENT_COL.wedge },
                    ice:   { bulletType: 'ice',   size: 4, color: BOSS_ACCENT_COL.ice },
                    seal:  { bulletType: 'seal',  size: 4, color: BOSS_ACCENT_COL.seal }
                };
                var sh = bulletMap[kind] || bulletMap.star;
                var ringSpd = spd * 0.8;
                var n = Math.max(6, Math.floor(7 * diff.bullets));
                var rot = e.age * 0.06;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + rot;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * ringSpd, vy: Math.sin(a) * ringSpd, size: sh.size, grazed: false, color: sh.color, bulletType: sh.bulletType, spin: Math.random() * Math.PI * 2 });
                }
                var an = diff.aimedCount;
                if (an <= 1) {
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: sh.size, grazed: false, color: 0, bulletType: sh.bulletType, spin: Math.random() * Math.PI * 2 });
                } else {
                    var asp = 0.2 + 0.04 * (an - 3);
                    for (var i = 0; i < an; i++) {
                        var a2 = angle - asp + (asp * 2 / (an - 1)) * i;
                        eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a2) * spd, vy: Math.sin(a2) * spd, size: sh.size, grazed: false, color: 0, bulletType: sh.bulletType, spin: Math.random() * Math.PI * 2 });
                    }
                }
                break;
            }
            case 'turretDual': {
                // 自機狙い広角扇（中弾）: aimedCount+2 (3/5/7/9)
                var aimedN = diff.aimedCount + 2;
                var aimedSpread = 0.5;
                if (aimedN <= 1) {
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 5, grazed: false, color: 0, bulletType: 'medium' });
                } else {
                    for (var i = 0; i < aimedN; i++) {
                        var a = angle - aimedSpread + (aimedSpread * 2 / (aimedN - 1)) * i;
                        eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: 5, grazed: false, color: 0, bulletType: 'medium' });
                    }
                }
                // 回転全方位（大弾）: 左の敵は左回転、右の敵は右回転
                var spinN = Math.floor(10 * diff.bullets);
                var spinDir = e.spinDir || 1;
                var spinOffset = e.age * 0.06 * spinDir;
                var s = spd * 0.65;
                for (var i = 0; i < spinN; i++) {
                    var a = (Math.PI * 2 / spinN) * i + spinOffset;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 6, grazed: false, color: 5, bulletType: 'large' });
                }
                break;
            }
        }
    }

    function enemyDestroyed(e) {
        spawnExplosion(e.x, e.y, '#ff4444', e.size > 14 ? 12 : 6);
        if (e.type === 'spawner') {
            spawnExplosion(e.x, e.y, '#ffffff', 16);
            score += 1500;
            // スポナーはアイテムを落とさない
            return;
        }
        score += e.type === 'small' ? 100 : e.type === 'medium' ? 500 : 2000;
        if (practiceMode) return; // プラクティス中はアイテムを落とさない
        if (e.type === 'small') {
            var r = Math.random();
            if (r < 0.35) spawnItems(e.x, e.y, 'powerS', 1);
            else if (r < 0.45) { spawnItems(e.x, e.y, 'powerS', 1); spawnItems(e.x, e.y, 'scoreS', 1); }
            else spawnItems(e.x, e.y, 'scoreS', 1);
        } else if (e.type === 'medium') {
            spawnItems(e.x, e.y, 'score', 1);
            spawnItems(e.x, e.y, 'powerS', 2);
            if (Math.random() < 0.5) spawnItems(e.x, e.y, 'power', 1);
            else spawnItems(e.x, e.y, 'scoreS', 2);
        } else if (e.type === 'large') {
            spawnItems(e.x, e.y, 'score', 3); spawnItems(e.x, e.y, 'scoreS', 5);
            spawnItems(e.x, e.y, 'power', 2); spawnItems(e.x, e.y, 'powerS', 4);
            var rng = Math.random();
            if (rng < 0.15) spawnItems(e.x, e.y, 'life', 1);
            else if (rng < 0.35) spawnItems(e.x, e.y, 'bomb', 1);
        }
    }

    function drawEnemies() {
        var useSpriteL = isSpriteReady('bulletL');
        var useMagic = isSpriteReady('magicCircle');
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            ctx.save(); ctx.translate(e.x, e.y);

            if (e.type === 'spawner') {
                // スポナー: 小さい魔法陣 + 白い大弾スプライト
                if (useMagic) {
                    ctx.save();
                    ctx.rotate(e.age * 0.04);
                    ctx.globalAlpha = 0.55;
                    var mcSize = e.size * 4.2;
                    ctx.drawImage(sprites.magicCircle, -mcSize / 2, -mcSize / 2, mcSize, mcSize);
                    ctx.restore();
                }
                if (useSpriteL) {
                    // col=7 (白) の大弾を 32x32 で正方形描画（魔法陣と中心を合わせる）
                    var bs = e.size * 2.2;
                    ctx.drawImage(sprites.bulletL, 7 * 32, 0, 32, 32, -bs / 2, -bs / 2, bs, bs);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(0, 0, e.size, 0, Math.PI * 2); ctx.fill();
                }
                // スポナーはHPバー非表示（破壊可能・寿命でも消滅）
                ctx.restore();
                continue;
            }

            ctx.fillStyle = e.type === 'large' ? '#ff3333' : e.type === 'medium' ? '#cc4444' : '#aa3333';
            ctx.beginPath();
            ctx.moveTo(0, e.size); ctx.lineTo(-e.size, -e.size * 0.3);
            ctx.lineTo(0, -e.size * 0.6); ctx.lineTo(e.size, -e.size * 0.3);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath();
            ctx.arc(0, 0, e.size * 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    // ===== Boss =====
    function updateBoss() {
        if (!boss) return; boss.age++;
        if (boss.entering) { boss.y += 1; if (boss.y >= 70) boss.entering = false; return; }

        // 大技（スペルカード）発動判定（プラクティス中はHP連動スイッチを行わない）
        var hpRatio = boss.hp / boss.maxHp;
        if (!boss.spellActive && !practiceMode) {
            if (hpRatio <= 0.7 && boss.spellsUsed.indexOf(0) === -1) startSpellcard(0);
            else if (hpRatio <= 0.35 && boss.spellsUsed.indexOf(1) === -1) startSpellcard(1);
        }

        if (boss.spellActive) {
            updateSpellcard();
        } else {
            updateBossMovement();
            boss.phaseTimer++; boss.fireTimer++;
            var fireRate = Math.floor(30 / diff.bullets);
            if (boss.fireTimer >= fireRate) { boss.fireTimer = 0; fireBossBullets(); }
            if (boss.phaseTimer > 360) {
                if (practiceMode) {
                    // プラクティスはフェーズ固定。タイマーだけリセット
                    boss.phaseTimer = 0; boss.moveTimer = 0;
                } else {
                    boss.phase++; boss.phaseTimer = 0; boss.moveTimer = 0; onBossPhaseChange();
                }
            }

            // 定期的にスポナーを召喚（プラクティスでは無効）
            if (!practiceMode && boss.spawnerTimer !== undefined) {
                boss.spawnerTimer--;
                if (boss.spawnerTimer <= 0 && countActiveSpawners() < 3) {
                    summonBossSpawners();
                    boss.spawnerTimer = 900 + Math.floor(Math.random() * 180); // 次の召喚まで15-18秒
                }
            }
        }

        boss.firing = true;
        if (boss.spellFlash > 0) boss.spellFlash--;
        if (boss.hp <= 0) bossDefeated();
    }

    function countActiveSpawners() {
        var c = 0;
        for (var i = 0; i < enemies.length; i++) if (enemies[i].type === 'spawner') c++;
        return c;
    }

    function summonBossSpawners() {
        var positions = [
            { x: 80, y: 120 },
            { x: W - 80, y: 120 },
            { x: W / 2, y: 170 }
        ];
        // 2体ランダム選択
        var indices = [0, 1, 2];
        for (var j = indices.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
        }
        var count = 2;
        for (var i = 0; i < count; i++) {
            var p = positions[indices[i]];
            enemies.push({
                x: p.x, y: -20,
                targetSx: p.x, targetSy: p.y,
                hp: 30, maxHp: 30, speed: 1.5,
                type: 'spawner',
                pattern: 'spawnerHover',
                fireRate: Math.floor(55 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 40),
                size: 14, age: 0, baseX: 0, dir: 1,
                bulletPattern: 'spawnerRing',
                spawnerKind: (boss && boss.bulletKind) || 'star',
                lifetime: 720
            });
        }
        spawnExplosion(boss.x, boss.y, '#ffffff', 12);
    }

    function onBossPhaseChange() {
        var p = boss.phase % 4;
        if (p === 0) boss.moveMode = 'sine';
        else if (p === 1) boss.moveMode = 'center';
        else if (p === 2) boss.moveMode = 'dash';
        else boss.moveMode = 'figure8';
    }

    function updateBossMovement() {
        boss.moveTimer++;
        var m = boss.moveMode;
        if (m === 'sine') {
            boss.x += Math.sin(boss.age * 0.012) * 1.6;
            boss.y = 70 + Math.sin(boss.age * 0.018) * 8;
        } else if (m === 'center') {
            boss.x += (W / 2 - boss.x) * 0.04;
            boss.y += (80 - boss.y) * 0.04;
        } else if (m === 'dash') {
            if (boss.moveTimer % 90 === 1) {
                boss.dashTargetX = 70 + Math.random() * (W - 140);
                boss.dashTargetY = 50 + Math.random() * 50;
            }
            boss.x += (boss.dashTargetX - boss.x) * 0.12;
            boss.y += (boss.dashTargetY - boss.y) * 0.12;
        } else if (m === 'figure8') {
            var cx = W / 2, cy = 80, rx = 110, ry = 30;
            var t = boss.moveTimer * 0.02;
            boss.x = cx + Math.sin(t) * rx;
            boss.y = cy + Math.sin(t * 2) * ry;
        }
        if (boss.x < 50) boss.x = 50;
        if (boss.x > W - 50) boss.x = W - 50;
        if (boss.y < 40) boss.y = 40;
        if (boss.y > 160) boss.y = 160;
    }

    function pushBossBullet(x, y, vx, vy, shapeOverride) {
        var sh = shapeOverride || bossBulletShape(5);
        var spinVal = sh.spin !== undefined ? sh.spin : Math.random() * Math.PI * 2;
        // 星弾は少しゆっくりに
        if (sh.bulletType === 'star') { vx *= 0.8; vy *= 0.8; }
        eBullets.push({ x: x, y: y, vx: vx, vy: vy, size: sh.size, grazed: false, color: sh.color, bulletType: sh.bulletType, spin: spinVal });
    }

    function fireBossBullets() {
        var spd = 2 * diff.speed, phase = boss.phase % 4;
        if (phase === 0) {
            // 自機狙い扇: Easy 1 / Normal 3 / Hard 5 / Lunatic 7
            var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            var n = diff.aimedCount;
            if (n <= 1) {
                pushBossBullet(boss.x, boss.y + boss.size, Math.cos(angle) * spd, Math.sin(angle) * spd);
            } else {
                var spread = 0.3 + 0.08 * (n - 3); // 弾数に応じて扇を広げる
                for (var i = 0; i < n; i++) {
                    var a = angle - spread + (spread * 2 / (n - 1)) * i;
                    pushBossBullet(boss.x, boss.y + boss.size, Math.cos(a) * spd, Math.sin(a) * spd);
                }
            }
        } else if (phase === 1) {
            // 全方位回転2層逆回転：大きめ
            var n = Math.max(6, Math.floor(7 * diff.bullets));
            for (var i = 0; i < n; i++) {
                var a = (Math.PI * 2 / n) * i + boss.age * 0.05;
                pushBossBullet(boss.x, boss.y + boss.size * 0.5, Math.cos(a) * spd * 0.9, Math.sin(a) * spd * 0.9, bossBulletShape(7));
            }
            if ((boss.phaseTimer / 18) % 2 < 1) {
                var n2 = Math.max(5, Math.floor(5 * diff.bullets));
                for (var i = 0; i < n2; i++) {
                    var a = (Math.PI * 2 / n2) * i - boss.age * 0.05;
                    pushBossBullet(boss.x, boss.y + boss.size * 0.5, Math.cos(a) * spd * 1.1, Math.sin(a) * spd * 1.1, bossBulletShape(6));
                }
            }
        } else if (phase === 2) {
            // ランダム散らし
            var n = Math.max(5, Math.floor(8 * diff.bullets));
            for (var i = 0; i < n; i++) {
                var a = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                var s = spd * (0.7 + Math.random() * 0.6);
                pushBossBullet(boss.x + (Math.random() - 0.5) * 30, boss.y + boss.size, Math.cos(a) * s, Math.sin(a) * s);
            }
        } else {
            // way (wayCount+2) + 自機狙い (aimedCount)
            var base = Math.PI / 2;
            var wn = diff.wayCount + 2;
            var whalf = (wn - 1) / 2;
            for (var i = 0; i < wn; i++) {
                var k = i - whalf;
                var a = base + k * 0.25;
                pushBossBullet(boss.x, boss.y + boss.size, Math.cos(a) * spd, Math.sin(a) * spd);
            }
            var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            var an = diff.aimedCount;
            if (an <= 1) {
                pushBossBullet(boss.x, boss.y + boss.size, Math.cos(angle) * spd * 1.2, Math.sin(angle) * spd * 1.2);
            } else {
                var asp = 0.2 + 0.05 * (an - 3);
                for (var i = 0; i < an; i++) {
                    var aa = angle - asp + (asp * 2 / (an - 1)) * i;
                    pushBossBullet(boss.x, boss.y + boss.size, Math.cos(aa) * spd * 1.2, Math.sin(aa) * spd * 1.2);
                }
            }
        }
    }

    // ===== Boss Spellcard（大技） =====
    function startSpellcard(idx) {
        boss.spellActive = true;
        boss.spellIdx = idx;
        boss.spellTimer = 0;
        boss.spellDuration = 540; // 約9秒
        boss.spellFlash = 30;
        boss.spellsUsed.push(idx);
        // 発動演出: 画面の敵弾を一掃（通常弾消去エフェクト）
        for (var i = 0; i < eBullets.length; i++) spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
        eBullets = [];
        spawnExplosion(boss.x, boss.y, '#ffff88', 30);
        for (var c = 0; c < 6; c++) {
            spawnExplosion(boss.x, boss.y, c % 2 === 0 ? '#ff4444' : '#ffaaff', 12);
        }
        boss.dashTargetX = boss.x; boss.dashTargetY = boss.y;
    }

    function updateSpellcard() {
        boss.spellTimer++;
        if (boss.spellIdx === 0) {
            // 大技1: 中央固定で逆回転する2層リング＋周期的な自機狙い
            boss.x += (W / 2 - boss.x) * 0.05;
            boss.y += (80 - boss.y) * 0.05;
            var t = boss.spellTimer;

            if (t % 10 === 0) {
                var n = Math.max(8, Math.floor(10 * diff.bullets));
                var rot = t * 0.04;
                var s = 1.8 * diff.speed;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + rot;
                    pushBossBullet(boss.x, boss.y, Math.cos(a) * s, Math.sin(a) * s);
                }
            }
            if (t % 14 === 4) {
                var n = Math.max(6, Math.floor(8 * diff.bullets));
                var rot = -t * 0.05;
                var s = 2.3 * diff.speed;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + rot;
                    pushBossBullet(boss.x, boss.y, Math.cos(a) * s, Math.sin(a) * s, bossBulletShape(6));
                }
            }
            if (t % 100 === 80) {
                var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                var bn = diff.aimedCount + 2; // 大技中の自機狙いはやや多め (3/5/7/9)
                if (bn <= 1) {
                    pushBossBullet(boss.x, boss.y, Math.cos(angle) * 2.8 * diff.speed, Math.sin(angle) * 2.8 * diff.speed);
                } else {
                    var bsp = 0.16 + 0.04 * (bn - 3);
                    for (var i = 0; i < bn; i++) {
                        var a = angle - bsp + (bsp * 2 / (bn - 1)) * i;
                        pushBossBullet(boss.x, boss.y, Math.cos(a) * 2.8 * diff.speed, Math.sin(a) * 2.8 * diff.speed);
                    }
                }
            }
        } else if (boss.spellIdx === 1) {
            // 大技2: ワープ移動＋放射爆発＋回転リング
            var dashInterval = 110;
            if (boss.spellTimer % dashInterval === 1) {
                boss.dashTargetX = 70 + Math.random() * (W - 140);
                boss.dashTargetY = 55 + Math.random() * 50;
            }
            boss.x += (boss.dashTargetX - boss.x) * 0.1;
            boss.y += (boss.dashTargetY - boss.y) * 0.1;

            var t = boss.spellTimer;
            if (t % 8 === 0) {
                var n = Math.max(9, Math.floor(12 * diff.bullets));
                var rot = t * 0.03;
                var s = 1.6 * diff.speed;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + rot;
                    pushBossBullet(boss.x, boss.y, Math.cos(a) * s, Math.sin(a) * s, bossBulletShape(5));
                }
            }
            if (t % dashInterval === dashInterval - 10) {
                var n = Math.max(16, Math.floor(24 * diff.bullets));
                var s = 2.5 * diff.speed;
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + Math.random() * 0.08;
                    var ss = s * (0.75 + Math.random() * 0.5);
                    pushBossBullet(boss.x, boss.y, Math.cos(a) * ss, Math.sin(a) * ss);
                }
                spawnExplosion(boss.x, boss.y, '#ffaa44', 18);
            }
            if (t % 70 === 50) {
                var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                var bn = diff.aimedCount;
                if (bn <= 1) {
                    pushBossBullet(boss.x, boss.y, Math.cos(angle) * 3 * diff.speed, Math.sin(angle) * 3 * diff.speed);
                } else {
                    var bsp = 0.22 + 0.04 * (bn - 3);
                    for (var i = 0; i < bn; i++) {
                        var a = angle - bsp + (bsp * 2 / (bn - 1)) * i;
                        pushBossBullet(boss.x, boss.y, Math.cos(a) * 3 * diff.speed, Math.sin(a) * 3 * diff.speed);
                    }
                }
            }
        }

        if (boss.spellTimer >= boss.spellDuration) endSpellcard();
    }

    function endSpellcard() {
        if (practiceMode) {
            // プラクティスは大技を繰り返しループさせる
            boss.spellTimer = 0;
            return;
        }
        boss.spellActive = false;
        for (var i = 0; i < eBullets.length; i++) spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
        eBullets = [];
        boss.phaseTimer = 0;
        boss.fireTimer = 0;
        boss.moveTimer = 0;
        onBossPhaseChange();
    }

    function bossDefeated() {
        score += 10000;
        spawnExplosion(boss.x, boss.y, '#ffdd44', 20);
        if (practiceMode) {
            for (var i = 0; i < eBullets.length; i++) spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
            eBullets = []; boss = null; bossActive = false;
            for (var j = enemies.length - 1; j >= 0; j--) {
                if (enemies[j].type === 'spawner') enemies.splice(j, 1);
            }
            practiceEnd('cleared');
            return;
        }
        spawnItems(boss.x, boss.y, 'score', 5); spawnItems(boss.x, boss.y, 'scoreS', 10);
        spawnItems(boss.x, boss.y, 'power', 3);
        if (Math.random() > 0.5) spawnItems(boss.x, boss.y, 'life', 1);
        else spawnItems(boss.x, boss.y, 'bomb', 1);
        for (var i = 0; i < eBullets.length; i++) spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
        eBullets = []; boss = null; bossActive = false;
        // 残存スポナーも消去
        for (var j = enemies.length - 1; j >= 0; j--) {
            if (enemies[j].type === 'spawner') {
                spawnExplosion(enemies[j].x, enemies[j].y, '#ffffff', 8);
                enemies.splice(j, 1);
            }
        }
        waveTimer = 0;
        buildWaveScript();
    }

    function drawBoss() {
        if (!boss) return;
        var colors = BOSS_BODY_COLORS[boss.bulletKind] || BOSS_BODY_COLORS.star;
        ctx.save(); ctx.translate(boss.x, boss.y);

        // 大技発動フラッシュ（発動直後の光の波紋）
        if (boss.spellFlash > 0) {
            var t = 1 - boss.spellFlash / 30;
            ctx.save();
            var flashR = boss.size + 120 * t;
            var grd = ctx.createRadialGradient(0, 0, flashR * 0.2, 0, 0, flashR);
            grd.addColorStop(0, 'rgba(255,255,200,' + (0.6 * (1 - t)) + ')');
            grd.addColorStop(0.6, 'rgba(255,120,120,' + (0.3 * (1 - t)) + ')');
            grd.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(0, 0, flashR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // 魔法陣（射撃中のみ）拡大
        if (boss.firing && !boss.entering && isSpriteReady('magicCircle')) {
            var mc = sprites.magicCircle;
            var baseSize = boss.size * (boss.spellActive ? 5.8 : 4.8);
            ctx.save();
            ctx.rotate(boss.age * 0.03);
            ctx.globalAlpha = boss.spellActive ? 0.65 : 0.55;
            ctx.drawImage(mc, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
            ctx.restore();
            if (boss.spellActive) {
                ctx.save();
                ctx.rotate(-boss.age * 0.02);
                ctx.globalAlpha = 0.35;
                var outerSize = baseSize * 1.5;
                ctx.drawImage(mc, -outerSize / 2, -outerSize / 2, outerSize, outerSize);
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        // ボス本体（種類ごとに色替え）
        ctx.fillStyle = colors.main; ctx.beginPath(); ctx.arc(0, 0, boss.size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors.dark;
        ctx.beginPath(); ctx.moveTo(-boss.size, 0); ctx.lineTo(-boss.size * 1.8, -boss.size * 0.5); ctx.lineTo(-boss.size * 0.5, -boss.size * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(boss.size, 0); ctx.lineTo(boss.size * 1.8, -boss.size * 0.5); ctx.lineTo(boss.size * 0.5, -boss.size * 0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = colors.halo; ctx.beginPath(); ctx.arc(0, 0, boss.size * 0.25, 0, Math.PI * 2); ctx.fill();

        // HPバー: 画像ベース、12時からCW方向に削れる（画像クリップ方式）
        var hpRatio = Math.max(0, boss.hp / boss.maxHp);
        var hpRadius = boss.size + 14;
        if (isSpriteReady('bossHpBar')) {
            var hb = sprites.bossHpBar;
            var hbSize = (hpRadius + 8) * 2;

            // 欠けている部分: 暗く薄いリングを下地として描画
            if (hpRatio < 1) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                var s2 = -Math.PI / 2 - Math.PI * 2 * hpRatio;
                var e2 = -Math.PI / 2;
                ctx.arc(0, 0, hbSize, s2, e2, true);
                ctx.closePath();
                ctx.clip();
                ctx.rotate(boss.age * 0.01);
                ctx.globalAlpha = 0.12;
                ctx.drawImage(hb, -hbSize / 2, -hbSize / 2, hbSize, hbSize);
                ctx.restore();
            }

            // 残HP部分: 通常表示
            if (hpRatio > 0) {
                // HPで色を変える（低いほど赤→橙→黄）
                var tintColor = hpRatio > 0.5 ? null : hpRatio > 0.25 ? '#ffaa44' : '#ffee66';
                // 着色する場合はオフスクリーンで事前合成（source-atop が他描画に波及しないため）
                var srcImg = hb;
                if (tintColor) {
                    if (!hpTintCanvas) hpTintCanvas = document.createElement('canvas');
                    if (hpTintCanvas.width !== hbSize || hpTintCanvas.height !== hbSize) {
                        hpTintCanvas.width = hbSize; hpTintCanvas.height = hbSize;
                    }
                    var tctx = hpTintCanvas.getContext('2d');
                    tctx.globalCompositeOperation = 'source-over';
                    tctx.globalAlpha = 1;
                    tctx.clearRect(0, 0, hbSize, hbSize);
                    tctx.drawImage(hb, 0, 0, hbSize, hbSize);
                    tctx.globalCompositeOperation = 'source-atop';
                    tctx.globalAlpha = 0.5;
                    tctx.fillStyle = tintColor;
                    tctx.fillRect(0, 0, hbSize, hbSize);
                    srcImg = hpTintCanvas;
                }
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                var s1 = -Math.PI / 2;
                var e1 = -Math.PI / 2 - Math.PI * 2 * hpRatio;
                ctx.arc(0, 0, hbSize, s1, e1, true);
                ctx.closePath();
                ctx.clip();
                ctx.rotate(boss.age * 0.01);
                ctx.globalAlpha = 0.95;
                ctx.drawImage(srcImg, -hbSize / 2, -hbSize / 2, hbSize, hbSize);
                ctx.restore();
            }
        } else {
            // 画像が無い場合のフォールバック
            if (hpRatio > 0) {
                ctx.strokeStyle = hpRatio > 0.5 ? '#ff2222' : hpRatio > 0.25 ? '#ff8800' : '#ffff00';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, hpRadius, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2 * hpRatio, true);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ===== Enemy Bullets =====
    function updateEBullets() {
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i]; b.x += b.vx; b.y += b.vy;
            if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) eBullets.splice(i, 1);
        }
    }
    function drawBulletStar(x, y, r, color, col, rot) {
        // 星型描画（常時回転）
        ctx.save(); ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
            var a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
            var a2 = a + Math.PI / 5;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a2) * r * 0.4, Math.sin(a2) * r * 0.4);
        }
        ctx.closePath(); ctx.fill();
        // 中心の白い点（回転の影響を受けない位置）
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    var BULLET_TYPE_COLORS = ['#ff4444', '#ff8844', '#ffff44', '#44ff44', '#44ffff', '#4444ff', '#aa44ff', '#aaaaaa', '#ffffff'];

    function drawEBullets() {
        var useSpriteS = isSpriteReady('bulletS');
        var useSpriteM = isSpriteReady('bulletM');
        var useSpriteL = isSpriteReady('bulletL');
        var useSpriteW = isSpriteReady('bulletWedge');
        var useSpriteI = isSpriteReady('bulletIce');
        var useSpriteSeal = isSpriteReady('bulletSeal');
        var useSpriteStar = isSpriteReady('bulletStar');
        var imgS = sprites.bulletS;
        var imgM = sprites.bulletM;
        var imgL = sprites.bulletL;
        for (var i = 0; i < eBullets.length; i++) {
            var b = eBullets[i];
            var col = (b.color !== undefined) ? b.color : 0;
            var bt = b.bulletType || 'small';

            if (bt === 'star') {
                // 星ごとに固有のスピン + フレーム依存の共通回転（ゆっくり）
                var spin = (b.spin !== undefined) ? b.spin : 0;
                var starRot = frame * 0.04 + spin;
                if (useSpriteStar) {
                    var drawSize = b.size * 3;
                    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(starRot);
                    ctx.drawImage(sprites.bulletStar, col * 32, 0, 32, 32, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                    ctx.restore();
                } else {
                    var starColor = BULLET_TYPE_COLORS[col] || '#ff4444';
                    drawBulletStar(b.x, b.y, b.size * 3, starColor, col, starRot);
                }
            } else if (bt === 'wedge' && useSpriteW) {
                // 楔弾: 進行方向に回転、144x16 の 9 コマ
                var drawSize = b.size * 4;
                var rot = Math.atan2(b.vy, b.vx) + Math.PI / 2;
                ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(rot);
                ctx.drawImage(sprites.bulletWedge, col * 16, 0, 16, 16, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                ctx.restore();
            } else if (bt === 'ice' && useSpriteI) {
                // 氷弾: 進行方向に回転
                var drawSize = b.size * 4;
                var rot = Math.atan2(b.vy, b.vx) + Math.PI / 2;
                ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(rot);
                ctx.drawImage(sprites.bulletIce, col * 16, 0, 16, 16, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                ctx.restore();
            } else if (bt === 'seal' && useSpriteSeal) {
                // 札弾
                var drawSize = b.size * 4;
                ctx.drawImage(sprites.bulletSeal, col * 16, 0, 16, 16, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
            } else if (bt === 'large' && useSpriteL) {
                // Large bullet sprite: 256x32, 8 cells of 32x32
                var drawSize = b.size * 5;
                ctx.drawImage(imgL, col * 32, 0, 32, 32, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
            } else if (bt === 'medium' && useSpriteM) {
                // Medium bullet sprite: 256x32, 8 cells of 32x32
                var drawSize = b.size * 4;
                ctx.drawImage(imgM, col * 32, 0, 32, 32, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
            } else if (useSpriteS) {
                var drawSize = b.size * 4;
                ctx.drawImage(imgS, col * 16, 0, 16, 16, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
            } else {
                ctx.fillStyle = 'rgba(255,136,136,0.9)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    // ===== Particles =====
    function spawnExplosion(x, y, color, n) { for (var i = 0; i < n; i++) spawnParticle(x, y, color, 2 + Math.random() * 3); }
    function spawnParticle(x, y, color, size) {
        var a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
        particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 25, maxLife: 25, size: size, color: color });
    }
    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }
    function drawParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    // ===== Graze =====
    function checkGraze() {
        if (invTimer > 0 || bombTimer > 0) return;
        for (var i = 0; i < eBullets.length; i++) {
            var b = eBullets[i]; if (b.grazed) continue;
            var dx = b.x - player.x, dy = b.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var bHitSize = b.size * 0.4;
            if (dist < GRAZE_RADIUS && dist > PLAYER_HITBOX + bHitSize) {
                b.grazed = true; graze++; score += 10;
                spawnParticle(player.x + dx * 0.3, player.y + dy * 0.3, '#ffffff', 1);
            }
        }
    }

    // ===== Collision =====
    function checkCollisions() {
        for (var i = pBullets.length - 1; i >= 0; i--) {
            var b = pBullets[i];
            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];
                if (Math.abs(b.x - e.x) < e.size + 4 && Math.abs(b.y - e.y) < e.size + 4) {
                    e.hp -= 1; pBullets.splice(i, 1); spawnParticle(b.x, b.y, '#ffffff', 1); break;
                }
            }
            if (boss && !boss.entering && i < pBullets.length) {
                var b2 = pBullets[i];
                if (b2 && Math.abs(b2.x - boss.x) < boss.size + 4 && Math.abs(b2.y - boss.y) < boss.size + 4) {
                    boss.hp -= 1; pBullets.splice(i, 1); spawnParticle(b2.x, b2.y, '#ffffff', 1);
                }
            }
        }
        checkGraze();
        if (invTimer > 0 || bombTimer > 0) return;
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i]; var dx = b.x - player.x, dy = b.y - player.y;
            // 当たり判定は弾の中心部分のみ（見た目の40%）
            var hitSize = b.size * 0.4;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + hitSize) * (PLAYER_HITBOX + hitSize)) { eBullets.splice(i, 1); playerHit(); return; }
        }
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i]; var dx = e.x - player.x, dy = e.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + e.size * 0.4) * (PLAYER_HITBOX + e.size * 0.4)) { playerHit(); return; }
        }
        if (boss && !boss.entering) {
            var dx = boss.x - player.x, dy = boss.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + boss.size * 0.5) * (PLAYER_HITBOX + boss.size * 0.5)) playerHit();
        }
    }

    function playerHit() {
        if (practiceMode) {
            spawnExplosion(player.x, player.y, '#ffffff', 12);
            eBullets = [];
            practiceEnd('miss');
            return;
        }
        lives--;
        bombs = MAX_BOMBS; // 残機減少時ボム初期化
        invTimer = INVINCIBLE_FRAMES;
        var px = player.x, py = player.y;
        var oldPower = power;
        power = Math.max(MIN_POWER, power - 100); // -1.00
        var lost = oldPower - power;
        if (lost > 0) {
            var dropRate = 0.4 + Math.random() * 0.2;
            var dropAmount = Math.floor(lost * dropRate);
            var bigCount = Math.floor(dropAmount / 10);
            var smallCount = dropAmount - bigCount * 10;
            if (bigCount > 0) spawnDeathPowerItems(px, py, 'power', bigCount);
            if (smallCount > 0) spawnDeathPowerItems(px, py, 'powerS', smallCount);
        }
        spawnExplosion(px, py, '#ffffff', 10);
        eBullets = [];
        player.x = W / 2; player.y = H - 60;
        if (lives <= 0) gameOver();
    }

    // ===== Right-side HUD Panel (東方スタイル) =====
    var DIFF_COLORS = { easy: '#44ff44', normal: '#44aaff', hard: '#ff4444', lunatic: '#c466ff' };

    function drawStar(cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
            var a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
            var a2 = a + Math.PI / 5;
            if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            ctx.lineTo(cx + Math.cos(a2) * r * 0.4, cy + Math.sin(a2) * r * 0.4);
        }
        ctx.closePath();
        ctx.fill();
    }

    function formatScore(n) {
        var s = n.toString();
        var out = '';
        for (var i = 0; i < s.length; i++) {
            if (i > 0 && (s.length - i) % 3 === 0) out += ',';
            out += s[i];
        }
        return out;
    }

    function drawHUDPanel() {
        ctx.save();

        // Panel background
        var panelX = FIELD_X + W + 4;
        ctx.fillStyle = '#0a0810';
        ctx.fillRect(panelX, 0, CANVAS_W - panelX, CANVAS_H);

        // Subtle decorative pattern on panel
        ctx.globalAlpha = 0.03;
        for (var i = 0; i < 8; i++) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(CANVAS_W - 40, CANVAS_H - 60, 30 + i * 20, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        var px = HUD_X;
        var rightX = px + HUD_W;
        var py = FIELD_Y + 10;

        ctx.textBaseline = 'top';

        // Difficulty (大きく色付き、東方風)
        var diffCol = DIFF_COLORS[diffKey] || '#ff4444';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = diffCol;
        ctx.fillText(diff.label.toUpperCase(), rightX, py);
        py += 28;

        // HI SCORE
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('HI SCORE', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ccc';
        ctx.font = '13px "Courier New", monospace';
        ctx.fillText(formatScore(Math.max(score, 0)), rightX, py);
        py += 20;

        // SCORE
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('SCORE', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px "Courier New", monospace';
        ctx.fillText(formatScore(score), rightX, py);
        py += 30;

        // PLAYER (Lives)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('PLAYER', px, py);
        py += 16;
        for (var i = 0; i < Math.max(MAX_LIVES, lives); i++) {
            drawStar(px + 8 + i * 16, py + 5, i < lives ? 6 : 5, i < lives ? '#ff4444' : '#222');
        }
        py += 22;

        // BOMB
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('BOMB', px, py);
        py += 16;
        for (var i = 0; i < Math.max(MAX_BOMBS, bombs); i++) {
            drawStar(px + 8 + i * 16, py + 5, i < bombs ? 6 : 5, i < bombs ? '#44ff44' : '#222');
        }
        py += 30;

        // POWER (数値のみ、ゲージなし)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('POWER', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText((power / 100).toFixed(2) + ' / ' + (MAX_POWER / 100).toFixed(2), rightX, py);
        py += 26;

        // GRAZE
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('GRAZE', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ccc';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText(formatScore(graze), rightX, py);
        py += 40;

        // Stage
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('STAGE', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText((waveIndex + 1).toString(), rightX, py);

        ctx.restore();
    }

    // ===== Game State =====
    function resetGame() {
        frame = 0; score = 0; graze = 0; lives = MAX_LIVES; bombs = MAX_BOMBS;
        power = MIN_POWER; invTimer = 0; fireTimer = 0; bombTimer = 0;
        waveTimer = 0; waveIndex = 0; bossActive = false; boss = null;
        bossInterval = 1200; preBoss = false;
        player.x = W / 2; player.y = H - 60;
        pBullets = []; enemies = []; eBullets = []; items = []; particles = [];
        deleteEffects = [];
        bombOrbs = [];
        initBgParticles();
        buildWaveScript();
    }

    function startGame() {
        if (titleAnimId) { cancelAnimationFrame(titleAnimId); titleAnimId = null; }
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        practiceMode = false;
        resetGame();
        state = 'PLAYING';
        overlay.hidden = true;
        // 固定ステップの時刻をリセット（高リフレッシュ環境での倍速化対策）
        loopLastTime = 0; loopAccum = 0;
        animId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        state = 'GAMEOVER';
        overlay.hidden = false;
        titleScreen.hidden = true; diffScreen.hidden = true;
        overScreen.hidden = false; rankingScreen.hidden = true;
        finalScoreEl.textContent = 'SCORE: ' + score;
        nameInput.value = '';
        setTimeout(function () { nameInput.focus(); }, 100);
    }

    function showRanking(from, showDiff) {
        rankingFrom = from || 'title';
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        state = 'RANKING';
        overlay.hidden = false;
        overScreen.hidden = true; titleScreen.hidden = true;
        diffScreen.hidden = true; rankingScreen.hidden = false;
        initTitleParticles();
        drawTitleBg();
        var tabDiff = showDiff || diffKey;
        rankingTabs.querySelectorAll('.ranking-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.diff === tabDiff);
        });
        loadRanking(tabDiff);
        rankingBtns.innerHTML = '';
        if (rankingFrom === 'gameover') {
            var retryB = document.createElement('button');
            retryB.className = 'game-btn';
            retryB.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Retry' : '\u30EA\u30C8\u30E9\u30A4';
            retryB.addEventListener('click', function () { playSE('decide'); startGame(); });
            retryB.addEventListener('mouseenter', function () { playSE('select'); });
            var titleB = document.createElement('button');
            titleB.className = 'game-btn';
            titleB.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Title' : '\u30BF\u30A4\u30C8\u30EB\u3078';
            titleB.addEventListener('click', function () { playSE('decide'); goToTitle(); });
            titleB.addEventListener('mouseenter', function () { playSE('select'); });
            rankingBtns.appendChild(retryB);
            rankingBtns.appendChild(titleB);
        } else {
            var backB = document.createElement('button');
            backB.className = 'game-btn';
            backB.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Back' : '\u623B\u308B';
            backB.addEventListener('click', function () { playSE('decide'); goToTitle(); });
            backB.addEventListener('mouseenter', function () { playSE('select'); });
            rankingBtns.appendChild(backB);
        }
        menuIndex = 0;
    }

    function loadRanking(difficultyKey) {
        rankingList.innerHTML = '<li><span style="color:var(--text-muted)">Loading...</span></li>';
        GameRanking.fetchRanking(difficultyKey, 10).then(function (data) {
            rankingList.innerHTML = '';
            if (data.length === 0) {
                rankingList.innerHTML = '<li><span style="color:var(--text-muted)">No scores yet</span></li>';
                return;
            }
            for (var i = 0; i < data.length; i++) {
                var li = document.createElement('li');
                li.innerHTML = '<span class="rank">' + (i + 1) + '.</span><span class="name">' + escapeHtml(data[i].name) + '</span><span class="score">' + data[i].score + '</span>';
                rankingList.appendChild(li);
            }
        });
    }

    function goToTitle() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        practiceMode = false;
        state = 'TITLE'; menuIndex = 0;
        overlay.hidden = false;
        titleScreen.hidden = false; diffScreen.hidden = true;
        overScreen.hidden = true; rankingScreen.hidden = true;
        if (practiceScreen) practiceScreen.hidden = true;
        if (practiceResultScreen) practiceResultScreen.hidden = true;
        if (pauseScreen) pauseScreen.hidden = true;
        updateMenuHighlight();
        initTitleParticles();
        drawTitleBg();
    }

    function showPracticeSelect() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        practiceMode = false;
        state = 'PRACTICE_SELECT'; menuIndex = 0;
        overlay.hidden = false;
        titleScreen.hidden = true; diffScreen.hidden = true;
        overScreen.hidden = true; rankingScreen.hidden = true;
        practiceScreen.hidden = false; practiceResultScreen.hidden = true;
        // 難易度ボタンの active を現在の diffKey に同期
        practiceDiffSelect.querySelectorAll('.practice-diff-btn').forEach(function (b) {
            b.classList.toggle('active', b.dataset.diff === diffKey);
        });
        updateMenuHighlight();
        initTitleParticles();
        drawTitleBg();
    }

    function startPractice(patternKey) {
        if (titleAnimId) { cancelAnimationFrame(titleAnimId); titleAnimId = null; }
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        practiceMode = true;
        practicePatternKey = patternKey;

        frame = 0; score = 0; graze = 0; lives = 1; bombs = 0;
        // 道中はPower=1（MIN_POWER）、ボスはMAX
        var isBossPattern = patternKey.indexOf('boss_') === 0;
        power = isBossPattern ? MAX_POWER : MIN_POWER;
        invTimer = 0; fireTimer = 0; bombTimer = 0;
        waveTimer = 0; waveIndex = 0; bossActive = false; boss = null;
        bossInterval = Number.POSITIVE_INFINITY; preBoss = false;
        waveScript = []; waveScriptIdx = 0;
        player.x = W / 2; player.y = H - 60;
        pBullets = []; enemies = []; eBullets = []; items = []; particles = [];
        deleteEffects = []; bombOrbs = [];
        initBgParticles();

        if (!diff) { diff = DIFF.normal; diffKey = 'normal'; }

        if (patternKey.indexOf('wave_') === 0) {
            var pat = patternKey.substring(5);
            try { executeWaveEvent(pat); } catch (e) { console.error('practice wave error', e); }
        } else if (patternKey.indexOf('boss_') === 0) {
            var parts = patternKey.split('_');
            spawnPracticeBoss(parts[1], parts[2]);
        }

        state = 'PLAYING';
        overlay.hidden = true;
        practiceScreen.hidden = true; practiceResultScreen.hidden = true;
        loopLastTime = 0; loopAccum = 0;
        animId = requestAnimationFrame(gameLoop);
    }

    function spawnPracticeBoss(kind, attackId) {
        bossActive = true;
        boss = {
            x: W / 2, y: -40,
            hp: 600, maxHp: 600,
            size: 30, phase: 0, phaseTimer: 0,
            fireTimer: 0, age: 0, entering: true, firing: false,
            bulletKind: kind,
            spellActive: false, spellsUsed: [0, 1], spellIdx: -1,
            spellTimer: 0, spellDuration: 0, spellFlash: 0,
            moveMode: 'sine', moveTimer: 0,
            targetX: W / 2, targetY: 70,
            dashTargetX: W / 2, dashTargetY: 70
            // spawnerTimer 未設定 = スポナー召喚なし
        };
        if (attackId.charAt(0) === 'p') {
            boss.phase = parseInt(attackId.substring(1), 10) || 0;
            onBossPhaseChange();
        } else if (attackId.charAt(0) === 's') {
            var spellIdx = parseInt(attackId.substring(1), 10) || 0;
            boss.spellsUsed = [];
            startSpellcard(spellIdx);
            boss.spellsUsed = [0, 1];
        }
    }

    function pauseGame() {
        if (state !== 'PLAYING') return;
        state = 'PAUSED'; menuIndex = 0;
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        overlay.hidden = false;
        titleScreen.hidden = true; diffScreen.hidden = true;
        overScreen.hidden = true; rankingScreen.hidden = true;
        practiceScreen.hidden = true; practiceResultScreen.hidden = true;
        pauseScreen.hidden = false;
        // プラクティス中のみ「パターン選択へ戻る」ボタンを表示
        var practiceOnlyBtn = pauseScreen.querySelector('.pause-practice-only');
        if (practiceOnlyBtn) practiceOnlyBtn.hidden = !practiceMode;
        // 復帰時に押しっぱなしでの暴走（自機移動・連射）を防ぐ
        keys = {}; resetMobileKeys();
        updateMenuHighlight();
    }

    function resumeGame() {
        if (state !== 'PAUSED') return;
        pauseScreen.hidden = true;
        overlay.hidden = true;
        state = 'PLAYING';
        loopLastTime = 0; loopAccum = 0;
        if (!animId) animId = requestAnimationFrame(gameLoop);
    }

    function restartFromPause() {
        pauseScreen.hidden = true;
        if (practiceMode && practicePatternKey) {
            startPractice(practicePatternKey);
        } else {
            startGame();
        }
    }

    function practiceEnd(result) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        state = 'PRACTICE_RESULT'; menuIndex = 0;
        overlay.hidden = false;
        titleScreen.hidden = true; diffScreen.hidden = true;
        overScreen.hidden = true; rankingScreen.hidden = true;
        practiceScreen.hidden = true; practiceResultScreen.hidden = false;
        var en = (typeof currentLang !== 'undefined' && currentLang === 'en');
        if (result === 'cleared') {
            practiceResultTitle.textContent = en ? 'CLEAR' : 'CLEAR';
            practiceResultTitle.style.color = '#44ff44';
        } else {
            practiceResultTitle.textContent = en ? 'MISS' : 'MISS';
            practiceResultTitle.style.color = '#ff4444';
        }
        updateMenuHighlight();
        initTitleParticles();
        drawTitleBg();
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    // ===== Game Loop =====
    // ===== Fixed-step loop =====
    // 画面のリフレッシュレートに依存せず60FPS相当で更新
    var LOOP_STEP_MS = 1000 / 60;
    var LOOP_MAX_STEPS_PER_FRAME = 4;
    var loopLastTime = 0;
    var loopAccum = 0;

    function gameLoop(now) {
        now = now || performance.now();
        if (!loopLastTime) loopLastTime = now;
        var delta = now - loopLastTime;
        loopLastTime = now;
        if (delta > 250) delta = 250; // スパイラル防止
        loopAccum += delta;

        // 固定ステップでゲーム更新（最大回数を制限）
        var stepsRun = 0;
        while (loopAccum >= LOOP_STEP_MS && stepsRun < LOOP_MAX_STEPS_PER_FRAME) {
            frame++;
            if (state === 'PLAYING') {
                try {
                    updateBgParticles(bgParticles);
                    updatePlayer(); updatePBullets(); updateEnemies();
                    updateEBullets(); updateBombOrbs(); updateItems(); updateParticles();
                    updateDeleteEffects();
                    checkCollisions();
                } catch (e) {
                    console.error('Game update error:', e);
                }
            }
            loopAccum -= LOOP_STEP_MS;
            stepsRun++;
        }
        // 追いつけない場合は蓄積をクリア（遅延の永続化防止）
        if (loopAccum > LOOP_STEP_MS * LOOP_MAX_STEPS_PER_FRAME) loopAccum = 0;

        // Draw (always, so last frame visible on gameover)
        ctx.fillStyle = '#0a0810';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Draw game field (clipped & translated)
        ctx.save();
        try {
            ctx.translate(FIELD_X, FIELD_Y);
            ctx.beginPath();
            ctx.rect(0, 0, W, H);
            ctx.clip();

            drawGameBg();
            drawCollectLine();
            drawItems(); drawPBullets(); drawEnemies(); drawBoss();
            drawEBullets(); drawBombOrbs(); drawPlayer(); drawParticles();
            drawDeleteEffects();
        } catch (e) {
            console.error('Game draw error:', e);
        }
        ctx.restore(); // always restore even on error

        // Field border (東方風の二重枠)
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(FIELD_X - 1, FIELD_Y - 1, W + 2, H + 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(FIELD_X - 3, FIELD_Y - 3, W + 6, H + 6);

        // Right-side HUD
        try {
            drawHUDPanel();
        } catch (e) {
            console.error('HUD draw error:', e);
        }

        // Always keep the loop running while in game states
        if (state === 'PLAYING' || state === 'GAMEOVER') {
            animId = requestAnimationFrame(gameLoop);
        } else {
            animId = null;
        }
    }

    // ===== Title Scene =====
    var titleLoopLastTime = 0;
    var titleLoopAccum = 0;
    function drawTitleBg() {
        if (titleAnimId) { cancelAnimationFrame(titleAnimId); titleAnimId = null; }
        titleLoopLastTime = 0; titleLoopAccum = 0;
        function titleFrame(now) {
            if (state !== 'TITLE' && state !== 'DIFFICULTY' && state !== 'RANKING' && state !== 'PRACTICE_SELECT' && state !== 'PRACTICE_RESULT') { titleAnimId = null; return; }
            now = now || performance.now();
            if (!titleLoopLastTime) titleLoopLastTime = now;
            var delta = now - titleLoopLastTime;
            titleLoopLastTime = now;
            if (delta > 250) delta = 250;
            titleLoopAccum += delta;
            var steps = 0;
            while (titleLoopAccum >= LOOP_STEP_MS && steps < LOOP_MAX_STEPS_PER_FRAME) {
                frame++;
                updateBgParticles(titleParticles, CANVAS_W, CANVAS_H);
                titleLoopAccum -= LOOP_STEP_MS;
                steps++;
            }
            if (titleLoopAccum > LOOP_STEP_MS * LOOP_MAX_STEPS_PER_FRAME) titleLoopAccum = 0;
            drawTitleBackground();
            titleAnimId = requestAnimationFrame(titleFrame);
        }
        titleFrame();
    }

    // ===== Menu Navigation =====
    function getMenuItems() {
        if (state === 'TITLE') return titleScreen.querySelectorAll('.title-menu-item');
        if (state === 'DIFFICULTY') return diffScreen.querySelectorAll('.difficulty-btn');
        if (state === 'RANKING') return rankingBtns.querySelectorAll('.game-btn');
        if (state === 'PRACTICE_SELECT') return practiceScreen.querySelectorAll('.practice-btn');
        if (state === 'PRACTICE_RESULT') return practiceResultScreen.querySelectorAll('.game-btn');
        if (state === 'PAUSED') return pauseScreen.querySelectorAll('.game-btn:not([hidden])');
        return [];
    }

    function updateMenuHighlight() {
        var items = getMenuItems();
        for (var i = 0; i < items.length; i++) items[i].classList.toggle('selected', i === menuIndex);
        if (items[menuIndex] && typeof items[menuIndex].scrollIntoView === 'function') {
            items[menuIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    // 2Dグリッドの方向キー移動: 現在のボタン中心から指定方向に最も近いボタンへ
    function navigate2D(dir, items) {
        if (menuIndex < 0 || menuIndex >= items.length) menuIndex = 0;
        var cur = items[menuIndex].getBoundingClientRect();
        var cx = cur.left + cur.width / 2;
        var cy = cur.top + cur.height / 2;
        var best = -1;
        var bestScore = Infinity;
        for (var i = 0; i < items.length; i++) {
            if (i === menuIndex) continue;
            var r = items[i].getBoundingClientRect();
            var ix = r.left + r.width / 2;
            var iy = r.top + r.height / 2;
            var dx = ix - cx, dy = iy - cy;
            var score;
            if (dir === 'up' && dy < -2) score = Math.abs(dx) * 3 + (-dy);
            else if (dir === 'down' && dy > 2) score = Math.abs(dx) * 3 + dy;
            else if (dir === 'left' && dx < -2) score = Math.abs(dy) * 3 + (-dx);
            else if (dir === 'right' && dx > 2) score = Math.abs(dy) * 3 + dx;
            else continue;
            if (score < bestScore) { bestScore = score; best = i; }
        }
        if (best >= 0) {
            menuIndex = best;
            updateMenuHighlight();
            playSE('select');
        }
    }

    function handleMenuKey(code) {
        if (state === 'GAMEOVER') {
            if (code === 'Enter') { playSE('decide'); submitBtn.click(); }
            else if (code === 'KeyX' || code === 'Escape') { playSE('decide'); skipBtn.click(); }
            return;
        }
        var items = getMenuItems();
        if (!items || items.length === 0) return;
        // PRACTICE_SELECT は2Dグリッドナビゲーション
        if (state === 'PRACTICE_SELECT' && (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight')) {
            var dir = code === 'ArrowUp' ? 'up' : code === 'ArrowDown' ? 'down' : code === 'ArrowLeft' ? 'left' : 'right';
            navigate2D(dir, items);
            return;
        }
        if (code === 'ArrowUp') { menuIndex = (menuIndex - 1 + items.length) % items.length; updateMenuHighlight(); playSE('select'); }
        else if (code === 'ArrowDown') { menuIndex = (menuIndex + 1) % items.length; updateMenuHighlight(); playSE('select'); }
        else if (code === 'KeyZ' || code === 'Enter') { if (menuIndex >= 0 && menuIndex < items.length) { playSE('decide'); items[menuIndex].click(); } }
        else if (code === 'KeyX' || code === 'Escape') {
            playSE('decide');
            if (state === 'DIFFICULTY') goToTitle();
            else if (state === 'RANKING') goToTitle();
            else if (state === 'PRACTICE_SELECT') goToTitle();
            else if (state === 'PRACTICE_RESULT') showPracticeSelect();
            else if (state === 'PAUSED') resumeGame();
            else if (state === 'TITLE') closeGameModal();
        }
    }

    // ===== Modal =====
    function openGameModal() {
        modal.classList.add('active');
        document.body.style.overflowY = 'hidden';
        menuIndex = 0;
        modal.querySelectorAll('[data-ja][data-en]').forEach(function (el) {
            el.textContent = el.getAttribute('data-' + currentLang);
        });
        goToTitle();
    }

    function closeGameModal() {
        modal.classList.remove('active');
        document.body.style.overflowY = '';
        state = 'CLOSED';
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (titleAnimId) { cancelAnimationFrame(titleAnimId); titleAnimId = null; }
        keys = {}; resetMobileKeys();
    }

    // ===== Input =====
    document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('active')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) !== -1) {
            if (state !== 'GAMEOVER') e.preventDefault();
        }
        keys[e.code] = true;
        // PLAYING中の Escape はポーズ起動
        if (state === 'PLAYING' && e.code === 'Escape' && !e.repeat) {
            playSE('decide'); pauseGame(); return;
        }
        // 自動リピート（長押し）ではメニュー決定を発火しない。
        // PLAYING中に押していたZ/Enter等が画面遷移直後に決定を誤発火するのを防ぐ
        if (state !== 'PLAYING' && !e.repeat) handleMenuKey(e.code);
    });
    document.addEventListener('keyup', function (e) { keys[e.code] = false; });

    // ===== Mobile Controls =====
    // タッチ端末判定（hover なし + ポインタ粗め）
    var isTouchDevice = !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    var mobileKeys = { bomb: false, slow: false };
    var mobileAxis = { x: 0, y: 0 };
    function resetMobileKeys() {
        for (var k in mobileKeys) mobileKeys[k] = false;
        mobileAxis.x = 0; mobileAxis.y = 0;
    }

    function setupMobileBtn(selector, key) {
        var el = modal.querySelector(selector); if (!el) return;
        el.addEventListener('touchstart', function (e) { e.preventDefault(); mobileKeys[key] = true; el.classList.add('active'); }, { passive: false });
        el.addEventListener('touchend', function (e) { e.preventDefault(); mobileKeys[key] = false; el.classList.remove('active'); }, { passive: false });
        el.addEventListener('touchcancel', function () { mobileKeys[key] = false; el.classList.remove('active'); });
    }
    setupMobileBtn('.bomb-btn', 'bomb'); setupMobileBtn('.slow-btn', 'slow');

    // スライドパッド（アナログスティック）
    (function setupSlidePad() {
        var pad = modal.querySelector('.slide-pad');
        var knob = modal.querySelector('.slide-pad-knob');
        if (!pad || !knob) return;
        var padRect = null;
        var maxR = 42;
        var deadZone = 0.14;
        var activeId = null;

        function findTouch(touchList) {
            for (var i = 0; i < touchList.length; i++) {
                if (touchList[i].identifier === activeId) return touchList[i];
            }
            return null;
        }
        function applyDelta(clientX, clientY) {
            if (!padRect) return;
            var cx = padRect.left + padRect.width / 2;
            var cy = padRect.top + padRect.height / 2;
            var dx = clientX - cx;
            var dy = clientY - cy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxR) { dx = dx / dist * maxR; dy = dy / dist * maxR; }
            knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            var ax = dx / maxR;
            var ay = dy / maxR;
            var mag = Math.sqrt(ax * ax + ay * ay);
            if (mag < deadZone) { ax = 0; ay = 0; }
            mobileAxis.x = ax;
            mobileAxis.y = ay;
        }
        pad.addEventListener('touchstart', function (e) {
            e.preventDefault();
            var t = e.changedTouches[0];
            activeId = t.identifier;
            padRect = pad.getBoundingClientRect();
            pad.classList.add('active');
            applyDelta(t.clientX, t.clientY);
        }, { passive: false });
        pad.addEventListener('touchmove', function (e) {
            e.preventDefault();
            var t = findTouch(e.changedTouches);
            if (!t) return;
            applyDelta(t.clientX, t.clientY);
        }, { passive: false });
        function endHandler(e) {
            var t = findTouch(e.changedTouches);
            if (!t) return;
            activeId = null;
            pad.classList.remove('active');
            knob.style.transform = 'translate(-50%, -50%)';
            mobileAxis.x = 0; mobileAxis.y = 0;
        }
        pad.addEventListener('touchend', endHandler, { passive: false });
        pad.addEventListener('touchcancel', endHandler);
    })();

    // ===== Event Listeners =====
    startBtn.addEventListener('click', openGameModal);
    modalClose.addEventListener('click', closeGameModal);
    modalBackdrop.addEventListener('click', closeGameModal);

    // マウスホバー時の選択SE（直前と同じidxなら鳴らさない）
    var lastHoverIdx = -1;
    function hoverSelect(idx) {
        if (idx !== lastHoverIdx) { lastHoverIdx = idx; playSE('select'); }
        menuIndex = idx; updateMenuHighlight();
    }

    modal.querySelectorAll('.title-menu-item').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            playSE('decide');
            var action = btn.dataset.action;
            if (action === 'start') {
                state = 'DIFFICULTY'; menuIndex = 0;
                titleScreen.hidden = true; diffScreen.hidden = false;
                updateMenuHighlight();
                lastHoverIdx = -1;
            } else if (action === 'ranking') {
                showRanking('title', 'normal');
                drawTitleBg();
                lastHoverIdx = -1;
            } else if (action === 'practice') {
                showPracticeSelect();
                lastHoverIdx = -1;
            } else if (action === 'exit') {
                closeGameModal();
            }
        });
        btn.addEventListener('mouseenter', function () { hoverSelect(idx); });
    });

    // プラクティス: 難易度ボタン
    practiceDiffSelect.querySelectorAll('.practice-diff-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            playSE('decide');
            diffKey = btn.dataset.diff;
            diff = DIFF[diffKey];
            practiceDiffSelect.querySelectorAll('.practice-diff-btn').forEach(function (b) {
                b.classList.toggle('active', b === btn);
            });
        });
        btn.addEventListener('mouseenter', function () { playSE('select'); });
    });

    // プラクティス: パターン選択ボタン
    practiceScreen.querySelectorAll('.practice-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            playSE('decide');
            startPractice(btn.dataset.pattern);
        });
        btn.addEventListener('mouseenter', function () { hoverSelect(idx); });
    });

    // プラクティス: 戻るボタン
    if (practiceBackBtn) {
        practiceBackBtn.addEventListener('click', function () {
            playSE('decide'); goToTitle();
        });
        practiceBackBtn.addEventListener('mouseenter', function () { playSE('select'); });
    }

    // プラクティス結果: リトライ／パターン選択／タイトル
    practiceResultScreen.querySelectorAll('.game-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            playSE('decide');
            var act = btn.dataset.action;
            if (act === 'retry') startPractice(practicePatternKey);
            else if (act === 'select') showPracticeSelect();
            else if (act === 'title') goToTitle();
        });
        btn.addEventListener('mouseenter', function () { hoverSelect(idx); });
    });

    // ポーズメニュー: ゲームに戻る／リスタート／(プラクティスのみ)パターン選択へ戻る／タイトルへ
    pauseScreen.querySelectorAll('.game-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            playSE('decide');
            var act = btn.dataset.action;
            if (act === 'resume') resumeGame();
            else if (act === 'restart') restartFromPause();
            else if (act === 'practice-select') {
                pauseScreen.hidden = true;
                showPracticeSelect();
            }
            else if (act === 'title') goToTitle();
        });
        btn.addEventListener('mouseenter', function () { hoverSelect(idx); });
    });

    modal.querySelectorAll('.difficulty-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            playSE('decide');
            diffKey = btn.dataset.diff; diff = DIFF[diffKey]; startGame();
        });
        btn.addEventListener('mouseenter', function () { hoverSelect(idx); });
    });

    submitBtn.addEventListener('click', function () {
        playSE('decide');
        var name = nameInput.value.trim() || 'AAA';
        submitBtn.disabled = true; submitBtn.textContent = '...';
        GameRanking.submitScore(name, score, diffKey).then(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Submit Score' : '\u30B9\u30B3\u30A2\u9001\u4FE1';
            showRanking('gameover', diffKey);
        });
    });

    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
        e.stopPropagation();
    });

    skipBtn.addEventListener('click', function () {
        playSE('decide');
        showRanking('gameover', diffKey);
    });

    rankingTabs.querySelectorAll('.ranking-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            playSE('decide');
            rankingTabs.querySelectorAll('.ranking-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active'); loadRanking(tab.dataset.diff);
        });
        tab.addEventListener('mouseenter', function () { playSE('select'); });
    });

    GameRanking.init();
    canvas.style.touchAction = 'none';
})();
