// --- src/js/main.js ---
import { Application, Container, Assets, TextureStyle, Text } from 'pixi.js';
import { setupEnvironment } from './Environment.js';
import { setupCharacter } from './Character.js';
import { setupTimer } from './Timer.js';
import { setupWeather } from './Weather.js';
import { setupChatBubble } from './ChatBubble.js';

(async () => {
    try {
        const app = new Application();
        await app.init({
            resizeTo: window, backgroundAlpha: 0, antialias: false,
            resolution: window.devicePixelRatio || 1, autoDensity: true, roundPixels: true
        });
        document.getElementById('pixi-container').appendChild(app.canvas);
        TextureStyle.defaultOptions.scaleMode = 'nearest';

        const world = new Container();
        world.sortableChildren = true; 
        app.stage.addChild(world);

        const repoPath = '/'; 
        const directions = ['north_east', 'south_east', 'south_west', 'north_west'];
        const assetPaths = [
            repoPath + 'assets/room_base.png',
            repoPath + 'assets/room_base_sofa.png',
            repoPath + 'assets/room_base_kitchen.png',
            repoPath + 'assets/animations/Computer_turn_on.png',
            repoPath + 'assets/animations/Computer_TYPING.png',
            repoPath + 'assets/animations/TV_GAME_TURN_ON.png',
            repoPath + 'assets/animations/TV_GAME.png',
            repoPath + 'assets/animations/bathtub_drip.png',
            repoPath + 'assets/room_base_night_lamp_MASK.png',
            repoPath + 'assets/animations/room_base_sofa_sleeping-sheet.png',
            repoPath + 'assets/animations/room_base_sofa_sitting.png',
            repoPath + 'assets/animations/angad_coffee_sipping.png'
        ];
        directions.forEach(dir => assetPaths.push(`${repoPath}assets/animations/angad_character_${dir}.png`));

        const textures = await Assets.load(assetPaths);

        const env = setupEnvironment(world, textures);
        const characterEngine = setupCharacter(world, textures, env);
        
        setupChatBubble();
        
        const weatherControls = await setupWeather(world, env); 
        setupTimer(characterEngine, env, weatherControls);

        app.ticker.add((ticker) => {
            characterEngine.update(ticker);
        });

        function resize() {
            const w = window.innerWidth; const h = window.innerHeight;
            world.x = w / 2; world.y = h / 2;
            world.scale.set(Math.min(w / 960, h / 720) * 0.95);
        }
        window.addEventListener('resize', resize);
        resize();

        // --- DAILY SCHEDULE LOGIC ---
        function getScheduledState(hour, minute, engine) {
            if (hour >= 22 || hour < 7) return engine.STATES.SLEEPING;
            if (hour >= 7 && hour < 10) return (minute < 30) ? engine.STATES.SIPPING_COFFEE : engine.STATES.WATCHING_TV;
            if (hour >= 10 && hour < 14) return (minute < 50) ? engine.STATES.WORKING : engine.STATES.SIPPING_COFFEE;
            if (hour === 14) return engine.STATES.SLEEPING;
            if (hour >= 15 && hour < 22) {
                const block = hour % 3;
                if (block === 0) return engine.STATES.WORKING;       
                if (block === 1) return engine.STATES.WATCHING_TV;   
                if (block === 2) return engine.STATES.SIPPING_COFFEE;
            }
            return engine.STATES.IDLE;
        }

        const now = new Date();
        const startState = getScheduledState(now.getHours(), now.getMinutes(), characterEngine);
        characterEngine.snapTo(startState, env, weatherControls);

        // --- GLOBAL DEBUG HOTKEYS ---
        let manualOverride = false;
        window.addEventListener('keydown', (e) => {
            if (e.key === '1') weatherControls.forceWeather('clear');
            if (e.key === '2') weatherControls.forceWeather('cloudy');
            if (e.key === '3') weatherControls.forceWeather('rain');
            
            if (e.key === '4') weatherControls.toggleLamp();
            
            if (e.key === '5') {
                if (env.tv) {
                    env.tv.visible = !env.tv.visible;
                    if (env.tv.visible) env.tv.gotoAndPlay(0);
                    else env.tv.stop();
                }
            }
            if (e.key === '6') {
                if (env.computer) {
                    env.computer.visible = !env.computer.visible;
                    if (env.computer.visible) env.computer.gotoAndPlay(0);
                    else env.computer.stop();
                }
            }

            if (['7', '8', '9', '0'].includes(e.key)) {
                manualOverride = true; 
                if (e.key === '7') characterEngine.command(characterEngine.STATES.SLEEPING, env, weatherControls);
                if (e.key === '8') characterEngine.command(characterEngine.STATES.WORKING, env, weatherControls);
                if (e.key === '9') characterEngine.command(characterEngine.STATES.SIPPING_COFFEE, env, weatherControls);
                if (e.key === '0') characterEngine.command(characterEngine.STATES.WATCHING_TV, env, weatherControls);
            }
        });

        // --- AUTONOMOUS 24/7 ROUTINE CLOCK ---
        setInterval(() => {
            if (manualOverride) return; 
            
            const current = new Date();
            const expectedState = getScheduledState(current.getHours(), current.getMinutes(), characterEngine);
            const currentState = characterEngine.getState();
            
            if (currentState !== expectedState && currentState !== 'WALKING') {
                characterEngine.command(expectedState, env, weatherControls);
            }
        }, 5000);

        // 🚀 THE WAKE UP FIX: Instantly sync the room if the user switches back to this tab!
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !manualOverride) {
                const current = new Date();
                const expectedState = getScheduledState(current.getHours(), current.getMinutes(), characterEngine);
                
                // If Angad missed a schedule change while the tab was hidden, snap him there instantly!
                if (characterEngine.getState() !== expectedState) {
                    characterEngine.snapTo(expectedState, env, weatherControls);
                }
            }
        });

    } catch (err) {
        console.error("Critical System Failure:", err);
        const loaderText = document.querySelector('.loading-text');
        if (loaderText) loaderText.innerText = "SYSTEM ERROR";
    }

    setTimeout(() => {
        requestAnimationFrame(() => {
            const loader = document.getElementById('loading-screen');
            if (loader) loader.classList.add('hidden-loader');
            
            const ui = document.getElementById('ui-overlay');
            if (ui) ui.style.opacity = '1';

            // Force PixiJS to recalculate the world size now that the CSS is fully loaded
            window.dispatchEvent(new Event('resize')); 
        });
    }, 900);
})();