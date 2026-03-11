import { Application, Container, Assets, Sprite, TextureStyle, Graphics, Point, Text } from 'pixi.js';

(async () => {
    try {
        console.log("1. System Starting...");
        
        // --- CONFIGURATION ---
        const DEBUG_MODE = false; 
        
        const app = new Application();
        await app.init({
            resizeTo: window,
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
        char.anchor.set(0.5, 1); 
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
        const zonePoints = [
            -160, 85, 
            45, -10,  
            180, 45,  
            -10, 140,   
        ];

        const hiddenZone = new Graphics();
        hiddenZone.poly(zonePoints);
        hiddenZone.fill({ color: 0xff0000, alpha: DEBUG_MODE ? 0.5 : 0 }); 
        world.addChild(hiddenZone);

        // --- MOUSE TRACKER SETUP ---
        let coordText;
        if (DEBUG_MODE) {
            coordText = new Text({ text: "0, 0", style: { fontSize: 16, fill: 'white', stroke: 'black', strokeThickness: 3 } });
            coordText.zIndex = 10000; 
            app.stage.addChild(coordText); 
        }

        // --- CHARACTER DRAGGING LOGIC ---
        char.eventMode = 'static';
        char.cursor = 'pointer';
        let isDragging = false;

        char.on('pointerdown', () => { isDragging = true; char.alpha = 0.8; });
        window.addEventListener('pointerup', () => { isDragging = false; char.alpha = 1; });
        
        window.addEventListener('pointermove', (e) => {
            const globalPos = { x: e.clientX, y: e.clientY };
            const localPos = world.toLocal(globalPos);

            if (isDragging) {
                char.x = localPos.x;
                char.y = localPos.y;
            }

            if (DEBUG_MODE && coordText) {
                coordText.text = `x: ${Math.round(localPos.x)}, y: ${Math.round(localPos.y)}`;
                coordText.x = e.clientX + 15;
                coordText.y = e.clientY + 15;
            }
        });

        // --- THE SORTING LOGIC ---
        app.ticker.add(() => {
            const feetPos = new Point(char.x, char.y);
            char.zIndex = hiddenZone.containsPoint(feetPos) ? 10 : 100; 
        });

        // --- 1. HEX COLOR BLENDER ---
        function lerpColor(a, b, amount) { 
            const ar = a >> 16, ag = a >> 8 & 0xff, ab = a & 0xff;
            const br = b >> 16, bg = b >> 8 & 0xff, bb = b & 0xff;
            const rr = Math.round(ar + amount * (br - ar));
            const rg = Math.round(ag + amount * (bg - ag));
            const rb = Math.round(ab + amount * (bb - ab));
            return (rr << 16) + (rg << 8) + (rb | 0);
        }

        function toCssHex(num) {
            return '#' + num.toString(16).padStart(6, '0');
        }

        // --- 2. 24-HOUR DYNAMIC ENVIRONMENT RENDERER ---
        const sunElement = document.getElementById('weather-sun');
        const moonElement = document.getElementById('weather-moon');

        function renderEnvironment(progress) {
            // progress: 0.0 -> 1.0
            
            let roomTint, skyTop, skyMid1, skyMid2, skyBottom, starOpacity;
            let sunX = 0, sunY = 0, sunOpacity = 0;
            let moonX = 0, moonY = 0, moonOpacity = 0;
            
            const screenW = window.innerWidth;

            // Defines the top of the arc and the bottom of the arc (the horizon)
            const Y_PEAK = window.innerHeight * 0.05;    // Highest point (5% from top)
            const Y_HORIZON = window.innerHeight * 0.25; // Horizon line (25% from top)
            const Y_HIDDEN = window.innerHeight * 1.5;   // Way off screen when hidden

            // -- PREDETERMINED SKY GRADIENTS --
            const gradientDay = { top: 0x4A90E2, m1: 0x5CA0EA, m2: 0x6EB0F2, b: 0x87CEEB };
            const gradientDusk = { top: 0x2B2D42, m1: 0x7A444A, m2: 0xB85B50, b: 0xFF7B54 };
            const gradientNight = { top: 0x0B0B1A, m1: 0x1c142c, m2: 0x251d36, b: 0x2D263C };

            // -- DEFINE THE COMPLEX TIMELINE PHASES (0.0 - 1.0) --
            
            if (progress < 0.15) {
                // PHASE 1: MIDNIGHT TO MOONSET (0.0 to 0.15)
                const p = progress / 0.15;
                
                skyTop=gradientNight.top; skyMid1=gradientNight.m1; skyMid2=gradientNight.m2; skyBottom=gradientNight.b;
                roomTint = 0x5a5a8f; starOpacity = 1.0;

                moonX = screenW * 0.5 + (p * screenW * 0.5); 
                moonY = Y_HORIZON - Math.sin((0.5 + p * 0.5) * Math.PI) * (Y_HORIZON - Y_PEAK);
                moonOpacity = 1;
                sunY = Y_HIDDEN;
            } 
            else if (progress < 0.25) {
                // PHASE 2: TWILIGHT DAWN (0.15 to 0.25)
                const p = (progress - 0.15) / 0.10;
                
                roomTint = lerpColor(0x5a5a8f, 0xffcc88, p); 
                skyTop = lerpColor(gradientNight.top, gradientDusk.top, p);
                skyMid1 = lerpColor(gradientNight.m1, gradientDusk.m1, p);
                skyMid2 = lerpColor(gradientNight.m2, gradientDusk.m2, p);
                skyBottom = lerpColor(gradientNight.b, gradientDusk.b, p);
                starOpacity = 1.0 - p; 

                moonY = Y_HIDDEN; 
                sunY = Y_HIDDEN; 
            } 
            else if (progress < 0.75) {
                // PHASE 3, 4, 5: SUN RISING, DAY, SUN SETTING (0.25 to 0.75)
                const pSun = (progress - 0.25) / 0.50; 
                
                if (progress < 0.35) { 
                    const pC = (progress - 0.25) / 0.10;
                    roomTint = lerpColor(0xffcc88, 0xFFFFFF, pC);
                    skyTop = lerpColor(gradientDusk.top, gradientDay.top, pC);
                    skyMid1 = lerpColor(gradientDusk.m1, gradientDay.m1, pC);
                    skyMid2 = lerpColor(gradientDusk.m2, gradientDay.m2, pC);
                    skyBottom = lerpColor(gradientDusk.b, gradientDay.b, pC);
                } else if (progress < 0.65) { 
                    roomTint = 0xFFFFFF;
                    skyTop=gradientDay.top; skyMid1=gradientDay.m1; skyMid2=gradientDay.m2; skyBottom=gradientDay.b;
                } else { 
                    const pC = (progress - 0.65) / 0.10;
                    roomTint = lerpColor(0xFFFFFF, 0xffcc88, pC);
                    skyTop = lerpColor(gradientDay.top, gradientDusk.top, pC);
                    skyMid1 = lerpColor(gradientDay.m1, gradientDusk.m1, pC);
                    skyMid2 = lerpColor(gradientDay.m2, gradientDusk.m2, pC);
                    skyBottom = lerpColor(gradientDay.b, gradientDusk.b, pC);
                }
                
                starOpacity = 0;
                sunX = pSun * screenW;
                sunY = Y_HORIZON - Math.sin(pSun * Math.PI) * (Y_HORIZON - Y_PEAK);
                sunOpacity = 1;
                moonY = Y_HIDDEN;
            } 
            else if (progress < 0.85) {
                // PHASE 6: TWILIGHT DUSK (0.75 to 0.85)
                const p = (progress - 0.75) / 0.10;
                
                roomTint = lerpColor(0xffcc88, 0x5a5a8f, p); 
                skyTop = lerpColor(gradientDusk.top, gradientNight.top, p);
                skyMid1 = lerpColor(gradientDusk.m1, gradientNight.m1, p);
                skyMid2 = lerpColor(gradientDusk.m2, gradientNight.m2, p);
                skyBottom = lerpColor(gradientDusk.b, gradientNight.b, p);
                starOpacity = p; 

                moonY = Y_HIDDEN;
                sunY = Y_HIDDEN; 
            } 
            else {
                // PHASE 7: MOONRISE TO MIDNIGHT (0.85 to 1.0)
                const p = (progress - 0.85) / 0.15;
                
                skyTop=gradientNight.top; skyMid1=gradientNight.m1; skyMid2=gradientNight.m2; skyBottom=gradientNight.b;
                roomTint = 0x5a5a8f; starOpacity = 1.0;

                moonX = p * screenW * 0.5; 
                moonY = Y_HORIZON - Math.sin((p * 0.5) * Math.PI) * (Y_HORIZON - Y_PEAK);
                moonOpacity = 1;
                sunY = Y_HIDDEN;
            }

            // --- Apply the States ---
            world.children.forEach(item => { item.tint = roomTint; });

            document.documentElement.style.setProperty('--sky-top', toCssHex(skyTop));
            document.documentElement.style.setProperty('--sky-mid1', toCssHex(skyMid1));
            document.documentElement.style.setProperty('--sky-mid2', toCssHex(skyMid2));
            document.documentElement.style.setProperty('--sky-bottom', toCssHex(skyBottom));

            document.querySelectorAll('.star').forEach(star => {
                star.style.opacity = starOpacity;
            });

            if (sunElement) {
                sunElement.style.left = `${sunX}px`;
                sunElement.style.top = `${sunY}px`;
                sunElement.style.opacity = sunOpacity;
            }
            
            if (moonElement) {
                moonElement.style.left = `${moonX}px`;
                moonElement.style.top = `${moonY}px`;
                moonElement.style.opacity = moonOpacity;
            }
        }

        // --- 3. REAL-WORLD TIME CALCULATOR ---
        function syncWithRealTime() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            
            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
            const currentProgress = totalSeconds / 86400; 
            
            renderEnvironment(currentProgress);
        }

        // Runs immediately when site loads to prevent the initial snapping glitch
        syncWithRealTime(); 
        // Starts the clock updates
        setInterval(syncWithRealTime, 1000);

        // --- RESIZE ---
        function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            world.x = w / 2;
            world.y = h / 2;
            const scale = Math.min(w / 960, h / 720) * 0.95;
            world.scale.set(scale);
            
            // Re-calculate sun position on resize so it doesn't break
            syncWithRealTime();
        }
        window.addEventListener('resize', resize);
        resize();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
})();

// --- UI LOGIC (LIVE CLOCK & POMODORO) ---
const clockElement = document.getElementById('live-clock');
setInterval(() => {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    clockElement.innerText = now.toLocaleDateString('en-US', options);
}, 1000);

let timerInterval;
let timeLeft = 25 * 60; 

const taskInput = document.getElementById('task-input');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer-display');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startBtn.addEventListener('click', () => {
    if (taskInput.value.trim() === "") taskInput.value = "FOCUSING..."; 

    clearInterval(timerInterval);
    timeLeft = 25 * 60; 
    updateTimerDisplay();

    taskInput.disabled = true;
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5"; 

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerDisplay.innerText = "DONE!";
            taskInput.disabled = false;
            startBtn.disabled = false;
            startBtn.style.opacity = "1";
        }
    }, 1000);
});
updateTimerDisplay();

