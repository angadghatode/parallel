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
            repoPath + 'assets/animations/room_base_sofa_sleeping-sheet.png'
        ];
        directions.forEach(dir => assetPaths.push(`${repoPath}assets/animations/angad_character_${dir}.png`));

        const textures = await Assets.load(assetPaths);

        // --- 1. BOOT UP MODULES ---
        const env = setupEnvironment(world, textures);
        const characterEngine = setupCharacter(world, textures, env);
        
        setupChatBubble();
        
        const weatherControls = await setupWeather(world, env); 
        setupTimer(characterEngine, env, weatherControls);

        // --- 2. MOUSE TRACKER & DEBUG CLICK-TO-MOVE ---
        const coordText = new Text({ text: "0, 0", style: { fontSize: 16, fill: 'white', stroke: 'black', strokeThickness: 3 } });
        coordText.zIndex = 10000; 
        app.stage.addChild(coordText); 

        window.addEventListener('pointermove', (e) => {
            if (env && env.envContainer) {
                const localPos = env.envContainer.toLocal({ x: e.clientX, y: e.clientY });
                coordText.text = `x: ${Math.round(localPos.x)}, y: ${Math.round(localPos.y)}`;
                coordText.x = e.clientX + 15;
                coordText.y = e.clientY + 15;
            }
        });

        // Use the envContainer for clicks!
        if (env && env.room) {
            env.room.eventMode = 'static';
            env.room.cursor = 'crosshair';
            env.room.on('pointerdown', (e) => {
                const localPos = env.envContainer.toLocal(e.global);
                characterEngine.walkTo(localPos.x, localPos.y);
            });
        }

        // --- INITIAL STATE SNAP ---
        const initialHour = new Date().getHours();
        if (initialHour >= 22 || initialHour < 8) {
            characterEngine.snapTo(characterEngine.STATES.SLEEPING, env, weatherControls);
        }

        // --- AUTONOMOUS ROUTINE CLOCK ---
        // Checks the time every 5 seconds to manage his sleep schedule
        setInterval(() => {
            const hour = new Date().getHours();
            const isSleepTime = hour >= 22 || hour < 8; // 10 PM to 8 AM
            const currentState = characterEngine.getState();
            
            // If it's sleep time, and he isn't already sleeping... send him to bed!
            if (isSleepTime && currentState !== characterEngine.STATES.SLEEPING) {
                console.log("Routine: It is past 10 PM. Going to sleep.");
                characterEngine.command(characterEngine.STATES.SLEEPING, env, weatherControls);
            } 
            // If it's daytime, and he is still sleeping... wake him up!
            else if (!isSleepTime && currentState === characterEngine.STATES.SLEEPING) {
                console.log("Routine: It is past 8 AM. Waking up.");
                characterEngine.command(characterEngine.STATES.IDLE, env, weatherControls);
            }
        }, 5000);

        // --- 3. GAME LOOP ---
        app.ticker.add((ticker) => {
            characterEngine.update(ticker);
        });

        // --- 4. RESIZE HANDLER ---
        function resize() {
            const w = window.innerWidth; const h = window.innerHeight;
            world.x = w / 2; world.y = h / 2;
            world.scale.set(Math.min(w / 960, h / 720) * 0.95);
        }
        window.addEventListener('resize', resize);
        resize();

        // --- 🎬 THE GRAND REVEAL ---
        setTimeout(() => {
            requestAnimationFrame(() => {
                const loader = document.getElementById('loading-screen');
                if (loader) loader.classList.add('hidden-loader');
                
                const ui = document.getElementById('ui-overlay');
                if (ui) ui.style.opacity = '1';
            });
        }, 900);

    } catch (err) {
        console.error("Critical System Failure:", err);
        const loaderText = document.querySelector('.loading-text');
        if (loaderText) loaderText.innerText = "SYSTEM ERROR";
    }
})();