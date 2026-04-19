// 背景アニメーション：まっすぐ走る青いライン（近未来風）
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let w, h;
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ライン1本分のデータ
    class Line {
        constructor() {
            this.reset();
        }

        reset() {
            // ランダムな開始位置（画面端から）& まっすぐ進む角度
            const side = Math.random();
            if (side < 0.25) {
                this.x = 0;
                this.y = Math.random() * h;
                this.angle = (Math.random() * 0.8 - 0.4); // 右方向
            } else if (side < 0.5) {
                this.x = w;
                this.y = Math.random() * h;
                this.angle = Math.PI + (Math.random() * 0.8 - 0.4); // 左方向
            } else if (side < 0.75) {
                this.x = Math.random() * w;
                this.y = 0;
                this.angle = Math.PI / 2 + (Math.random() * 0.8 - 0.4); // 下方向
            } else {
                this.x = Math.random() * w;
                this.y = h;
                this.angle = -Math.PI / 2 + (Math.random() * 0.8 - 0.4); // 上方向
            }

            this.speed = 3 + Math.random() * 5;
            this.length = 80 + Math.random() * 160;
            this.opacity = 0.15 + Math.random() * 0.25;
            this.width = 0.5 + Math.random() * 1.5;
            this.life = 0;

            // 画面を横断するのに十分な寿命
            const diagonal = Math.sqrt(w * w + h * h);
            this.maxLife = diagonal / this.speed + 20;

            // 青系の明るめの色（近未来風）
            const hue = 200 + Math.random() * 50; // 200-250 (シアン〜青〜紫青)
            const lightness = 65 + Math.random() * 15; // 65-80% (明るめ)
            this.color = 'hsla(' + hue + ', 85%, ' + lightness + '%, ';

            // 速度ベクトル（固定＝まっすぐ）
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;

            // 軌跡を記録
            this.trail = [];
        }

        update() {
            this.life++;

            // まっすぐ進む
            this.x += this.vx;
            this.y += this.vy;

            this.trail.push({ x: this.x, y: this.y });

            // 軌跡の長さを制限
            const maxTrailPoints = Math.floor(this.length / this.speed);
            if (this.trail.length > maxTrailPoints) {
                this.trail.shift();
            }

            // 画面外に出たらリセット
            if (this.life > this.maxLife ||
                this.x < -200 || this.x > w + 200 ||
                this.y < -200 || this.y > h + 200) {
                this.reset();
            }
        }

        draw() {
            if (this.trail.length < 2) return;

            // フェードイン・フェードアウト
            let fadeMultiplier = 1;
            if (this.life < 20) {
                fadeMultiplier = this.life / 20;
            } else if (this.life > this.maxLife - 30) {
                fadeMultiplier = Math.max(0, (this.maxLife - this.life) / 30);
            }

            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // グラデーション描画（先端が明るく、尾が消える）
            for (let i = 1; i < this.trail.length; i++) {
                const t = i / this.trail.length;
                const alpha = t * this.opacity * fadeMultiplier;
                ctx.beginPath();
                ctx.strokeStyle = this.color + alpha + ')';
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }

            // 先端に小さなグロウ
            const tip = this.trail[this.trail.length - 1];
            const glowAlpha = this.opacity * fadeMultiplier * 0.6;
            const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 5);
            glow.addColorStop(0, this.color + glowAlpha + ')');
            glow.addColorStop(1, this.color + '0)');
            ctx.beginPath();
            ctx.fillStyle = glow;
            ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ライン数
    const lineCount = 18;
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        const line = new Line();
        line.life = Math.random() * line.maxLife * 0.5; // 初期タイミングをずらす
        lines.push(line);
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        for (const line of lines) {
            line.update();
            line.draw();
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
