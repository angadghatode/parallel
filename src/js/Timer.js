export function setupTimer(character, env, weatherControls) { // <-- Accept the engines here
    let timerInterval;
    let timeLeft = 25 * 60; 

    const taskInput = document.getElementById('task-input');
    const startBtn = document.getElementById('start-btn');
    const timerDisplay = document.getElementById('timer-display');

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (taskInput && taskInput.value.trim() === "") taskInput.value = "FOCUSING..."; 
            
            clearInterval(timerInterval);
            timeLeft = 25 * 60; 
            updateTimerDisplay();
            
            if (taskInput) taskInput.disabled = true; 
            startBtn.disabled = true; 
            startBtn.style.opacity = "0.5"; 

            // 🧠 SEND THE COMMAND TO ANGAD: Go to work!
            if (character && env) {
                character.command(character.STATES.WORKING, env, weatherControls);
            }

            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--; 
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    timerDisplay.innerText = "DONE!";
                    if (taskInput) taskInput.disabled = false; 
                    startBtn.disabled = false; 
                    startBtn.style.opacity = "1";
                    
                    // 🧠 SEND THE COMMAND TO ANGAD: Break time!
                    if (character && env) {
                        character.command(character.STATES.IDLE, env, weatherControls);
                    }
                }
            }, 1000); // Note: Set this to 10 for testing so you don't have to wait 25 minutes!
        });
    }
    updateTimerDisplay();
}