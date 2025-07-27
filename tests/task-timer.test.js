describe('TaskTimer', () => {
    let taskTimer;
    let mockCallback;
    
    beforeEach(() => {
        jest.useFakeTimers();
        mockCallback = jest.fn();
        taskTimer = new TaskTimer('test-task', mockCallback);
    });

    afterEach(() => {
        jest.useRealTimers();
        if (taskTimer.intervalId) {
            clearInterval(taskTimer.intervalId);
        }
    });

    describe('Timer Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(taskTimer.taskId).toBe('test-task');
            expect(taskTimer.updateCallback).toBe(mockCallback);
            expect(taskTimer.startTime).toBeNull();
            expect(taskTimer.elapsedTime).toBe(0);
            expect(taskTimer.isRunning).toBe(false);
            expect(taskTimer.isPaused).toBe(false);
            expect(taskTimer.intervalId).toBeNull();
        });
    });

    describe('Timer Start', () => {
        test('should start timer correctly', () => {
            taskTimer.start();
            
            expect(taskTimer.isRunning).toBe(true);
            expect(taskTimer.isPaused).toBe(false);
            expect(taskTimer.startTime).toBeTruthy();
            expect(taskTimer.intervalId).toBeTruthy();
        });

        test('should call update callback when started', () => {
            taskTimer.start();
            
            jest.advanceTimersByTime(1000);
            
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should not start if already running', () => {
            taskTimer.start();
            const firstStartTime = taskTimer.startTime;
            const firstIntervalId = taskTimer.intervalId;
            
            taskTimer.start();
            
            expect(taskTimer.startTime).toBe(firstStartTime);
            expect(taskTimer.intervalId).toBe(firstIntervalId);
        });
    });

    describe('Timer Pause', () => {
        test('should pause running timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(5000);
            
            taskTimer.pause();
            
            expect(taskTimer.isRunning).toBe(true);
            expect(taskTimer.isPaused).toBe(true);
            expect(taskTimer.elapsedTime).toBe(5000);
            expect(taskTimer.intervalId).toBeNull();
        });

        test('should not pause if not running', () => {
            taskTimer.pause();
            
            expect(taskTimer.isPaused).toBe(false);
        });

        test('should not pause if already paused', () => {
            taskTimer.start();
            taskTimer.pause();
            const elapsedTime = taskTimer.elapsedTime;
            
            taskTimer.pause();
            
            expect(taskTimer.elapsedTime).toBe(elapsedTime);
        });
    });

    describe('Timer Resume', () => {
        test('should resume paused timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(3000);
            taskTimer.pause();
            
            taskTimer.resume();
            
            expect(taskTimer.isRunning).toBe(true);
            expect(taskTimer.isPaused).toBe(false);
            expect(taskTimer.intervalId).toBeTruthy();
        });

        test('should not resume if not paused', () => {
            taskTimer.start();
            const intervalId = taskTimer.intervalId;
            
            taskTimer.resume();
            
            expect(taskTimer.intervalId).toBe(intervalId);
        });

        test('should continue from paused time', () => {
            taskTimer.start();
            jest.advanceTimersByTime(2000);
            taskTimer.pause();
            
            taskTimer.resume();
            jest.advanceTimersByTime(3000);
            
            expect(taskTimer.getElapsedTime()).toBe(5000);
        });
    });

    describe('Timer Stop', () => {
        test('should stop running timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(4000);
            
            taskTimer.stop();
            
            expect(taskTimer.isRunning).toBe(false);
            expect(taskTimer.isPaused).toBe(false);
            expect(taskTimer.intervalId).toBeNull();
            expect(taskTimer.elapsedTime).toBe(4000);
        });

        test('should stop paused timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(2000);
            taskTimer.pause();
            
            taskTimer.stop();
            
            expect(taskTimer.isRunning).toBe(false);
            expect(taskTimer.isPaused).toBe(false);
            expect(taskTimer.elapsedTime).toBe(2000);
        });
    });

    describe('Elapsed Time Calculation', () => {
        test('should return 0 for stopped timer', () => {
            expect(taskTimer.getElapsedTime()).toBe(0);
        });

        test('should return correct elapsed time for running timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(7000);
            
            expect(taskTimer.getElapsedTime()).toBe(7000);
        });

        test('should return paused time for paused timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(3000);
            taskTimer.pause();
            jest.advanceTimersByTime(2000); // This shouldn't affect elapsed time
            
            expect(taskTimer.getElapsedTime()).toBe(3000);
        });

        test('should return stored elapsed time for stopped timer', () => {
            taskTimer.start();
            jest.advanceTimersByTime(6000);
            taskTimer.stop();
            jest.advanceTimersByTime(1000); // This shouldn't affect elapsed time
            
            expect(taskTimer.getElapsedTime()).toBe(6000);
        });
    });

    describe('Timer Persistence', () => {
        test('should maintain elapsed time across pause/resume cycles', () => {
            taskTimer.start();
            jest.advanceTimersByTime(2000);
            taskTimer.pause();
            
            taskTimer.resume();
            jest.advanceTimersByTime(3000);
            taskTimer.pause();
            
            taskTimer.resume();
            jest.advanceTimersByTime(1000);
            
            expect(taskTimer.getElapsedTime()).toBe(6000);
        });
    });
});
