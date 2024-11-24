// Pregnancy Wellness Game Component
class PregnancyWellnessGame {
    constructor(map3DElement) {
        this.map3DElement = map3DElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gameObjects = new Map();
        this.score = 0;
        this.currentLevel = 1;
        this.isActive = false;

        // Game states
        this.STATES = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.STATES.MENU;

        // Game container
        this.container = document.createElement('div');
        this.container.id = 'pregnancy-wellness-game';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Game UI
        this.createGameUI();
    }

    createGameUI() {
        // Game controls
        const controls = document.createElement('div');
        controls.className = 'game-controls';
        controls.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;

        // Start/Stop button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'feature-button';
        toggleButton.innerHTML = '🎮 Start Wellness Game';
        toggleButton.onclick = () => this.toggleGame();

        controls.appendChild(toggleButton);
        document.body.appendChild(controls);

        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'game-score';
        this.scoreDisplay.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: none;
            z-index: 1000;
        `;
        this.updateScoreDisplay();
        document.body.appendChild(this.scoreDisplay);
    }

    updateScoreDisplay() {
        this.scoreDisplay.innerHTML = `
            <div style="font-size: 16px; font-weight: bold;">Wellness Score: ${this.score}</div>
            <div style="font-size: 14px;">Level: ${this.currentLevel}</div>
        `;
    }

    async initialize() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Initialize game objects
        await this.initializeGameObjects();
        
        // Start animation loop
        this.animate();
    }

    async initializeGameObjects() {
        // Create wellness checkpoints
        const checkpoints = [
            { position: { x: 2, y: 1, z: -3 }, type: 'exercise', points: 10 },
            { position: { x: -2, y: -1, z: -3 }, type: 'nutrition', points: 15 },
            { position: { x: 0, y: 2, z: -4 }, type: 'relaxation', points: 20 }
        ];

        for (const checkpoint of checkpoints) {
            const object = await this.createCheckpoint(checkpoint);
            this.gameObjects.set(`checkpoint-${checkpoint.type}`, object);
        }
    }

    async createCheckpoint(checkpoint) {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.getCheckpointColor(checkpoint.type),
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(
            checkpoint.position.x,
            checkpoint.position.y,
            checkpoint.position.z
        );

        // Add glow effect
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { type: "f", value: 0.5 },
                p: { type: "f", value: 1.4 },
                glowColor: { type: "c", value: new THREE.Color(0x00ff00) },
                viewVector: { type: "v3", value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 1.0);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const glowMesh = new THREE.Mesh(geometry.clone(), glowMaterial);
        glowMesh.scale.multiplyScalar(1.2);
        mesh.add(glowMesh);

        // Add checkpoint data
        mesh.userData = {
            type: checkpoint.type,
            points: checkpoint.points,
            collected: false
        };

        this.scene.add(mesh);
        return mesh;
    }

    getCheckpointColor(type) {
        const colors = {
            exercise: 0x00ff00,    // Green
            nutrition: 0xff9900,   // Orange
            relaxation: 0x0099ff   // Blue
        };
        return colors[type] || 0xffffff;
    }

    toggleGame() {
        this.isActive = !this.isActive;
        this.container.style.display = this.isActive ? 'block' : 'none';
        this.scoreDisplay.style.display = this.isActive ? 'block' : 'none';
        
        if (this.isActive) {
            this.startGame();
        } else {
            this.pauseGame();
        }
    }

    startGame() {
        if (!this.scene) {
            this.initialize();
        }
        this.currentState = this.STATES.PLAYING;
        
        // Show game instructions
        this.showGameInstructions();
    }

    showGameInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            max-width: 400px;
            text-align: center;
            z-index: 1001;
        `;
        
        instructions.innerHTML = `
            <h2 style="color: #4d90fe; margin-bottom: 15px;">Pregnancy Wellness Game</h2>
            <p style="margin-bottom: 10px;">Collect wellness checkpoints to boost your health score!</p>
            <ul style="text-align: left; margin: 15px 0;">
                <li>🏃‍♀️ Green orbs: Exercise activities</li>
                <li>🥗 Orange orbs: Nutrition tips</li>
                <li>🧘‍♀️ Blue orbs: Relaxation exercises</li>
            </ul>
            <button class="feature-button" style="margin-top: 15px;">Start Playing!</button>
        `;

        document.body.appendChild(instructions);

        instructions.querySelector('button').onclick = () => {
            instructions.remove();
            this.currentState = this.STATES.PLAYING;
        };
    }

    pauseGame() {
        this.currentState = this.STATES.PAUSED;
    }

    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        if (!this.isActive) return;

        requestAnimationFrame(() => this.animate());

        if (this.currentState === this.STATES.PLAYING) {
            this.updateGame();
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateGame() {
        // Update game objects
        this.gameObjects.forEach((object) => {
            if (!object.userData.collected) {
                object.rotation.y += 0.01;
                
                // Floating animation
                object.position.y += Math.sin(Date.now() * 0.001) * 0.01;
            }
        });

        // Check for collisions with map markers
        this.checkCollisions();
    }

    checkCollisions() {
        // Implementation will depend on how we integrate with the map markers
        // This is a placeholder for the collision detection logic
    }

    collectCheckpoint(checkpoint) {
        if (!checkpoint.userData.collected) {
            checkpoint.userData.collected = true;
            this.score += checkpoint.userData.points;
            this.updateScoreDisplay();

            // Show collection animation
            this.showCollectionAnimation(checkpoint);

            // Show wellness tip
            this.showWellnessTip(checkpoint.userData.type);
        }
    }

    showCollectionAnimation(checkpoint) {
        // Create particle effect
        const particles = new THREE.Group();
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: this.getCheckpointColor(checkpoint.userData.type),
                    transparent: true
                })
            );

            const angle = (i / particleCount) * Math.PI * 2;
            particle.position.set(
                Math.cos(angle) * 0.5,
                Math.sin(angle) * 0.5,
                0
            );

            particles.add(particle);
        }

        this.scene.add(particles);
        particles.position.copy(checkpoint.position);

        // Animate particles
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 1000) {
                this.scene.remove(particles);
                return;
            }

            particles.children.forEach((particle, i) => {
                const angle = (i / particleCount) * Math.PI * 2;
                const radius = 0.5 + (elapsed / 1000) * 2;
                particle.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                );
                particle.material.opacity = 1 - (elapsed / 1000);
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    showWellnessTip(type) {
        const tips = {
            exercise: [
                "Try prenatal yoga for flexibility and strength",
                "Walking is a great low-impact exercise",
                "Swimming can help reduce pregnancy discomfort"
            ],
            nutrition: [
                "Eat plenty of fruits and vegetables",
                "Stay hydrated throughout the day",
                "Include protein-rich foods in your diet"
            ],
            relaxation: [
                "Practice deep breathing exercises",
                "Try meditation for stress relief",
                "Get adequate rest and sleep"
            ]
        };

        const tip = tips[type][Math.floor(Math.random() * tips[type].length)];
        
        const tipElement = document.createElement('div');
        tipElement.className = 'wellness-tip';
        tipElement.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            animation: slideUp 0.3s ease-out;
            z-index: 1002;
        `;
        
        tipElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Wellness Tip:</div>
            <div>${tip}</div>
        `;

        document.body.appendChild(tipElement);

        setTimeout(() => {
            tipElement.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => tipElement.remove(), 300);
        }, 3000);
    }
}

// Add the game to the window object so it can be accessed from map.html
window.PregnancyWellnessGame = PregnancyWellnessGame;