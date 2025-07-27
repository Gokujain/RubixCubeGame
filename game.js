class RubiksCubeGame {
    constructor() {
        this.currentScreen = 'welcome';
        this.cubeSize = 3;
        this.timer = new Timer();
        this.cubeRenderer = null;
        this.cubeState = null;
        this.selectedFace = 'front';
        this.isGameActive = false;
        this.scoreboard = new Scoreboard();
        
        this.initializeEventListeners();
        this.showScreen('welcome');
    }

    initializeEventListeners() {
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('show-scoreboard-btn').addEventListener('click', () => this.showScoreboard());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('scramble-btn').addEventListener('click', () => this.scrambleCube());
        document.getElementById('clockwise-btn').addEventListener('click', () => this.rotateFace(true));
        document.getElementById('counterclockwise-btn').addEventListener('click', () => this.rotateFace(false));
        document.getElementById('save-score-btn').addEventListener('click', () => this.saveScore());
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.backToMenu());
        document.getElementById('size-filter').addEventListener('change', () => this.filterScoreboard());

        document.querySelectorAll('.face-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectFace(e.target.dataset.face));
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;
    }

    startGame() {
        this.cubeSize = parseInt(document.getElementById('cube-size').value);
        document.getElementById('cube-size-display').textContent = `${this.cubeSize}x${this.cubeSize}x${this.cubeSize}`;
        
        this.showScreen('game');
        this.initializeCube();
        this.scrambleCube();
        this.timer.start();
        this.isGameActive = true;
        this.updateControls();
    }

    initializeCube() {
        const canvas = document.getElementById('game-canvas');
        this.cubeRenderer = new CubeRenderer(canvas, this.cubeSize);
        this.cubeState = new CubeState(this.cubeSize);
        this.cubeRenderer.updateCube(this.cubeState.getState());
        this.selectFace('front');
    }

    selectFace(face) {
        this.selectedFace = face;
        document.querySelectorAll('.face-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-face="${face}"]`).classList.add('selected');
    }

    rotateFace(clockwise) {
        if (!this.isGameActive || this.timer.isPaused) return;
        
        this.cubeState.rotateFace(this.selectedFace, clockwise);
        this.cubeRenderer.animateRotation(this.selectedFace, clockwise, () => {
            this.cubeRenderer.updateCube(this.cubeState.getState());
            this.checkWinCondition();
        });
    }

    scrambleCube() {
        if (!this.cubeState) return;
        
        const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        const moves = 20 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < moves; i++) {
            const face = faces[Math.floor(Math.random() * faces.length)];
            const clockwise = Math.random() > 0.5;
            this.cubeState.rotateFace(face, clockwise);
        }
        
        this.cubeRenderer.updateCube(this.cubeState.getState());
    }

    checkWinCondition() {
        if (this.cubeState.isSolved()) {
            this.isGameActive = false;
            this.timer.stop();
            this.showVictory();
        }
    }

    showVictory() {
        const finalTime = this.timer.getFormattedTime();
        document.getElementById('final-time').textContent = `Time: ${finalTime}`;
        this.showScreen('victory');
    }

    saveScore() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        this.scoreboard.addScore(playerName, this.timer.getElapsedTime(), this.cubeSize);
        this.showScoreboard();
    }

    playAgain() {
        this.showScreen('welcome');
        this.resetGameState();
    }

    backToMenu() {
        this.showScreen('welcome');
    }

    showScoreboard() {
        this.showScreen('scoreboard');
        this.displayScoreboard();
    }

    filterScoreboard() {
        this.displayScoreboard();
    }

    displayScoreboard() {
        const filter = document.getElementById('size-filter').value;
        const scores = this.scoreboard.getScores(filter === 'all' ? null : parseInt(filter));
        const container = document.getElementById('scoreboard-list');
        
        if (scores.length === 0) {
            container.innerHTML = '<div class="empty-scoreboard">No scores yet. Play a game to add your score!</div>';
            return;
        }
        
        container.innerHTML = scores.map((score, index) => `
            <div class="score-entry">
                <span class="score-rank">#${index + 1}</span>
                <span class="score-name">${score.name}</span>
                <span class="score-time">${this.formatTime(score.time)}</span>
                <span class="score-size">${score.size}x${score.size}x${score.size}</span>
            </div>
        `).join('');
    }

    togglePause() {
        if (!this.isGameActive && !this.timer.isPaused) return;
        
        if (this.timer.isPaused) {
            this.timer.resume();
            this.isGameActive = true;
        } else {
            this.timer.pause();
            this.isGameActive = false;
        }
        
        this.updateControls();
    }

    updateControls() {
        const pauseBtn = document.getElementById('pause-btn');
        const faceButtons = document.querySelectorAll('.face-btn');
        const rotationButtons = document.querySelectorAll('.rotation-controls .btn');
        const scrambleBtn = document.getElementById('scramble-btn');
        
        if (this.timer.isPaused) {
            pauseBtn.textContent = 'Resume';
            faceButtons.forEach(btn => btn.disabled = true);
            rotationButtons.forEach(btn => btn.disabled = true);
            scrambleBtn.disabled = true;
        } else {
            pauseBtn.textContent = 'Pause';
            faceButtons.forEach(btn => btn.disabled = false);
            rotationButtons.forEach(btn => btn.disabled = false);
            scrambleBtn.disabled = false;
        }
    }

    resetGame() {
        this.timer.reset();
        this.isGameActive = false;
        this.resetGameState();
        this.showScreen('welcome');
    }

    resetGameState() {
        if (this.cubeRenderer) {
            this.cubeRenderer.dispose();
            this.cubeRenderer = null;
        }
        this.cubeState = null;
        this.selectedFace = 'front';
        document.getElementById('player-name').value = '';
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.display = document.getElementById('timer');
    }

    start() {
        this.startTime = Date.now() - this.elapsedTime;
        this.isRunning = true;
        this.isPaused = false;
        this.interval = setInterval(() => this.updateDisplay(), 1000);
        this.updateDisplay();
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.interval);
        }
    }

    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.startTime = Date.now() - this.elapsedTime;
            this.interval = setInterval(() => this.updateDisplay(), 1000);
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.isRunning && !this.isPaused) {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        }
        this.display.textContent = this.getFormattedTime();
    }

    getFormattedTime() {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = this.elapsedTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getElapsedTime() {
        return this.elapsedTime;
    }
}