// --- DYNAMIC SPEECH BUBBLE ---
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
];

const typeSpeed = 100; 
const bubble = document.getElementById('speech-bubble');
const bubbleText = document.getElementById('bubble-text');
let typingTimer; 

function typeWriter(text) {
    bubbleText.innerText = ""; 
    let i = 0;
    clearInterval(typingTimer); 

    typingTimer = setInterval(() => {
        if (i < text.length) {
            bubbleText.innerText += text.charAt(i);
            i++;
        } else {
            clearInterval(typingTimer); 
            setTimeout(hideBubble, 10000); 
        }
    }, typeSpeed);
}

function showBubble() {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    bubble.classList.remove('hidden');
    typeWriter(randomMessage);
}

function hideBubble() {
    bubble.classList.add('hidden');
    scheduleNextMessage(); 
}

function scheduleNextMessage() {
    const randomWait = Math.random() * (45000 - 15000) + 15000;
    setTimeout(showBubble, randomWait);
}
scheduleNextMessage();

// --- DYNAMIC WEATHER SYSTEM ---
const weatherLayer = document.getElementById('weather-layer');
const cloudLayer = document.getElementById('weather-clouds');

// 1. Generate Raindrops
for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.classList.add('raindrop');
    
    drop.style.left = `${Math.random() * 120}vw`; 
    drop.style.animationDuration = `${Math.random() * 1.0 + 0.8}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`; 
    
    if (weatherLayer) weatherLayer.appendChild(drop);
}

