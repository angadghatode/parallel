import { Container, Sprite, AnimatedSprite, Rectangle, Texture, Graphics, Polygon } from 'pixi.js';

export function setupEnvironment(world, textures) {
    // --- UTILS ---
    function getTex(filename) {
        const key = Object.keys(textures).find(k => k.includes(filename));
        if (!key) console.error(`🚨 Missing texture: ${filename}`);
        return textures[key];
    }

    function createFrames(baseTexture, numFrames) {
        if (!baseTexture) return [];
        const frameWidth = baseTexture.width / numFrames; 
        const frameHeight = baseTexture.height;
        const frames = [];
        for (let i = 0; i < numFrames; i++) {
            const rect = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
            frames.push(new Texture({ source: baseTexture.source, frame: rect }));
        }
        return frames;
    }

    // --- 🏗️ NEW LAYERED CONTAINER SETUP ---
    // Everything goes inside here so the Lighting Mask can cover it!
    const envContainer = new Container();
    envContainer.sortableChildren = true;
    world.addChild(envContainer);

    // --- STATIC SPRITES ---
    const room = new Sprite(getTex('room_base.png'));
    room.anchor.set(0.5);
    room.zIndex = -1000; 
    envContainer.addChild(room); // Added to envContainer

    const sofa = new Sprite(getTex('room_base_sofa.png'));
    sofa.anchor.set(0.5, 0.5); 
    sofa.y = 0; 
    sofa.zIndex = 50; 
    envContainer.addChild(sofa);

    const kitchen = new Sprite(getTex('room_base_kitchen.png'));
    kitchen.anchor.set(0.5, 0.5); 
    kitchen.y = 0; 
    kitchen.x = 0;
    kitchen.zIndex = 998; 
    envContainer.addChild(kitchen);

    const sleepFrames = createFrames(getTex('room_base_sofa_sleeping-sheet.png'), 4);
    let sofaSleeping = null;
    
    if (sleepFrames.length > 0) {
        sofaSleeping = new AnimatedSprite(sleepFrames);
        sofaSleeping.anchor.set(0.5, 0.5);
        sofaSleeping.y = 0; 
        sofaSleeping.zIndex = 51; // Sits exactly on top of the empty sofa!
        sofaSleeping.animationSpeed = 0.015; // Slow, sleepy breathing pace
        sofaSleeping.loop = true;
        sofaSleeping.visible = false; // Hidden during the day
        sofaSleeping.play();
        envContainer.addChild(sofaSleeping);
    }

    // --- ANIMATED PROPS ---
    const compStartupFrames = createFrames(getTex('Computer_turn_on.png'), 7);
    const compTypingFrames = createFrames(getTex('Computer_TYPING.png'), 12);
    let computer = null;

    if (compStartupFrames.length > 0) {
        computer = new AnimatedSprite(compStartupFrames);
        computer.anchor.set(0.5, 0.5); 
        computer.zIndex = 55; 
        computer.animationSpeed = 0.1;
        computer.loop = false; 
        computer.visible = false; 
        envContainer.addChild(computer);

        computer.onComplete = () => {
            computer.textures = compTypingFrames;
            computer.loop = true; 
            computer.play();
        };
    }

    const tvStartupFrames = createFrames(getTex('TV_GAME_TURN_ON.png'), 5);
    const tvGameFrames = createFrames(getTex('TV_GAME.png'), 7);
    let tv = null;

    if (tvStartupFrames.length > 0) {
        tv = new AnimatedSprite(tvStartupFrames);
        tv.anchor.set(0.5, 0.5); 
        tv.zIndex = 55; 
        tv.animationSpeed = 0.1;
        tv.loop = false; 
        tv.visible = false; 
        envContainer.addChild(tv);

        tv.onComplete = () => {
            tv.textures = tvGameFrames;
            tv.loop = true; 
            tv.play();
        };
    }

    const tapFrames = createFrames(getTex('bathtub_drip.png'), 7);
    let leakyTap = null;
    
    if (tapFrames.length > 0) {
        leakyTap = new AnimatedSprite(tapFrames);
        leakyTap.anchor.set(0.5, 0.5);  
        leakyTap.zIndex = 999;
        leakyTap.animationSpeed = 0.15;
        leakyTap.loop = false; 
        leakyTap.visible = false; 
        envContainer.addChild(leakyTap);

        setInterval(() => {
            leakyTap.visible = true;
            leakyTap.gotoAndPlay(0);
        }, 6000);

        leakyTap.onComplete = () => {
            leakyTap.visible = false;
        };
    }

    

    // --- HIDDEN ZONE (For Z-Sorting) ---
    const zonePoints = [
        -160, 85, 
        45, -10,  
        180, 45,  
        -10, 140,   
    ];
    // Create a mathematical polygon for collision detection
    const hiddenPolygon = new Polygon(zonePoints); 
    
    // Create the visual debug graphics
    const hiddenZone = new Graphics();
    hiddenZone.poly(zonePoints);
    hiddenZone.fill({ color: 0xff0000, alpha: 0 }); // Change alpha to 0.5 to debug
    envContainer.addChild(hiddenZone);

    // --- 💡 THE MASK OVERLAY ENGINE ---
    let nightOverlay = null;
    const maskTex = getTex('room_base_night_lamp_MASK.png');
    if (maskTex) {
        nightOverlay = new Sprite(maskTex);
        nightOverlay.anchor.set(0.5);
        nightOverlay.x = 0;
        nightOverlay.y = 0;
        nightOverlay.zIndex = 1000; // Sits on top of EVERYTHING
        nightOverlay.visible = false; 
        envContainer.addChild(nightOverlay);

        nightOverlay.blendMode = 'multiply';
    }

    // Return the envContainer and the new hiddenPolygon!
    return { envContainer, room, computer, tv, leakyTap, hiddenPolygon, nightOverlay, sofaSleeping };
}