class CubeState {
    constructor(size) {
        this.size = size;
        this.faces = {
            front: this.createFace(0xff0000),
            back: this.createFace(0xff8800),
            left: this.createFace(0x00ff00),
            right: this.createFace(0x0000ff),
            top: this.createFace(0xffffff),
            bottom: this.createFace(0xffff00)
        };
    }

    createFace(color) {
        const face = [];
        for (let i = 0; i < this.size; i++) {
            face[i] = [];
            for (let j = 0; j < this.size; j++) {
                face[i][j] = color;
            }
        }
        return face;
    }

    rotateFace(faceName, clockwise) {
        const face = this.faces[faceName];
        const rotated = this.rotateMatrix(face, clockwise);
        this.faces[faceName] = rotated;
        this.rotateAdjacentEdges(faceName, clockwise);
    }

    rotateMatrix(matrix, clockwise) {
        const size = matrix.length;
        const rotated = [];
        
        for (let i = 0; i < size; i++) {
            rotated[i] = [];
            for (let j = 0; j < size; j++) {
                if (clockwise) {
                    rotated[i][j] = matrix[size - 1 - j][i];
                } else {
                    rotated[i][j] = matrix[j][size - 1 - i];
                }
            }
        }
        
        return rotated;
    }

    rotateAdjacentEdges(faceName, clockwise) {
        const adjacentMap = {
            front: ['top', 'right', 'bottom', 'left'],
            back: ['top', 'left', 'bottom', 'right'],
            left: ['top', 'front', 'bottom', 'back'],
            right: ['top', 'back', 'bottom', 'front'],
            top: ['back', 'right', 'front', 'left'],
            bottom: ['front', 'right', 'back', 'left']
        };

        const adjacent = adjacentMap[faceName];
        if (!adjacent) return;

        const edges = adjacent.map(face => this.getEdge(face, faceName));
        
        if (clockwise) {
            const temp = edges[0];
            for (let i = 0; i < 3; i++) {
                this.setEdge(adjacent[i], faceName, edges[i + 1]);
            }
            this.setEdge(adjacent[3], faceName, temp);
        } else {
            const temp = edges[3];
            for (let i = 3; i > 0; i--) {
                this.setEdge(adjacent[i], faceName, edges[i - 1]);
            }
            this.setEdge(adjacent[0], faceName, temp);
        }
    }

