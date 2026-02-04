A full-stack screenplay editing platform for collaborative writing with real-time collaboration, intelligent script analysis, and complete version control.

## Features

**Writing & Formatting**

- Rich-text editing with Bold, Italic, Underline support
- Line-by-line locking to prevent edit conflicts
- Character name management with global rename

**Script Analysis**

- Auto-detect character names and roles
- Word count and formatting statistics
- Identify naming inconsistencies
- View full character dialogue with context
- Group characters by scene interaction

**Collaboration**

- Multi-user editing with real-time line locking
- Prevent simultaneous edits on same line
- User session tracking

**Version Control**

- Delta tracking of all changes (timestamps included)
- Create checkpoints to save script states
- Restore from any checkpoint
- Full change history

## Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript  
**Backend:** Node.js, Express.js, Sequelize ORM  
**Database:** MySQL


## Quick Start

### Frontend

```bash
# Open in browser
open editor.html
```

### Backend

```bash
# Install dependencies
npm install

# Start server
node prviZd.js
```

Server runs on `http://localhost:3000`

## API Endpoints

| Method | Endpoint                                   | Purpose                     |
| ------ | ------------------------------------------ | --------------------------- |
| POST   | `/api/scenarios`                           | Create new script           |
| GET    | `/api/scenarios/:id`                       | Fetch script content        |
| POST   | `/api/scenarios/:id/lines/:lineId/lock`    | Lock line for editing       |
| PUT    | `/api/scenarios/:id/lines/:lineId`         | Update line (requires lock) |
| POST   | `/api/scenarios/:id/characters/lock`       | Lock character for rename   |
| POST   | `/api/scenarios/:id/characters/update`     | Rename character globally   |
| GET    | `/api/scenarios/:id/deltas`                | Get change history          |
| POST   | `/api/scenarios/:id/checkpoint`            | Create version checkpoint   |
| GET    | `/api/scenarios/:id/checkpoints`           | List checkpoints            |
| GET    | `/api/scenarios/:id/restore/:checkpointId` | Restore from checkpoint     |


## How It Works

1. **Write** - Edit script in contenteditable area with formatting
2. **Lock** - Request line lock before editing (prevents conflicts)
3. **Analyze** - Run analysis tools (detect characters, count words, find inconsistencies)
4. **Collaborate** - Multiple users edit simultaneously with individual line locks
5. **Checkpoint** - Save script version at any time
6. **Restore** - Recover previous version from checkpoint

## Database Models

- **Scenario** - Script metadata (id, title)
- **Line** - Script content with linked list structure (lineId, text, nextLineId)
- **Delta** - Change log (type, content, timestamp, userId)
- **Checkpoint** - Version markers (scenarioId, timestamp)

## Key Components

**prviZd.js** - Express server with:

- 10 REST endpoints for script management
- In-memory line and character locking
- Delta-based version tracking
- Checkpoint creation and restoration
