export async function setupWeather(world, env) {
    const clockElement = document.getElementById('live-clock');
    const weatherText = document.getElementById('live-weather-text');
    const weatherLayer = document.getElementById('weather-layer');
    const cloudLayer = document.getElementById('weather-clouds');
    const sunElement = document.getElementById('weather-sun');
    const moonElement = document.getElementById('weather-moon');
    const starLayer = document.getElementById('star-layer');

    let isWeatherLoaded = false;
    let latestWeatherString = "LOADING WEATHER...";
    let latestTimeString = "LOADING TIME...";
    
    // 💡 THE LIGHT SWITCHES
    let isLampOn = false; 
    let debugForceNight = false; // Overrides the clock
    let debugForceDay = false;
    let isClearSky = true;

    // --- 1. GENERATE RAIN ---
    if (weatherLayer && weatherLayer.children.length === 0) {
        for (let i = 0; i < 150; i++) { 
            const drop = document.createElement('div'); 
            drop.classList.add('raindrop');
            drop.style.left = `${Math.random() * 120}vw`; 
            drop.style.animationDuration = `${Math.random() * 1.0 + 0.6}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`; 
            weatherLayer.appendChild(drop);
        }
    }

    // --- 2. GENERATE CLOUDS ---
    if (cloudLayer && cloudLayer.children.length === 0) {
        const cloudImages = ['/assets/cloud.png', '/assets/cloud2.png']; 
        for (let i = 0; i < 6; i++) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('cloud-wrapper');
            wrapper.style.top = `${Math.random() * 30}vh`; 
            wrapper.style.animationDuration = `${Math.random() * 80 + 40}s`; 
            wrapper.style.animationDelay = `-${Math.random() * 80}s`; 

            const img = document.createElement('img');
            img.classList.add('cloud-img');
            img.src = cloudImages[Math.floor(Math.random() * cloudImages.length)];
            img.style.width = `${Math.random() * 15 + 10}vw`;
            if (Math.random() > 0.5) img.style.transform = 'scaleX(-1)';
            
            wrapper.appendChild(img);
            cloudLayer.appendChild(wrapper);
        }
    }

    if (clockElement) clockElement.innerText = latestTimeString;
    if (weatherText) weatherText.innerText = latestWeatherString;

    const TOTAL_STARS = 80; 
    if (starLayer) {
        for (let i = 0; i < TOTAL_STARS; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            const size = Math.floor(Math.random() * 4 + 1) * 2;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.background = 'white';
            star.style.animationDelay = `-${Math.random() * 4}s`;
            starLayer.appendChild(star);
        }
    }

    // --- DEVELOPER DEBUG CONTROLS ---
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            if(sunElement) sunElement.style.opacity = '1'; 
            if(cloudLayer) cloudLayer.style.opacity = '0'; 
            if(weatherLayer) weatherLayer.style.opacity = '0';
        }
        if (e.key === '2') {
            if(sunElement) sunElement.style.opacity = '0'; 
            if(cloudLayer) cloudLayer.style.opacity = '1'; 
            if(weatherLayer) weatherLayer.style.opacity = '0';
        }
        if (e.key === '3') {
            if(sunElement) sunElement.style.opacity = '0'; 
            if(cloudLayer) cloudLayer.style.opacity = '0'; 
            if(weatherLayer) weatherLayer.style.opacity = '1';
        }
        if (e.key === '4') {
            if(sunElement) sunElement.style.opacity = '1'; 
            if(cloudLayer) cloudLayer.style.opacity = '1'; 
            if(weatherLayer) weatherLayer.style.opacity = '0';
        }
        if (e.key === '5') {
            debugForceNight = !debugForceNight;
            console.log("Forced Night Mode:", debugForceNight);
            triggerInstantRender();
        }
        if (e.key === '6') {
            isLampOn = !isLampOn;
            console.log("Forced Desk Lamp:", isLampOn);
            triggerInstantRender();
        }
        if (e.key === '7') { // <-- NEW: Force Day
            debugForceDay = !debugForceDay;
            if (debugForceDay) debugForceNight = false; // Turn off night if day is forced
            console.log("Forced Day Mode:", debugForceDay);
            triggerInstantRender();
        }
    });

    function triggerInstantRender() {
        const now = new Date();
        renderEnvironment(((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds()) / 86400);
    }

    function lerpColor(a, b, amount) { 
        const ar = a >> 16, ag = a >> 8 & 0xff, ab = a & 0xff;
        const br = b >> 16, bg = b >> 8 & 0xff, bb = b & 0xff;
        const rr = Math.round(ar + amount * (br - ar));
        const rg = Math.round(ag + amount * (bg - ag));
        const rb = Math.round(ab + amount * (bb - ab));
        return (rr << 16) + (rg << 8) + (rb | 0);
    }
    function toCssHex(num) { return '#' + num.toString(16).padStart(6, '0'); }

    // --- 24-HOUR ENVIRONMENT RENDERER ---
    function renderEnvironment(progress) {
        // 🛠️ Apply Night Override if Key 5 is active
        if (debugForceNight) progress = 0.0; // 0.0 is exact midnight
        if (debugForceDay) progress = 0.5;

        let roomTint, skyTop, skyMid1, skyMid2, skyBottom, starOpacity;
        let sunX = 0, sunY = 0, sunOpacity = 0;
        let moonX = 0, moonY = 0, moonOpacity = 0;
        const screenW = window.innerWidth;
        const Y_PEAK = window.innerHeight * 0.05;    
        const Y_HORIZON = window.innerHeight * 0.25; 
        const Y_HIDDEN = window.innerHeight * 1.5;   

        const gradientDay = { top: 0x4A90E2, m1: 0x5CA0EA, m2: 0x6EB0F2, b: 0x87CEEB };
        const gradientDusk = { top: 0x2B2D42, m1: 0x7A444A, m2: 0xB85B50, b: 0xFF7B54 };
        const gradientNight = { top: 0x0B0B1A, m1: 0x1c142c, m2: 0x251d36, b: 0x2D263C };

        if (progress < 0.15) {
            const p = progress / 0.15;
            skyTop=gradientNight.top; skyMid1=gradientNight.m1; skyMid2=gradientNight.m2; skyBottom=gradientNight.b;
            roomTint = 0x5a5a8f; starOpacity = 1.0;
            moonX = screenW * 0.5 + (p * screenW * 0.5); 
            moonY = Y_HORIZON - Math.sin((0.5 + p * 0.5) * Math.PI) * (Y_HORIZON - Y_PEAK);
            moonOpacity = 1; sunY = Y_HIDDEN;
        } 
        else if (progress < 0.25) {
            const p = (progress - 0.15) / 0.10;
            roomTint = lerpColor(0x5a5a8f, 0xffcc88, p); 
            skyTop = lerpColor(gradientNight.top, gradientDusk.top, p);
            skyMid1 = lerpColor(gradientNight.m1, gradientDusk.m1, p);
            skyMid2 = lerpColor(gradientNight.m2, gradientDusk.m2, p);
            skyBottom = lerpColor(gradientNight.b, gradientDusk.b, p);
            starOpacity = 1.0 - p; moonY = Y_HIDDEN; sunY = Y_HIDDEN; 
        } 
        else if (progress < 0.75) {
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
            starOpacity = 0; sunX = pSun * screenW;
            sunY = Y_HORIZON - Math.sin(pSun * Math.PI) * (Y_HORIZON - Y_PEAK);
            sunOpacity = isClearSky ? 1 : 0; 
            moonY = Y_HIDDEN;
        } 
        else if (progress < 0.85) {
            const p = (progress - 0.75) / 0.10;
            roomTint = lerpColor(0xffcc88, 0x5a5a8f, p); 
            skyTop = lerpColor(gradientDusk.top, gradientNight.top, p);
            skyMid1 = lerpColor(gradientDusk.m1, gradientNight.m1, p);
            skyMid2 = lerpColor(gradientDusk.m2, gradientNight.m2, p);
            skyBottom = lerpColor(gradientDusk.b, gradientNight.b, p);
            starOpacity = p; moonY = Y_HIDDEN; sunY = Y_HIDDEN; 
        } 
        else {
            const p = (progress - 0.85) / 0.15;
            skyTop=gradientNight.top; skyMid1=gradientNight.m1; skyMid2=gradientNight.m2; skyBottom=gradientNight.b;
            roomTint = 0x5a5a8f; starOpacity = 1.0;
            moonX = p * screenW * 0.5; 
            moonY = Y_HORIZON - Math.sin((p * 0.5) * Math.PI) * (Y_HORIZON - Y_PEAK);
            moonOpacity = 1; sunY = Y_HIDDEN;
        }

        // 💡 THE SAFE DAY/NIGHT LIGHTING TRICK
        const isNightTime = (progress < 0.25 || progress > 0.75);

        if (isLampOn && isNightTime) {
            // It is actually dark out, so we need the cutout mask!
            roomTint = 0xFFFFFF; // Remove uniform tint so the "hole" is brightly colored
            if (env && env.nightOverlay) env.nightOverlay.visible = true; // Turn on mask
        } else {
            // Either the lamp is off, OR it's broad daylight. 
            if (env && env.nightOverlay) env.nightOverlay.visible = false;
            // roomTint remains whatever the gradient logic calculated
        }

        // Apply tint strictly to the environment items, ignoring the mask layer itself
        if (env && env.envContainer) {
            env.envContainer.children.forEach(item => { 
                if (item !== env.nightOverlay) item.tint = roomTint; 
            });
        }

        document.documentElement.style.setProperty('--sky-top', toCssHex(skyTop));
        document.documentElement.style.setProperty('--sky-mid1', toCssHex(skyMid1));
        document.documentElement.style.setProperty('--sky-mid2', toCssHex(skyMid2));
        document.documentElement.style.setProperty('--sky-bottom', toCssHex(skyBottom));
        document.querySelectorAll('.star').forEach(star => { star.style.opacity = starOpacity; });

        if (sunElement) { sunElement.style.left = `${sunX}px`; sunElement.style.top = `${sunY}px`; sunElement.style.opacity = sunOpacity; }
        if (moonElement) { moonElement.style.left = `${moonX}px`; moonElement.style.top = `${moonY}px`; moonElement.style.opacity = moonOpacity; }
    }

    function updateUI() {
        if (!isWeatherLoaded) return;
        const now = new Date();
        latestTimeString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        if (clockElement) clockElement.innerText = latestTimeString;
        if (weatherText) weatherText.innerText = latestWeatherString;
    }

    setInterval(() => {
        const now = new Date();
        const totalSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
        renderEnvironment(totalSeconds / 86400);
        updateUI(); 
    }, 1000);

    async function fetchLiveWeather() {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY; 
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=-31.87&lon=115.93&appid=${apiKey}&units=metric`);
            const data = await res.json();
            const id = data.weather[0].id;

            isClearSky = (id === 800);
            
            if (weatherLayer) weatherLayer.style.opacity = (id >= 200 && id < 600) ? '1' : '0';
            
            if (cloudLayer) cloudLayer.style.opacity = (id >= 801 && id <= 804) ? '1' : '0';
            
            latestWeatherString = `${data.weather[0].main} | ${Math.round(data.main.temp)}°C`;
            isWeatherLoaded = true; 
            updateUI(); 
        } catch (e) {
            latestWeatherString = "WEATHER OFFLINE";
            isWeatherLoaded = true; 
            updateUI();
        }
    }
    await fetchLiveWeather(); 
    setInterval(fetchLiveWeather, 3600000); 

    // Return the light switch so Timer/Angad can use it!
    return {
        setLights: (isOn) => {
            isLampOn = isOn;
            triggerInstantRender();
        }
    };
}