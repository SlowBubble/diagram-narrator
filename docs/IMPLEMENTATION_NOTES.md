# Testing the id= Parameter Implementation

## Changes Made

### 1. In `main.js` (index.html)
- Changed from `diagram=` (using index) to `id=` (using diagramId)
- `init()` function now looks for `id` parameter and finds diagram by `diagramId`
- `syncURL()` function now sets `id` parameter with the current diagram's `diagramId`

### 2. In `edit.js` (edit.html)
- Added support for loading existing diagrams via `id=` parameter
- `init()` function checks for `id` parameter and calls `loadDiagramFromLocalStorage()`
- New `loadDiagramFromLocalStorage()` function restores diagram state from localStorage

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
3. For diagrams from localStorage, it uses their unique timestamp-based `diagramId`
4. For static diagrams, it uses the descriptive `diagramId` from `diagrams.js`

### edit.html
1. You can now edit an existing diagram by visiting `edit.html?id=<diagramId>`
2. The editor will load the diagram from localStorage using the provided `id`
3. All changes are saved back to localStorage with the same `diagramId`

## Example URLs

- `http://localhost:8000/index.html?id=red-line-stops` - View the Red Line stops diagram
- `http://localhost:8000/index.html?id=learn-struggle-challenge` - View the first diagram
- `http://localhost:8000/edit.html?id=2026-01-03T16:00:00.000Z` - Edit a diagram saved at that timestamp
