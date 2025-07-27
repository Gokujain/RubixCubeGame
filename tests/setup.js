const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, '..', 'game.js');
const gameJsContent = fs.readFileSync(gameJsPath, 'utf8');

const gameJsForTesting = gameJsContent.replace(
    /document\.addEventListener\('DOMContentLoaded'.*?\}\);/s,
    ''
);

eval(gameJsForTesting + `
    if (typeof TaskTracker !== 'undefined') global.TaskTracker = TaskTracker;
    if (typeof TaskTimer !== 'undefined') global.TaskTimer = TaskTimer;
    if (typeof GamificationSystem !== 'undefined') global.GamificationSystem = GamificationSystem;
    if (typeof RubiksCubeGame !== 'undefined') global.RubiksCubeGame = RubiksCubeGame;
    if (typeof Timer !== 'undefined') global.Timer = Timer;
    if (typeof Scoreboard !== 'undefined') global.Scoreboard = Scoreboard;
`);

global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

global.performance = {
    now: jest.fn(() => Date.now())
};

global.confirm = jest.fn(() => true);

global.alert = jest.fn();

beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
});