// 2. Generate Image Clouds
const cloudImages = ['/assets/cloud.png', '/assets/cloud2.png'];
for (let i = 0; i < 6; i++) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('cloud-wrapper');
    wrapper.style.top = `${Math.random() * 35}vh`; 
    wrapper.style.animationDuration = `${Math.random() * 80 + 40}s`; 
    wrapper.style.animationDelay = `-${Math.random() * 80}s`; 

    const img = document.createElement('img');
    img.classList.add('cloud-img');
    img.src = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    
    const randomWidth = Math.random() * 15 + 10;
    img.style.width = `${randomWidth}vw`;
    
    if (Math.random() > 0.5) {
        img.style.transform = 'scaleX(-1)';
    }
    
    wrapper.appendChild(img);
    if (cloudLayer) cloudLayer.appendChild(wrapper);
}

// 3. Live Weather Controller (OpenWeatherMap)
async function fetchLiveWeather() {
    const apiKey = '89ab74ef53eb7ae3c0e036d5d9953e2e'; 
    
    if (apiKey.includes('***')) {
        console.warn("Weather API Key incomplete. Please replace the *** with your last 3 digits.");
        return; 
    }

    const lat = -31.87; 
    const lon = 115.93; 
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Weather API Error: ${response.status} ${response.statusText}.`);
            return;
        }

        const data = await response.json();
        const weatherId = data.weather[0].id;
        
        const isRaining = weatherId >= 200 && weatherId < 600;
        const isClear = weatherId === 800;
        const isCloudy = weatherId >= 801 && weatherId <= 804;

        if (weatherLayer) weatherLayer.style.opacity = isRaining ? '1' : '0';
        if (document.getElementById('weather-sun')) document.getElementById('weather-sun').style.opacity = isClear ? '1' : '0';
        if (cloudLayer) cloudLayer.style.opacity = isCloudy ? '1' : '0';
        
        const weatherText = document.getElementById('live-weather-text');
        if (weatherText) {
            weatherText.innerText = `${data.weather[0].main} | ${Math.round(data.main.temp)}°C`;
        }
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
    }
}

fetchLiveWeather(); 
setInterval(fetchLiveWeather, 60 * 60 * 1000);

// --- TEMPORARY DEBUG CONTROLS ---
window.addEventListener('keydown', (e) => {
    const sun = document.getElementById('weather-sun');
    const clouds = document.getElementById('weather-clouds');
    const rain = document.getElementById('weather-layer');

    if (!sun || !clouds || !rain) return;

    if (e.key === '1') {
        sun.style.opacity = '1'; clouds.style.opacity = '0'; rain.style.opacity = '0';
        console.log("Forced: SUNNY");
    }
    if (e.key === '2') {
        sun.style.opacity = '0'; clouds.style.opacity = '1'; rain.style.opacity = '0';
        console.log("Forced: CLOUDY");
    }
    if (e.key === '3') {
        sun.style.opacity = '0'; clouds.style.opacity = '0'; rain.style.opacity = '1';
        console.log("Forced: RAIN");
    }
    if (e.key === '4') {
        sun.style.opacity = '1'; clouds.style.opacity = '1'; rain.style.opacity = '0';
        console.log("Forced: RAIN");
    }
});321