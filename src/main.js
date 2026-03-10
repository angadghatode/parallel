import { Application, Container, Assets, Sprite, TextureStyle, Graphics, Point, Text, TextStyle } from 'pixi.js';

(async () => {
    try {
        console.log("1. System Starting...");
        
        // --- CONFIGURATION ---
        const DEBUG_MODE = false; // Set to FALSE later to hide the Red Zone and Numbers!
        
        const app = new Application();
        await app.init({
            resizeTo: window,

            // the weird yellow that i have right now 0xffd70
            backgroundAlpha: 0,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        document.getElementById('pixi-container').appendChild(app.canvas);

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

        function setTimeOfDay(isNight) {
            // 0xFFFFFF is pure white (Daytime - no filter)
            // 0x5a5a8f is a moody, dark purple/blue (Nighttime filter)
            const lightingColor = isNight ? 0x5a5a8f : 0xFFFFFF;

            // Loop through everything inside your 8-bit room and apply the filter
            world.children.forEach(item => {
                // Apply the tint to every sprite
                item.tint = lightingColor; 
            });
        }

        // Since it's nearly 2:00 AM in Beechboro right now, let's force night mode!
        setTimeOfDay(true);

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
            
            // Scale the PixiJS Room
            world.x = w / 2;
            world.y = h / 2;
            const scale = Math.min(w / 960, h / 720) * 0.95;
            world.scale.set(scale);

            // REMOVE all the document.getElementById('ui-overlay') logic here
        }
        window.addEventListener('resize', resize);
        resize();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
})();

// --- UI LOGIC (LIVE CLOCK & POMODORO) ---

// 1. Live Clock
const clockElement = document.getElementById('live-clock');
setInterval(() => {
    const now = new Date();
    // Formats like: "Wed, Mar 11, 03:01 AM"
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    clockElement.innerText = now.toLocaleDateString('en-US', options);
}, 1000);

// 2. Pomodoro Timer
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes

const taskInput = document.getElementById('task-input');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer-display');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startBtn.addEventListener('click', () => {
    // Optional: Only start if they typed something!
    if (taskInput.value.trim() === "") {
        taskInput.value = "FOCUSING..."; // Default text if they leave it blank
    }

    // Reset and start timer
    clearInterval(timerInterval);
    timeLeft = 25 * 60; 
    updateTimerDisplay();

    // Lock the input so they can't change it while the timer is running
    taskInput.disabled = true;
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5"; // Dim the play button

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerDisplay.innerText = "DONE!";
            // Unlock the inputs when finished
            taskInput.disabled = false;
            startBtn.disabled = false;
            startBtn.style.opacity = "1";
        }
    }, 1000);
});

// Initialize the 25:00 display on load
updateTimerDisplay();


// List of random messages (in standard case for readability)
const messages = [
    "remember to stretch your legs!",
    "don't forget to drink a little bit of water!",
    "i really hope you're doing okay! you got this!",
    "take a deep breath. You're doing great.",
    "your eyes need a break! Look away from the screen for 20 seconds.",
    "posture check! Drop those shoulders and sit back.",
    "don't forget to blink! Screen fatigue is real.",
    "one Pomodoro at a time. You've got this.",
    "it's getting pretty late. Make sure you actually get some sleep soon.",
]

// ...rest of your typewriter logic from before remains the same...
// Speed of typewriter in milliseconds per letter
const typeSpeed = 100; 

// References to HTML elements
const bubble = document.getElementById('speech-bubble');
const bubbleText = document.getElementById('bubble-text');

let typingTimer; // Holds the interval loop for the typing

// Function 1: The Typewriter Effect
function typeWriter(text) {
    bubbleText.innerText = ""; // Clear existing text
    let i = 0;
    clearInterval(typingTimer); // Stop previous typing instances

    typingTimer = setInterval(() => {
        if (i < text.length) {
            // Add next letter
            bubbleText.innerText += text.charAt(i);
            i++;
        } else {
            // Finished typing the whole message
            clearInterval(typingTimer); 
            
            // Wait 4 seconds for the user to read it, THEN hide
            setTimeout(hideBubble, 10000); 
        }
    }, typeSpeed);
}

// Function 2: Show the Bubble and start typing
function showBubble() {
    // Select a random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Make the container visible, THEN start the typing effect
    bubble.classList.remove('hidden');
    typeWriter(randomMessage);
}

// Function 3: Hide the Bubble
function hideBubble() {
    bubble.classList.add('hidden');
    
    // Immediately start the random timer for the NEXT message
    scheduleNextMessage(); 
}

// Function 4: Start the Random Timer
function scheduleNextMessage() {
    // Generate random wait time (between 15 and 45 seconds)
    const randomWait = Math.random() * (45000 - 15000) + 15000;
    
    console.log(`Angad will speak again in ${Math.round(randomWait/1000)} seconds...`);
    setTimeout(showBubble, randomWait);
}

// Start the cycle when the website loads
scheduleNextMessage();

// --- DYNAMIC WEATHER SYSTEM ---
const weatherLayer = document.getElementById('weather-layer');

// 1. Generate the Raindrops
for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.classList.add('raindrop');
    
    // Randomize position across the screen
    drop.style.left = `${Math.random() * 120}vw`; 
    
    // Randomize fall speed (between 0.8s and 1.8s for a slower, relaxed fall)
    drop.style.animationDuration = `${Math.random() * 1.0 + 0.8}s`;
    
    // Randomize start time so they don't fall in a block
    drop.style.animationDelay = `${Math.random() * 2}s`; 
    
    weatherLayer.appendChild(drop);
}

// 2. The Random Storm Controller
function toggleWeather() {
    // Check if it's currently raining
    const isRaining = weatherLayer.style.opacity === '1';
    
    // Toggle it
    weatherLayer.style.opacity = isRaining ? '0' : '1';
    
    // Determine how long until the weather changes again
    // Right now, it shifts every 1 to 3 minutes
    const nextChange = Math.random() * (180000 - 60000) + 60000; 
    
    console.log(`Weather shifting in ${Math.round(nextChange/1000)} seconds...`);
    setTimeout(toggleWeather, nextChange);
}

// Start the weather cycle (Starts the first storm in 10 seconds for testing!)
setTimeout(toggleWeather, 10000);