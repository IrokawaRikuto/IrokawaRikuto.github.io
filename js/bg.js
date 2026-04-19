// 背景アニメーション：まっすぐな棒が画面を横断する（近未来風）
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
                this.angle = (Math.random() * 0.8 - 0.4);
            } else if (side < 0.5) {
                this.x = w;
                this.y = Math.random() * h;
                this.angle = Math.PI + (Math.random() * 0.8 - 0.4);
            } else if (side < 0.75) {
                this.x = Math.random() * w;
                this.y = 0;
                this.angle = Math.PI / 2 + (Math.random() * 0.8 - 0.4);
            } else {
                this.x = Math.random() * w;
                this.y = h;
                this.angle = -Math.PI / 2 + (Math.random() * 0.8 - 0.4);
            }

            // 開始位置を保存
            this.startX = this.x;
            this.startY = this.y;

            this.speed = 3 + Math.random() * 5;
            this.lineLength = 80 + Math.random() * 160;
            this.opacity = 0.15 + Math.random() * 0.25;
            this.width = 0.5 + Math.random() * 1.5;

            // 青系の明るめの色（近未来風）
            const hue = 200 + Math.random() * 50;
            const lightness = 65 + Math.random() * 15;
            this.color = 'hsla(' + hue + ', 85%, ' + lightness + '%, ';

            // 速度ベクトル（固定＝まっすぐ）
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;

            // 進んだ距離
            this.distance = 0;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.distance += this.speed;

            // 先頭が画面外に十分出たらリセット
            if (this.x < -300 || this.x > w + 300 ||
                this.y < -300 || this.y > h + 300) {
                this.reset();
            }
        }

        draw() {
            // 先頭位置
            const headX = this.x;
            const headY = this.y;

            // 尾の位置（先頭からlineLength分後ろ）
            const dx = Math.cos(this.angle);
            const dy = Math.sin(this.angle);
            let tailX = headX - dx * this.lineLength;
            let tailY = headY - dy * this.lineLength;

            // まだ棒が完全に出ていない場合、尾を開始位置に制限
            if (this.distance < this.lineLength) {
                tailX = this.startX;
                tailY = this.startY;
            }

            // 棒全体を一本の直線で描画（グラデーション：尾→先端）
            const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            grad.addColorStop(0, this.color + '0)');
            grad.addColorStop(0.3, this.color + (this.opacity * 0.5) + ')');
            grad.addColorStop(1, this.color + this.opacity + ')');

            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();

            // 先端に小さなグロウ
            const glowAlpha = this.opacity * 0.6;
            const glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 5);
            glow.addColorStop(0, this.color + glowAlpha + ')');
            glow.addColorStop(1, this.color + '0)');
            ctx.beginPath();
            ctx.fillStyle = glow;
            ctx.arc(headX, headY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const lineCount = 18;
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        const line = new Line();
        // 初期タイミングをずらす（最初から画面内にいくつか表示）
        const preAdvance = Math.random() * Math.sqrt(w * w + h * h) * 0.6;
        line.x += line.vx / line.speed * preAdvance;
        line.y += line.vy / line.speed * preAdvance;
        line.distance = preAdvance;
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
