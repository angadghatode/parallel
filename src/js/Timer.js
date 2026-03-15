// --- src/js/Timer.js ---
export function setupTimer(character, env, weatherControls) {
    let timerInterval;

    const taskInput = document.getElementById('task-input');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('button_pause');
    const stopBtn = document.getElementById('button_stop');
    const timerDisplay = document.getElementById('timer-display');
    
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

    if (menuBtn && taskSidebar) menuBtn.addEventListener('click', () => taskSidebar.classList.add('active'));
    if (closeMenuBtn && taskSidebar) closeMenuBtn.addEventListener('click', () => taskSidebar.classList.remove('active'));

    // --- INTEGRATED QUEUE INPUT LOGIC ---
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

    // --- EVENT DELEGATION FOR DELETE, PLAY, AND NOTES ---
    if (sidebarList) {
        sidebarList.addEventListener('click', (e) => {
            // Delete Button Logic
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

            // 🚀 NEW: Play Button Logic for Queued Tasks
            const playBtn = e.target.closest('.start-queued-btn');
            if (playBtn) {
                const index = playBtn.getAttribute('data-index');
                const queue = JSON.parse(localStorage.getItem('parallel_task_queue') || '[]');
                
                if (queue[index]) {
                    const taskName = queue[index];
                    
                    // Safely close out the current active task if there is one
                    completeActiveTask();
                    
                    // Remove the task from the queue
                    queue.splice(index, 1);
                    localStorage.setItem('parallel_task_queue', JSON.stringify(queue));
                    
                    // Set it as the new active task on the main screen
                    if (taskInput) taskInput.value = taskName;
                    localStorage.setItem('parallel_active_task', JSON.stringify({ 
                        id: Date.now().toString(), 
                        name: taskName, 
                        startTime: Date.now(), 
                        notes: "" 
                    }));
                    
                    // Close the popup if it was open, and start the timer immediately!
                    if (continuePopup) continuePopup.style.display = 'none';
                    startFocusBlock();
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

        // --- DRAG AND DROP LOGIC ---
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

        if (savedEndTime) {
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

        // 1. THE HISTORY LOOP
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

        // 2. THE ACTIVE TASK BLOCK
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
            
            // 🚀 UPDATED: Only show play button on the 1st item AND if there is NO active task
            let playBtnHtml = '';
            if (index === 0 && !activeTask) {
                // Removed the extra margin-right so it groups perfectly with the other buttons!
                playBtnHtml = `<button class="start-queued-btn" data-index="${index}" style="background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center;"><img src="/assets/button.png" style="width: 3vmin; height: auto; image-rendering: pixelated;"></button>`;
            }

            taskDiv.innerHTML = `
                <div class="task-title-row">
                    <div class="sidebar-task-title" style="color: var(--ui-text-secondary);">${listIndex++}. ${taskName}</div>
                    <div class="task-actions">
                        ${playBtnHtml}
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
        clearInterval(timerInterval);
        localStorage.removeItem('parallel_timer_end');
        const mode = localStorage.getItem('parallel_timer_mode') || 'focus';

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
            if (timerDisplay) timerDisplay.innerText = "25:00";
            if (continuePopup) continuePopup.style.display = 'block';
            renderTaskLog();
        }
    }

    function runTimerCheck() {
        clearInterval(timerInterval);
        const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
        setUIState('running', mode);
        
        timerInterval = setInterval(() => {
            const savedEndTime = localStorage.getItem('parallel_timer_end');
            if (!savedEndTime) {
                clearInterval(timerInterval);
                return;
            }

            const timeLeft = parseInt(savedEndTime, 10) - Date.now();

            if (timeLeft <= 0) {
                handleTimerComplete();
            } else {
                const totalSecondsLeft = Math.floor(timeLeft / 1000);
                const m = Math.floor(totalSecondsLeft / 60);
                const s = totalSecondsLeft % 60;
                if (timerDisplay) timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    function startFocusBlock() {
        const endTime = Date.now() + (25 * 60 * 1000);
        localStorage.setItem('parallel_timer_end', endTime);
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
            } else {
                if (taskInput) taskInput.value = "";
                renderTaskLog();
            }
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (taskInput && taskInput.value.trim() === "") taskInput.value = "FOCUSING..."; 
            
            let endTime;
            const pausedTimeLeft = localStorage.getItem('parallel_timer_paused_left');
            
            if (pausedTimeLeft) {
                endTime = Date.now() + parseInt(pausedTimeLeft, 10);
                localStorage.removeItem('parallel_timer_paused_left');
            } else {
                if (!localStorage.getItem('parallel_active_task')) {
                    localStorage.setItem('parallel_active_task', JSON.stringify({ 
                        id: Date.now().toString(), 
                        name: taskInput.value, 
                        startTime: Date.now(), 
                        notes: "" 
                    }));
                }
                endTime = Date.now() + (25 * 60 * 1000);
            }
            
            localStorage.setItem('parallel_timer_end', endTime);
            localStorage.setItem('parallel_timer_mode', 'focus');
            runTimerCheck();
            renderTaskLog();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            const savedEndTime = localStorage.getItem('parallel_timer_end');
            if (savedEndTime) {
                const timeLeft = parseInt(savedEndTime, 10) - Date.now();
                localStorage.setItem('parallel_timer_paused_left', Math.max(0, timeLeft));
                localStorage.removeItem('parallel_timer_end');
            }
            const mode = localStorage.getItem('parallel_timer_mode') || 'focus';
            setUIState('paused', mode);
            calculateEstFinish();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            localStorage.removeItem('parallel_timer_end');
            localStorage.removeItem('parallel_timer_paused_left');
            localStorage.removeItem('parallel_timer_mode');
            
            completeActiveTask();
            
            if (timerDisplay) timerDisplay.innerText = "25:00";
            if (taskInput) taskInput.value = "";
            setUIState('idle', 'focus');
            if (continuePopup) continuePopup.style.display = 'none';
            renderTaskLog();
        });
    }

    const existingTimer = localStorage.getItem('parallel_timer_end');
    const pausedTimer = localStorage.getItem('parallel_timer_paused_left');
    const mode = localStorage.getItem('parallel_timer_mode') || 'focus';

    if (existingTimer) {
        const timeLeft = parseInt(existingTimer, 10) - Date.now();
        if (timeLeft > 0) {
            const activeStr = localStorage.getItem('parallel_active_task');
            if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
            runTimerCheck();
        } else {
            handleTimerComplete();
        }
    } else if (pausedTimer) {
        const activeStr = localStorage.getItem('parallel_active_task');
        if (taskInput && activeStr) taskInput.value = JSON.parse(activeStr).name;
        const totalSecondsLeft = Math.floor(parseInt(pausedTimer, 10) / 1000);
        if (timerDisplay) timerDisplay.innerText = `${Math.floor(totalSecondsLeft / 60).toString().padStart(2, '0')}:${(totalSecondsLeft % 60).toString().padStart(2, '0')}`;
        setUIState('paused', mode);
    } else {
        if (timerDisplay) timerDisplay.innerText = "25:00";
        setUIState('idle', 'focus');
    }
    
    renderTaskLog();
}