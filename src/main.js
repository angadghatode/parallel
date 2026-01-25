import { Application, Container, Assets, Sprite, TextureStyle, Graphics, Point, Text, TextStyle } from 'pixi.js';

(async () => {
    try {
        console.log("1. System Starting...");
        
        // --- CONFIGURATION ---
        const DEBUG_MODE = true; 
        
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

        const repoPath = '/'; 

        // 4. LOAD ASSETS
        const textures = await Assets.load([
            repoPath + 'assets/room_base.png',
            repoPath + 'assets/room_base_sofa.png',
            repoPath + 'assets/angad_character_temp3.png', 
        ]);

        console.log("2. Assets Loaded!");

        // 5. CREATE SPRITES
        const room = new Sprite(textures[repoPath + 'assets/room_base.png']);
        room.anchor.set(0.5);
        room.zIndex = -1000;
        world.addChild(room);

        const sofa = new Sprite(textures[repoPath + 'assets/room_base_sofa.png']);
        sofa.anchor.set(0.5, 0.5); 
        sofa.y = 0; 
        world.addChild(sofa);

        const char = new Sprite(textures[repoPath + 'assets/angad_character_temp3.png']);
        char.anchor.set(0.5, 0.5); 
        char.scale.set(2); 
        char.y = 100;
        world.addChild(char);

        // --- 6. DEFINE CUSTOM SHAPES (POLYGONS) ---
        // UPDATE THESE NUMBERS using the mouse tracker!
        const sofaPoints = [
            -75, 40,  //left corner 
            45, -30,  //Right Corner
            130, 10,
            10, 80,
        ];

        // Create the Hitbox Graphics
        const obstacles = new Graphics();
        obstacles.moveTo(sofaPoints[0], sofaPoints[1]);
        for (let i = 2; i < sofaPoints.length; i += 2) {
            obstacles.lineTo(sofaPoints[i], sofaPoints[i+1]);
        }
        obstacles.closePath();
        
        // Visual Styling for Obstacles
        obstacles.fill({ color: 0xff0000, alpha: DEBUG_MODE ? 0.3 : 0 });
        obstacles.stroke({ width: 2, color: 0xff0000, alpha: DEBUG_MODE ? 0.8 : 0 });
        world.addChild(obstacles);

        // --- 7. DEBUG HELPERS (DOT & TEXT) ---
        let coordText;
        let debugDot; // The specific dot you asked for!

        if (DEBUG_MODE) {
            // Text Helper
            coordText = new Text({ text: "0, 0", style: { fontSize: 16, fill: 'white', stroke: 'black', strokeThickness: 3 } });
            coordText.zIndex = 10000;
            app.stage.addChild(coordText);

            // THE COLLISION DOT
            debugDot = new Graphics();
            debugDot.circle(0, 0, 4); // Draw a 4px circle
            debugDot.fill(0x00ff00);  // Start Green (Safe)
            debugDot.zIndex = 9999;   // Draw on top of character
            world.addChild(debugDot); // Add to world so it moves with the room
        }

        // 8. INPUT HANDLING
        const keys = {};
        window.addEventListener('keydown', (e) => keys[e.key] = true);
        window.addEventListener('keyup', (e) => keys[e.key] = false);

        // 9. GAME LOOP
        app.ticker.add(() => {
            
            // --- A. ISOMETRIC MOVEMENT ---
            let dx = 0;
            let dy = 0;
            const speed = 1; // Adjust speed here
            const isoRatio = 0.5; // Standard 2:1 isometric ratio

            // W = Move towards Top-Left Wall (North-West)
            if (keys['a'] || keys['A']) {
                dx -= speed;
                dy -= speed * isoRatio;
            }
            // S = Move towards Bottom-Right Wall (South-East)
            if (keys['d'] || keys['D']) {
                dx += speed;
                dy += speed * isoRatio;
            }
            // A = Move towards Bottom-Left Wall (South-West)
            if (keys['s'] || keys['S']) {
                dx -= speed;
                dy += speed * isoRatio;
            }
            // D = Move towards Top-Right Wall (North-East)
            if (keys['w'] || keys['W']) {
                dx += speed;
                dy -= speed * isoRatio;
            }

            // Normalization (Optional: Prevents super speed when holding 3 keys)
            // If we are moving, we normalize to ensure consistent speed
            if (dx !== 0 || dy !== 0) {
                 // Simple cap to prevent runaway values if multiple keys are mashed
                 // (We don't strictly normalize vector length here to keep the "snappy" grid feel, 
                 // but you can add Math.sqrt logic here if you want perfect circle movement)
            }

            // --- B. INDEPENDENT COLLISION CHECKS (Sliding) ---
            
            // 1. Check X Movement
            const nextX = char.x + dx;
            const pointX = new Point(nextX, char.y); 
            if (!obstacles.containsPoint(pointX)) {
                char.x = nextX; // Safe to move X
            }

            // 2. Check Y Movement
            const nextY = char.y + dy;
            const pointY = new Point(char.x, nextY); 
            if (!obstacles.containsPoint(pointY)) {
                char.y = nextY; // Safe to move Y
            }

            // --- DEBUG DOT ---
            if (DEBUG_MODE) {
                const isBlocked = obstacles.containsPoint(new Point(char.x + dx, char.y + dy));
                debugDot.tint = isBlocked ? 0xff0000 : 0x00ff00;
                debugDot.x = char.x;
                debugDot.y = char.y;
            }

            // --- C. Y-SORTING ---
            const charSortY = char.y + -10; 
            char.zIndex = charSortY;

            // 2. Sofa Sort Point
            // We want the "sorting line" to be at the very bottddaom of the sofa's feet.
            // If the anchor is 0.5, we need to add half the sofa's height.
            // TWEAK THIS NUMBER until it looks perfect!
            const sofaOffset = 10; 
            sofa.zIndex = sofa.y + sofaOffset;
        });

        // 10. MOUSE TRACKER EVENT
        if (DEBUG_MODE) {
            window.addEventListener('pointermove', (e) => {
                const globalPos = { x: e.clientX, y: e.clientY };
                const localPos = world.toLocal(globalPos);

                coordText.text = `x: ${Math.round(localPos.x)}, y: ${Math.round(localPos.y)}`;
                coordText.x = e.clientX + 15;
                coordText.y = e.clientY + 15;
            });
        }

        function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            world.x = w / 2;
            world.y = h / 2;
            const scale = Math.min(w / 960, h / 720) * 0.95;
            world.scale.set(scale);
        }
        
        window.addEventListener('resize', resize);
        resize();

        console.log("3. System Online!");

    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        alert("CRASH: " + err.message);
    }
})();