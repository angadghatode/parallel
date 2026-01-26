import { Application, Container, Assets, Sprite, TextureStyle, Graphics, Point, Text, TextStyle } from 'pixi.js';

(async () => {
    try {
        console.log("1. System Starting...");
        
        // --- CONFIGURATION ---
        const DEBUG_MODE = false; // Set to FALSE later to hide the Red Zone and Numbers!
        
        const app = new Application();
        await app.init({
            resizeTo: window,
            backgroundColor: 0xffd700,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        document.body.appendChild(app.canvas);

        TextureStyle.defaultOptions.scaleMode = 'nearest';

        const world = new Container();
        world.sortableChildren = true; 
        app.stage.addChild(world);

        const repoPath = '/'; 

        const textures = await Assets.load([
            repoPath + 'assets/room_base.png',
            repoPath + 'assets/room_base_sofa.png',
            repoPath + 'assets/angad_character_temp3.png', 
            repoPath + 'assets/room_base_kitchen.png'
        ]);

        // --- SPRITES ---
        const room = new Sprite(textures[repoPath + 'assets/room_base.png']);
        room.anchor.set(0.5);
        room.zIndex = -1000; 
        world.addChild(room);

        const sofa = new Sprite(textures[repoPath + 'assets/room_base_sofa.png']);
        sofa.anchor.set(0.5, 0.5); 
        sofa.y = 0; 
        sofa.zIndex = 50; 
        world.addChild(sofa);

        const char = new Sprite(textures[repoPath + 'assets/angad_character_temp3.png']);
        char.anchor.set(0.5, 1); // Anchor at FEET
        char.scale.set(2); 
        char.y = 50;
        world.addChild(char);

        const kitchen = new Sprite(textures[repoPath + 'assets/room_base_kitchen.png']);
        kitchen.anchor.set(0.5, 0.5); 
        kitchen.y = 0; 
        kitchen.x = 0;
        kitchen.zIndex = 999; 
        world.addChild(kitchen);

        // --- THE "HIDDEN ZONE" ---
        // Use the Mouse Tracker to find the perfect numbers for this!
        const zonePoints = [
            -160, 85, //left corner 
            45, -10,  //Right Corner
            180, 45,  //bottom right
            -10, 140,   //bottom left 
        ];

        const hiddenZone = new Graphics();
        hiddenZone.poly(zonePoints);
        hiddenZone.fill({ color: 0xff0000, alpha: DEBUG_MODE ? 0.5 : 0 }); 
        world.addChild(hiddenZone);

        // --- MOUSE TRACKER SETUP ---
        let coordText;
        if (DEBUG_MODE) {
            coordText = new Text({ text: "0, 0", style: { fontSize: 16, fill: 'white', stroke: 'black', strokeThickness: 3 } });
            coordText.zIndex = 10000; // Always on top
            app.stage.addChild(coordText); // Add to screen, not world
        }

        // --- DRAGGING LOGIC ---
        char.eventMode = 'static';
        char.cursor = 'pointer';
        let isDragging = false;

        char.on('pointerdown', () => { isDragging = true; char.alpha = 0.8; });
        window.addEventListener('pointerup', () => { isDragging = false; char.alpha = 1; });
        
        // Combine Dragging + Mouse Tracking in one listener
        window.addEventListener('pointermove', (e) => {
            const globalPos = { x: e.clientX, y: e.clientY };
            const localPos = world.toLocal(globalPos);

            // 1. Handle Dragging
            if (isDragging) {
                char.x = localPos.x;
                char.y = localPos.y;
            }

            // 2. Handle Mouse Tracker
            if (DEBUG_MODE && coordText) {
                // Update text
                coordText.text = `x: ${Math.round(localPos.x)}, y: ${Math.round(localPos.y)}`;
                // Move text to follow mouse
                coordText.x = e.clientX + 15;
                coordText.y = e.clientY + 15;
            }
        });

        // --- THE SORTING LOGIC ---
        app.ticker.add(() => {
            const feetPos = new Point(char.x, char.y);

            if (hiddenZone.containsPoint(feetPos)) {
                char.zIndex = 10; // Behind
            } else {
                char.zIndex = 100; // Front
            }
        });

        // --- RESIZE ---
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

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
})();