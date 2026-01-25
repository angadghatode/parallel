import { Application, Container, Assets, Sprite, TextureStyle } from 'pixi.js';

(async () => {
    try {
        console.log("1. System Starting...");
        
        // 1. SETUP APP
        const app = new Application();
        await app.init({
            resizeTo: window,
            backgroundColor: 0xffd700,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        document.body.appendChild(app.canvas);

        // GLOBAL SETTINGS
        TextureStyle.defaultOptions.scaleMode = 'nearest';

        // 2. WORLD CONTAINER
        const world = new Container();
        world.sortableChildren = true; 
        app.stage.addChild(world);

        // 3. DEFINE PATH (Keep this since it works!)
        const repoPath = '/parallel/'; 

        // 4. LOAD ASSETS
        const textures = await Assets.load([
            repoPath + 'assets/room_base.png',
            repoPath + 'assets/room_base_sofa.png',
            repoPath + 'assets/angad_character_temp3.png', 
        ]);

        console.log("2. Assets Loaded!");

        // 5. CREATE SPRITES
        // --- ROOM ---
        const room = new Sprite(textures[repoPath + 'assets/room_base.png']);
        room.anchor.set(0.5);
        room.zIndex = 0;
        world.addChild(room);

        // --- ANGAD ---
        const char = new Sprite(textures[repoPath + 'assets/angad_character_temp3.png']);
        char.anchor.set(0.5, 1); 
        char.zIndex = 10;
        char.scale.set(2); 
        world.addChild(char);

        // --- SOFA ---
        const sofa = new Sprite(textures[repoPath + 'assets/room_base_sofa.png']);
        sofa.anchor.set(0.5);
        sofa.zIndex = 20;
        world.addChild(sofa);

        // --- DRAGGING LOGIC (RESTORED) ---
        char.eventMode = 'static';
        char.cursor = 'pointer';
        
        let isDragging = false;

        // Start Drag
        char.on('pointerdown', () => {
            isDragging = true;
            char.alpha = 0.8; // Visual feedback
        });

        // End Drag (Listen on window so you don't drop him if you move too fast)
        window.addEventListener('pointerup', () => {
            isDragging = false;
            char.alpha = 1;
        });

        // Move (The Math Magic)
        window.addEventListener('pointermove', (e) => {
            if (isDragging) {
                // 1. Get raw mouse position
                const globalPos = { x: e.clientX, y: e.clientY };

                // 2. Convert raw mouse -> World coordinates
                // This handles the scaling and centering automatically
                const localPos = world.toLocal(globalPos);

                // 3. Move Angad
                char.x = localPos.x;
                char.y = localPos.y;
            }
        });

        // 6. RESIZE LOGIC
        function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            world.x = w / 2;
            world.y = h / 2;
            const scale = Math.min(w / 960, h / 720) * 0.95;
            world.scale.set(scale);
        }
        
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));
        resize();

        console.log("3. System Online!");

    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        alert("CRASH: " + err.message);
    }
})();