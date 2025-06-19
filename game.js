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

document.addEventListener('DOMContentLoaded', () => {
    new RubiksCubeGame();
});
