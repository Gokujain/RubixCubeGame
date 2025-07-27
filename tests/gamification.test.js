describe('GamificationSystem', () => {
    let gamificationSystem;
    
    beforeEach(() => {
        localStorage.clear();
        gamificationSystem = new GamificationSystem();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Points Calculation', () => {
        test('should calculate correct base points for different priorities', () => {
            const lowTask = { priority: 'low', estimatedTime: 30, timeSpent: 25 * 60 * 1000 };
            const mediumTask = { priority: 'medium', estimatedTime: 30, timeSpent: 25 * 60 * 1000 };
            const highTask = { priority: 'high', estimatedTime: 30, timeSpent: 25 * 60 * 1000 };
            
            expect(gamificationSystem.calculateTaskPoints(lowTask)).toBe(15); // 10 + 5 bonus
            expect(gamificationSystem.calculateTaskPoints(mediumTask)).toBe(20); // 15 + 5 bonus
            expect(gamificationSystem.calculateTaskPoints(highTask)).toBe(25); // 20 + 5 bonus
        });

        test('should give bonus points for completing under estimated time', () => {
            const fastTask = { 
                priority: 'medium', 
                estimatedTime: 30, 
                timeSpent: 20 * 60 * 1000 // 20 minutes < 30 minutes
            };
            const slowTask = { 
                priority: 'medium', 
                estimatedTime: 30, 
                timeSpent: 35 * 60 * 1000 // 35 minutes > 30 minutes
            };
            
            expect(gamificationSystem.calculateTaskPoints(fastTask)).toBe(20); // 15 + 5 bonus
            expect(gamificationSystem.calculateTaskPoints(slowTask)).toBe(15); // 15 base, no bonus
        });
    });

    describe('Points Management', () => {
        test('should add points correctly', () => {
            const initialPoints = gamificationSystem.data.totalPoints;
            gamificationSystem.addPoints(50);
            
            expect(gamificationSystem.data.totalPoints).toBe(initialPoints + 50);
        });

        test('should deduct points for delay', () => {
            gamificationSystem.addPoints(100);
            const task = { priority: 'high', estimatedTime: 30, timeSpent: 25 * 60 * 1000 };
            const initialPoints = gamificationSystem.data.totalPoints;
            
            gamificationSystem.deductPointsForDelay(task);
            
            const expectedDeduction = Math.floor(gamificationSystem.calculateTaskPoints(task) * 0.5);
            expect(gamificationSystem.data.totalPoints).toBe(initialPoints - expectedDeduction);
        });

        test('should not allow negative points', () => {
            gamificationSystem.data.totalPoints = 10;
            const task = { priority: 'high', estimatedTime: 30, timeSpent: 25 * 60 * 1000 };
            
            gamificationSystem.deductPointsForDelay(task);
            
            expect(gamificationSystem.data.totalPoints).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Daily Streak Management', () => {
        test('should start streak on first day', () => {
            gamificationSystem.addPoints(10);
            
            expect(gamificationSystem.data.dailyStreak).toBe(1);
            expect(gamificationSystem.data.lastActiveDate).toBe(new Date().toDateString());
        });

        test('should increment streak on consecutive days', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            gamificationSystem.data.lastActiveDate = yesterday.toDateString();
            gamificationSystem.data.dailyStreak = 5;
            
            gamificationSystem.addPoints(10);
            
            expect(gamificationSystem.data.dailyStreak).toBe(6);
        });

        test('should reset streak if gap in days', () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            
            gamificationSystem.data.lastActiveDate = twoDaysAgo.toDateString();
            gamificationSystem.data.dailyStreak = 5;
            
            gamificationSystem.addPoints(10);
            
            expect(gamificationSystem.data.dailyStreak).toBe(1);
        });
    });

    describe('Achievement System', () => {
        test('should unlock "Getting Started" achievement', () => {
            const tasks = [
                { status: 'completed', completedAt: new Date().toISOString() }
            ];
            
            gamificationSystem.checkAchievements(tasks);
            
            expect(gamificationSystem.data.unlockedAchievements).toContain('first_task');
        });

        test('should unlock "Speed Demon" achievement', () => {
            const tasks = [
                { 
                    status: 'completed', 
                    estimatedTime: 30, 
                    timeSpent: 20 * 60 * 1000,
                    completedAt: new Date().toISOString()
                }
            ];
            
            gamificationSystem.checkAchievements(tasks);
            
            expect(gamificationSystem.data.unlockedAchievements).toContain('speed_demon');
        });

        test('should unlock "Daily Achiever" achievement', () => {
            const today = new Date().toISOString();
            const tasks = [
                { status: 'completed', completedAt: today },
                { status: 'completed', completedAt: today },
                { status: 'completed', completedAt: today }
            ];
            
            gamificationSystem.checkAchievements(tasks);
            
            expect(gamificationSystem.data.unlockedAchievements).toContain('daily_three');
        });

        test('should unlock "Week Warrior" achievement', () => {
            gamificationSystem.data.dailyStreak = 7;
            
            gamificationSystem.checkAchievements([]);
            
            expect(gamificationSystem.data.unlockedAchievements).toContain('streak_week');
        });

        test('should unlock "Century Club" achievement', () => {
            gamificationSystem.data.totalPoints = 100;
            
            gamificationSystem.checkAchievements([]);
            
            expect(gamificationSystem.data.unlockedAchievements).toContain('hundred_points');
        });

        test('should award bonus points for achievements', () => {
            const initialPoints = gamificationSystem.data.totalPoints;
            const tasks = [
                { status: 'completed', completedAt: new Date().toISOString() }
            ];
            
            gamificationSystem.checkAchievements(tasks);
            
            expect(gamificationSystem.data.totalPoints).toBe(initialPoints + 25);
        });

        test('should not unlock same achievement twice', () => {
            const tasks = [
                { status: 'completed', completedAt: new Date().toISOString() }
            ];
            
            gamificationSystem.checkAchievements(tasks);
            const firstPoints = gamificationSystem.data.totalPoints;
            
            gamificationSystem.checkAchievements(tasks);
            const secondPoints = gamificationSystem.data.totalPoints;
            
            expect(secondPoints).toBe(firstPoints);
            expect(gamificationSystem.data.unlockedAchievements.filter(id => id === 'first_task').length).toBe(1);
        });
    });

    describe('Data Persistence', () => {
        test('should save gamification data to localStorage', () => {
            gamificationSystem.addPoints(50);
            
            const savedData = JSON.parse(localStorage.getItem('task-tracker-gamification'));
            expect(savedData).toBeTruthy();
            expect(savedData.totalPoints).toBe(50);
        });

        test('should load gamification data from localStorage', () => {
            const testData = {
                totalPoints: 150,
                dailyStreak: 3,
                lastActiveDate: new Date().toDateString(),
                unlockedAchievements: ['first_task', 'speed_demon']
            };
            
            localStorage.setItem('task-tracker-gamification', JSON.stringify(testData));
            
            const newGamificationSystem = new GamificationSystem();
            expect(newGamificationSystem.data.totalPoints).toBe(150);
            expect(newGamificationSystem.data.dailyStreak).toBe(3);
            expect(newGamificationSystem.data.unlockedAchievements).toEqual(['first_task', 'speed_demon']);
        });
    });

    describe('Statistics', () => {
        test('should return correct stats', () => {
            gamificationSystem.data.totalPoints = 75;
            gamificationSystem.data.dailyStreak = 5;
            
            const stats = gamificationSystem.getStats();
            
            expect(stats.totalPoints).toBe(75);
            expect(stats.dailyStreak).toBe(5);
        });

        test('should return achievements with unlock status', () => {
            gamificationSystem.data.unlockedAchievements = ['first_task', 'speed_demon'];
            
            const achievements = gamificationSystem.getAchievements();
            
            expect(achievements.find(a => a.id === 'first_task').unlocked).toBe(true);
            expect(achievements.find(a => a.id === 'speed_demon').unlocked).toBe(true);
            expect(achievements.find(a => a.id === 'daily_three').unlocked).toBe(false);
        });
    });
});
