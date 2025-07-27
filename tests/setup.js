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
