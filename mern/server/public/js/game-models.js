// 3D Models and Game Mechanics for Environmental Explorer

// Analysis Kit Types
const KIT_TYPES = {
    BASIC: {
        name: 'Basic Kit',
        icon: '🔬',
        uses: 3,
        effectiveness: 1.0,
        model: {
            scale: 0.5,
            src: 'https://storage.googleapis.com/environmental-models/kit-basic.glb'
        }
    },
    ADVANCED: {
        name: 'Advanced Kit',
        icon: '🔬+',
        uses: 2,
        effectiveness: 1.5,
        model: {
            scale: 0.7,
            src: 'https://storage.googleapis.com/environmental-models/kit-advanced.glb'
        }
    },
    PROFESSIONAL: {
        name: 'Professional Kit',
        icon: '🔬++',
        uses: 1,
        effectiveness: 2.0,
        model: {
            scale: 1.0,
            src: 'https://storage.googleapis.com/environmental-models/kit-pro.glb'
        }
    }
};

// Hotspot 3D Models
const HOTSPOT_MODELS = {
    AirQuality: {
        scale: 0.8,
        src: 'https://storage.googleapis.com/environmental-models/air-sensor.glb',
        baseHeight: 50,
        heightMultiplier: 2
    },
    GreenSpace: {
        scale: 1.2,
        src: 'https://storage.googleapis.com/environmental-models/tree-sensor.glb',
        baseHeight: 30,
        heightMultiplier: 1.5
    },
    WasteManagement: {
        scale: 1.0,
        src: 'https://storage.googleapis.com/environmental-models/waste-sensor.glb',
        baseHeight: 40,
        heightMultiplier: 1.8
    },
    RenewableEnergy: {
        scale: 1.5,
        src: 'https://storage.googleapis.com/environmental-models/solar-sensor.glb',
        baseHeight: 60,
        heightMultiplier: 2.2
    }
};

// Wind Visualization Settings
const WIND_SETTINGS = {
    particleCount: 100,
    particleSize: 2,
    particleSpeed: 0.5,
    particleLifetime: 2000,
    colors: {
        clean: '#a8e6cf',
        moderate: '#ffd3b6',
        polluted: '#ff8b94'
    }
};

class GameModels {
    constructor(map3DElement) {
        this.map = map3DElement;
        this.models = new Map();
        this.windParticles = [];
        this.activeAnimations = new Set();
    }

    async createHotspotModel(hotspot, severity) {
        const modelConfig = HOTSPOT_MODELS[hotspot.type];
        const height = modelConfig.baseHeight + (severity * modelConfig.heightMultiplier);

        const model = new google.maps.maps3d.Model3DElement({
            position: {
                lat: hotspot.location.lat,
                lng: hotspot.location.lng,
                altitude: height
            },
            scale: modelConfig.scale,
            src: modelConfig.src,
            altitudeMode: google.maps.maps3d.AltitudeMode.RELATIVE_TO_GROUND
        });

        // Add glow effect using Polyline3D
        const glowEffect = new google.maps.maps3d.Polyline3DElement({
            coordinates: [
                { lat: hotspot.location.lat, lng: hotspot.location.lng, altitude: 0 },
                { lat: hotspot.location.lat, lng: hotspot.location.lng, altitude: height }
            ],
            strokeColor: this.getSeverityColor(severity),
            strokeWidth: 3,
            outerWidth: 0.5,
            outerColor: 'rgba(255,255,255,0.5)',
            altitudeMode: google.maps.maps3d.AltitudeMode.RELATIVE_TO_GROUND,
            drawsOccludedSegments: true
        });

        this.map.append(model);
        this.map.append(glowEffect);
        this.models.set(hotspot.id, { model, glowEffect });

        return model;
    }

    getSeverityColor(severity) {
        if (severity < 0.3) return '#4CAF50';
        if (severity < 0.7) return '#FFC107';
        return '#FF5252';
    }

    async animateAnalysis(hotspot) {
        const modelData = this.models.get(hotspot.id);
        if (!modelData) return;

        const { model } = modelData;
        const startPosition = model.position;
        const animationId = `analysis-${hotspot.id}`;

        // Stop any existing animation for this hotspot
        if (this.activeAnimations.has(animationId)) {
            this.map.stopCameraAnimation();
            this.activeAnimations.delete(animationId);
        }

        // Camera animation
        await this.map.flyCameraTo({
            endCamera: {
                center: {
                    lat: startPosition.lat,
                    lng: startPosition.lng,
                    altitude: startPosition.altitude + 200
                },
                tilt: 45,
                heading: 0
            },
            durationMillis: 1000
        });

        // Orbit animation
        await this.map.flyCameraAround({
            camera: {
                center: startPosition,
                range: 300,
                tilt: 45
            },
            rounds: 1,
            durationMillis: 2000
        });

        this.activeAnimations.add(animationId);
    }

    updateWindVisualization(windSpeed, windDirection, airQuality) {
        // Clear existing wind particles
        this.windParticles.forEach(particle => this.map.removeChild(particle));
        this.windParticles = [];

        // Create new wind particles
        for (let i = 0; i < WIND_SETTINGS.particleCount; i++) {
            const particle = this.createWindParticle(windSpeed, windDirection, airQuality);
            this.windParticles.push(particle);
            this.map.append(particle);
        }
    }

    createWindParticle(windSpeed, windDirection, airQuality) {
        const angle = (windDirection * Math.PI) / 180;
        const distance = windSpeed * WIND_SETTINGS.particleSpeed;
        
        const center = this.map.center;
        const particlePos = {
            lat: center.lat + (Math.cos(angle) * distance),
            lng: center.lng + (Math.sin(angle) * distance),
            altitude: 100 + (Math.random() * 200)
        };

        const particle = new google.maps.maps3d.Polyline3DElement({
            coordinates: [
                particlePos,
                {
                    lat: particlePos.lat + (Math.cos(angle) * 0.001),
                    lng: particlePos.lng + (Math.sin(angle) * 0.001),
                    altitude: particlePos.altitude
                }
            ],
            strokeColor: this.getWindParticleColor(airQuality),
            strokeWidth: WIND_SETTINGS.particleSize,
            altitudeMode: google.maps.maps3d.AltitudeMode.RELATIVE_TO_GROUND,
            drawsOccludedSegments: true
        });

        return particle;
    }

    getWindParticleColor(airQuality) {
        if (airQuality <= 50) return WIND_SETTINGS.colors.clean;
        if (airQuality <= 100) return WIND_SETTINGS.colors.moderate;
        return WIND_SETTINGS.colors.polluted;
    }

    cleanup() {
        this.models.forEach(({ model, glowEffect }) => {
            this.map.removeChild(model);
            this.map.removeChild(glowEffect);
        });
        this.windParticles.forEach(particle => this.map.removeChild(particle));
        this.models.clear();
        this.windParticles = [];
        this.activeAnimations.clear();
    }
}

// Export for use in main game file
window.GameModels = GameModels;
window.KIT_TYPES = KIT_TYPES;
window.HOTSPOT_MODELS = HOTSPOT_MODELS;
window.WIND_SETTINGS = WIND_SETTINGS;