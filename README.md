# Rubik's Cube Game with Task Tracker

A web-based Rubik's Cube game enhanced with a comprehensive task tracking system and gamification features.

## Features

### Rubik's Cube Game
- Interactive 3D Rubik's Cube simulation
- Multiple cube sizes (2x2, 3x3, 4x4, 5x5)
- Timer and move counter
- Scoreboard with best times
- Scramble and solve functionality

### Task Tracker
- **Task Management**: Add, edit, delete, and organize tasks
- **Timer System**: Built-in timer for each task with start/pause/stop functionality
- **Status Tracking**: Visual status indicators (pending, in-progress, completed, overdue)
- **Priority Levels**: High, medium, and low priority classification
- **Filtering**: Filter tasks by status and priority

### Gamification System
- **Points System**: Earn points for completing tasks based on priority and speed
- **Daily Achievements**: 5 different achievements to unlock
  - 🎯 Getting Started: Complete your first task (25 points)
  - ⭐ Daily Achiever: Complete 3 tasks in one day (50 points)
  - ⚡ Speed Demon: Complete a task under estimated time (30 points)
  - 🔥 Week Warrior: Maintain a 7-day streak (100 points)
  - 💯 Century Club: Earn 100 total points (25 points)
- **Daily Streaks**: Track consecutive days of task completion
- **Point Deduction**: Lose points for tasks that go over estimated time
- **Statistics Dashboard**: View total points, daily streak, and tasks completed today

## Getting Started

1. Open `index.html` in a web browser
2. Choose between the Rubik's Cube game or Task Tracker
3. For Task Tracker:
   - Click "Add New Task" to create your first task
   - Fill in task details (title, description, priority, estimated time)
   - Use the timer to track your work
   - Complete tasks to earn points and unlock achievements

## Testing

The application includes comprehensive test coverage:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- **Unit Tests**: Individual component testing (TaskTracker, GamificationSystem, TaskTimer)
- **Integration Tests**: Complete user workflow testing
- **Edge Cases**: Error handling, data persistence, performance testing

## Technical Implementation

### Architecture
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Storage**: localStorage for data persistence
- **Testing**: Jest with jsdom environment
- **Styling**: CSS Grid and Flexbox for responsive design

### Key Classes
- `TaskTracker`: Main task management logic
- `TaskTimer`: Timer functionality for individual tasks
- `GamificationSystem`: Points, achievements, and streak tracking
- `RubiksCubeGame`: Original cube game functionality

### Data Persistence
All data is stored locally in the browser using localStorage:
- Tasks and their states
- Gamification data (points, streaks, achievements)
- Rubik's cube high scores

## Browser Compatibility
- Modern browsers with ES6+ support
- localStorage support required
- Responsive design for desktop and mobile

## Development

The codebase follows these principles:
- Modular class-based architecture
- Comprehensive error handling
- Data validation and sanitization
- Responsive and accessible UI design
- Extensive test coverage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request
