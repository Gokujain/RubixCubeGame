describe('TaskTracker', () => {
    let taskTracker;
    
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
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
        taskTracker = new TaskTracker();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Task Management', () => {
        test('should add a new task', () => {
            const initialCount = taskTracker.tasks.length;
            taskTracker.addTask('Test Task', 'Test Description', 'high', 60);
            
            expect(taskTracker.tasks.length).toBe(initialCount + 1);
            const newTask = taskTracker.tasks[taskTracker.tasks.length - 1];
            expect(newTask.title).toBe('Test Task');
            expect(newTask.description).toBe('Test Description');
            expect(newTask.priority).toBe('high');
            expect(newTask.estimatedTime).toBe(60);
            expect(newTask.status).toBe('pending');
        });

        test('should update an existing task', () => {
            taskTracker.addTask('Original Task', 'Original Description', 'low', 30);
            const taskId = taskTracker.tasks[0].id;
            
            taskTracker.updateTask(taskId, {
                title: 'Updated Task',
                priority: 'high',
                estimatedTime: 45
            });
            
            const updatedTask = taskTracker.tasks.find(t => t.id === taskId);
            expect(updatedTask.title).toBe('Updated Task');
            expect(updatedTask.priority).toBe('high');
            expect(updatedTask.estimatedTime).toBe(45);
            expect(updatedTask.description).toBe('Original Description');
        });

        test('should delete a task', () => {
            taskTracker.addTask('Task to Delete', 'Description', 'medium', 30);
            const taskId = taskTracker.tasks[0].id;
            const initialCount = taskTracker.tasks.length;
            
            window.confirm = jest.fn(() => true);
            taskTracker.deleteTask(taskId);
            
            expect(taskTracker.tasks.length).toBe(initialCount - 1);
            expect(taskTracker.tasks.find(t => t.id === taskId)).toBeUndefined();
        });

        test('should not delete task if user cancels', () => {
            taskTracker.addTask('Task to Keep', 'Description', 'medium', 30);
            const taskId = taskTracker.tasks[0].id;
            const initialCount = taskTracker.tasks.length;
            
            window.confirm = jest.fn(() => false);
            taskTracker.deleteTask(taskId);
            
            expect(taskTracker.tasks.length).toBe(initialCount);
            expect(taskTracker.tasks.find(t => t.id === taskId)).toBeDefined();
        });
    });

    describe('Task Status Management', () => {
        test('should start a task and change status to in-progress', () => {
            taskTracker.addTask('Test Task', 'Description', 'medium', 30);
            const taskId = taskTracker.tasks[0].id;
            
            taskTracker.startTask(taskId);
            
            const task = taskTracker.tasks.find(t => t.id === taskId);
            expect(task.status).toBe('in-progress');
            expect(taskTracker.activeTimers.has(taskId)).toBe(true);
        });

        test('should complete a task and award points', () => {
            taskTracker.addTask('Test Task', 'Description', 'high', 30);
            const taskId = taskTracker.tasks[0].id;
            const initialPoints = taskTracker.gamificationSystem.data.totalPoints;
            
            taskTracker.completeTask(taskId);
            
            const task = taskTracker.tasks.find(t => t.id === taskId);
            expect(task.status).toBe('completed');
            expect(task.completedAt).toBeTruthy();
            expect(taskTracker.gamificationSystem.data.totalPoints).toBeGreaterThan(initialPoints);
        });

        test('should not start completed task', () => {
            taskTracker.addTask('Test Task', 'Description', 'medium', 30);
            const taskId = taskTracker.tasks[0].id;
            
            taskTracker.completeTask(taskId);
            taskTracker.startTask(taskId);
            
            expect(taskTracker.activeTimers.has(taskId)).toBe(false);
        });
    });

    describe('Data Persistence', () => {
        test('should save tasks to localStorage', () => {
            taskTracker.addTask('Persistent Task', 'Description', 'low', 15);
            
            const savedTasks = JSON.parse(localStorage.getItem('task-tracker-tasks'));
            expect(savedTasks).toBeTruthy();
            expect(savedTasks.length).toBe(1);
            expect(savedTasks[0].title).toBe('Persistent Task');
        });

        test('should load tasks from localStorage', () => {
            const testTasks = [{
                id: '123',
                title: 'Loaded Task',
                description: 'Test',
                priority: 'medium',
                estimatedTime: 30,
                status: 'pending',
                createdAt: new Date().toISOString(),
                completedAt: null,
                timeSpent: 0,
                isOverdue: false
            }];
            
            localStorage.setItem('task-tracker-tasks', JSON.stringify(testTasks));
            
            const newTaskTracker = new TaskTracker();
            expect(newTaskTracker.tasks.length).toBe(1);
            expect(newTaskTracker.tasks[0].title).toBe('Loaded Task');
        });
    });

    describe('Task Filtering', () => {
        beforeEach(() => {
            taskTracker.addTask('Pending Task', 'Description', 'high', 30);
            taskTracker.addTask('In Progress Task', 'Description', 'medium', 45);
            taskTracker.addTask('Completed Task', 'Description', 'low', 60);
            
            taskTracker.startTask(taskTracker.tasks[1].id);
            taskTracker.completeTask(taskTracker.tasks[2].id);
        });

        test('should filter tasks by status', () => {
            document.getElementById('status-filter').value = 'completed';
            taskTracker.updateTaskList();
            
            const taskList = document.getElementById('task-list');
            expect(taskList.innerHTML).toContain('Completed Task');
            expect(taskList.innerHTML).not.toContain('Pending Task');
            expect(taskList.innerHTML).not.toContain('In Progress Task');
        });

        test('should filter tasks by priority', () => {
            document.getElementById('priority-filter').value = 'high';
            taskTracker.updateTaskList();
            
            const taskList = document.getElementById('task-list');
            expect(taskList.innerHTML).toContain('Pending Task');
            expect(taskList.innerHTML).not.toContain('In Progress Task');
            expect(taskList.innerHTML).not.toContain('Completed Task');
        });
    });

    describe('Time Formatting', () => {
        test('should format milliseconds to MM:SS', () => {
            expect(taskTracker.formatTime(0)).toBe('00:00');
            expect(taskTracker.formatTime(30000)).toBe('00:30');
            expect(taskTracker.formatTime(90000)).toBe('01:30');
            expect(taskTracker.formatTime(3661000)).toBe('61:01');
        });
    });
});
