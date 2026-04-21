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
        sprites[key] = img;
    }
    loadSprite('bulletS', 'シューティング素材/nc165950_弾幕素材_小弾.png');
    loadSprite('bulletM', 'シューティング素材/nc177465_弾幕素材_中弾.png');
    loadSprite('bulletL', 'シューティング素材/nc177425_弾幕素材_大弾.png');
    loadSprite('magicCircle', 'シューティング素材/ボス魔法陣.png');
    loadSprite('deleteEffect', 'シューティング素材/nc165947_敵弾消去エフェクト.png');
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
    var MAX_BOMBS = 3;
    var MIN_POWER = 100;
    var MAX_POWER = 400;
    var INVINCIBLE_FRAMES = 120;
    var BOMB_DURATION = 60;
    var ITEM_ATTRACT_RADIUS = 60;
    var ITEM_AUTO_COLLECT_Y = 100;
    var GRAZE_RADIUS = 24;

    var DIFF = {
        easy:    { bullets: 0.5, bossHp: 0.6, speed: 0.8, label: 'Easy' },
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

        // Title text (single layer)
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 38px "Courier New", monospace';
        ctx.fillText('SHOOTING', CANVAS_W / 2, CANVAS_H * 0.28);
        ctx.shadowBlur = 0;
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,180,180,0.5)';
        ctx.fillText('- Portfolio Mini Game -', CANVAS_W / 2, CANVAS_H * 0.28 + 26);
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

        // Bomb
        if ((keys['KeyX'] || mobileKeys.bomb) && bombTimer <= 0 && bombs > 0) {
            bombs--;
            bombTimer = BOMB_DURATION;
            invTimer = Math.max(invTimer, BOMB_DURATION);
            for (var i = 0; i < eBullets.length; i++) {
                spawnDeleteEffect(eBullets[i].x, eBullets[i].y);
            }
            eBullets = [];
            for (var i = 0; i < enemies.length; i++) enemies[i].hp -= 30;
            if (boss) boss.hp -= 50;
        }
        if (bombTimer > 0) {
            bombTimer--;
            if (frame % 10 === 0) {
                for (var i = 0; i < enemies.length; i++) enemies[i].hp -= 5;
                if (boss) boss.hp -= 10;
            }
        }

        attractItems(slow);
    }

    function firePlayerShot() {
        var lvl = Math.floor(power / 100);
        var bx = player.x, by = player.y - PLAYER_SIZE;

        if (lvl <= 1) {
            pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 2) {
            pBullets.push({ x: bx - 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx + 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 3) {
            pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx - 10, y: by, vx: -0.5, vy: -10, w: 3, h: 12 });
            pBullets.push({ x: bx + 10, y: by, vx: 0.5, vy: -10, w: 3, h: 12 });
        } else {
            pBullets.push({ x: bx - 4, y: by, vx: 0, vy: -10, w: 4, h: 16 });
            pBullets.push({ x: bx + 4, y: by, vx: 0, vy: -10, w: 4, h: 16 });
            pBullets.push({ x: bx - 14, y: by, vx: -0.6, vy: -10, w: 3, h: 12 });
            pBullets.push({ x: bx + 14, y: by, vx: 0.6, vy: -10, w: 3, h: 12 });
            pBullets.push({ x: bx - 22, y: by + 4, vx: -1.2, vy: -9, w: 3, h: 10 });
            pBullets.push({ x: bx + 22, y: by + 4, vx: 1.2, vy: -9, w: 3, h: 10 });
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

        if (bombTimer > 0) {
            var ba = bombTimer / BOMB_DURATION * 0.3;
            ctx.fillStyle = 'rgba(68,255,68,' + ba + ')';
            ctx.fillRect(0, 0, W, H);
        }
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
    function spawnItems(x, y, type, count) {
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = 1 + Math.random() * 2;
            items.push({
                x: x + Math.cos(angle) * 5, y: y + Math.sin(angle) * 5,
                vx: Math.cos(angle) * spd * 0.3, vy: -2 + Math.sin(angle) * spd * 0.3,
                type: type, age: 0, attracted: false
            });
        }
    }

    function attractItems(slow) {
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var dx = player.x - it.x, dy = player.y - it.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (player.y < ITEM_AUTO_COLLECT_Y) it.attracted = true;
            if (slow && dist < ITEM_ATTRACT_RADIUS) it.attracted = true;
            if (it.attracted && dist > 1) {
                it.vx = dx / dist * 8; it.vy = dy / dist * 8;
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
            case 'bomb':   bombs = Math.min(MAX_BOMBS + 2, bombs + 1); break;
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
        var img = sprites.deleteEffect;
        if (!img || !img.complete) return;
        // 256x32, 8 frames of 32x32
        for (var i = 0; i < deleteEffects.length; i++) {
            var de = deleteEffects[i];
            var fi = Math.min(7, Math.floor(de.frame / 2));
            ctx.globalAlpha = 1 - de.frame / de.maxFrame;
            ctx.drawImage(img, fi * 32, 0, 32, 32, de.x - 16, de.y - 16, 32, 32);
        }
        ctx.globalAlpha = 1;
    }

    // ===== Enemies =====
    // Bullet patterns: 'down', 'way3', 'way5', 'circle', 'aimed', 'diagonal', 'random'
    var BULLET_PATTERNS_SMALL = ['down', 'aimed', 'diagonal'];
    var BULLET_PATTERNS_MEDIUM = ['way3', 'aimed', 'diagonal', 'random'];
    var BULLET_PATTERNS_LARGE = ['way5', 'circle', 'way3', 'random'];

    function pickBulletPattern(type) {
        var pool;
        if (type === 'small') pool = BULLET_PATTERNS_SMALL;
        else if (type === 'medium') pool = BULLET_PATTERNS_MEDIUM;
        else pool = BULLET_PATTERNS_LARGE;
        if (waveIndex >= 2 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3'];
        if (waveIndex >= 4 && type === 'small') pool = ['down', 'aimed', 'diagonal', 'way3', 'random'];
        if (waveIndex >= 3 && type === 'medium') pool = ['way3', 'way5', 'aimed', 'diagonal', 'circle', 'random'];
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
            e.hp = 3; e.maxHp = 3; e.size = 8;
            e.speed = 1.5 + Math.random() * 1;
            e.fireRate = Math.floor(180 / diff.bullets);
            e.bulletPattern = pickBulletPattern('small');
            if (patRoll > 0.7) { e.pattern = 'sine'; e.baseX = e.x; }
        } else if (type === 'medium') {
            e.hp = 15; e.maxHp = 15; e.size = 14;
            e.speed = 1 + Math.random() * 0.5;
            e.fireRate = Math.floor(100 / diff.bullets);
            e.bulletPattern = pickBulletPattern('medium');
            if (patRoll > 0.5) { e.pattern = 'sine'; e.baseX = e.x; }
        } else if (type === 'large') {
            e.hp = 50; e.maxHp = 50; e.size = 20; e.speed = 0.4;
            e.fireRate = Math.floor(60 / diff.bullets);
            e.bulletPattern = pickBulletPattern('large');
            e.pattern = 'hover'; e.targetY = 60 + Math.random() * 60;
        }
        enemies.push(e);
    }

    function spawnDriftFormation() {
        var count = 5 + Math.floor(Math.random() * 6); // 5-10体
        var dir = Math.random() > 0.5 ? 1 : -1;
        var baseY = 30 + Math.random() * 40;
        var startX = dir > 0 ? -15 : W + 15;
        var spd = 1.5 + Math.random() * 1;
        var spacing = 25;
        for (var i = 0; i < count; i++) {
            enemies.push({
                x: startX - dir * spacing * i,
                y: baseY,  // 一直線
                hp: 3, maxHp: 3, speed: spd, type: 'small',
                pattern: 'drift', fireRate: Math.floor(180 / diff.bullets),
                fireTimer: Math.floor(Math.random() * 60),
                size: 8, age: 0, baseX: 0, dir: dir,
                bulletPattern: pickBulletPattern('small')
            });
        }
    }

    function spawnBoss() {
        bossActive = true;
        boss = {
            x: W / 2, y: -40,
            hp: Math.floor(300 * diff.bossHp),
            maxHp: Math.floor(300 * diff.bossHp),
            size: 30, phase: 0, phaseTimer: 0,
            fireTimer: 0, age: 0, entering: true
        };
    }

    function updateEnemies() {
        if (bossActive) { updateBoss(); return; }
        waveTimer++;

        if (preBoss) {
            for (var i = enemies.length - 1; i >= 0; i--) {
                var e = enemies[i]; e.age++;
                e.y += e.speed + 1.5;
                if (e.pattern === 'drift') e.x += e.dir * e.speed * 1.5;
                if (e.y > H + 40 || e.x < -40 || e.x > W + 40) enemies.splice(i, 1);
            }
            if (enemies.length === 0) {
                forceCollectAllItems();
                // ボス出現時に残っている弾を消去エフェクト付きで消す
                for (var j = 0; j < eBullets.length; j++) spawnDeleteEffect(eBullets[j].x, eBullets[j].y);
                eBullets = [];
                preBoss = false; spawnBoss();
            }
            return;
        }

        // Stage-based scaling
        var stageScale = 1 + waveIndex * 0.15;
        var spawnRate = Math.max(20, Math.floor(40 / stageScale));
        if (waveTimer % spawnRate === 0) {
            spawnEnemy('small');
            if (Math.random() > 0.6 / stageScale) spawnEnemy('small');
        }
        var driftRate = Math.max(60, Math.floor(120 / stageScale));
        if (waveTimer % driftRate === 0 && waveTimer > 60) spawnDriftFormation();
        var medRate = Math.max(100, Math.floor(200 / stageScale));
        if (waveTimer % medRate === 0 && waveTimer > 150) spawnEnemy('medium');
        var lgRate = Math.max(250, Math.floor(500 / stageScale));
        if (waveTimer % lgRate === 0 && waveTimer > 400) spawnEnemy('large');

        if (waveTimer >= bossInterval) {
            waveTimer = 0; waveIndex++;
            bossInterval = Math.max(800, bossInterval - 50);
            preBoss = true; return;
        }

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i]; e.age++;
            if (e.pattern === 'straight') e.y += e.speed;
            else if (e.pattern === 'sine') { e.y += e.speed; e.x = e.baseX + Math.sin(e.age * 0.04) * 40; }
            else if (e.pattern === 'drift') { e.x += e.dir * e.speed * 1.5; e.y += Math.sin(e.age * 0.02) * 0.5; }
            else if (e.pattern === 'hover') { if (e.y < e.targetY) e.y += e.speed; e.x += Math.sin(e.age * 0.015) * 0.8; }

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
                  bp === 'circle' ? 5 : bp === 'diagonal' ? 1 : bp === 'random' ? 6 : 0;

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
            if (e.type !== 'small') {
                var bw = e.size * 1.6;
                ctx.fillStyle = '#333'; ctx.fillRect(-bw / 2, -e.size - 6, bw, 3);
                ctx.fillStyle = '#ff4444'; ctx.fillRect(-bw / 2, -e.size - 6, bw * (e.hp / e.maxHp), 3);
            }
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
    }

    function drawBoss() {
        if (!boss) return;
        // Magic circle behind boss
        var mc = sprites.magicCircle;
        if (mc && mc.complete) {
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
        if (bombTimer > 0) return;
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i]; b.x += b.vx; b.y += b.vy;
            if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) eBullets.splice(i, 1);
        }
    }
    function drawEBullets() {
        var imgS = sprites.bulletS;
        var useSprite = imgS && imgS.complete;
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
        invTimer = INVINCIBLE_FRAMES;
        var oldPower = power;
        power = Math.max(MIN_POWER, power - 100); // -1.00
        var lost = oldPower - power;
        if (lost > 0) {
            var dropRate = 0.4 + Math.random() * 0.2;
            var dropAmount = Math.floor(lost * dropRate);
            var bigCount = Math.floor(dropAmount / 10);
            var smallCount = dropAmount - bigCount * 10;
            if (bigCount > 0) spawnItems(player.x, player.y, 'power', bigCount);
            if (smallCount > 0) spawnItems(player.x, player.y, 'powerS', smallCount);
        }
        spawnExplosion(player.x, player.y, '#ffffff', 10);
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

        // ハイスコア (HiScore)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u30CF\u30A4\u30B9\u30B3\u30A2', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ccc';
        ctx.font = '13px "Courier New", monospace';
        ctx.fillText(formatScore(Math.max(score, 0)), rightX, py);
        py += 20;

        // スコア (Score)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u30B9\u30B3\u30A2', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px "Courier New", monospace';
        ctx.fillText(formatScore(score), rightX, py);
        py += 30;

        // 残り人数 (Lives)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u6B8B\u308A\u4EBA\u6570', px, py);
        py += 16;
        for (var i = 0; i < Math.max(MAX_LIVES, lives); i++) {
            drawStar(px + 8 + i * 16, py + 5, i < lives ? 6 : 5, i < lives ? '#ff4444' : '#222');
        }
        py += 22;

        // スペルカード (Bombs)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u30B9\u30DA\u30EB\u30AB\u30FC\u30C9', px, py);
        py += 16;
        for (var i = 0; i < Math.max(MAX_BOMBS, bombs); i++) {
            drawStar(px + 8 + i * 16, py + 5, i < bombs ? 6 : 5, i < bombs ? '#44ff44' : '#222');
        }
        py += 30;

        // 霊力 (Power)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u970A\u529B', px, py);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText((power / 100).toFixed(2) + ' / ' + (MAX_POWER / 100).toFixed(2), rightX, py);
        py += 22;

        // Power bar
        var barW = HUD_W;
        var barH = 4;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(px, py, barW, barH);
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(px, py, barW * (power / MAX_POWER), barH);
        py += 18;

        // グレイズ (Graze)
        ctx.textAlign = 'left';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('\u30B0\u30EC\u30A4\u30BA', px, py);
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
        initBgParticles();
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
                updateEBullets(); updateItems(); updateParticles();
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
            drawEBullets(); drawPlayer(); drawParticles();
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
