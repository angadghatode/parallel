import { AnimatedSprite, Rectangle, Texture, Point } from 'pixi.js';

export function setupCharacter(world, textures, env) {
    function getTex(filename) {
        const key = Object.keys(textures).find(k => k.includes(filename));
        return key ? textures[key] : null;
    }

    const directions = ['north_east', 'south_east', 'south_west', 'north_west'];
    const animations = {};

    directions.forEach(dir => {
        const baseTexture = getTex(`angad_character_${dir}.png`);
        if (!baseTexture) return;
        const frameWidth = baseTexture.width / 4; 
        const frameHeight = baseTexture.height;
        const frames = [];
        for (let i = 0; i < 4; i++) {
            const rect = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
            frames.push(new Texture({ source: baseTexture.source, frame: rect }));
        }
        animations[dir] = frames;
    });

    const char = new AnimatedSprite(animations['south_east']);
    char.anchor.set(0.5, 1); 
    char.scale.set(2); 
    char.animationSpeed = 0.1; 
    char.stop(); 
    char.zIndex = 490; 
    if (env && env.envContainer) env.envContainer.addChild(char);
    else world.addChild(char);

    const STATES = { IDLE: 'IDLE', WORKING: 'WORKING', WATCHING_TV: 'WATCHING_TV', SIPPING_COFFEE: 'SIPPING_COFFEE', SLEEPING: 'SLEEPING' };
    let currentState = STATES.IDLE;
    
    // --- 📍 EXACT DESTINATION COORDINATES ---
    const LOC = {
        DESK:   { x: 80, y: 35 },
        BED:    { x: -50, y: 100 },
        COFFEE: { x: 254, y: 132 },
        FLOOR:  { x: -170, y: 110 }
    };

    let currentLocation = 'DESK'; 
    
    // --- 🗺️ THE ISOMETRIC ROUTES ---
    // Notice how BED to DESK is now just two simple steps!
    const BED_TO_DESK = [ 
        LOC.DESK           
    ];

    const DESK_TO_BED = [ 
        LOC.BED            // Walk a perfect 2:1 straight line back to the bed
    ];
    
    // ☕ THE PERFECT 2:1 COFFEE ROUTE
    const DESK_TO_COFFEE = [    // SW: Step back into the walkway (Exactly -12 X, +6 Y)
        { x: 72, y: 39 },   // SW: A much smaller step back (-8 X, +4 Y)
        { x: 156, y: 81 },  // SE: Walk past the couch, extended further SE (+84 X, +42 Y)
        { x: 128, y: 95 },  // SW: Walk down towards the kitchen (-28 X, +14 Y)
        { x: 228, y: 145 }, // SE: The exact mathematical corner to reach the table (+100 X, +50 Y)
        LOC.COFFEE         // NE: Arrive perfectly at the table (+26 X, -13 Y)
    ];
    
    const COFFEE_TO_DESK = [ 
        { x: 228, y: 145 }, // SW: Step away from the table
        { x: 128, y: 95 },  // NW: Walk up the kitchen edge
        { x: 156, y: 81 },  // NE: Walk behind the couch
        { x: 72, y: 39 },   // NW: Walk up the center aisle
        LOC.DESK            // THE NUDGE: Move +3 pixels Y to update his sprite!
    ];

    const COFFEE_TO_BED = [ 
        { x: 228, y: 145 }, // SW: Step away from the table
        { x: 124, y: 93 },  // NW: Walk up the kitchen edge
        { x: 148, y: 81 },  // NE: Walk behind the couch
        { x: 68, y: 41 },   // NW: Walk up the center aisle
        LOC.BED            // THE NUDGE: Move +3 pixels Y to update his sprite!
    ];

    const BED_TO_COFFEE = [ 
        LOC.BED,
        { x: 68, y: 41 },   // SW: Step back into the walkway (Exactly -12 X, +6 Y)
        { x: 148, y: 81 },  // SE: Walk past the couch (Exactly +80 X, +40 Y)
        { x: 124, y: 93 },  // SW: Walk down towards the kitchen (Exactly -24 X, +12 Y)
        { x: 228, y: 145 }, // SE: The exact mathematical corner to reach the table! (+104 X, +52 Y)
        LOC.COFFEE          // NE: Arrive perfectly at the table (+26 X, -13 Y)
    ];

    // 🏋️ THE PERFECT 2:1 PUSHUP ROUTE
    const BED_TO_FLOOR = [
        { x: -100, y: 75 }, // NW: Turns much earlier now! (-50 X, -25 Y)
        LOC.FLOOR           // SW: Walks down towards the vacuum (-70 X, +35 Y)
    ];

    const FLOOR_TO_BED = [
        { x: -100, y: 75 }, // NE: Walk back to the new turn point (+70 X, -35 Y)
        LOC.BED             // SE: Walk the short distance back to bed (+50 X, +25 Y)
    ];

    const COFFEE_TO_FLOOR = [ 
        { x: 228, y: 145 }, // SW: Step away from the table
        { x: 124, y: 93 },  // NW: Walk up the kitchen edge
        { x: 148, y: 81 },  // NE: Walk behind the couch
        { x: 68, y: 41 },   // NW: Walk up the center aisle
        LOC.BED,
        { x: -100, y: 75 },
        LOC.FLOOR          // THE NUDGE: Move +3 pixels Y to update his sprite!
    ];
    
    const FLOOR_TO_COFFEE = [
        { x: -100, y: 75 },
        LOC.BED,
        { x: 68, y: 41 },
        { x: 148, y: 81 },
        { x: 124, y: 93 },
        { x: 228, y: 145 },
        LOC.COFFEE
    ]

    const DESK_TO_FLOOR = [
        LOC.BED,
        { x: -100, y: 75 },
        LOC.FLOOR    
    ]

    const FLOOR_TO_DESK = [
        { x: -100, y: 75 },
        LOC.BED,
        LOC.DESK
    ]


    function getRoute(from, to) {
        if (from === to) return [];
        if (from === 'DESK' && to === 'BED') return DESK_TO_BED;
        if (from === 'BED' && to === 'DESK') return BED_TO_DESK;
        if (from === 'DESK' && to === 'COFFEE') return DESK_TO_COFFEE;
        if (from === 'COFFEE' && to === 'DESK') return COFFEE_TO_DESK;
        if (from === 'BED' && to === 'COFFEE') return BED_TO_COFFEE; 
        if (from === 'COFFEE' && to === 'BED') return COFFEE_TO_BED;
        if (from === 'BED' && to === 'FLOOR') return BED_TO_FLOOR;
        if (from === 'FLOOR' && to === 'BED') return FLOOR_TO_BED;
        if (from === 'DESK' && to === 'FLOOR') return DESK_TO_FLOOR;
        if (from === 'FLOOR' && to === 'DESK') return FLOOR_TO_DESK;
        if (from === 'COFFEE' && to === 'FLOOR') return COFFEE_TO_FLOOR;
        if (from === 'FLOOR' && to === 'COFFEE') return FLOOR_TO_COFFEE;
    
        return [];
    }

    function resetProps(env) {
        if (env.computer) { env.computer.visible = false; env.computer.stop(); }
        if (env.tv) { env.tv.visible = false; env.tv.stop(); }
        if (env.sofaSleeping) { env.sofaSleeping.visible = false; env.sofaSleeping.stop(); }
        if (env.sofaSitting) { env.sofaSitting.visible = false; env.sofaSitting.stop(); }
        if (env.coffeeSipping) { env.coffeeSipping.visible = false; env.coffeeSipping.stop(); }
        if (env.keyboardAnim) { env.keyboardAnim.visible = false; env.keyboardAnim.stop(); }
        if (env.pushupAnim) { env.pushupAnim.visible = false; env.pushupAnim.stop(); } 
        char.visible = true;
    }

    // Start him at the desk physical coordinates
    char.x = LOC.DESK.x; char.y = LOC.DESK.y; 
    let pathQueue = []; 
    let targetX = char.x; let targetY = char.y;
    const baseMoveSpeed = 0.6; 
    let onArriveCallback = null; 

    return {
        sprite: char, STATES: STATES, LOCATIONS: LOC,
        getState: function() { return currentState; },

        snapTo: function(newState, env, weatherControls) {
            currentState = newState;
            resetProps(env);
            if (weatherControls) weatherControls.setLights(newState === STATES.WORKING); 

            if (newState === STATES.SLEEPING) {
                currentLocation = 'BED'; 
                char.x = LOC.BED.x; char.y = LOC.BED.y; 
                char.visible = false;
                if (env.sofaSleeping) { env.sofaSleeping.visible = true; env.sofaSleeping.play(); }
            } else if (newState === STATES.WATCHING_TV) {
                currentLocation = 'BED'; 
                char.x = LOC.BED.x; char.y = LOC.BED.y;
                char.visible = false;
                if (env.tv) { env.tv.visible = true; env.tv.gotoAndPlay(0); }
                if (env.sofaSitting) { env.sofaSitting.visible = true; env.sofaSitting.play(); }
            } else if (newState === STATES.SIPPING_COFFEE) {
                currentLocation = 'COFFEE'; 
                char.x = LOC.COFFEE.x; char.y = LOC.COFFEE.y;
                char.visible = false;
                if (env.coffeeSipping) { env.coffeeSipping.visible = true; env.coffeeSipping.play(); }
            } else if (newState === STATES.WORKING) {
                currentLocation = 'DESK'; 
                char.x = LOC.DESK.x; char.y = LOC.DESK.y;

                if (char.textures !== animations['north_east']) {
                    char.textures = animations['north_east'];
                }
                char.visible = false; 
                char.gotoAndStop(0);
                if (env.computer) { env.computer.visible = true; env.computer.gotoAndPlay(0); }
                if (env.keyboardAnim) { env.keyboardAnim.visible = true; env.keyboardAnim.play(); }
            } else if (newState === STATES.WORKING_OUT) {
                currentLocation = 'FLOOR'; 
                char.x = LOC.FLOOR.x; char.y = LOC.FLOOR.y;
                char.visible = false;
                if (env.pushupAnim) { env.pushupAnim.visible = true; env.pushupAnim.play(); }
            }
        },

        command: function(newState, env, weatherControls) {
            if (currentState === newState) return;
            currentState = newState;
            resetProps(env);

            let targetLocation = 'DESK';
            if (newState === STATES.SLEEPING || newState === STATES.WATCHING_TV) targetLocation = 'BED';
            if (newState === STATES.SIPPING_COFFEE) targetLocation = 'COFFEE';
            if (newState === STATES.WORKING_OUT) targetLocation = 'FLOOR';

            const route = getRoute(currentLocation, targetLocation);
            currentLocation = targetLocation;

            if (weatherControls) weatherControls.setLights(newState === STATES.WORKING);

            this.walkPath(route, () => {
                if (newState === STATES.SLEEPING && env.sofaSleeping) { 
                    char.visible = false;
                    env.sofaSleeping.visible = true; env.sofaSleeping.play(); 
                } 
                else if (newState === STATES.WATCHING_TV) { 
                    char.visible = false;
                    if (env.tv) { env.tv.visible = true; env.tv.gotoAndPlay(0); }
                    if (env.sofaSitting) { env.sofaSitting.visible = true; env.sofaSitting.play(); }
                } 
                else if (newState === STATES.WORKING && env.computer) { 
                    char.visible = false; // STAY VISIBLE!

                    if (char.textures !== animations['north_east']) {
                        char.textures = animations['north_east'];
                    }
                    
                    char.gotoAndStop(0);
                    env.computer.visible = true; env.computer.gotoAndPlay(0); 

                    if (env.keyboardAnim) { env.keyboardAnim.visible = true; env.keyboardAnim.play(); }
                } 
                else if (newState === STATES.SIPPING_COFFEE && env.coffeeSipping) { 
                    char.visible = false;
                    env.coffeeSipping.visible = true; env.coffeeSipping.play(); 
                }else if (newState === STATES.WORKING_OUT && env.pushupAnim) { 
                    char.visible = false;
                    env.pushupAnim.visible = true; env.pushupAnim.play(); 
                }
                else {
                    char.visible = true; char.gotoAndStop(0);
                }

                
            });
        },
        
        walkTo: function(x, y) {
            this.walkPath([{ x: x, y: y }], () => { char.gotoAndStop(0); });
        },

        walkPath: function(pointsArray, callback) {
            if (!pointsArray || pointsArray.length === 0) {
                if (callback) callback();
                return; 
            }
            pathQueue = [...pointsArray]; 
            const firstPoint = pathQueue.shift(); 
            targetX = firstPoint.x; targetY = firstPoint.y;
            currentState = 'WALKING'; onArriveCallback = callback;
        },

        update: function(ticker) {
            if (env && env.hiddenPolygon) {
                const inHiddenZone = env.hiddenPolygon.contains(char.x, char.y);
                char.zIndex = inHiddenZone ? 10 : 490; 
            }
            if (currentState !== 'WALKING') return;

            const dx = targetX - char.x; const dy = targetY - char.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const step = baseMoveSpeed * ticker.deltaTime;

            if (distance > step) {
                const angle = Math.atan2(dy, dx);
                char.x += Math.cos(angle) * step; char.y += Math.sin(angle) * step;

                let degrees = angle * (180 / Math.PI);
                if (degrees < 0) degrees += 360;

                let newDir = 'south_east'; 
                if (degrees >= 0 && degrees < 90) newDir = 'south_east';
                else if (degrees >= 90 && degrees < 180) newDir = 'south_west';
                else if (degrees >= 180 && degrees < 270) newDir = 'north_west';
                else if (degrees >= 270 && degrees < 360) newDir = 'north_east';

                if (char.textures !== animations[newDir]) {
                    char.textures = animations[newDir]; char.play();
                }
                if (!char.playing) char.play();
            } else {
                char.x = targetX; char.y = targetY;

                if (pathQueue.length > 0) {
                    const nextPoint = pathQueue.shift();
                    targetX = nextPoint.x; targetY = nextPoint.y;
                } else {
                    char.gotoAndStop(0); 
                    if (onArriveCallback) {
                        const tempCallback = onArriveCallback;
                        onArriveCallback = null; tempCallback();
                    } else {
                        currentState = STATES.IDLE;
                    }
                }
            }
        }
    };
}