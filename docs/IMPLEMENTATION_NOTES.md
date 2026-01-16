# Testing the id= Parameter Implementation

## Changes Made

### 1. In `main.js` (index.html)
- Changed from `diagram=` (using index) to `id=` (using diagramId)
- `init()` function now looks for `id` parameter and finds diagram by `diagramId`
- `syncURL()` function now sets `id` parameter with the current diagram's `diagramId`

### 2. In `edit.js` (edit.html)
- Added support for loading existing diagrams via `id=` parameter
- `init()` function checks for `id` parameter and calls `loadDiagramFromFirestore()`
- New `loadDiagramFromFirestore()` function restores diagram state from Firestore

### 3. In `diagrams.js`
- Added `diagramId` field to all static diagrams with descriptive IDs:
  - `learn-struggle-challenge`
  - `rent-earn-learn`
  - `school-progression`
  - `red-line-stops`
  - `big-problem-breakdown`
  - `run-crash-cry-learn`
  - `grade-scale`
  - `clock-hours`
  - `clock-minutes`
  - `compass-basic`
  - `compass-advanced`
  - `repetitive-task`
  - `solar-system`
  - `family-tree`
  - `task-group-example`

## How It Works

### index.html
1. When you navigate through diagrams using arrow keys, the URL updates with `?id=<diagramId>`
2. You can directly access a diagram by visiting `index.html?id=<diagramId>`
3. For diagrams from Firestore, it uses their unique timestamp-based `diagramId`
4. For static diagrams, it uses the descriptive `diagramId` from `diagrams.js`

### edit.html
1. You can now edit an existing diagram by visiting `edit.html?id=<diagramId>`
2. The editor will load the diagram from Firestore using the provided `id`
3. All changes are saved back to Firestore with the same `diagramId`

## Example URLs

- `http://localhost:8000/index.html?id=red-line-stops` - View the Red Line stops diagram
- `http://localhost:8000/index.html?id=learn-struggle-challenge` - View the first diagram
- `http://localhost:8000/edit.html?id=2026-01-03T16:00:00.000Z` - Edit a diagram saved at that timestamp

## Keyboard Shortcuts

### Common Shortcuts
- **`v`** - Switch between view mode (index.html) and edit mode (edit.html) while preserving the current diagram ID

### index.html (View Mode)
- **Space** - Advance to next narrative step
- **Left Arrow** - Go to previous diagram
- **Right Arrow** - Go to next diagram
- **`v`** - Switch to edit mode for current diagram

### edit.html (Edit Mode)
- **Arrow Keys** - Move cursor between nodes
- **Enter** - Edit node text (or create node group if multiple nodes selected)
- **`a`** - Start/end arrow drawing
- **`x`** - View diagram JSON
- **Cmd+Enter** - Add narrative step
- **Backspace** - Delete node or edge
- **Space** - Play narrative
- **Cmd+Backspace** - Delete diagram from Firestore (or Cmd+Backspace while playing narrative to delete step)
- **Escape** - Return to start of narration
- **`v`** - Switch to view mode for current diagram