    getEdge(face, relativeTo) {
        const faceData = this.faces[face];
        const edge = [];
        
        for (let i = 0; i < this.size; i++) {
            if ((face === 'top' && relativeTo === 'front') || 
                (face === 'bottom' && relativeTo === 'front') ||
                (face === 'top' && relativeTo === 'back') || 
                (face === 'bottom' && relativeTo === 'back')) {
                edge.push(faceData[relativeTo === 'back' ? 0 : this.size - 1][i]);
            } else if ((face === 'left' && (relativeTo === 'front' || relativeTo === 'top' || relativeTo === 'bottom')) ||
                       (face === 'right' && (relativeTo === 'front' || relativeTo === 'top' || relativeTo === 'bottom'))) {
                edge.push(faceData[i][face === 'left' ? this.size - 1 : 0]);
            } else {
                edge.push(faceData[i][0]);
            }
        }
        
        return edge;
    }

    setEdge(face, relativeTo, edge) {
        const faceData = this.faces[face];
        
        for (let i = 0; i < this.size; i++) {
            if ((face === 'top' && relativeTo === 'front') || 
                (face === 'bottom' && relativeTo === 'front') ||
                (face === 'top' && relativeTo === 'back') || 
                (face === 'bottom' && relativeTo === 'back')) {
                faceData[relativeTo === 'back' ? 0 : this.size - 1][i] = edge[i];
            } else if ((face === 'left' && (relativeTo === 'front' || relativeTo === 'top' || relativeTo === 'bottom')) ||
                       (face === 'right' && (relativeTo === 'front' || relativeTo === 'top' || relativeTo === 'bottom'))) {
                faceData[i][face === 'left' ? this.size - 1 : 0] = edge[i];
            } else {
                faceData[i][0] = edge[i];
            }
        }
    }

    isSolved() {
        for (const faceName in this.faces) {
            const face = this.faces[faceName];
            const firstColor = face[0][0];
            
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (face[i][j] !== firstColor) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    getState() {
        return this.faces;
    }
}

class CubeRenderer {
    constructor(canvas, size) {
        this.canvas = canvas;
        this.size = size;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.cubeGroup = new THREE.Group();
        this.isAnimating = false;
        
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.setupControls();
        this.createCube();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0x2d3748);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupCamera() {
        this.camera.position.set(this.size * 2, this.size * 2, this.size * 2);
        this.camera.lookAt(0, 0, 0);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging || this.isAnimating) return;

            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            this.cubeGroup.rotation.y += deltaMove.x * 0.01;
            this.cubeGroup.rotation.x += deltaMove.y * 0.01;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
        });
    }

    createCube() {
        this.scene.add(this.cubeGroup);
        
        const cubeSize = 0.95;
        const gap = 0.05;
        const totalSize = this.size * (cubeSize + gap) - gap;
        const offset = totalSize / 2 - cubeSize / 2;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                    const materials = [
                        new THREE.MeshLambertMaterial({ color: 0xff0000 }),
                        new THREE.MeshLambertMaterial({ color: 0xff8800 }),
                        new THREE.MeshLambertMaterial({ color: 0xffffff }),
                        new THREE.MeshLambertMaterial({ color: 0xffff00 }),
                        new THREE.MeshLambertMaterial({ color: 0x0000ff }),
                        new THREE.MeshLambertMaterial({ color: 0x00ff00 })
                    ];
                    
                    const cube = new THREE.Mesh(geometry, materials);
                    cube.position.set(
                        x * (cubeSize + gap) - offset,
                        y * (cubeSize + gap) - offset,
                        z * (cubeSize + gap) - offset
                    );
                    
                    cube.castShadow = true;
                    cube.receiveShadow = true;
                    
                    this.cubeGroup.add(cube);
                }
            }
        }
    }

    updateCube(faceStates) {
        const children = this.cubeGroup.children;
        let index = 0;
        
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const cube = children[index];
                    if (cube) {
                        const materials = cube.material;
                        
                        if (x === this.size - 1) materials[0].color.setHex(faceStates.right[y][z]);
                        if (x === 0) materials[1].color.setHex(faceStates.left[y][z]);
                        if (y === this.size - 1) materials[2].color.setHex(faceStates.top[z][x]);
                        if (y === 0) materials[3].color.setHex(faceStates.bottom[z][x]);
                        if (z === this.size - 1) materials[4].color.setHex(faceStates.front[y][x]);
                        if (z === 0) materials[5].color.setHex(faceStates.back[y][x]);
                    }
                    index++;
                }
            }
        }
    }

    animateRotation(face, clockwise, callback) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        setTimeout(() => {
            this.isAnimating = false;
            if (callback) callback();
        }, 300);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

