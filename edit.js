const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

const NODE_WIDTH = 400;
const NODE_HEIGHT = 200;
const GRID_X = 600;
const GRID_Y = 350;
const FONT_SIZE = 56;

// Editor State
let cursor = { x: 0, y: 0 };
let nodes = []; // Array of { id, text, x, y }
let mode = 'navigate'; // 'navigate', 'edit-text', 'view-json'

// Modal Elements
const textModal = document.getElementById('text-modal');
const nodeTextArea = document.getElementById('node-text');
const jsonModal = document.getElementById('json-modal');
const jsonOutput = document.getElementById('json-output');

// Initialize
function init() {
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleInput);

  // Check if we have nodes (empty start)
  // Maybe pre-populate or just start empty?
  // User said "Start with edit.html... Goal: build an editor... Show a grid... start with 4x4"
  // I will implicitly assume a blank canvas within a 4x4 allowable area logic-wise. 
  // And visualize the 4x4 grid.

  handleResize();
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function handleInput(e) {
  if (mode === 'navigate') {
    if (e.key === 'ArrowUp') cursor.y = Math.max(0, cursor.y - 1);
    if (e.key === 'ArrowDown') cursor.y = Math.min(3, cursor.y + 1); // 4x4 grid -> max index 3
    if (e.key === 'ArrowLeft') cursor.x = Math.max(0, cursor.x - 1);
    if (e.key === 'ArrowRight') cursor.x = Math.min(3, cursor.x + 1);

    if (e.key === 'Enter') {
      e.preventDefault();
      startEditing();
    }

    if (e.key === 'x') {
      e.preventDefault();
      showJson();
    }

    render();
  } else if (mode === 'edit-text') {
    // Modal handles focus, but we need to intercept specific keys if needed, 
    // though usually the textarea will consume them.
    // We added a global listener, might be better to listen on the textarea specifically or check target.
  } else if (mode === 'view-json') {
    if (e.key === 'Escape') {
      closeJson();
    }
  }
}

// Text Area specific handling
nodeTextArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    saveNodeText();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEditing();
  }
});

function startEditing() {
  mode = 'edit-text';
  const node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
  nodeTextArea.value = node ? node.text : '';
  textModal.classList.add('active');
  nodeTextArea.focus();
}

function saveNodeText() {
  const text = nodeTextArea.value.trim();
  if (text) {
    // Find existing or create new
    const existingIdx = nodes.findIndex(n => n.x === cursor.x && n.y === cursor.y);
    if (existingIdx >= 0) {
      nodes[existingIdx].text = text;
    } else {
      // Find a safe ID. "node-N"
      let idNum = 0;
      while (nodes.some(n => n.id === `node-${idNum}`)) {
        idNum++;
      }
      const id = `node-${idNum}`;
      nodes.push({ id, text, x: cursor.x, y: cursor.y });
    }
  } else {
    // If empty, remove the node
    nodes = nodes.filter(n => !(n.x === cursor.x && n.y === cursor.y));
  }

  cancelEditing();
}

function cancelEditing() {
  mode = 'navigate';
  textModal.classList.remove('active');
  nodeTextArea.value = '';
  render();
}

function showJson() {
  mode = 'view-json';
  const diagram = {
    nodes: nodes.map(n => ({
      id: n.id,
      text: n.text,
      x: n.x,
      y: n.y
    })),
    edges: [], // Edges not implemented yet
    narrative: [] // Narrative not implemented yet
  };
  jsonOutput.value = JSON.stringify(diagram, null, 2);
  jsonModal.classList.add('active');
  jsonOutput.focus();
}

function closeJson() {
  mode = 'navigate';
  jsonModal.classList.remove('active');
  render();
}

function render() {
  // Clear
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate Grid Bounds (4x4)
  // Min x=0, max x=3. Min y=0, max y=3.
  const minX = 0, maxX = 3;
  const minY = 0, maxY = 3;

  // Use logic similar to main.js for scaling
  // We want the whole 4x4 grid to fit.

  // We can just statically assume 4x4 grid size.
  // Width = 3 * GRID_X + NODE_WIDTH (approx) ? 
  // Actually from center of 0 to center of 3 is 3 * GRID_X.
  // Total width needed = (maxX - minX) * GRID_X + NODE_WIDTH + padding
  const totalWidth = (3) * GRID_X + NODE_WIDTH + 100;
  const totalHeight = (3) * GRID_Y + NODE_HEIGHT + 100;

  const scale = Math.min(canvas.width / totalWidth, canvas.height / totalHeight, 1) * 0.9;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  // Center of the 4x4 grid (from 0,0 to 3,3)
  // Center X is 1.5 * GRID_X
  // Center Y is 1.5 * GRID_Y
  const gridCenterX = 1.5 * GRID_X;
  const gridCenterY = 1.5 * GRID_Y;

  ctx.save();
  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.scale(scale, scale);
  ctx.translate(-gridCenterX, -gridCenterY);

  // Draw Grid Slots (4x4)
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      const centerX = x * GRID_X;
      const centerY = y * GRID_Y;

      // Draw placeholder logic
      const node = nodes.find(n => n.x === x && n.y === y);
      const isCursor = (x === cursor.x && y === cursor.y);

      if (node) {
        drawNode(node, centerX, centerY, isCursor);
      } else {
        drawPlaceholder(centerX, centerY, isCursor);
      }
    }
  }

  ctx.restore();
}

function drawPlaceholder(cx, cy, isCursor) {
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.strokeStyle = isCursor ? "#0000ff" : "#eeeeee"; // Blue if cursor, faint grey if not
  ctx.lineWidth = isCursor ? 4 : 2;

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();

  if (isCursor) {
    // Maybe a "plus" sign or something?
    // Just the blue border is enough.
  }
}

function drawNode(node, cx, cy, isCursor) {
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);

  // Border (if cursor)
  if (isCursor) {
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  // Text
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${FONT_SIZE}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = node.text.split('\n');
  if (lines.length > 1) {
    const lineHeight = FONT_SIZE * 1.2;
    const totalHeight = lineHeight * lines.length;
    const startY = cy - (totalHeight / 2) + (lineHeight / 2);

    lines.forEach((line, i) => {
      ctx.fillText(line, cx, startY + (i * lineHeight));
    });
  } else {
    ctx.fillText(node.text, cx, cy);
  }
}

init();
