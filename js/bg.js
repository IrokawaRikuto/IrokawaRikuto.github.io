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

            this.speed = 1 + Math.random() * 2;
            this.lineLength = 700 + Math.random() * 200;
            this.opacity = 0.25 + Math.random() * 0.15;
            this.width = 0.5 + Math.random() * 1.5;

            // 赤系の色（近未来風）
            const hue = 350 + Math.random() * 20;
            const lightness = 55 + Math.random() * 15;
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

            // 先頭と尾の両方が画面外に出たらリセット
            const dx = Math.cos(this.angle);
            const dy = Math.sin(this.angle);
            let tailX, tailY;
            if (this.distance < this.lineLength) {
                tailX = this.startX;
                tailY = this.startY;
            } else {
                tailX = this.x - dx * this.lineLength;
                tailY = this.y - dy * this.lineLength;
            }
            const headOut = this.x < 0 || this.x > w || this.y < 0 || this.y > h;
            const tailOut = tailX < 0 || tailX > w || tailY < 0 || tailY > h;
            if (headOut && tailOut) {
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

            // 棒全体を一本の直線で描画（均一な不透明度、両端だけ少しフェード）
            const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            grad.addColorStop(0, this.color + '0)');
            grad.addColorStop(0.3, this.color + this.opacity + ')');
            grad.addColorStop(1, this.color + this.opacity + ')');

            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'butt';
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();
        }
    }

    // ===== 小さなグロウパーティクル =====
    class Glow {
        constructor() {
            this.reset(true);
        }

        reset(init) {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.radius = 2 + Math.random() * 5;
            this.baseOpacity = 0.2 + Math.random() * 0.25;
            this.phase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.005 + Math.random() * 0.015;
            this.driftX = (Math.random() - 0.5) * 0.15;
            this.driftY = (Math.random() - 0.5) * 0.1 - 0.05;
        }

        update() {
            this.x += this.driftX;
            this.y += this.driftY;
            this.phase += this.pulseSpeed;

            if (this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20) {
                this.reset(false);
            }
        }

        draw() {
            const opacity = this.baseOpacity * (0.5 + 0.5 * Math.sin(this.phase));
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
            grad.addColorStop(0, 'rgba(255, 68, 68, ' + opacity + ')');
            grad.addColorStop(1, 'rgba(255, 68, 68, 0)');
            ctx.beginPath();
            ctx.fillStyle = grad;
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const glowCount = 25;
    const glows = [];
    for (let i = 0; i < glowCount; i++) {
        glows.push(new Glow());
    }

    const lineCount = 10;
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        const line = new Line();
        // 初期タイミングをずらす（最低3本は画面内に見えるように配置）
        if (i < 4) {
            // 最初の4本は画面内に配置
            const preAdvance = 200 + Math.random() * Math.sqrt(w * w + h * h) * 0.4;
            line.x += line.vx / line.speed * preAdvance;
            line.y += line.vy / line.speed * preAdvance;
            line.distance = preAdvance;
        } else {
            // 残りは少しずらして順次出現
            const preAdvance = Math.random() * Math.sqrt(w * w + h * h) * 0.3;
            line.x += line.vx / line.speed * preAdvance;
            line.y += line.vy / line.speed * preAdvance;
            line.distance = preAdvance;
        }
        lines.push(line);
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        for (const glow of glows) {
            glow.update();
            glow.draw();
        }

        for (const line of lines) {
            line.update();
            line.draw();
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
