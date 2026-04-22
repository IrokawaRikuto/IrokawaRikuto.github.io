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
    loadSprite('magicCircle', 'assets/game/boss_magic_circle.png');
    loadSprite('deleteEffect', 'assets/game/bullet_delete_effect.png');
    // Sprite layout: small=16x16 x9, medium=64x32 x8, large=128x64 x8
    // Colors: 0=red,1=orange,2=yellow,3=green,4=cyan,5=blue,6=purple,7=gray (8=white for 9-sprites)
    var BULLET_COLORS = { red: 0, orange: 1, yellow: 2, green: 3, cyan: 4, blue: 5, purple: 6, gray: 7 };

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

    var DIFF = {
        easy:    { bullets: 0.5, bossHp: 0.8, speed: 0.8, label: 'Easy' },
        normal:  { bullets: 1.0, bossHp: 1.0, speed: 1.0, label: 'Normal' },
        hard:    { bullets: 1.5, bossHp: 1.5, speed: 1.2, label: 'Hard' },
        lunatic: { bullets: 2.0, bossHp: 2.5, speed: 1.4, label: 'Lunatic' }
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

        if (keys['ArrowLeft'] || mobileKeys.left) dx = -1;
        if (keys['ArrowRight'] || mobileKeys.right) dx = 1;
        if (keys['ArrowUp'] || mobileKeys.up) dy = -1;
        if (keys['ArrowDown'] || mobileKeys.down) dy = 1;

        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        player.x += dx * spd;
        player.y += dy * spd;
        if (player.x < PLAYER_SIZE) player.x = PLAYER_SIZE;
        if (player.x > W - PLAYER_SIZE) player.x = W - PLAYER_SIZE;
        if (player.y < PLAYER_SIZE) player.y = PLAYER_SIZE;
        if (player.y > H - PLAYER_SIZE) player.y = H - PLAYER_SIZE;

        if (invTimer > 0) invTimer--;

        // Fire
        if (keys['KeyZ'] || mobileKeys.shot) {
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
                // 回収エリアでの引き寄せはほぼ一瞬
                var speed = autoCollect ? 20 : 4.5;
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
    var BOMB_ORB_RADIUS = 28;
    var BOMB_ORB_SPEED = 5;
    var BOMB_ORB_COUNT = 6;
    var BOMB_ORB_DAMAGE = 8;

    function launchBombOrbs() {
        bombOrbs = [];
        var baseAngle = -Math.PI / 2; // 上方向
        var spread = Math.PI * 0.8;
        for (var i = 0; i < BOMB_ORB_COUNT; i++) {
            var a = baseAngle - spread / 2 + (spread / (BOMB_ORB_COUNT - 1)) * i;
            bombOrbs.push({
                x: player.x, y: player.y,
                vx: Math.cos(a) * BOMB_ORB_SPEED,
                vy: Math.sin(a) * BOMB_ORB_SPEED,
                radius: BOMB_ORB_RADIUS,
                life: 120, // フレーム寿命
                hue: (360 / BOMB_ORB_COUNT) * i
            });
        }
        bombTimer = 120;
        invTimer = Math.max(invTimer, 120);
    }

    function updateBombOrbs() {
        for (var i = bombOrbs.length - 1; i >= 0; i--) {
            var orb = bombOrbs[i];
            orb.x += orb.vx; orb.y += orb.vy;
            orb.life--;
            orb.hue = (orb.hue + 3) % 360; // 虹色回転

            // 敵弾を消去
            for (var j = eBullets.length - 1; j >= 0; j--) {
                var b = eBullets[j];
                var dx = b.x - orb.x, dy = b.y - orb.y;
                if (dx * dx + dy * dy < (orb.radius + b.size) * (orb.radius + b.size)) {
                    spawnDeleteEffect(b.x, b.y);
                    eBullets.splice(j, 1);
                    score += 10;
                }
            }

            // 敵にダメージ
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                var dx = e.x - orb.x, dy = e.y - orb.y;
                if (dx * dx + dy * dy < (orb.radius + e.size) * (orb.radius + e.size)) {
                    e.hp -= BOMB_ORB_DAMAGE;
                }
            }
            // ボスにダメージ
            if (boss && !boss.entering) {
                var dx = boss.x - orb.x, dy = boss.y - orb.y;
                if (dx * dx + dy * dy < (orb.radius + boss.size) * (orb.radius + boss.size)) {
                    boss.hp -= BOMB_ORB_DAMAGE;
                }
            }

            if (orb.life <= 0 || orb.x < -50 || orb.x > W + 50 || orb.y < -50 || orb.y > H + 50) {
                bombOrbs.splice(i, 1);
            }
        }
        // オーブが全て消えたらボム終了
        if (bombOrbs.length === 0 && bombTimer > 0) bombTimer = 0;
    }

    function drawBombOrbs() {
        for (var i = 0; i < bombOrbs.length; i++) {
            var orb = bombOrbs[i];
            var alpha = Math.min(1, orb.life / 20);
            ctx.save();
            ctx.translate(orb.x, orb.y);

            // 虹色グロー（外側）
            var grd = ctx.createRadialGradient(0, 0, orb.radius * 0.2, 0, 0, orb.radius * 1.5);
            grd.addColorStop(0, 'hsla(' + orb.hue + ', 100%, 80%, ' + (alpha * 0.8) + ')');
            grd.addColorStop(0.4, 'hsla(' + ((orb.hue + 60) % 360) + ', 100%, 60%, ' + (alpha * 0.5) + ')');
            grd.addColorStop(1, 'hsla(' + ((orb.hue + 120) % 360) + ', 100%, 50%, 0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, orb.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // コア（白く輝く中心）
            var coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.radius);
            coreGrd.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
            coreGrd.addColorStop(0.5, 'hsla(' + orb.hue + ', 100%, 75%, ' + (alpha * 0.9) + ')');
            coreGrd.addColorStop(1, 'hsla(' + ((orb.hue + 180) % 360) + ', 80%, 50%, ' + (alpha * 0.3) + ')');
            ctx.fillStyle = coreGrd;
            ctx.beginPath();
            ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ===== Enemies =====
    // Bullet patterns: 'down', 'way3', 'way5', 'circle', 'aimed', 'diagonal', 'random', 'spread'
    var BULLET_PATTERNS_SMALL = ['down', 'aimed', 'diagonal'];
    var BULLET_PATTERNS_MEDIUM = ['way3', 'aimed', 'diagonal', 'random', 'spread'];
    var BULLET_PATTERNS_LARGE = ['way5', 'circle', 'way3', 'random', 'spread'];

    function pickBulletPattern(type) {
        var pool;
        if (type === 'small') pool = BULLET_PATTERNS_SMALL;
        else if (type === 'medium') pool = BULLET_PATTERNS_MEDIUM;
        else pool = BULLET_PATTERNS_LARGE;
        if (waveIndex >= 2 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3'];
        if (waveIndex >= 4 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3', 'random', 'spread'];
        if (waveIndex >= 3 && type === 'medium') pool = ['way3', 'way5', 'aimed', 'diagonal', 'circle', 'random', 'spread'];
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
        var count = 6 + Math.floor(Math.random() * 6); // 6-11体
        var dir = Math.random() > 0.5 ? 1 : -1;
        var baseY = 30 + Math.random() * 40;
        var startX = dir > 0 ? -15 : W + 15;
        var spd = 1.5 + Math.random() * 1;
        var spacing = 25;
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

    // 左右から大量の小型が水平移動（Cross Stream）
    function spawnCrossStream(countPerSide) {
        countPerSide = countPerSide || (5 + Math.floor(Math.random() * 4));
        var yL = 30 + Math.random() * 40;
        var yR = 50 + Math.random() * 40;
        var spd = 1.8 + Math.random() * 0.5;
        for (var i = 0; i < countPerSide; i++) {
            enemies.push({
                x: -15 - i * 25, y: yL, hp: 1, maxHp: 1, speed: spd, type: 'small',
                pattern: 'drift', fireRate: Math.floor(130 / diff.bullets),
                fireTimer: 30 + Math.floor(Math.random() * 40),
                size: 8, age: 0, baseX: 0, dir: 1, bulletPattern: 'aimed'
            });
            enemies.push({
                x: W + 15 + i * 25, y: yR, hp: 1, maxHp: 1, speed: spd, type: 'small',
                pattern: 'drift', fireRate: Math.floor(130 / diff.bullets),
                fireTimer: 30 + Math.floor(Math.random() * 40),
                size: 8, age: 0, baseX: 0, dir: -1, bulletPattern: 'aimed'
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

    // サインウェーブ編隊（横移動＋縦の揺れ）
    function spawnSineFormation(count) {
        count = count || (7 + Math.floor(Math.random() * 5));
        var dir = Math.random() > 0.5 ? 1 : -1;
        var startX = dir > 0 ? -15 : W + 15;
        var baseY = 50 + Math.random() * 40;
        var spd = 1.5 + Math.random() * 0.5;
        for (var i = 0; i < count; i++) {
            enemies.push({
                x: startX - dir * 22 * i, y: baseY, hp: 1, maxHp: 1, speed: spd, type: 'small',
                pattern: 'sineDrift', fireRate: Math.floor(140 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 60),
                size: 8, age: 0, baseX: 0, baseY: baseY, dir: dir,
                bulletPattern: 'down'
            });
        }
    }

    // 画面上部左右に大型2体が固定して弾幕を放つ
    function spawnDualTurrets() {
        var positions = [{ x: 60, y: 50 }, { x: W - 60, y: 50 }];
        for (var i = 0; i < 2; i++) {
            enemies.push({
                x: positions[i].x, y: -20,
                hp: 40, maxHp: 40, speed: 0.8, type: 'large',
                pattern: 'hover', fireRate: Math.floor(35 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 20),
                size: 20, age: 0, baseX: positions[i].x, dir: 1,
                bulletPattern: 'spread',
                targetY: positions[i].y
            });
        }
    }

    // 画面上部で左右から合計40体が5列でランダムに横断、全員自機狙い
    function spawnMassRush() {
        var totalCount = 40;
        var rows = 5;
        var rowSpacing = 20;
        var baseY = 25;
        for (var r = 0; r < rows; r++) {
            var rowY = baseY + r * rowSpacing;
            var perRow = Math.floor(totalCount / rows);
            for (var i = 0; i < perRow; i++) {
                var dir = Math.random() > 0.5 ? 1 : -1;
                var startX = dir > 0 ? -10 - Math.random() * 80 : W + 10 + Math.random() * 80;
                var spd = 1.8 + Math.random() * 1.2;
                var delay = Math.floor(Math.random() * 60); // 出現タイミングをばらす
                enemies.push({
                    x: startX - dir * spd * delay,
                    y: rowY + (Math.random() - 0.5) * 8,
                    hp: 1, maxHp: 1, speed: spd, type: 'small',
                    pattern: 'drift', fireRate: Math.floor(90 / diff.bullets),
                    fireTimer: Math.floor(Math.random() * 40),
                    size: 8, age: 0, baseX: 0, dir: dir,
                    bulletPattern: 'aimed'
                });
            }
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

        // 基本パターンプール
        var pool = ['streamL', 'streamR', 'formation'];
        if (stage >= 1) { pool.push('crossStream', 'topAimed', 'massRush'); }
        if (stage >= 2) { pool.push('sineWave', 'mediumEscort'); }
        if (stage >= 2) { pool.push('dualTurret'); }
        if (stage >= 3) { pool.push('largeTank', 'topAimedHeavy'); }

        // シャッフル
        var shuffled = [];
        var copy = pool.slice();
        while (copy.length > 0) shuffled.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);

        var eventCount = Math.min(14, 8 + stage);
        for (var i = 0; i < eventCount; i++) {
            // 最大3パターン同時出現
            var simultaneous = 1 + Math.floor(Math.random() * 3); // 1~3
            for (var s = 0; s < simultaneous && i + s < eventCount; s++) {
                var pat = shuffled[(i + s) % shuffled.length];
                waveScript.push({ time: t, pattern: pat });
            }
            i += simultaneous - 1;
            t += Math.max(120, Math.floor(300 / stageScale));
        }
        bossInterval = t + 180;
    }

    function executeWaveEvent(pat) {
        switch (pat) {
            case 'streamL': spawnDriftFormation(); break;
            case 'streamR':
                var count = 6 + Math.floor(Math.random() * 6);
                var dir = Math.random() > 0.5 ? 1 : -1;
                var baseY = 30 + Math.random() * 40;
                var startX = dir > 0 ? -15 : W + 15;
                for (var i = 0; i < count; i++) {
                    enemies.push({
                        x: startX - dir * 25 * i, y: baseY,
                        hp: 1, maxHp: 1, speed: 1.5 + Math.random(), type: 'small',
                        pattern: 'drift', fireRate: Math.floor(110 / diff.bullets),
                        fireTimer: Math.floor(Math.random() * 60),
                        size: 8, age: 0, baseX: 0, dir: dir,
                        bulletPattern: 'way3'
                    });
                }
                break;
            case 'formation': spawnDriftFormation(); break;
            case 'crossStream': spawnCrossStream(); break;
            case 'topAimed': spawnTopAimedWave(); break;
            case 'topAimedHeavy': spawnTopAimedWave(6 + Math.floor(Math.random() * 3)); break;
            case 'sineWave': spawnSineFormation(); break;
            case 'mediumEscort':
                spawnEnemy('medium');
                for (var j = 0; j < 5; j++) spawnEnemy('small');
                break;
            case 'largeTank':
                spawnEnemy('large');
                for (var j = 0; j < 3; j++) spawnEnemy('small');
                break;
            case 'dualTurret':
                spawnDualTurrets();
                break;
            case 'massRush':
                spawnMassRush();
                break;
        }
    }

    function spawnBoss() {
        bossActive = true;
        boss = {
            x: W / 2, y: -40,
            hp: Math.floor(600 * diff.bossHp),
            maxHp: Math.floor(600 * diff.bossHp),
            size: 30, phase: 0, phaseTimer: 0,
            fireTimer: 0, age: 0, entering: true
        };
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
    }

    function updateEnemies() {
        if (bossActive) { updateBoss(); return; }
        waveTimer++;

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
        var sz = e.type === 'small' ? 3 : 4;
        var bp = e.bulletPattern || 'down';
        // Assign sprite color based on bullet pattern
        var col = bp === 'aimed' ? 0 : bp === 'way3' ? 3 : bp === 'way5' ? 4 :
                  bp === 'circle' ? 5 : bp === 'diagonal' ? 1 : bp === 'random' ? 6 :
                  bp === 'spread' ? 2 : 0;

        switch (bp) {
            case 'down':
                eBullets.push({ x: e.x, y: e.y, vx: 0, vy: spd, size: sz, grazed: false, color: col });
                break;
            case 'way3': {
                var base = Math.PI / 2;
                for (var i = -1; i <= 1; i++) {
                    var a = base + i * 0.3;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col });
                }
                break;
            }
            case 'way5': {
                var base = Math.PI / 2;
                for (var i = -2; i <= 2; i++) {
                    var a = base + i * 0.25;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: sz, grazed: false, color: col });
                }
                break;
            }
            case 'circle': {
                var n = Math.floor(5 * diff.bullets);
                for (var i = 0; i < n; i++) {
                    var a = (Math.PI * 2 / n) * i + e.age * 0.03;
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd * 0.8, vy: Math.sin(a) * spd * 0.8, size: sz, grazed: false, color: col });
                }
                break;
            }
            case 'aimed':
                eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: sz, grazed: false, color: col });
                break;
            case 'diagonal': {
                var dirX = e.x < W / 2 ? 1 : -1;
                eBullets.push({ x: e.x, y: e.y, vx: dirX * spd * 0.7, vy: spd * 0.7, size: sz, grazed: false, color: col });
                eBullets.push({ x: e.x, y: e.y, vx: -dirX * spd * 0.5, vy: spd * 0.85, size: sz, grazed: false, color: col });
                break;
            }
            case 'random': {
                var n = e.type === 'large' ? 3 : (e.type === 'medium' ? 2 : 1);
                for (var i = 0; i < n; i++) {
                    var a = Math.PI * 0.15 + Math.random() * Math.PI * 0.7;
                    var s = spd * (0.7 + Math.random() * 0.6);
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: sz, grazed: false, color: col });
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
                    eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: sz, grazed: false, color: col });
                }
                break;
            }
        }
    }

    function enemyDestroyed(e) {
        spawnExplosion(e.x, e.y, '#ff4444', e.size > 14 ? 12 : 6);
        score += e.type === 'small' ? 100 : e.type === 'medium' ? 500 : 2000;
        if (e.type === 'small') {
            if (Math.random() < 0.2) spawnItems(e.x, e.y, 'powerS', 1);
            else spawnItems(e.x, e.y, 'scoreS', 1);
        } else if (e.type === 'medium') {
            spawnItems(e.x, e.y, 'score', 1);
            if (Math.random() < 0.25) spawnItems(e.x, e.y, 'power', 1);
            else spawnItems(e.x, e.y, 'scoreS', 2);
        } else if (e.type === 'large') {
            spawnItems(e.x, e.y, 'score', 3); spawnItems(e.x, e.y, 'scoreS', 5);
            spawnItems(e.x, e.y, 'power', 1); spawnItems(e.x, e.y, 'powerS', 2);
            var rng = Math.random();
            if (rng < 0.15) spawnItems(e.x, e.y, 'life', 1);
            else if (rng < 0.35) spawnItems(e.x, e.y, 'bomb', 1);
        }
    }

    function drawEnemies() {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            ctx.save(); ctx.translate(e.x, e.y);
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
        boss.x += Math.sin(boss.age * 0.01) * 1.5;
        if (boss.x < 50) boss.x = 50; if (boss.x > W - 50) boss.x = W - 50;
        boss.phaseTimer++; boss.fireTimer++;
        var fireRate = Math.floor(30 / diff.bullets);
        if (boss.fireTimer >= fireRate) { boss.fireTimer = 0; fireBossBullets(); }
        if (boss.hp <= 0) bossDefeated();
    }

    function fireBossBullets() {
        var spd = 2 * diff.speed, phase = boss.phase % 3;
        if (phase === 0) {
            var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            var n = Math.floor(3 * diff.bullets), spread = 0.4;
            for (var i = 0; i < n; i++) {
                var a = angle - spread + (spread * 2 / Math.max(n - 1, 1)) * i;
                eBullets.push({ x: boss.x, y: boss.y + boss.size, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: 5, grazed: false, color: 0 });
            }
        } else if (phase === 1) {
            var n = Math.floor(4 * diff.bullets);
            for (var i = 0; i < n; i++) {
                var a = (Math.PI * 2 / n) * i + boss.age * 0.05;
                eBullets.push({ x: boss.x, y: boss.y + boss.size * 0.5, vx: Math.cos(a) * spd * 0.9, vy: Math.sin(a) * spd * 0.9, size: 4, grazed: false, color: 5 });
            }
        } else {
            var n = Math.floor(6 * diff.bullets);
            for (var i = 0; i < n; i++) {
                var a = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                var s = spd * (0.7 + Math.random() * 0.6);
                eBullets.push({ x: boss.x + (Math.random() - 0.5) * 30, y: boss.y + boss.size, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 4, grazed: false, color: 6 });
            }
        }
        if (boss.phaseTimer > 300) { boss.phase++; boss.phaseTimer = 0; }
    }

    function bossDefeated() {
        score += 10000;
        spawnExplosion(boss.x, boss.y, '#ffdd44', 20);
        spawnItems(boss.x, boss.y, 'score', 5); spawnItems(boss.x, boss.y, 'scoreS', 10);
        spawnItems(boss.x, boss.y, 'power', 3);
        if (Math.random() > 0.5) spawnItems(boss.x, boss.y, 'life', 1);
        else spawnItems(boss.x, boss.y, 'bomb', 1);
        for (var i = 0; i < eBullets.length; i++) spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
        eBullets = []; boss = null; bossActive = false;
        waveTimer = 0;
        buildWaveScript();
    }

    function drawBoss() {
        if (!boss) return;
        // Magic circle behind boss
        if (isSpriteReady('magicCircle')) {
            var mc = sprites.magicCircle;
            ctx.save();
            ctx.translate(boss.x, boss.y);
            ctx.rotate(boss.age * 0.02);
            ctx.globalAlpha = 0.4;
            var mcSize = boss.size * 3;
            ctx.drawImage(mc, -mcSize / 2, -mcSize / 2, mcSize, mcSize);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        ctx.save(); ctx.translate(boss.x, boss.y);
        ctx.fillStyle = '#cc2222'; ctx.beginPath(); ctx.arc(0, 0, boss.size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#991111';
        ctx.beginPath(); ctx.moveTo(-boss.size, 0); ctx.lineTo(-boss.size * 1.8, -boss.size * 0.5); ctx.lineTo(-boss.size * 0.5, -boss.size * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(boss.size, 0); ctx.lineTo(boss.size * 1.8, -boss.size * 0.5); ctx.lineTo(boss.size * 0.5, -boss.size * 0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, boss.size * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Boss HP bar at top of field
        var bw = W * 0.7, bx = (W - bw) / 2;
        ctx.fillStyle = '#333'; ctx.fillRect(bx, 8, bw, 5);
        ctx.fillStyle = '#ff2222'; ctx.fillRect(bx, 8, bw * Math.max(0, boss.hp / boss.maxHp), 5);
    }

    // ===== Enemy Bullets =====
    function updateEBullets() {
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i]; b.x += b.vx; b.y += b.vy;
            if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) eBullets.splice(i, 1);
        }
    }
    function drawEBullets() {
        var useSprite = isSpriteReady('bulletS');
        var imgS = sprites.bulletS;
        for (var i = 0; i < eBullets.length; i++) {
            var b = eBullets[i];
            if (useSprite) {
                // Small bullet sprite: 144x16, 9 sprites of 16x16
                var col = (b.color !== undefined) ? b.color : 0;
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
            if (dist < GRAZE_RADIUS && dist > PLAYER_HITBOX + b.size) {
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
            if (dx * dx + dy * dy < (PLAYER_HITBOX + b.size) * (PLAYER_HITBOX + b.size)) { eBullets.splice(i, 1); playerHit(); return; }
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
    var DIFF_COLORS = { easy: '#44aaff', normal: '#44ff44', hard: '#ffaa44', lunatic: '#ff4444' };

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
        resetGame();
        state = 'PLAYING';
        overlay.hidden = true;
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
            retryB.addEventListener('click', function () { startGame(); });
            var titleB = document.createElement('button');
            titleB.className = 'game-btn';
            titleB.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Title' : '\u30BF\u30A4\u30C8\u30EB\u3078';
            titleB.addEventListener('click', function () { goToTitle(); });
            rankingBtns.appendChild(retryB);
            rankingBtns.appendChild(titleB);
        } else {
            var backB = document.createElement('button');
            backB.className = 'game-btn';
            backB.textContent = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Back' : '\u623B\u308B';
            backB.addEventListener('click', function () { goToTitle(); });
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
        state = 'TITLE'; menuIndex = 0;
        overlay.hidden = false;
        titleScreen.hidden = false; diffScreen.hidden = true;
        overScreen.hidden = true; rankingScreen.hidden = true;
        updateMenuHighlight();
        initTitleParticles();
        drawTitleBg();
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    // ===== Game Loop =====
    function gameLoop() {
        frame++;

        // Update (only while playing)
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
        }
    }

    // ===== Title Scene =====
    function drawTitleBg() {
        if (titleAnimId) { cancelAnimationFrame(titleAnimId); titleAnimId = null; }
        function titleFrame() {
            if (state !== 'TITLE' && state !== 'DIFFICULTY' && state !== 'RANKING') { titleAnimId = null; return; }
            frame++;
            updateBgParticles(titleParticles, CANVAS_W, CANVAS_H);
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
        return [];
    }

    function updateMenuHighlight() {
        var items = getMenuItems();
        for (var i = 0; i < items.length; i++) items[i].classList.toggle('selected', i === menuIndex);
    }

    function handleMenuKey(code) {
        if (state === 'GAMEOVER') {
            if (code === 'Enter') submitBtn.click();
            else if (code === 'KeyX' || code === 'Escape') skipBtn.click();
            return;
        }
        var items = getMenuItems();
        if (!items || items.length === 0) return;
        if (code === 'ArrowUp') { menuIndex = (menuIndex - 1 + items.length) % items.length; updateMenuHighlight(); }
        else if (code === 'ArrowDown') { menuIndex = (menuIndex + 1) % items.length; updateMenuHighlight(); }
        else if (code === 'KeyZ' || code === 'Enter') { if (menuIndex >= 0 && menuIndex < items.length) items[menuIndex].click(); }
        else if (code === 'KeyX' || code === 'Escape') {
            if (state === 'DIFFICULTY') goToTitle();
            else if (state === 'RANKING') goToTitle();
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
        if (state !== 'PLAYING') handleMenuKey(e.code);
    });
    document.addEventListener('keyup', function (e) { keys[e.code] = false; });

    // ===== Mobile Controls =====
    var mobileKeys = { up: false, down: false, left: false, right: false, shot: false, bomb: false, slow: false };
    function resetMobileKeys() { for (var k in mobileKeys) mobileKeys[k] = false; }

    function setupMobileBtn(selector, key) {
        var el = modal.querySelector(selector); if (!el) return;
        el.addEventListener('touchstart', function (e) { e.preventDefault(); mobileKeys[key] = true; el.classList.add('active'); }, { passive: false });
        el.addEventListener('touchend', function (e) { e.preventDefault(); mobileKeys[key] = false; el.classList.remove('active'); }, { passive: false });
        el.addEventListener('touchcancel', function () { mobileKeys[key] = false; el.classList.remove('active'); });
    }
    setupMobileBtn('.dpad-up', 'up'); setupMobileBtn('.dpad-down', 'down');
    setupMobileBtn('.dpad-left', 'left'); setupMobileBtn('.dpad-right', 'right');
    setupMobileBtn('.shot-btn', 'shot'); setupMobileBtn('.bomb-btn', 'bomb'); setupMobileBtn('.slow-btn', 'slow');

    // ===== Event Listeners =====
    startBtn.addEventListener('click', openGameModal);
    modalClose.addEventListener('click', closeGameModal);
    modalBackdrop.addEventListener('click', closeGameModal);

    modal.querySelectorAll('.title-menu-item').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            var action = btn.dataset.action;
            if (action === 'start') {
                state = 'DIFFICULTY'; menuIndex = 0;
                titleScreen.hidden = true; diffScreen.hidden = false;
                updateMenuHighlight();
            } else if (action === 'ranking') {
                showRanking('title', 'normal');
                drawTitleBg();
            } else if (action === 'exit') {
                closeGameModal();
            }
        });
        btn.addEventListener('mouseenter', function () { menuIndex = idx; updateMenuHighlight(); });
    });

    modal.querySelectorAll('.difficulty-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            diffKey = btn.dataset.diff; diff = DIFF[diffKey]; startGame();
        });
        btn.addEventListener('mouseenter', function () { menuIndex = idx; updateMenuHighlight(); });
    });

    submitBtn.addEventListener('click', function () {
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
        showRanking('gameover', diffKey);
    });

    rankingTabs.querySelectorAll('.ranking-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            rankingTabs.querySelectorAll('.ranking-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active'); loadRanking(tab.dataset.diff);
        });
    });

    GameRanking.init();
    canvas.style.touchAction = 'none';
})();
