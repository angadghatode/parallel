import { Application, Container, Assets, Sprite, TextureStyle } from 'pixi.js';

// 1. SETUP
const app = new Application();
await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xffd500, // Dark background
    antialias: false, 
    resolution: 1,
});
document.body.appendChild(app.canvas);

// GLOBAL PIXEL ART SETTING (Keeps it crisp)
TextureStyle.defaultOptions.scaleMode = 'nearest';

// 2. CREATE A STAGE (The "World" Container)
// We put everything in here so we can zoom/pan the whole world later
const world = new Container();
app.stage.addChild(world);

// 3. LOAD ASSETS & BUILD
async function setup() {
    // 1. Load BOTH images now
    const textures = await Assets.load([
        '/assets/room_base.png',
        '/assets/angad_character_temp.png',
    ]);

    // 2. Setup the Room (Background)
    const room = new Sprite(textures['/assets/room_base.png']);
    room.anchor.set(0.5); // Center of the image
    room.x = app.screen.width / 2;
    room.y = app.screen.height / 2;
    room.scale.set(1.5); // Zoom in (optional)
    
    // Add room to the world FIRST so it's in the back
    world.addChild(room);

    // 3. Setup Angad (The Character)
    const char = new Sprite(textures['/assets/angad_character_temp.png']);

    // THE ANCHOR TRICK:
    // (0.5, 1) means "The X is the middle, the Y is the BOTTOM feet".
    // This ensures his feet touch the specific coordinate we choose.
    char.anchor.set(0.5, 1); 
    
    // Match the room's scale
    char.scale.set(4);

    // 4. Position Him
    // We start him exactly where the room is (dead center)
    char.x = room.x;
    char.y = room.y;

    // Add him to the world SECOND so he appears ON TOP of the room
    world.addChild(char);
    
    // 5. Make him draggable (Temporary Test Tool)
    // This lets you click and drag Angad around to find the perfect spot for his desk
    char.eventMode = 'static';
    char.cursor = 'pointer';
    
    let isDragging = false;
    char.on('pointerdown', () => isDragging = true);
    window.addEventListener('pointerup', () => isDragging = false);
    window.addEventListener('pointermove', (e) => {
        if (isDragging) {
            char.x = e.clientX;
            char.y = e.clientY;
            console.log(`x: ${char.x}, y: ${char.y}`); // Prints coordinates to console
        }
    });
}
// 4. HANDLE RESIZING
window.addEventListener('resize', () => {
    // Resize the renderer
    app.renderer.resize(window.innerWidth, window.innerHeight);
    
    // Re-center the room sprite if the window size changes
    if (world.children[0]) {
        world.children[0].x = app.screen.width / 2;
        world.children[0].y = app.screen.height / 2;
    }
});

// Start the setup
setup();