describe('Task Tracker Integration', () => {
    let taskTracker;
    
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <div id="welcome-screen" class="screen active"></div>
            <div id="task-tracker-screen" class="screen">
                <div id="total-points">0</div>
                <div id="daily-streak">0</div>
                <div id="tasks-today">0</div>
                <div id="task-list"></div>
                <div id="achievements-list"></div>
                <select id="status-filter">
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <select id="priority-filter">
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <div id="task-modal" class="modal">
                <h3 id="modal-title">Add New Task</h3>
                <form id="task-form">
                    <input id="task-title" type="text">
                    <textarea id="task-description"></textarea>
                    <select id="task-priority">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <input id="estimated-time" type="number" value="30">
                </form>
            </div>
        `;
        
        document.getElementById = jest.fn((id) => {
            const element = document.querySelector(`#${id}`);
            if (element) {
                return element;
            }
            return {
                addEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn() },
                textContent: '',
                innerHTML: '',
                value: ''
            };
        });
        
        document.querySelectorAll = jest.fn((selector) => {
            return {
                forEach: jest.fn()
            };
        });
        
        taskTracker = new TaskTracker();
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('Complete User Workflow', () => {
        test('should complete full task lifecycle with gamification', async () => {
            taskTracker.addTask('Integration Test Task', 'Test Description', 'high', 30);
            expect(taskTracker.tasks.length).toBe(1);
            
            const task = taskTracker.tasks[0];
            expect(task.status).toBe('pending');
            expect(task.priority).toBe('high');
            
            taskTracker.startTask(task.id);
            expect(task.status).toBe('in-progress');
            expect(taskTracker.activeTimers.has(task.id)).toBe(true);
            
            const timer = taskTracker.activeTimers.get(task.id);
            timer.elapsedTime = 25 * 60 * 1000; // 25 minutes (under estimated 30 minutes)
            
            const initialPoints = taskTracker.gamificationSystem.data.totalPoints;
            taskTracker.completeTask(task.id);
            
            expect(task.status).toBe('completed');
            expect(task.completedAt).toBeTruthy();
            expect(taskTracker.activeTimers.has(task.id)).toBe(false);
            
            expect(taskTracker.gamificationSystem.data.totalPoints).toBeGreaterThan(initialPoints);
            
            const achievements = taskTracker.gamificationSystem.getAchievements();
            const firstTaskAchievement = achievements.find(a => a.id === 'first_task');
            const speedDemonAchievement = achievements.find(a => a.id === 'speed_demon');
            
            expect(firstTaskAchievement.unlocked).toBe(true);
            expect(speedDemonAchievement.unlocked).toBe(true);
            
            expect(taskTracker.gamificationSystem.data.dailyStreak).toBe(1);
            expect(taskTracker.getTodayCompletedTasks().length).toBe(1);
        });

        test('should handle multiple tasks and achievements', () => {
            taskTracker.addTask('Task 1', 'Description 1', 'high', 30);
            taskTracker.addTask('Task 2', 'Description 2', 'medium', 45);
            taskTracker.addTask('Task 3', 'Description 3', 'low', 60);
            
            expect(taskTracker.tasks.length).toBe(3);
            
            taskTracker.tasks.forEach((task, index) => {
                taskTracker.startTask(task.id);
                
                const timer = taskTracker.activeTimers.get(task.id);
                timer.elapsedTime = (task.estimatedTime - 5) * 60 * 1000; // All under estimated time
                
                taskTracker.completeTask(task.id);
            });
            
            const completedTasks = taskTracker.tasks.filter(t => t.status === 'completed');
            expect(completedTasks.length).toBe(3);
            
            const achievements = taskTracker.gamificationSystem.getAchievements();
            const dailyAchiever = achievements.find(a => a.id === 'daily_three');
            expect(dailyAchiever.unlocked).toBe(true);
            
            expect(taskTracker.gamificationSystem.data.totalPoints).toBeGreaterThan(50);
        });

        test('should handle task editing workflow', () => {
            taskTracker.addTask('Original Task', 'Original Description', 'low', 30);
            const taskId = taskTracker.tasks[0].id;
            
            taskTracker.updateTask(taskId, {
                title: 'Updated Task',
                description: 'Updated Description',
                priority: 'high',
                estimatedTime: 45
            });
            
            const updatedTask = taskTracker.tasks.find(t => t.id === taskId);
            expect(updatedTask.title).toBe('Updated Task');
            expect(updatedTask.description).toBe('Updated Description');
            expect(updatedTask.priority).toBe('high');
            expect(updatedTask.estimatedTime).toBe(45);
            
            taskTracker.completeTask(taskId);
            expect(updatedTask.status).toBe('completed');
            
            const expectedPoints = 20; // High priority base points
            expect(taskTracker.gamificationSystem.data.totalPoints).toBeGreaterThanOrEqual(expectedPoints);
        });

        test('should handle overdue tasks and point deduction', () => {
            taskTracker.addTask('Overdue Task', 'Description', 'medium', 30);
            const task = taskTracker.tasks[0];
            
            taskTracker.startTask(task.id);
            
            const timer = taskTracker.activeTimers.get(task.id);
            timer.elapsedTime = 35 * 60 * 1000; // 35 minutes > 30 minutes estimated
            
            const initialPoints = taskTracker.gamificationSystem.data.totalPoints;
            taskTracker.updateTaskTimer(task.id); // This should trigger overdue logic
            
            expect(task.isOverdue).toBe(true);
            expect(taskTracker.gamificationSystem.data.totalPoints).toBeLessThan(initialPoints);
        });
    });

    describe('Data Persistence Integration', () => {
        test('should persist and restore complete application state', () => {
            taskTracker.addTask('Persistent Task', 'Description', 'high', 30);
            taskTracker.startTask(taskTracker.tasks[0].id);
            taskTracker.completeTask(taskTracker.tasks[0].id);
            
            const originalPoints = taskTracker.gamificationSystem.data.totalPoints;
            const originalStreak = taskTracker.gamificationSystem.data.dailyStreak;
            const originalAchievements = taskTracker.gamificationSystem.data.unlockedAchievements.length;
            
            const newTaskTracker = new TaskTracker();
            
            expect(newTaskTracker.tasks.length).toBe(1);
            expect(newTaskTracker.tasks[0].status).toBe('completed');
            expect(newTaskTracker.gamificationSystem.data.totalPoints).toBe(originalPoints);
            expect(newTaskTracker.gamificationSystem.data.dailyStreak).toBe(originalStreak);
            expect(newTaskTracker.gamificationSystem.data.unlockedAchievements.length).toBe(originalAchievements);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid task operations gracefully', () => {
            expect(() => taskTracker.startTask('invalid-id')).not.toThrow();
            
            expect(() => taskTracker.completeTask('invalid-id')).not.toThrow();
            
            expect(() => taskTracker.updateTask('invalid-id', { title: 'New Title' })).not.toThrow();
        });

        test('should handle corrupted localStorage data', () => {
            localStorage.setItem('task-tracker-tasks', 'invalid-json');
            localStorage.setItem('task-tracker-gamification', 'invalid-json');
            
            expect(() => new TaskTracker()).not.toThrow();
            
            const newTaskTracker = new TaskTracker();
            expect(newTaskTracker.tasks).toEqual([]);
            expect(newTaskTracker.gamificationSystem.data.totalPoints).toBe(0);
        });
    });

    describe('Performance', () => {
        test('should handle large number of tasks efficiently', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                taskTracker.addTask(`Task ${i}`, `Description ${i}`, 'medium', 30);
            }
            
            for (let i = 0; i < 50; i++) {
                taskTracker.completeTask(taskTracker.tasks[i].id);
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(executionTime).toBeLessThan(1000);
            expect(taskTracker.tasks.length).toBe(100);
            expect(taskTracker.tasks.filter(t => t.status === 'completed').length).toBe(50);
        });
    });
});
