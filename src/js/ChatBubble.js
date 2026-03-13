export function setupChatBubble() {
    const dayMessages = ["remember to stretch your legs!", "don't forget to drink water!", "posture check!", "remember to rest your eyes."];
    const sleepMessages = ["zZz...", ". . ."];
    
    // Update these two lines to grab the correct new IDs!
    const bubble = document.getElementById('speech-bubble-wrap'); 
    const bubbleText = document.getElementById('bubble-body');
    let typingTimer; 

    if (bubble) bubble.style.transition = 'opacity 0.5s ease, transform 0.3s ease';

    function typeWriter(text) {
        if (!bubbleText) return;
        
        bubbleText.textContent = ""; // 🚀 Changed to textContent
        let i = 0; 
        clearInterval(typingTimer); 
        
        typingTimer = setInterval(() => {
            if (i < text.length) {
                bubbleText.textContent += text.charAt(i); // 🚀 Changed to textContent
                i++;
            } else {
                clearInterval(typingTimer); 
                setTimeout(hideBubble, 10000); 
            }
        }, 100); // 100ms typing speed
    }

    function showBubble() {
        if (!bubble) return;
        bubble.classList.remove('hidden');
        bubble.style.opacity = ''; 

        const hour = new Date().getHours();
        const isSleepTime = hour >= 22 || hour < 8;
        const messages = isSleepTime ? sleepMessages : dayMessages;

        typeWriter(messages[Math.floor(Math.random() * messages.length)]);
    }

    function hideBubble() {
        if (!bubble) return;
        bubble.classList.add('hidden');
        
        const hour = new Date().getHours();
        const isSleepTime = hour >= 22 || hour < 8;
        
        // Day popup: 15 to 45 seconds. Night popup: 1 to 2 minutes.
        const nextPopup = isSleepTime 
            ? Math.random() * (12000 - 6000) + 6000
            : Math.random() * (45000 - 15000) + 15000;

        setTimeout(showBubble, nextPopup);
    }
    
    setTimeout(showBubble, 15000);
}