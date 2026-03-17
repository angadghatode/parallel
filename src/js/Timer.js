// --- src/js/Timer.js ---
export function setupTimer(character, env, weatherControls) {
    let timerInterval;

    const taskInput = document.getElementById('task-input');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('button_pause');
    const stopBtn = document.getElementById('button_stop');
    const timerDisplay = document.getElementById('timer-display');
    const timerModeBtn = document.getElementById('timer-mode-btn'); 
    
    const closePopupBtn = document.getElementById('popup-close-btn');
    const continuePopup = document.getElementById('continue-popup');
    const btnResume = document.getElementById('btn-resume-task');
    const btnNext = document.getElementById('btn-next-task');
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-sidebar-btn');
    const taskSidebar = document.getElementById('task-sidebar');
    const estFinishText = document.getElementById('estimated-finish');
    const sidebarList = document.getElementById('task-sidebar-list');

    const queueBtn = document.getElementById('queue-btn');
    const queueInputContainer = document.getElementById('queue-input-container');
    const queueInput = document.getElementById('queue-input');

    // --- 🔄 3-WAY TOGGLE LOGIC ---
    let currentTimerType = localStorage.getItem('parallel_timer_type') || 'pomodoro_25';
    
    function updateTimerModeUI() {
        const modeLabel = document.getElementById('timer-mode-label'); 
        
        if (currentTimerType === 'pomodoro_25') {
            if (modeLabel) modeLabel.innerText = "25 MIN POMODORO";
            if (timerDisplay) timerDisplay.innerText = "25:00";
        } else if (currentTimerType === 'pomodoro_50') {
            if (modeLabel) modeLabel.innerText = "50 MIN POMODORO";
            if (timerDisplay) timerDisplay.innerText = "50:00";
        } else {
            if (modeLabel) modeLabel.innerText = "STOPWATCH";
            if (timerDisplay) timerDisplay.innerText = "00:00";
        }
    }

    if (timerModeBtn) {
        timerModeBtn.addEventListener('click', () => {
            if (startBtn.style.display === 'none') return; 

            if (currentTimerType === 'pomodoro_25') currentTimerType = 'pomodoro_50';
            else if (currentTimerType === 'pomodoro_50') currentTimerType = 'stopwatch';
            else currentTimerType = 'pomodoro_25';

            localStorage.setItem('parallel_timer_type', currentTimerType);
            updateTimerModeUI();
        });
    }

    if (menuBtn && taskSidebar) menuBtn.addEventListener('click', () => taskSidebar.classList.add('active'));
    if (closeMenuBtn && taskSidebar) closeMenuBtn.addEventListener('click', () => taskSidebar.classList.remove('active'));

    if (queueBtn && queueInputContainer && queueInput) {
        queueBtn.addEventListener('click', () => {
            queueBtn.style.display = 'none';
            queueInputContainer.style.display = 'block';
            queueInput.focus();
        });

        queueInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const taskName = queueInput.value.trim();
                if (taskName !== "") {
                    const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                    queue.push(taskName);
                    localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                    renderTaskLog();
                }
                queueInput.value = "";
                queueInputContainer.style.display = 'none';
                queueBtn.style.display = 'block';
            } else if (e.key === 'Escape') {
                queueInput.value = "";
                queueInputContainer.style.display = 'none';
                queueBtn.style.display = 'block';
            }
        });

        queueInput.addEventListener('blur', () => {
            if (queueInput.value.trim() === "") {
                queueInputContainer.style.display = 'none';
                queueBtn.style.display = 'block';
            }
        });
    }

    if (sidebarList) {
        sidebarList.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.delete-task-btn');
            if (delBtn) {
                const type = delBtn.getAttribute('data-type');
                const index = delBtn.getAttribute('data-index');
                
                if (type === 'history') {
                    const hist = JSON.parse(localStorage.getItem('parallel_task_history') || '[]');
                    hist.splice(index, 1);
                    localStorage.setItem('parallel_task_history', JSON.stringify(hist));
                } else if (type === 'queue') {
                    const q = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                    q.splice(index, 1);
                    localStorage.setItem('parallel_task_queue', JSON.stringify(q));
                } else if (type === 'active') {
                    localStorage.removeItem('parallel_active_task');
                }
                renderTaskLog();
            }

            const playBtn = e.target.closest('.start-queued-btn');
            if (playBtn) {
                const index = playBtn.getAttribute('data-index');
                const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                
                if (queue[index]) {
                    const taskName = queue[index];
                    
                    completeActiveTask();
                    
                    queue.splice(index, 1);
                    localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                    
                    if (taskInput) taskInput.value = taskName;
                    localStorage.setItem('parallel_active_task', JSON.stringify({ 
                        id: Date.now().toString(), 
                        name: taskName, 
                        startTime: Date.now(), 
                        notes: "" 
                    }));
                    
                    if (continuePopup) continuePopup.style.display = 'none';
                    startFocusBlock();

                    if (window.focusMusic) window.fadeAudio(window.focusMusic, 0.4, 2000);
                }
            }

            const upBtn = e.target.closest('.move-up-btn');
            if (upBtn) {
                const idx = parseInt(upBtn.getAttribute('data-index'), 10);
                const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                if (idx > 0) {
                    [queue[idx - 1], queue[idx]] = [queue[idx], queue[idx - 1]];
                    localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                    renderTaskLog();
                }
            }

            const downBtn = e.target.closest('.move-down-btn');
            if (downBtn) {
                const idx = parseInt(downBtn.getAttribute('data-index'), 10);
                const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                if (idx < queue.length - 1) {
                    [queue[idx + 1], queue[idx]] = [queue[idx], queue[idx + 1]];
                    localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                    renderTaskLog();
                }
            }
        });

        sidebarList.addEventListener('change', (e) => {
            if (e.target.classList.contains('sidebar-task-notes')) {
                const id = e.target.getAttribute('data-id');
                if (id === 'active') {
                    const currentActiveStr = localStorage.getItem('parallel_active_task');
                    if (currentActiveStr) {
                        const currentActive = JSON.parse(currentActiveStr);
                        currentActive.notes = e.target.value;
                        localStorage.setItem('parallel_active_task', JSON.stringify(currentActive));
                    }
                } else {
                    const currentHistory = JSON.parse(localStorage.getItem('parallel_task_history') || '[]');
                    const targetIndex = currentHistory.findIndex(t => t.id === id || currentHistory.indexOf(t).toString() === id);
                    if (targetIndex !== -1) {
                        currentHistory[targetIndex].notes = e.target.value;
                        localStorage.setItem('parallel_task_history', JSON.stringify(currentHistory));
                    }
                }
            }
        });

        sidebarList.addEventListener('dragstart', (e) => {
            const taskEl = e.target.closest('.sidebar-task');
            if (!taskEl) return;
            setTimeout(() => taskEl.classList.add('dragging'), 0);
        });

        sidebarList.addEventListener('dragend', (e) => {
            const taskEl = e.target.closest('.sidebar-task');
            if (taskEl) taskEl.classList.remove('dragging');
            saveTaskOrder();
            renderTaskLog();
        });

        sidebarList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(sidebarList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    sidebarList.appendChild(draggable);
                } else {
                    sidebarList.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sidebar-task:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveTaskOrder() {
        if (!sidebarList) return;
        const newHistory = [];
        let newActive = null;
        const newQueue = [];
        
        sidebarList.querySelectorAll('.sidebar-task').forEach(el => {
            const type = el.dataset.type;
            const dataStr = el.dataset.taskData;
            if (!dataStr) return;
            
            const data = type === 'queue' ? dataStr : JSON.parse(dataStr);
            
            if (type === 'history') newHistory.push(data);
            else if (type === 'active') newActive = data;
            else if (type === 'queue') newQueue.push(data);
        });
        
        localStorage.setItem('parallel_task_history', JSON.stringify(newHistory));
        if (newActive) localStorage.setItem('parallel_active_task', JSON.stringify(newActive));
        else localStorage.removeItem('parallel_active_task');
        localStorage.setItem('parallel_task_queue', JSON.stringify(newQueue));
    }

    function setUIState(state, mode) {
        if (taskInput) taskInput.disabled = (state !== 'idle');
        if (startBtn) startBtn.style.display = (state === 'running') ? 'none' : 'inline-block';
        if (pauseBtn) pauseBtn.style.display = (state === 'running') ? 'inline-block' : 'none';
        if (stopBtn) stopBtn.style.display = (state !== 'idle') ? 'inline-block' : 'none';
        if (timerDisplay) timerDisplay.style.color = (mode === 'break') ? '#87CEEB' : 'var(--ui-text-primary)';
    }

    function calculateEstFinish() {
        let totalMs = 0;
        const savedEndTime = localStorage.getItem('parallel_timer_end');
        const mode = localStorage.getItem('parallel_timer_mode') || 'focus';

        if (savedEndTime && currentTimerType.startsWith('pomodoro')) {
            totalMs += Math.max(0, parseInt(savedEndTime, 10) - Date.now());
            if (mode === 'focus') totalMs += (5 * 60 * 1000); 
        }

        const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
        totalMs += queue.length * (30 * 60 * 1000); 

        if (totalMs === 0 && !localStorage.getItem('parallel_active_task')) {
            if (estFinishText) estFinishText.innerText = "EST FINISH: --:--";
            return;
        }

        const finishTime = new Date(Date.now() + totalMs);
        if (estFinishText) estFinishText.innerText = `EST FINISH: ${finishTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }

    function formatTime(ms) {
        if (!ms) return "Invalid Date";
        return new Date(parseInt(ms, 10)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    function renderTaskLog() {
        if (!sidebarList) return;
        
        const history = JSON.parse(localStorage.getItem('parallel_task_history') || '[]');
        const activeTaskStr = localStorage.getItem('parallel_active_task');
        const activeTask = activeTaskStr ? JSON.parse(activeTaskStr) : null;
        const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
        
        sidebarList.innerHTML = '';
        let listIndex = 1;

        if (history.length === 0 && !activeTask && queue.length === 0) {
            sidebarList.innerHTML = '<div class="empty-tasks">No tasks done</div>';
        }

        history.forEach((task, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'sidebar-task';
            taskDiv.draggable = true;
            taskDiv.dataset.type = 'history';
            taskDiv.dataset.taskData = JSON.stringify(task);
            taskDiv.innerHTML = `
                <div class="task-title-row">
                    <div class="sidebar-task-title">${listIndex++}. ${task.name}</div>
                    <div class="task-actions">
                        <button class="drag-handle"><img src="/assets/button_rearrange.png"></button>
                        <button class="delete-task-btn" data-type="history" data-index="${index}"><img src="/assets/button_bin.png"></button>
                    </div>
                </div>
                <div class="sidebar-task-times">Start time: ${formatTime(task.startTime)}<br>End time: ${formatTime(task.endTime)}</div>
                <div class="sidebar-notes-label">Notes:</div> <textarea class="sidebar-task-notes" data-id="${task.id || index}" placeholder="Jot down notes here...">${task.notes || ''}</textarea>
            `;
            sidebarList.appendChild(taskDiv);
        });

        if (activeTask) {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'sidebar-task';
            taskDiv.draggable = false; 
            taskDiv.dataset.type = 'active';
            taskDiv.dataset.taskData = JSON.stringify(activeTask);
            const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
            const statusText = mode === 'break' ? 'Taking Break' : 'Ongoing';
            taskDiv.innerHTML = `
                <div class="task-title-row">
                    <div class="sidebar-task-title" style="color: #87CEEB;">${listIndex++}. ${activeTask.name}</div>
                </div>
                <div class="sidebar-task-times">Start time: ${formatTime(activeTask.startTime)}<br>End time: ${statusText}</div>
                <div class="sidebar-notes-label">Notes:</div> <textarea class="sidebar-task-notes" data-id="active" placeholder="Jot down notes here...">${activeTask.notes || ''}</textarea>
            `;
            sidebarList.appendChild(taskDiv);
        }

        queue.forEach((taskName, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'sidebar-task';
            taskDiv.draggable = true;
            taskDiv.dataset.type = 'queue';
            taskDiv.dataset.taskData = taskName;
            
            let playBtnHtml = '';
            if (index === 0 && !activeTask) {
                playBtnHtml = `<button class="start-queued-btn" data-index="${index}" style="background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center;"><img src="/assets/button.png" style="width: 3vmin; height: auto; image-rendering: pixelated;"></button>`;
            }

            let moveBtnsHtml = `
                <button class="move-up-btn" data-index="${index}" style="background: none; border: none; padding: 0 4px; cursor: pointer; color: var(--ui-text-secondary); font-size: 1.2rem;">▲</button>
                <button class="move-down-btn" data-index="${index}" style="background: none; border: none; padding: 0 4px; cursor: pointer; color: var(--ui-text-secondary); font-size: 1.2rem;">▼</button>
            `;

            taskDiv.innerHTML = `
                <div class="task-title-row">
                    <div class="sidebar-task-title" style="color: var(--ui-text-secondary);">${listIndex++}. ${taskName}</div>
                    <div class="task-actions" style="display: flex; align-items: center;">
                        ${playBtnHtml}
                        ${moveBtnsHtml}
                        <button class="drag-handle"><img src="/assets/button_rearrange.png"></button>
                        <button class="delete-task-btn" data-type="queue" data-index="${index}"><img src="/assets/button_bin.png"></button>
                    </div>
                </div>
                <div class="sidebar-task-times">Queued</div>
            `;
            sidebarList.appendChild(taskDiv);
        });

        calculateEstFinish();
    }
    
    function handleTimerComplete() {
        cancelAnimationFrame(timerInterval);
        localStorage.removeItem('parallel_timer_end');
        const mode = localStorage.getItem('parallel_timer_mode') || 'focus';

        if (window.focusMusic) window.fadeAudio(window.focusMusic, 0, 2000);
        
        if (window.tickingAudio) {
            window.tickingAudio.pause();
            window.tickingAudio.currentTime = 0;
        }

        if (mode === 'focus') {
            localStorage.setItem('parallel_timer_mode', 'break');
            const breakEndTime = Date.now() + (5 * 60 * 1000); 
            localStorage.setItem('parallel_timer_end', breakEndTime);
            renderTaskLog();
            runTimerCheck(); 
        } 
        else if (mode === 'break') {
            localStorage.setItem('parallel_timer_mode', 'focus');
            setUIState('idle', 'focus');
            updateTimerModeUI(); 
            if (continuePopup) continuePopup.style.display = 'block';
            renderTaskLog();
        }
    }

    function runTimerCheck() {
        cancelAnimationFrame(timerInterval);
        const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
        setUIState('running', mode);
        window.endingTransitionStarted = false;

        function checkTime() {
            if (currentTimerType.startsWith('pomodoro')) {
                const savedEndTime = localStorage.getItem('parallel_timer_end');
                if (!savedEndTime) return;

                const timeLeft = parseInt(savedEndTime, 10) - Date.now();

                if (timeLeft > 10000) {
                    window.endingTransitionStarted = false;
                }

                if (timeLeft <= 10000 && timeLeft > 0 && mode === 'focus') {
                    if (!window.endingTransitionStarted) {
                        window.endingTransitionStarted = true;
                        if (window.focusMusic) window.fadeAudio(window.focusMusic, 0, 4000);
                        if (window.tickingAudio) {
                            window.tickingAudio.currentTime = 0;
                            window.tickingAudio.play().catch(() => {});
                        }
                    }
                    if (window.tickingAudio) {
                        window.tickingAudio.volume = Math.max(0.1, 1 - (timeLeft / 10000));
                    }
                }

                if (timeLeft <= 0) {
                    handleTimerComplete();
                } else {
                    const totalSecondsLeft = Math.floor(timeLeft / 1000);
                    const m = Math.floor(totalSecondsLeft / 60);
                    const s = totalSecondsLeft % 60;
                    const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    
                    if (timerDisplay && timerDisplay.innerText !== timeString) {
                        timerDisplay.innerText = timeString;
                    }
                    timerInterval = requestAnimationFrame(checkTime);
                }
            } else {
                const savedStartTime = localStorage.getItem('parallel_timer_start');
                if (!savedStartTime) return;
                
                const elapsed = Date.now() - parseInt(savedStartTime, 10);
                const totalSecondsElapsed = Math.floor(elapsed / 1000);
                
                const h = Math.floor(totalSecondsElapsed / 3600);
                const m = Math.floor((totalSecondsElapsed % 3600) / 60);
                const s = totalSecondsElapsed % 60;
                
                const timeString = h > 0 
                    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                if (timerDisplay && timerDisplay.innerText !== timeString) {
                    timerDisplay.innerText = timeString;
                }
                timerInterval = requestAnimationFrame(checkTime);
            }
        }
        
        timerInterval = requestAnimationFrame(checkTime);
    }

    function startFocusBlock() {
        if (currentTimerType === 'pomodoro_25') {
            const endTime = Date.now() + (25 * 60 * 1000);
            localStorage.setItem('parallel_timer_end', endTime);
        } else if (currentTimerType === 'pomodoro_50') {
            const endTime = Date.now() + (50 * 60 * 1000);
            localStorage.setItem('parallel_timer_end', endTime);
        } else {
            localStorage.setItem('parallel_timer_start', Date.now());
        }
        localStorage.setItem('parallel_timer_mode', 'focus');
        runTimerCheck();
        renderTaskLog();
    }

    function completeActiveTask() {
        const activeStr = localStorage.getItem('parallel_active_task');
        if (activeStr) {
            const activeTask = JSON.parse(activeStr);
            activeTask.endTime = Date.now();
            const history = JSON.parse(localStorage.getItem('parallel_task_history') || '[]');
            history.push(activeTask);
            localStorage.setItem('parallel_task_history', JSON.stringify(history));
            localStorage.removeItem('parallel_active_task');
        }
    }

    if (btnResume) {
        btnResume.addEventListener('click', () => {
            continuePopup.style.display = 'none';
            startFocusBlock();
            if (window.focusMusic) window.fadeAudio(window.focusMusic, 0.4, 2000);
        });
    }

    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            if (continuePopup) continuePopup.style.display = 'none';

            completeActiveTask();

            localStorage.removeItem('parallel_timer_mode');
            localStorage.removeItem('parallel_timer_end');
            localStorage.removeItem('parallel_timer_start');

            if (taskInput) taskInput.value = "";
            updateTimerModeUI(); 

            setUIState('idle', 'focus');
            renderTaskLog();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            continuePopup.style.display = 'none';
            completeActiveTask();
            
            const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
            if (queue.length > 0) {
                const nextTaskName = queue.shift();
                localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                
                if (taskInput) taskInput.value = nextTaskName;
                localStorage.setItem('parallel_active_task', JSON.stringify({ 
                    id: Date.now().toString(), 
                    name: nextTaskName, 
                    startTime: Date.now(), 
                    notes: "" 
                }));
                startFocusBlock();

                if (window.focusMusic) window.fadeAudio(window.focusMusic, 0.4, 2000);
            } else {
                if (taskInput) taskInput.value = "";
                updateTimerModeUI();
                renderTaskLog();
            }
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (taskInput && taskInput.value.trim() === "") taskInput.value = "FOCUSING..."; 
            
            const pausedTimeLeft = localStorage.getItem('parallel_timer_paused_left');
            const pausedElapsed = localStorage.getItem('parallel_timer_paused_elapsed');
            
            if (currentTimerType.startsWith('pomodoro')) {
                let endTime;
                if (pausedTimeLeft) {
                    endTime = Date.now() + parseInt(pausedTimeLeft, 10);
                    localStorage.removeItem('parallel_timer_paused_left');
                } else {
                    const mins = currentTimerType === 'pomodoro_25' ? 25 : 50;
                    endTime = Date.now() + (mins * 60 * 1000); 
                }
                localStorage.setItem('parallel_timer_end', endTime);
            } else {
                let startTime;
                if (pausedElapsed) {
                    startTime = Date.now() - parseInt(pausedElapsed, 10);
                    localStorage.removeItem('parallel_timer_paused_elapsed');
                } else {
                    startTime = Date.now();
                }
                localStorage.setItem('parallel_timer_start', startTime);
            }

            if (!localStorage.getItem('parallel_active_task')) {
                localStorage.setItem('parallel_active_task', JSON.stringify({ 
                    id: Date.now().toString(), 
                    name: taskInput.value, 
                    startTime: Date.now(), 
                    notes: "" 
                }));
            }
            
            localStorage.setItem('parallel_timer_mode', 'focus');
            runTimerCheck();
            renderTaskLog();

            if (window.focusMusic) window.fadeAudio(window.focusMusic, 0.4, 2000);
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            cancelAnimationFrame(timerInterval);
            
            if (currentTimerType.startsWith('pomodoro')) {
                const savedEndTime = localStorage.getItem('parallel_timer_end');
                if (savedEndTime) {
                    const timeLeft = parseInt(savedEndTime, 10) - Date.now();
                    localStorage.setItem('parallel_timer_paused_left', Math.max(0, timeLeft));
                    localStorage.removeItem('parallel_timer_end');
                }
            } else {
                const savedStartTime = localStorage.getItem('parallel_timer_start');
                if (savedStartTime) {
                    const elapsed = Date.now() - parseInt(savedStartTime, 10);
                    localStorage.setItem('parallel_timer_paused_elapsed', Math.max(0, elapsed));
                    localStorage.removeItem('parallel_timer_start');
                }
            }

            const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
            setUIState('paused', mode);
            calculateEstFinish();

            if (window.focusMusic) window.fadeAudio(window.focusMusic, 0, 2000);
            if (window.tickingAudio) {
                window.tickingAudio.pause();
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            cancelAnimationFrame(timerInterval);
            localStorage.removeItem('parallel_timer_end');
            localStorage.removeItem('parallel_timer_start');
            localStorage.removeItem('parallel_timer_paused_left');
            localStorage.removeItem('parallel_timer_paused_elapsed');
            localStorage.removeItem('parallel_timer_mode');
            
            completeActiveTask();
            
            updateTimerModeUI(); 
            if (taskInput) taskInput.value = "";
            setUIState('idle', 'focus');
            if (continuePopup) continuePopup.style.display = 'none';
            renderTaskLog();

            if (window.focusMusic) window.fadeAudio(window.focusMusic, 0, 2000);
            if (window.tickingAudio) {
                window.tickingAudio.pause();
                window.tickingAudio.currentTime = 0;
            }
        });
    }

    // --- INITIALIZATION ---
    const existingTimer = localStorage.getItem('parallel_timer_end');
    const existingStopwatch = localStorage.getItem('parallel_timer_start');
    const pausedTimer = localStorage.getItem('parallel_timer_paused_left');
    const pausedStopwatch = localStorage.getItem('parallel_timer_paused_elapsed');
    const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
    const modeLabel = document.getElementById('timer-mode-label');

    if (currentTimerType.startsWith('pomodoro')) {
        if (existingTimer) {
            const timeLeft = parseInt(existingTimer, 10) - Date.now();
            if (timeLeft > 0) {
                const activeStr = localStorage.getItem('parallel_active_task');
                if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
                if (modeLabel) modeLabel.innerText = currentTimerType === 'pomodoro_25' ? "25 MIN POMODORO" : "50 MIN POMODORO";
                runTimerCheck();
            } else {
                handleTimerComplete();
            }
        } else if (pausedTimer) {
            const activeStr = localStorage.getItem('parallel_active_task');
            if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
            const totalSecondsLeft = Math.floor(parseInt(pausedTimer, 10) / 1000);
            if (modeLabel) modeLabel.innerText = currentTimerType === 'pomodoro_25' ? "25 MIN POMODORO" : "50 MIN POMODORO";
            if (timerDisplay) timerDisplay.innerText = `${Math.floor(totalSecondsLeft / 60).toString().padStart(2, '0')}:${(totalSecondsLeft % 60).toString().padStart(2, '0')}`;
            setUIState('paused', mode);
        } else {
            updateTimerModeUI();
            setUIState('idle', 'focus');
        }
    } else {
        if (existingStopwatch) {
            const activeStr = localStorage.getItem('parallel_active_task');
            if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
            if (modeLabel) modeLabel.innerText = "STOPWATCH";
            runTimerCheck();
        } else if (pausedStopwatch) {
            const activeStr = localStorage.getItem('parallel_active_task');
            if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
            
            const totalSecondsElapsed = Math.floor(parseInt(pausedStopwatch, 10) / 1000);
            
            const h = Math.floor(totalSecondsElapsed / 3600);
            const m = Math.floor((totalSecondsElapsed % 3600) / 60);
            const s = totalSecondsElapsed % 60;
            
            const timeString = h > 0 
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (modeLabel) modeLabel.innerText = "STOPWATCH";
            if (timerDisplay) timerDisplay.innerText = timeString;
            setUIState('paused', mode);
        } else {
            updateTimerModeUI();
            setUIState('idle', 'focus');
        }
    }
    
    renderTaskLog();
}