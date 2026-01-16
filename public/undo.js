export default class UndoManager {
  constructor(maxStates = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStates = maxStates;
  }

  // Push a state onto the undo stack
  push(state) {
    const stateCopy = JSON.parse(JSON.stringify(state));

    // Don't push if the state is the same as the last one
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack[this.undoStack.length - 1];
      if (JSON.stringify(lastState) === JSON.stringify(stateCopy)) {
        return;
      }
    }

    this.undoStack.push(stateCopy);
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length <= 1) return null;

    // Pop the current state and move it to redo stack
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    // Return the previous state
    const previousState = this.undoStack[this.undoStack.length - 1];
    return JSON.parse(JSON.stringify(previousState));
  }

  redo() {
    if (this.redoStack.length === 0) return null;

    // Pop state from redo stack and move it back to undo stack
    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    return JSON.parse(JSON.stringify(nextState));
  }
}
