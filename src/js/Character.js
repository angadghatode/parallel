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
    
    // Ensure character sits under the lighting mask
    char.zIndex = 490; 
    if (env && env.envContainer) {
        env.envContainer.addChild(char);
    } else {
        world.addChild(char);
    }

    const STATES = {
        IDLE: 'IDLE',
        WORKING: 'WORKING',
        SLEEPING: 'SLEEPING'
    };

    let currentState = STATES.IDLE;
    
    const ROUTES = {
        CENTER_TO_DESK: [ { x: 52, y: 24 }, { x: 80, y: 38 } ,{ x: 80, y: 37 }],
        DESK_TO_CENTER: [ { x: 52, y: 24 }, { x: 0, y: 50 } ],
        CENTER_TO_BED:  [ { x: -50, y: 50 }, { x: -100, y: 80 } ]
    };

    char.x = 0; char.y = 50;
    let pathQueue = []; 
    let targetX = char.x; let targetY = char.y;
    const baseMoveSpeed = 0.4; 
    let onArriveCallback = null; 

    return {
        sprite: char, STATES: STATES, ROUTES: ROUTES,
        
        // Let the system check if he's already asleep
        getState: function() { return currentState; },

        snapTo: function(newState, env, weatherControls) {
            currentState = newState;
            if (newState === STATES.SLEEPING) {
                if (weatherControls) weatherControls.setLights(false);
                char.visible = false;
                if (env.computer) { env.computer.visible = false; env.computer.stop(); }
                if (env.sofaSleeping) env.sofaSleeping.visible = true;
            }
        },

        command: function(newState, env, weatherControls) {
            currentState = newState;

            if (newState === STATES.WORKING) {
                if (weatherControls) weatherControls.setLights(true); 
                
                this.walkPath(ROUTES.CENTER_TO_DESK, () => {
                    char.visible = false; 
                    if (env.sofaSleeping) env.sofaSleeping.visible = false; // Make sure bed is empty
                    if (env.computer) {
                        env.computer.visible = true;
                        env.computer.gotoAndPlay(0); 
                    }
                });
            } 
            else if (newState === STATES.SLEEPING) {
                if (weatherControls) weatherControls.setLights(false); // Lights out!
                
                // You will need to map these exact coordinates to the sofa later!
                this.walkPath(ROUTES.CENTER_TO_BED, () => { 
                    char.visible = false; // Hide walking Angad
                    if (env.computer) { env.computer.visible = false; env.computer.stop(); }
                    if (env.sofaSleeping) env.sofaSleeping.visible = true; // Show sleeping Angad!
                });
            }
            else if (newState === STATES.IDLE) {
                if (weatherControls) weatherControls.setLights(true); 
                
                if (env.computer) { env.computer.visible = false; env.computer.stop(); }
                if (env.sofaSleeping) env.sofaSleeping.visible = false; // Wake up!
                
                char.visible = true;
                this.walkPath(ROUTES.DESK_TO_CENTER, () => { char.gotoAndStop(0); });
            }
        },
        
        walkTo: function(x, y) {
            this.walkPath([{ x: x, y: y }], () => {
                console.log(`📍 Arrived at: x: ${Math.round(char.x)}, y: ${Math.round(char.y)}`);
                char.gotoAndStop(0); 
            });
        },

        walkPath: function(pointsArray, callback) {
            if (!pointsArray || pointsArray.length === 0) return; 
            pathQueue = [...pointsArray]; 
            const firstPoint = pathQueue.shift(); 
            targetX = firstPoint.x; targetY = firstPoint.y;
            currentState = 'WALKING'; onArriveCallback = callback;
        },

        update: function(ticker) {
            // FIX: Using the math polygon to check boundaries safely!
            if (env && env.hiddenPolygon) {
                const inHiddenZone = env.hiddenPolygon.contains(char.x, char.y);
                char.zIndex = inHiddenZone ? 10 : 490; // 490 ensures he stays below the mask
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