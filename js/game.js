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
    var playBtn = document.getElementById('game-play-btn');
    var submitBtn = document.getElementById('game-submit-btn');
    var retryBtn = document.getElementById('game-retry-btn');
    var rankingList = document.getElementById('game-ranking-list');
    var rankingCloseBtn = document.getElementById('game-ranking-close');

    // HUD elements
    var hudScore = document.getElementById('hud-score');
    var hudHiscore = document.getElementById('hud-hiscore');
    var hudLives = document.getElementById('hud-lives');
    var hudBombs = document.getElementById('hud-bombs');
    var hudPowerVal = document.getElementById('hud-power-val');
    var hudPowerFill = document.getElementById('hud-power-fill');
    var hudDifficulty = document.getElementById('hud-difficulty');

    // Canvas size
    var W = 360, H = 480;
    canvas.width = W;
    canvas.height = H;

    // ===== Constants =====
    var PLAYER_SPEED = 4;
    var PLAYER_SLOW_SPEED = 1.8;
    var PLAYER_SIZE = 10;
    var PLAYER_HITBOX = 2;
    var FIRE_INTERVAL = 4;
    var MAX_LIVES = 3;
    var MAX_BOMBS = 3;
    var MAX_POWER = 400; // 4.00
    var INVINCIBLE_FRAMES = 120;
    var BOMB_DURATION = 60;
    var ITEM_ATTRACT_RADIUS = 60;
    var ITEM_AUTO_COLLECT_Y = 100;

    // Difficulty multipliers
    var DIFF = {
        easy:    { bullets: 0.5, bossHp: 0.6, speed: 0.8, label: 'Easy' },
        normal:  { bullets: 1.0, bossHp: 1.0, speed: 1.0, label: 'Normal' },
        hard:    { bullets: 1.5, bossHp: 1.5, speed: 1.2, label: 'Hard' },
        lunatic: { bullets: 2.0, bossHp: 2.5, speed: 1.4, label: 'Lunatic' }
    };

    // ===== State =====
    var state = 'TITLE';
    var animId = null;
    var frame = 0;
    var score = 0;
    var hiscore = parseInt(localStorage.getItem('game_hiscore') || '0');
    var lives = 0;
    var bombs = 0;
    var power = 0;
    var invTimer = 0;
    var fireTimer = 0;
    var bombTimer = 0;
    var diff = DIFF.normal;
    var diffKey = 'normal';
    var waveTimer = 0;
    var waveIndex = 0;
    var bossActive = false;
    var boss = null;
    var bossInterval = 1200; // Boss every ~20 seconds

    var player = { x: W / 2, y: H - 60 };
    var pBullets = [];
    var enemies = [];
    var eBullets = [];
    var items = [];
    var particles = [];
    var stars = [];

    var keys = {};

    // ===== Stars =====
    function initStars() {
        stars = [];
        for (var i = 0; i < 50; i++) {
            stars.push({ x: Math.random() * W, y: Math.random() * H, s: 0.3 + Math.random() * 1.2, sz: 0.5 + Math.random() * 1.5 });
        }
    }
    function updateStars() {
        for (var i = 0; i < stars.length; i++) {
            stars[i].y += stars[i].s;
            if (stars[i].y > H) { stars[i].y = 0; stars[i].x = Math.random() * W; }
        }
    }
    function drawStars() {
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            var a = 0.3 + s.s * 0.3;
            ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
            ctx.fillRect(s.x, s.y, s.sz, s.sz);
        }
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
            // Clear bullets
            for (var i = 0; i < eBullets.length; i++) {
                spawnParticle(eBullets[i].x, eBullets[i].y, '#ffffff', 3);
            }
            eBullets = [];
            // Damage all enemies
            for (var i = 0; i < enemies.length; i++) enemies[i].hp -= 30;
            if (boss) boss.hp -= 50;
        }
        if (bombTimer > 0) bombTimer--;

        // Item attraction
        attractItems(slow);
    }

    function firePlayerShot() {
        var lvl = Math.floor(power / 100); // 0-4
        var bx = player.x, by = player.y - PLAYER_SIZE;

        if (lvl === 0) {
            pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 1) {
            pBullets.push({ x: bx - 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx + 5, y: by, vx: 0, vy: -10, w: 3, h: 14 });
        } else if (lvl === 2) {
            pBullets.push({ x: bx, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx - 10, y: by, vx: -0.5, vy: -10, w: 3, h: 12 });
            pBullets.push({ x: bx + 10, y: by, vx: 0.5, vy: -10, w: 3, h: 12 });
        } else if (lvl === 3) {
            pBullets.push({ x: bx - 4, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx + 4, y: by, vx: 0, vy: -10, w: 3, h: 14 });
            pBullets.push({ x: bx - 14, y: by, vx: -0.8, vy: -10, w: 3, h: 12 });
            pBullets.push({ x: bx + 14, y: by, vx: 0.8, vy: -10, w: 3, h: 12 });
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
        if (invTimer > 0 && Math.floor(invTimer / 4) % 2 === 0) return;
        var slow = keys['ShiftLeft'] || keys['ShiftRight'] || mobileKeys.slow;

        ctx.save();
        ctx.translate(player.x, player.y);

        // Ship
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -PLAYER_SIZE);
        ctx.lineTo(-PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.5);
        ctx.lineTo(0, PLAYER_SIZE * 0.2);
        ctx.lineTo(PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.5);
        ctx.closePath();
        ctx.fill();

        // Engine
        ctx.fillStyle = 'rgba(255,68,68,0.7)';
        ctx.beginPath();
        ctx.arc(0, PLAYER_SIZE * 0.4, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();

        // Hitbox (visible in slow mode)
        if (slow) {
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, PLAYER_HITBOX + 2, 0, Math.PI * 2);
            ctx.stroke();

            // Attraction range
            ctx.strokeStyle = 'rgba(255,68,68,0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, ITEM_ATTRACT_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Hitbox core
        ctx.fillStyle = 'rgba(255,68,68,0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_HITBOX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Bomb effect
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
            b.x += b.vx;
            b.y += b.vy;
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
    // type: 'scoreS', 'score', 'powerS', 'power'
    function spawnItems(x, y, type, count) {
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = 1 + Math.random() * 2;
            items.push({
                x: x + Math.cos(angle) * 5,
                y: y + Math.sin(angle) * 5,
                vx: Math.cos(angle) * spd * 0.3,
                vy: -2 + Math.sin(angle) * spd * 0.3,
                type: type,
                age: 0,
                attracted: false
            });
        }
    }

    function attractItems(slow) {
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var dx = player.x - it.x;
            var dy = player.y - it.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            // Auto collect near top
            if (player.y < ITEM_AUTO_COLLECT_Y) {
                it.attracted = true;
            }
            // Slow mode attraction
            if (slow && dist < ITEM_ATTRACT_RADIUS) {
                it.attracted = true;
            }

            if (it.attracted) {
                var sp = 8;
                if (dist > 1) {
                    it.vx = dx / dist * sp;
                    it.vy = dy / dist * sp;
                }
            }
        }
    }

    function updateItems() {
        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            it.age++;
            if (!it.attracted) {
                it.vy += 0.03; // gravity
                if (it.vy > 1.5) it.vy = 1.5;
            }
            it.x += it.vx;
            it.y += it.vy;

            // Collect
            var dx = player.x - it.x;
            var dy = player.y - it.y;
            if (dx * dx + dy * dy < 16 * 16) {
                collectItem(it);
                items.splice(i, 1);
                continue;
            }

            if (it.y > H + 20) items.splice(i, 1);
        }
    }

    function collectItem(it) {
        switch (it.type) {
            case 'scoreS': score += 100; break;
            case 'score':  score += 1000; break;
            case 'powerS': power = Math.min(MAX_POWER, power + 1); break;
            case 'power':  power = Math.min(MAX_POWER, power + 5); break;
        }
    }

    function drawItems() {
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var sz = (it.type === 'scoreS' || it.type === 'powerS') ? 4 : 7;

            if (it.type === 'scoreS' || it.type === 'score') {
                ctx.fillStyle = it.type === 'score' ? '#ffdd44' : '#ffdd4488';
            } else {
                ctx.fillStyle = it.type === 'power' ? '#ff4444' : '#ff444488';
            }

            ctx.beginPath();
            ctx.arc(it.x, it.y, sz, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    // ===== Enemies =====
    function spawnEnemy(type) {
        var e = {
            x: 30 + Math.random() * (W - 60),
            y: -20,
            hp: 1, maxHp: 1,
            speed: 1,
            type: type, // 'small', 'medium', 'large'
            pattern: 'straight',
            fireRate: 200,
            fireTimer: Math.floor(Math.random() * 60),
            size: 8,
            age: 0,
            baseX: 0,
            dir: Math.random() > 0.5 ? 1 : -1
        };

        var patRoll = Math.random();

        if (type === 'small') {
            e.hp = 3; e.maxHp = 3;
            e.size = 8;
            e.speed = 1.5 + Math.random() * 1;
            e.fireRate = Math.floor(180 / diff.bullets);
            if (patRoll > 0.7) { e.pattern = 'sine'; e.baseX = e.x; }
            else if (patRoll > 0.5) { e.pattern = 'drift'; e.y = 30 + Math.random() * 40; e.x = e.dir > 0 ? -15 : W + 15; }
        } else if (type === 'medium') {
            e.hp = 15; e.maxHp = 15;
            e.size = 14;
            e.speed = 1 + Math.random() * 0.5;
            e.fireRate = Math.floor(100 / diff.bullets);
            if (patRoll > 0.5) { e.pattern = 'sine'; e.baseX = e.x; }
        } else if (type === 'large') {
            e.hp = 50; e.maxHp = 50;
            e.size = 20;
            e.speed = 0.4;
            e.fireRate = Math.floor(60 / diff.bullets);
            e.pattern = 'hover';
            e.targetY = 60 + Math.random() * 60;
        }

        enemies.push(e);
    }

    function spawnBoss() {
        bossActive = true;
        boss = {
            x: W / 2, y: -40,
            hp: Math.floor(300 * diff.bossHp),
            maxHp: Math.floor(300 * diff.bossHp),
            size: 30,
            phase: 0,
            phaseTimer: 0,
            fireTimer: 0,
            age: 0,
            entering: true
        };
    }

    function updateEnemies() {
        if (bossActive) {
            updateBoss();
            return;
        }

        waveTimer++;

        // Spawn logic
        var spawnRate = 40;
        if (waveTimer % spawnRate === 0) {
            spawnEnemy('small');
            if (Math.random() > 0.6) spawnEnemy('small');
        }
        if (waveTimer % 200 === 0 && waveTimer > 200) {
            spawnEnemy('medium');
        }
        if (waveTimer % 500 === 0 && waveTimer > 500) {
            spawnEnemy('large');
        }

        // Boss spawn
        if (waveTimer >= bossInterval) {
            waveTimer = 0;
            waveIndex++;
            bossInterval = Math.max(800, bossInterval - 50);
            // Clear remaining enemies gently
            spawnBoss();
        }

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            e.age++;

            if (e.pattern === 'straight') {
                e.y += e.speed;
            } else if (e.pattern === 'sine') {
                e.y += e.speed;
                e.x = e.baseX + Math.sin(e.age * 0.04) * 40;
            } else if (e.pattern === 'drift') {
                e.x += e.dir * e.speed * 1.5;
                e.y += Math.sin(e.age * 0.02) * 0.5;
            } else if (e.pattern === 'hover') {
                if (e.y < e.targetY) e.y += e.speed;
                e.x += Math.sin(e.age * 0.015) * 0.8;
            }

            // Fire
            e.fireTimer++;
            if (e.fireTimer >= e.fireRate && e.y > 10 && e.y < H * 0.65) {
                e.fireTimer = 0;
                fireEnemyBullet(e);
            }

            // HP check
            if (e.hp <= 0) {
                enemyDestroyed(e);
                enemies.splice(i, 1);
                continue;
            }

            // Off screen
            if (e.y > H + 40 || e.x < -40 || e.x > W + 40) {
                enemies.splice(i, 1);
            }
        }
    }

    function fireEnemyBullet(e) {
        var angle = Math.atan2(player.y - e.y, player.x - e.x);
        var spd = (1.5 + Math.random() * 0.5) * diff.speed;

        if (e.type === 'small') {
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 3 });
        } else if (e.type === 'medium') {
            var n = Math.floor(2 * diff.bullets);
            var spread = 0.3;
            for (var a = -spread; a <= spread + 0.01; a += spread * 2 / Math.max(n - 1, 1)) {
                eBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle + a) * spd, vy: Math.sin(angle + a) * spd, size: 4 });
            }
        } else if (e.type === 'large') {
            var n = Math.floor(5 * diff.bullets);
            for (var i = 0; i < n; i++) {
                var a = (Math.PI * 2 / n) * i + e.age * 0.03;
                eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd * 0.8, vy: Math.sin(a) * spd * 0.8, size: 4 });
            }
        }
    }

    function enemyDestroyed(e) {
        spawnExplosion(e.x, e.y, '#ff4444', e.size > 14 ? 12 : 6);
        score += e.type === 'small' ? 100 : e.type === 'medium' ? 500 : 2000;

        if (e.type === 'small') {
            if (Math.random() > 0.5) spawnItems(e.x, e.y, 'scoreS', 1);
            else spawnItems(e.x, e.y, 'powerS', 1);
        } else if (e.type === 'medium') {
            if (Math.random() > 0.5) spawnItems(e.x, e.y, 'score', 1);
            else spawnItems(e.x, e.y, 'power', 1);
        } else if (e.type === 'large') {
            spawnItems(e.x, e.y, 'score', 2);
            spawnItems(e.x, e.y, 'scoreS', 4);
            spawnItems(e.x, e.y, 'power', 1);
            spawnItems(e.x, e.y, 'powerS', 3);
        }
    }

    function drawEnemies() {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            ctx.save();
            ctx.translate(e.x, e.y);

            var color = e.type === 'large' ? '#ff3333' : e.type === 'medium' ? '#cc4444' : '#aa3333';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, e.size);
            ctx.lineTo(-e.size, -e.size * 0.3);
            ctx.lineTo(0, -e.size * 0.6);
            ctx.lineTo(e.size, -e.size * 0.3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // HP bar for medium/large
            if (e.type !== 'small') {
                var bw = e.size * 1.6;
                ctx.fillStyle = '#333';
                ctx.fillRect(-bw / 2, -e.size - 6, bw, 3);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-bw / 2, -e.size - 6, bw * (e.hp / e.maxHp), 3);
            }

            ctx.restore();
        }
    }

    // ===== Boss =====
    function updateBoss() {
        if (!boss) return;
        boss.age++;

        if (boss.entering) {
            boss.y += 1;
            if (boss.y >= 70) { boss.entering = false; }
            return;
        }

        // Movement
        boss.x += Math.sin(boss.age * 0.01) * 1.5;
        if (boss.x < 50) boss.x = 50;
        if (boss.x > W - 50) boss.x = W - 50;

        // Phases
        boss.phaseTimer++;
        boss.fireTimer++;

        var fireRate = Math.floor(30 / diff.bullets);
        if (boss.fireTimer >= fireRate) {
            boss.fireTimer = 0;
            fireBossBullets();
        }

        // Boss defeated
        if (boss.hp <= 0) {
            bossDefeated();
        }
    }

    function fireBossBullets() {
        var spd = 2 * diff.speed;
        var phase = boss.phase % 3;

        if (phase === 0) {
            // Aimed spread
            var angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            var n = Math.floor(3 * diff.bullets);
            var spread = 0.4;
            for (var i = 0; i < n; i++) {
                var a = angle - spread + (spread * 2 / Math.max(n - 1, 1)) * i;
                eBullets.push({ x: boss.x, y: boss.y + boss.size, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, size: 5 });
            }
        } else if (phase === 1) {
            // Spiral
            var n = Math.floor(4 * diff.bullets);
            for (var i = 0; i < n; i++) {
                var a = (Math.PI * 2 / n) * i + boss.age * 0.05;
                eBullets.push({ x: boss.x, y: boss.y + boss.size * 0.5, vx: Math.cos(a) * spd * 0.9, vy: Math.sin(a) * spd * 0.9, size: 4 });
            }
        } else {
            // Random spread
            var n = Math.floor(6 * diff.bullets);
            for (var i = 0; i < n; i++) {
                var a = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                var s = spd * (0.7 + Math.random() * 0.6);
                eBullets.push({ x: boss.x + (Math.random() - 0.5) * 30, y: boss.y + boss.size, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 4 });
            }
        }

        // Phase change
        if (boss.phaseTimer > 300) {
            boss.phase++;
            boss.phaseTimer = 0;
        }
    }

    function bossDefeated() {
        score += 10000;
        spawnExplosion(boss.x, boss.y, '#ffdd44', 20);
        spawnItems(boss.x, boss.y, 'score', 5);
        spawnItems(boss.x, boss.y, 'scoreS', 10);
        spawnItems(boss.x, boss.y, 'power', 3);
        // Clear bullets
        for (var i = 0; i < eBullets.length; i++) {
            spawnParticle(eBullets[i].x, eBullets[i].y, '#ffffff', 2);
        }
        eBullets = [];
        boss = null;
        bossActive = false;
    }

    function drawBoss() {
        if (!boss) return;
        ctx.save();
        ctx.translate(boss.x, boss.y);

        // Body
        ctx.fillStyle = '#cc2222';
        ctx.beginPath();
        ctx.arc(0, 0, boss.size, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#991111';
        ctx.beginPath();
        ctx.moveTo(-boss.size, 0);
        ctx.lineTo(-boss.size * 1.8, -boss.size * 0.5);
        ctx.lineTo(-boss.size * 0.5, -boss.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(boss.size, 0);
        ctx.lineTo(boss.size * 1.8, -boss.size * 0.5);
        ctx.lineTo(boss.size * 0.5, -boss.size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, boss.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // HP bar at top
        var bw = W * 0.7;
        var bx = (W - bw) / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, 8, bw, 5);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(bx, 8, bw * Math.max(0, boss.hp / boss.maxHp), 5);
    }

    // ===== Enemy Bullets =====
    function updateEBullets() {
        if (bombTimer > 0) return;
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
                eBullets.splice(i, 1);
            }
        }
    }
    function drawEBullets() {
        for (var i = 0; i < eBullets.length; i++) {
            var b = eBullets[i];
            ctx.fillStyle = 'rgba(255,136,136,0.9)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== Particles =====
    function spawnExplosion(x, y, color, n) {
        for (var i = 0; i < n; i++) {
            spawnParticle(x, y, color, 2 + Math.random() * 3);
        }
    }
    function spawnParticle(x, y, color, size) {
        var a = Math.random() * Math.PI * 2;
        var s = 1 + Math.random() * 3;
        particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 25, maxLife: 25, size: size, color: color });
    }
    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.vy *= 0.95;
            p.life--;
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

    // ===== Collision =====
    function checkCollisions() {
        // Player bullets vs enemies
        for (var i = pBullets.length - 1; i >= 0; i--) {
            var b = pBullets[i];
            // vs enemies
            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];
                if (Math.abs(b.x - e.x) < e.size + 4 && Math.abs(b.y - e.y) < e.size + 4) {
                    e.hp -= 1;
                    pBullets.splice(i, 1);
                    spawnParticle(b.x, b.y, '#ffffff', 1);
                    break;
                }
            }
            // vs boss
            if (boss && !boss.entering && i < pBullets.length) {
                var b2 = pBullets[i];
                if (b2 && Math.abs(b2.x - boss.x) < boss.size + 4 && Math.abs(b2.y - boss.y) < boss.size + 4) {
                    boss.hp -= 1;
                    pBullets.splice(i, 1);
                    spawnParticle(b2.x, b2.y, '#ffffff', 1);
                }
            }
        }

        // Enemy bullets vs player
        if (invTimer > 0 || bombTimer > 0) return;
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i];
            var dx = b.x - player.x;
            var dy = b.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + b.size) * (PLAYER_HITBOX + b.size)) {
                eBullets.splice(i, 1);
                playerHit();
                return;
            }
        }

        // Enemy body vs player
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            var dx = e.x - player.x;
            var dy = e.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + e.size * 0.4) * (PLAYER_HITBOX + e.size * 0.4)) {
                playerHit();
                return;
            }
        }

        // Boss body vs player
        if (boss && !boss.entering) {
            var dx = boss.x - player.x;
            var dy = boss.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + boss.size * 0.5) * (PLAYER_HITBOX + boss.size * 0.5)) {
                playerHit();
            }
        }
    }

    function playerHit() {
        lives--;
        invTimer = INVINCIBLE_FRAMES;
        power = Math.max(0, power - 50);
        spawnExplosion(player.x, player.y, '#ffffff', 10);
        eBullets = [];
        player.x = W / 2;
        player.y = H - 60;
        if (lives <= 0) gameOver();
    }

    // ===== Game State =====
    function resetGame() {
        frame = 0; score = 0; lives = MAX_LIVES; bombs = MAX_BOMBS;
        power = 0; invTimer = 0; fireTimer = 0; bombTimer = 0;
        waveTimer = 0; waveIndex = 0; bossActive = false; boss = null;
        bossInterval = 1200;
        player.x = W / 2; player.y = H - 60;
        pBullets = []; enemies = []; eBullets = []; items = []; particles = [];
        initStars();
    }

    function startGame() {
        resetGame();
        state = 'PLAYING';
        overlay.hidden = true;
        updateHUD();
    }

    function gameOver() {
        state = 'GAMEOVER';
        if (score > hiscore) {
            hiscore = score;
            localStorage.setItem('game_hiscore', hiscore.toString());
        }
        overlay.hidden = false;
        titleScreen.hidden = true;
        diffScreen.hidden = true;
        overScreen.hidden = false;
        rankingScreen.hidden = true;
        finalScoreEl.textContent = 'SCORE: ' + score;
        nameInput.value = '';
        setTimeout(function () { nameInput.focus(); }, 100);
    }

    function showRanking() {
        state = 'RANKING';
        overScreen.hidden = true;
        rankingScreen.hidden = false;
        rankingList.innerHTML = '<li><span style="color:var(--text-muted)">Loading...</span></li>';
        GameRanking.fetchRanking(10).then(function (data) {
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

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function updateHUD() {
        if (hudScore) hudScore.textContent = score;
        if (hudHiscore) hudHiscore.textContent = hiscore;
        if (hudDifficulty) hudDifficulty.textContent = diff.label;

        if (hudLives) {
            var h = '';
            for (var i = 0; i < MAX_LIVES; i++) h += '<span class="' + (i < lives ? '' : 'empty') + '"></span>';
            hudLives.innerHTML = h;
        }
        if (hudBombs) {
            var h = '';
            for (var i = 0; i < MAX_BOMBS; i++) h += '<span class="' + (i < bombs ? '' : 'empty') + '"></span>';
            hudBombs.innerHTML = h;
        }
        if (hudPowerVal) hudPowerVal.textContent = (power / 100).toFixed(2) + ' / 4.00';
        if (hudPowerFill) hudPowerFill.style.width = (power / MAX_POWER * 100) + '%';
    }

    // ===== Game Loop =====
    function gameLoop() {
        frame++;
        updateStars();
        updatePlayer();
        updatePBullets();
        updateEnemies();
        updateEBullets();
        updateItems();
        updateParticles();
        checkCollisions();
        updateHUD();

        // Draw
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawStars();
        drawItems();
        drawPBullets();
        drawEnemies();
        drawBoss();
        drawEBullets();
        drawPlayer();
        drawParticles();

        if (state === 'PLAYING') animId = requestAnimationFrame(gameLoop);
    }

    // ===== Modal =====
    function openGameModal() {
        modal.classList.add('active');
        document.body.style.overflowY = 'hidden';
        state = 'TITLE';
        overlay.hidden = false;
        titleScreen.hidden = false;
        diffScreen.hidden = true;
        overScreen.hidden = true;
        rankingScreen.hidden = true;
        modal.querySelectorAll('[data-ja][data-en]').forEach(function (el) {
            el.textContent = el.getAttribute('data-' + currentLang);
        });
        initStars();
        drawTitleBg();
    }

    function closeGameModal() {
        modal.classList.remove('active');
        document.body.style.overflowY = '';
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        state = 'TITLE';
        keys = {};
        resetMobileKeys();
    }

    function drawTitleBg() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawStars();
    }

    // ===== Input =====
    document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('active')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) !== -1) e.preventDefault();
        keys[e.code] = true;
    });
    document.addEventListener('keyup', function (e) { keys[e.code] = false; });

    // ===== Mobile Controls =====
    var mobileKeys = { up: false, down: false, left: false, right: false, shot: false, bomb: false, slow: false };

    function resetMobileKeys() {
        for (var k in mobileKeys) mobileKeys[k] = false;
    }

    function setupMobileBtn(selector, key) {
        var el = modal.querySelector(selector);
        if (!el) return;
        el.addEventListener('touchstart', function (e) { e.preventDefault(); mobileKeys[key] = true; el.classList.add('active'); }, { passive: false });
        el.addEventListener('touchend', function (e) { e.preventDefault(); mobileKeys[key] = false; el.classList.remove('active'); }, { passive: false });
        el.addEventListener('touchcancel', function () { mobileKeys[key] = false; el.classList.remove('active'); });
    }

    setupMobileBtn('.dpad-up', 'up');
    setupMobileBtn('.dpad-down', 'down');
    setupMobileBtn('.dpad-left', 'left');
    setupMobileBtn('.dpad-right', 'right');
    setupMobileBtn('.shot-btn', 'shot');
    setupMobileBtn('.bomb-btn', 'bomb');
    setupMobileBtn('.slow-btn', 'slow');

    // ===== Event Listeners =====
    startBtn.addEventListener('click', openGameModal);
    modalClose.addEventListener('click', closeGameModal);
    modalBackdrop.addEventListener('click', closeGameModal);

    playBtn.addEventListener('click', function () {
        titleScreen.hidden = true;
        diffScreen.hidden = false;
    });

    // Difficulty buttons
    modal.querySelectorAll('.difficulty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            diffKey = btn.dataset.diff;
            diff = DIFF[diffKey];
            startGame();
            animId = requestAnimationFrame(gameLoop);
        });
    });

    submitBtn.addEventListener('click', function () {
        var name = nameInput.value.trim() || 'AAA';
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        GameRanking.submitScore(name, score).then(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = currentLang === 'ja' ? '\u30B9\u30B3\u30A2\u9001\u4FE1' : 'Submit Score';
            showRanking();
        });
    });

    retryBtn.addEventListener('click', function () {
        overScreen.hidden = true;
        diffScreen.hidden = false;
    });

    rankingCloseBtn.addEventListener('click', function () {
        state = 'TITLE';
        titleScreen.hidden = false;
        diffScreen.hidden = true;
        rankingScreen.hidden = true;
        drawTitleBg();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeGameModal();
    });

    GameRanking.init();
    canvas.style.touchAction = 'none';
})();