class Scoreboard {
    constructor() {
        this.scores = this.loadScores();
    }

    loadScores() {
        const saved = localStorage.getItem('rubiks-scoreboard');
        return saved ? JSON.parse(saved) : [];
    }

    saveScores() {
        localStorage.setItem('rubiks-scoreboard', JSON.stringify(this.scores));
    }

    addScore(name, time, size) {
        this.scores.push({
            name: name,
            time: time,
            size: size,
            date: new Date().toISOString()
        });
        
        this.scores.sort((a, b) => a.time - b.time);
        this.saveScores();
    }

    getScores(sizeFilter = null) {
        let filtered = this.scores;
        
        if (sizeFilter !== null) {
            filtered = this.scores.filter(score => score.size === sizeFilter);
        }
        
        return filtered.sort((a, b) => a.time - b.time);
    }
}

class TaskTracker {
    constructor() {
        this.tasks = this.loadTasks();
        this.gamificationSystem = new GamificationSystem();
        this.currentEditingTask = null;
        this.activeTimers = new Map();
        
        if (typeof document !== 'undefined' && document.getElementById) {
            this.initializeEventListeners();
            this.updateDisplay();
        }
    }

    initializeEventListeners() {
        const showTaskTrackerBtn = document.getElementById('show-task-tracker-btn');
        if (showTaskTrackerBtn) showTaskTrackerBtn.addEventListener('click', () => this.showTaskTracker());
        
        const backToMenuBtn = document.getElementById('back-to-menu-from-tasks-btn');
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => this.backToMenu());
        
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.hideModal());
        
        const cancelTaskBtn = document.getElementById('cancel-task-btn');
        if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', () => this.hideModal());
        
        const taskForm = document.getElementById('task-form');
        if (taskForm) taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) statusFilter.addEventListener('change', () => this.updateTaskList());
        
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) priorityFilter.addEventListener('change', () => this.updateTaskList());

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal();
            }
        });
    }

    showTaskTracker() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('task-tracker-screen').classList.add('active');
        this.updateDisplay();
    }

    backToMenu() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('welcome-screen').classList.add('active');
    }

    showAddTaskModal() {
        this.currentEditingTask = null;
        document.getElementById('modal-title').textContent = 'Add New Task';
        document.getElementById('task-form').reset();
        document.getElementById('task-modal').classList.add('active');
    }

    showEditTaskModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditingTask = taskId;
        document.getElementById('modal-title').textContent = 'Edit Task';
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('estimated-time').value = task.estimatedTime;
        document.getElementById('task-modal').classList.add('active');
    }

    hideModal() {
        document.getElementById('task-modal').classList.remove('active');
        this.currentEditingTask = null;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const priority = document.getElementById('task-priority').value;
        const estimatedTime = parseInt(document.getElementById('estimated-time').value);

        if (!title) return;

        if (this.currentEditingTask) {
            this.updateTask(this.currentEditingTask, { title, description, priority, estimatedTime });
        } else {
            this.addTask(title, description, priority, estimatedTime);
        }

        this.hideModal();
    }

    addTask(title, description, priority, estimatedTime) {
        const task = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            estimatedTime,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null,
            timeSpent: 0,
            isOverdue: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateDisplay();
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
        this.saveTasks();
        this.updateDisplay();
    }

    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        this.stopTaskTimer(taskId);
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.updateDisplay();
    }

    startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status === 'completed') return;

        task.status = 'in-progress';
        this.saveTasks();
        
        const timer = new TaskTimer(taskId, () => this.updateTaskTimer(taskId));
        this.activeTimers.set(taskId, timer);
        timer.start();
        
        this.updateDisplay();
    }

    pauseTask(taskId) {
        const timer = this.activeTimers.get(taskId);
        if (timer) {
            timer.pause();
        }
        this.updateDisplay();
    }

    resumeTask(taskId) {
        const timer = this.activeTimers.get(taskId);
        if (timer) {
            timer.resume();
        }
        this.updateDisplay();
    }

    stopTaskTimer(taskId) {
        const timer = this.activeTimers.get(taskId);
        if (timer) {
            const timeSpent = timer.getElapsedTime();
            timer.stop();
            this.activeTimers.delete(taskId);
            
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.timeSpent += timeSpent;
                task.status = 'pending';
                this.saveTasks();
            }
        }
        this.updateDisplay();
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.stopTaskTimer(taskId);
        
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        const points = this.gamificationSystem.calculateTaskPoints(task);
        this.gamificationSystem.addPoints(points);
        this.gamificationSystem.checkAchievements(this.tasks);
        
        this.saveTasks();
        this.updateDisplay();
    }

    updateTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const timer = this.activeTimers.get(taskId);
        
        if (task && timer) {
            const elapsed = timer.getElapsedTime();
            const estimatedMs = task.estimatedTime * 60 * 1000;
            
            if (elapsed > estimatedMs && !task.isOverdue) {
                task.isOverdue = true;
                this.gamificationSystem.deductPointsForDelay(task);
                this.saveTasks();
            }
        }
        
        if (task && task.status === 'in-progress') {
            const currentTimeSpent = timer ? timer.getElapsedTime() : task.timeSpent;
            const estimatedMs = task.estimatedTime * 60 * 1000;
            
            if (currentTimeSpent > estimatedMs && !task.isOverdue) {
                task.isOverdue = true;
                this.gamificationSystem.deductPointsForDelay(task);
                this.saveTasks();
            }
        }
        
        this.updateTaskList();
    }

    updateDisplay() {
        if (typeof document !== 'undefined' && document.getElementById) {
            this.updateStats();
            this.updateTaskList();
            this.updateAchievements();
        }
    }

    updateStats() {
        const stats = this.gamificationSystem.getStats();
        const todayTasks = this.getTodayCompletedTasks().length;
        
        const totalPointsEl = document.getElementById('total-points');
        if (totalPointsEl) totalPointsEl.textContent = stats.totalPoints;
        
        const dailyStreakEl = document.getElementById('daily-streak');
        if (dailyStreakEl) dailyStreakEl.textContent = stats.dailyStreak;
        
        const tasksTodayEl = document.getElementById('tasks-today');
        if (tasksTodayEl) tasksTodayEl.textContent = todayTasks;
    }

    updateTaskList() {
        const statusFilterEl = document.getElementById('status-filter');
        const priorityFilterEl = document.getElementById('priority-filter');
        const taskListEl = document.getElementById('task-list');
        
        if (!statusFilterEl || !priorityFilterEl || !taskListEl) return;
        
        const statusFilter = statusFilterEl.value;
        const priorityFilter = priorityFilterEl.value;
        
        let filteredTasks = this.tasks;
        
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        if (filteredTasks.length === 0) {
            taskListEl.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks found</h3>
                    <p>Add a new task to get started!</p>
                </div>
            `;
            return;
        }

        taskListEl.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
        
        filteredTasks.forEach(task => {
            this.attachTaskEventListeners(task.id);
        });
    }

    renderTask(task) {
        const timer = this.activeTimers.get(task.id);
        const isRunning = timer && timer.isRunning;
        const isPaused = timer && timer.isPaused;
        const currentTime = timer ? timer.getElapsedTime() : task.timeSpent;
        const estimatedMs = task.estimatedTime * 60 * 1000;
        
        const statusClass = task.isOverdue ? 'overdue' : task.status;
        const timerDisplay = this.formatTime(currentTime);
        const estimatedDisplay = this.formatTime(estimatedMs);

        return `
            <div class="task-item ${statusClass}" data-task-id="${task.id}">
                <div class="task-header-row">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                
                <div class="task-meta">
                    <span>Estimated: ${estimatedDisplay}</span>
                    <span>Status: ${task.status.replace('-', ' ')}</span>
                </div>
                
                <div class="task-timer">
                    <div class="timer-display">${timerDisplay}</div>
                    <div class="timer-controls">
                        ${task.status !== 'completed' ? `
                            ${!isRunning ? `
                                <button class="btn primary start-task-btn">Start</button>
                            ` : `
                                ${!isPaused ? `
                                    <button class="btn secondary pause-task-btn">Pause</button>
                                ` : `
                                    <button class="btn primary resume-task-btn">Resume</button>
                                `}
                                <button class="btn secondary stop-task-btn">Stop</button>
                            `}
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions">
                    ${task.status !== 'completed' ? `
                        <button class="btn primary complete-task-btn">Complete</button>
                        <button class="btn secondary edit-task-btn">Edit</button>
                    ` : ''}
                    <button class="btn secondary delete-task-btn">Delete</button>
                </div>
            </div>
        `;
    }

    attachTaskEventListeners(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) return;

        const startBtn = taskElement.querySelector('.start-task-btn');
        const pauseBtn = taskElement.querySelector('.pause-task-btn');
        const resumeBtn = taskElement.querySelector('.resume-task-btn');
        const stopBtn = taskElement.querySelector('.stop-task-btn');
        const completeBtn = taskElement.querySelector('.complete-task-btn');
        const editBtn = taskElement.querySelector('.edit-task-btn');
        const deleteBtn = taskElement.querySelector('.delete-task-btn');

        if (startBtn) startBtn.addEventListener('click', () => this.startTask(taskId));
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTask(taskId));
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeTask(taskId));
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopTaskTimer(taskId));
        if (completeBtn) completeBtn.addEventListener('click', () => this.completeTask(taskId));
        if (editBtn) editBtn.addEventListener('click', () => this.showEditTaskModal(taskId));
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteTask(taskId));
    }

    updateAchievements() {
        const achievements = this.gamificationSystem.getAchievements();
        const achievementsList = document.getElementById('achievements-list');
        
        if (!achievementsList) return;
        
        achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `).join('');
    }

    getTodayCompletedTasks() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => 
            task.status === 'completed' && 
            task.completedAt && 
            new Date(task.completedAt).toDateString() === today
        );
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('task-tracker-tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load tasks from localStorage:', error);
            localStorage.removeItem('task-tracker-tasks');
            return [];
        }
    }

    saveTasks() {
        localStorage.setItem('task-tracker-tasks', JSON.stringify(this.tasks));
    }
}

class TaskTimer {
    constructor(taskId, updateCallback) {
        this.taskId = taskId;
        this.updateCallback = updateCallback;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
    }

    start() {
        if (this.isRunning) return;
        
        this.startTime = Date.now() - this.elapsedTime;
        this.isRunning = true;
        this.isPaused = false;
        
        this.intervalId = setInterval(() => {
            if (this.updateCallback) {
                this.updateCallback();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.elapsedTime = Date.now() - this.startTime;
        this.isPaused = true;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.startTime = Date.now() - this.elapsedTime;
        this.isPaused = false;
        
        this.intervalId = setInterval(() => {
            if (this.updateCallback) {
                this.updateCallback();
            }
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.isRunning && !this.isPaused) {
            this.elapsedTime = Date.now() - this.startTime;
        }
        
        this.isRunning = false;
        this.isPaused = false;
    }

    getElapsedTime() {
        if (!this.isRunning) {
            return this.elapsedTime;
        }
        
        if (this.isPaused) {
            return this.elapsedTime;
        }
        
        return Date.now() - this.startTime;
    }
}

class GamificationSystem {
    constructor() {
        this.data = this.loadData();
        this.achievements = this.initializeAchievements();
    }

    initializeAchievements() {
        return [
            {
                id: 'first_task',
                title: 'Getting Started',
                description: 'Complete your first task',
                icon: '🎯',
                unlocked: false,
                condition: (tasks) => tasks.filter(t => t.status === 'completed').length >= 1
            },
            {
                id: 'daily_three',
                title: 'Daily Achiever',
                description: 'Complete 3 tasks in one day',
                icon: '⭐',
                unlocked: false,
                condition: (tasks) => this.getTodayCompletedTasks(tasks).length >= 3
            },
            {
                id: 'speed_demon',
                title: 'Speed Demon',
                description: 'Complete a task under estimated time',
                icon: '⚡',
                unlocked: false,
                condition: (tasks) => tasks.some(t => 
                    t.status === 'completed' && 
                    t.timeSpent < (t.estimatedTime * 60 * 1000)
                )
            },
            {
                id: 'streak_week',
                title: 'Week Warrior',
                description: 'Complete tasks for 7 days straight',
                icon: '🔥',
                unlocked: false,
                condition: () => this.data.dailyStreak >= 7
            },
            {
                id: 'hundred_points',
                title: 'Century Club',
                description: 'Earn 100 total points',
                icon: '💯',
                unlocked: false,
                condition: () => this.data.totalPoints >= 100
            }
        ];
    }

    calculateTaskPoints(task) {
        let basePoints = 10;
        
        switch (task.priority) {
            case 'high': basePoints = 20; break;
            case 'medium': basePoints = 15; break;
            case 'low': basePoints = 10; break;
        }

        const estimatedMs = task.estimatedTime * 60 * 1000;
        if (task.timeSpent < estimatedMs) {
            basePoints += 5;
        }

        return basePoints;
    }

    addPoints(points) {
        this.data.totalPoints += points;
        this.updateDailyStreak();
        this.saveData();
    }

    deductPointsForDelay(task) {
        const penalty = Math.floor(this.calculateTaskPoints(task) * 0.5);
        this.data.totalPoints = Math.max(0, this.data.totalPoints - penalty);
        this.saveData();
    }

    updateDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.data.lastActiveDate;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                this.data.dailyStreak += 1;
            } else {
                this.data.dailyStreak = 1;
            }
            
            this.data.lastActiveDate = today;
        }
    }

    checkAchievements(tasks) {
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition(tasks)) {
                achievement.unlocked = true;
                this.data.unlockedAchievements.push(achievement.id);
                this.addPoints(25);
            }
        });
        
        this.saveData();
    }

    getTodayCompletedTasks(tasks) {
        const today = new Date().toDateString();
        return tasks.filter(task => 
            task.status === 'completed' && 
            task.completedAt && 
            new Date(task.completedAt).toDateString() === today
        );
    }

    getStats() {
        return {
            totalPoints: this.data.totalPoints,
            dailyStreak: this.data.dailyStreak
        };
    }

    getAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.data.unlockedAchievements.includes(achievement.id)
        }));
    }

    loadData() {
        try {
            const saved = localStorage.getItem('task-tracker-gamification');
            return saved ? JSON.parse(saved) : {
                totalPoints: 0,
                dailyStreak: 0,
                lastActiveDate: null,
                unlockedAchievements: []
            };
        } catch (error) {
            console.warn('Failed to load gamification data from localStorage:', error);
            localStorage.removeItem('task-tracker-gamification');
            return {
                totalPoints: 0,
                dailyStreak: 0,
                lastActiveDate: null,
                unlockedAchievements: []
            };
        }
    }

    saveData() {
        localStorage.setItem('task-tracker-gamification', JSON.stringify(this.data));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RubiksCubeGame();
    new TaskTracker();
});
