import { Application, Container, Assets, Sprite, TextureStyle, Text, TextStyle } from 'pixi.js';

// 1. SETUP APP
const app = new Application();
await app.init({
    resizeTo: window,
    backgroundColor: 0xffd700, // Yellow background
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

// 3. DEBUG LOADING TEXT (So you know it's running)
const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#000000', // Black text
});
const loadingText = new Text({ text: 'Loading Assets...', style });
loadingText.x = 20;
loadingText.y = 20;
app.stage.addChild(loadingText);

async function setup() {
    try {
        // --- ROBUST LOADER ---
        // We give them "names" (alias) so path changes don't break the code
        Assets.add({ alias: 'room', src: 'assets/room_base.png' });
        Assets.add({ alias: 'sofa', src: 'assets/room_base_sofa.png' });
        Assets.add({ alias: 'char', src: 'assets/angad_character_temp3.png' });

        // Load by name
        const textures = await Assets.load(['room', 'sofa', 'char']);
        
        // Remove loading text
        app.stage.removeChild(loadingText);

        // --- SETUP ROOM ---
        // Now we use the simple name 'room' instead of the path
        const room = new Sprite(textures.room);
        room.anchor.set(0.5);
        room.zIndex = 0;
        world.addChild(room);

        // --- SETUP ANGAD ---
        const char = new Sprite(textures.char);
        char.anchor.set(0.5, 1); 
        char.zIndex = 10;
        char.scale.set(2); 
        world.addChild(char);

        // --- SETUP SOFA ---
        const sofa = new Sprite(textures.sofa);
        sofa.anchor.set(0.5);
        sofa.zIndex = 20;
        world.addChild(sofa);

        // Resize immediately
        resize();

    } catch (e) {
        // If it fails, print the error on the screen so we can see it
        loadingText.text = "ERROR:\n" + e.message;
        console.error(e);
    }
}

// 4. RESIZE FUNCTION
function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    world.x = w / 2;
    world.y = h / 2;

    const originalRoomWidth = 960;  
    const originalRoomHeight = 720; 
    
    const scaleX = w / originalRoomWidth;
    const scaleY = h / originalRoomHeight;
    
    let finalScale = Math.min(scaleX, scaleY) * 0.95;
    world.scale.set(finalScale);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

setup();