class Confetti {
    constructor() {
        this.particles = [];
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        this.running = false;
    }

    createParticle(x, y) {
        return {
            x,
            y,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            radius: Math.random() * 3 + 2,
            vx: Math.random() * 10 - 5,
            vy: -Math.random() * 10 - 10,
            gravity: 0.5,
            opacity: 1,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        };
    }

    start(duration = 3000) {
        if (this.running) return;
        this.running = true;

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Create initial particles
        for (let i = 0; i < 150; i++) {
            this.particles.push(this.createParticle(
                Math.random() * canvas.width,
                canvas.height + 10
            ));
        }

        const animate = () => {
            if (!this.running) {
                canvas.remove();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.005;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(-p.radius, -p.radius);
                ctx.lineTo(0, p.radius);
                ctx.lineTo(p.radius, -p.radius);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Remove particles that are off screen or fully transparent
                if (p.opacity <= 0 || p.y > canvas.height + 20) {
                    if (this.running) {
                        this.particles[index] = this.createParticle(
                            Math.random() * canvas.width,
                            canvas.height + 10
                        );
                    }
                }
            });

            requestAnimationFrame(animate);
        };

        animate();

        if (duration) {
            setTimeout(() => this.stop(), duration);
        }
    }

    stop() {
        this.running = false;
        this.particles = [];
    }
}

// Create a global instance
window.gameConfetti = new Confetti();