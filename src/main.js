import { Application, Container, Assets, Sprite, TextureStyle } from 'pixi.js';

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

// 2. THE WORLD CONTAINER
const world = new Container();
world.sortableChildren = true; 
app.stage.addChild(world);

async function setup() {
    // UPDATED ASSET LIST
    const textures = await Assets.load([
        '/assets/room_base.png',
        '/assets/room_base_sofa.png',
        '/assets/angad_character_temp3.png', 
    ]);

    // --- SETUP ROOM ---
    const room = new Sprite(textures['/assets/room_base.png']);
    room.anchor.set(0.5);
    room.zIndex = 0;
    world.addChild(room);

    // --- SETUP ANGAD ---
    const char = new Sprite(textures['/assets/angad_character_temp3.png']);
    char.anchor.set(0.5, 1); 
    char.zIndex = 10;
    char.scale.set(2); 
    world.addChild(char);

    // --- SETUP SOFA ---
    const sofa = new Sprite(textures['/assets/room_base_sofa.png']);
    sofa.anchor.set(0.5);
    sofa.zIndex = 20;
    world.addChild(sofa);

    // --- RESTORE DRAGGING (SMART VERSION) ---
    char.eventMode = 'static';
    char.cursor = 'pointer';
    
    let isDragging = false;

    // Start Dragging
    char.on('pointerdown', () => {
        isDragging = true;
        // Optional: Make him slightly transparent while dragging
        char.alpha = 0.8; 
    });

    // Stop Dragging
    // We attach this to 'window' so it stops even if you drag off the character
    window.addEventListener('pointerup', () => {
        isDragging = false;
        char.alpha = 1;
    });

    // Move
    window.addEventListener('pointermove', (e) => {
        if (isDragging) {
            // 1. Get Global Mouse Position
            const globalPos = { x: e.clientX, y: e.clientY };

            // 2. Convert to "World" Position
            // Since the world is centered and scaled, we need to ask Pixi:
            // "Where is this mouse click inside the World container?"
            const localPos = world.toLocal(globalPos);

            // 3. Move Angad
            char.x = localPos.x;
            char.y = localPos.y;
        }
    });

    // Trigger resize immediately
    resize();
}

// 3. THE RESIZE FUNCTION
function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Center the world
    world.x = w / 2;
    world.y = h / 2;

    const originalRoomWidth = 960;  
    const originalRoomHeight = 720; 
    
    const scaleX = w / originalRoomWidth;
    const scaleY = h / originalRoomHeight;
    
    // Fit to screen with 95% margin
    let finalScale = Math.min(scaleX, scaleY) * 0.95;

    world.scale.set(finalScale);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

setup();