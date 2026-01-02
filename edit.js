const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

const NODE_WIDTH = 400;
const NODE_HEIGHT = 200;
const GRID_X = 600;
const GRID_Y = 350;
const FONT_SIZE = 56;

// Editor State
let cursor = { x: 0, y: 0 };
let viewX = 0;
let viewY = 0;
let nodes = []; // Array of { id, text, x, y }
let edges = []; // Array of { id, start, end }
let mode = 'navigate'; // 'navigate', 'edit-text', 'view-json', 'edit-narrative'
let drawingStartNode = null;
let narrative = []; // Array of { utter, highlightedNodes, highlightedEdges }

function getOrCreateNode(x, y) {
  let n = nodes.find(node => node.x === x && node.y === y);
  if (!n) {
    let idNum = 0;
    while (nodes.some(node => node.id === `node-${idNum}`)) {
      idNum++;
    }
    n = { id: `node-${idNum}`, text: '', x, y };
    nodes.push(n);
  }
  return n;
}

function finishArrowDrawing() {
  if (!drawingStartNode) return;

  const endNode = getOrCreateNode(cursor.x, cursor.y);
  let idNum = 0;
  while (edges.some(e => e.id === `edge-${idNum}`)) {
    idNum++;
  }
  const newEdge = {
    id: `edge-${idNum}`,
    start: drawingStartNode.id,
    end: endNode.id
  };
  edges.push(newEdge);
  drawingStartNode = null;
}

function drawSelfLoop(node, isHighlighted, w, h, isDashed = false, isGhost = false) {
  const gap = 100; // Reach halfway to next node
  const cx = node.centerX;
  const cy = node.centerY;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.strokeStyle = isHighlighted ? "#ff4444" : "#000000";
  ctx.lineWidth = isHighlighted ? 12 : 8;

  if (isGhost) {
    ctx.save();
    ctx.globalAlpha = 0.5;
  }

  ctx.beginPath();
  if (isDashed) {
    ctx.setLineDash([20, 10]);
  } else {
    ctx.setLineDash([]);
  }

  const x_start = x + w * 0.75;
  const y_start = y;
  const x_end = x + w;
  const y_end = y + h * 0.25;

  ctx.moveTo(x_start, y_start);
  ctx.lineTo(x_start, y_start - gap);
  ctx.lineTo(x + w + gap, y_start - gap);
  ctx.lineTo(x + w + gap, y_end);

  // Stop short for arrowhead
  const headLength = 40;
  const altitude = headLength * Math.cos(Math.PI / 6);
  ctx.lineTo(x + w + altitude, y_end);
  ctx.stroke();

  ctx.setLineDash([]);

  drawArrowhead({ x: x + w + 1, y: y_end }, { x: x + w, y: y_end }, isHighlighted);

  if (isGhost) {
    ctx.restore();
  }
}

// Modal Elements
const textModal = document.getElementById('text-modal');
const nodeTextArea = document.getElementById('node-text');
const jsonModal = document.getElementById('json-modal');
const jsonOutput = document.getElementById('json-output');
const narrativeModal = document.getElementById('narrative-modal');
const narrativeTextArea = document.getElementById('narrative-text');

// Initialize
function init() {
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleInput);
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
    if (e.key === 'ArrowDown') cursor.y = cursor.y + 1;
    if (e.key === 'ArrowLeft') cursor.x = Math.max(0, cursor.x - 1);
    if (e.key === 'ArrowRight') cursor.x = cursor.x + 1;

    updateView();

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (drawingStartNode) {
        finishArrowDrawing();
      }
      startEditing();
    }

    if (e.key === 'x') {
      e.preventDefault();
      showJson();
    }

    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      startNarrativeEditing();
    }

    if (e.key === 'a') {
      if (drawingStartNode) {
        finishArrowDrawing();
      } else {
        drawingStartNode = getOrCreateNode(cursor.x, cursor.y);
      }
    }

    if (e.key === 'Backspace') {
      const nodeIndex = nodes.findIndex(n => n.x === cursor.x && n.y === cursor.y);
      if (nodeIndex >= 0) {
        const nodeId = nodes[nodeIndex].id;
        nodes.splice(nodeIndex, 1);
        // Remove connected edges
        edges = edges.filter(edge => edge.start !== nodeId && edge.end !== nodeId);
        // Also clear drawingStartNode if it was the deleted node
        if (drawingStartNode && drawingStartNode.id === nodeId) {
          drawingStartNode = null;
        }
      }
    }

    render();
  } else if (mode === 'edit-text') {
    // Modal handles focus
  } else if (mode === 'view-json') {
    if (e.key === 'Escape') {
      closeJson();
    }
  } else if (mode === 'edit-narrative') {
    // Modal handles focus
  }
}

function updateView() {
  if (cursor.x < viewX) viewX = cursor.x;
  if (cursor.x > viewX + 3) viewX = cursor.x - 3;
  if (cursor.y < viewY) viewY = cursor.y;
  if (cursor.y > viewY + 3) viewY = cursor.y - 3;
}

// Text Area specific handling
nodeTextArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    saveNodeText();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelEditing();
  }
});

// Narrative Area specific handling
narrativeTextArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    saveNarrativeStep();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelNarrativeEditing();
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
    // Also remove connected edges
    // Edges connected to this node should be removed or made invalid?
    // Let's filter them out for correctness
    // We need to know the ID of the removed node, but we might not have it easily if it was new.
    // If logic works correctly, an existing node has an ID.
    // Since we just filtered logic above:
    // Actually, getting the ID of the node at cursor BEFORE filtering would be better.
    // But since we are here, let's just do a clean pass on edges in render or just keep simple.
  }

  cancelEditing();
}

function cancelEditing() {
  mode = 'navigate';
  textModal.classList.remove('active');
  nodeTextArea.value = '';
  render();
}

function startNarrativeEditing() {
  mode = 'edit-narrative';
  narrativeTextArea.value = '';
  narrativeModal.classList.add('active');
  narrativeTextArea.focus();
}

function saveNarrativeStep() {
  const text = narrativeTextArea.value.trim();
  if (text) {
    const node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
    const highlightedNodes = node ? [node.id] : [];

    narrative.push({
      utter: text,
      highlightedNodes: highlightedNodes,
      highlightedEdges: []
    });
  }
  cancelNarrativeEditing();
}

function cancelNarrativeEditing() {
  mode = 'navigate';
  narrativeModal.classList.remove('active');
  narrativeTextArea.value = '';
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
    edges: edges,
    narrative: narrative
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

  const totalWidth = (3) * GRID_X + NODE_WIDTH + 100;
  const totalHeight = (3) * GRID_Y + NODE_HEIGHT + 100;

  const scale = Math.min(canvas.width / totalWidth, canvas.height / totalHeight, 1) * 0.9;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const gridCenterX = (viewX + 1.5) * GRID_X;
  const gridCenterY = (viewY + 1.5) * GRID_Y;

  ctx.save();
  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.scale(scale, scale);
  ctx.translate(-gridCenterX, -gridCenterY);

  // Helper map
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = {
      ...n,
      centerX: n.x * GRID_X,
      centerY: n.y * GRID_Y
    };
  });

  // Draw Edges
  edges.forEach(edge => {
    const startNode = nodeMap[edge.start];
    const endNode = nodeMap[edge.end];
    if (startNode && endNode) {
      drawEdge(startNode, endNode, false);
    }
  });

  // Ghost Arrow
  if (drawingStartNode) {
    const startNode = nodeMap[drawingStartNode.id];
    // Target is cursor
    const targetX = cursor.x * GRID_X;
    const targetY = cursor.y * GRID_Y;

    // Fake end node for geometry calculation
    const isSelf = drawingStartNode.x === cursor.x && drawingStartNode.y === cursor.y;
    const endNode = isSelf ? startNode : { id: 'temp', centerX: targetX, centerY: targetY };

    drawEdge(startNode, endNode, false, true);
  }

  // Draw Grid/Nodes
  for (let x = viewX; x < viewX + 4; x++) {
    for (let y = viewY; y < viewY + 4; y++) {
      const centerX = x * GRID_X;
      const centerY = y * GRID_Y;

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

  ctx.strokeStyle = isCursor ? "#0000ff" : "#eeeeee";
  ctx.lineWidth = isCursor ? 4 : 2;

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}

function drawNode(node, cx, cy, isCursor) {
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);

  if (isCursor) {
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

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

// Helper functions for Arrow Drawing
function drawEdge(startNode, endNode, isHighlighted, isGhost = false) {
  if (startNode.id === endNode.id) {
    drawSelfLoop(startNode, isHighlighted, NODE_WIDTH, NODE_HEIGHT, false, isGhost);
    return;
  }

  const startPt = getRectIntersection(endNode.centerX, endNode.centerY, startNode.centerX, startNode.centerY, NODE_WIDTH, NODE_HEIGHT);
  const endPt = getRectIntersection(startNode.centerX, startNode.centerY, endNode.centerX, endNode.centerY, NODE_WIDTH, NODE_HEIGHT);

  const headLength = 40;

  const dx = endPt.x - startPt.x;
  const dy = endPt.y - startPt.y;
  const angle = Math.atan2(dy, dx);
  const fullLength = Math.sqrt(dx * dx + dy * dy);

  const altitude = headLength * Math.cos(Math.PI / 6);
  const shortenBy = altitude;

  const lineLen = Math.max(0, fullLength - shortenBy);
  const lineEndX = startPt.x + Math.cos(angle) * lineLen;
  const lineEndY = startPt.y + Math.sin(angle) * lineLen;

  ctx.strokeStyle = isHighlighted ? "#ff4444" : "#000000";
  ctx.lineWidth = isHighlighted ? 12 : 8;

  if (isGhost) {
    ctx.save();
    ctx.globalAlpha = 0.5;
  }

  ctx.beginPath();
  ctx.moveTo(startPt.x, startPt.y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  drawArrowhead(startPt, endPt, isHighlighted);

  if (isGhost) {
    ctx.restore();
  }
}

function drawArrowhead(fromPt, toPt, isHighlighted) {
  const headLength = 40;
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const angle = Math.atan2(dy, dx);

  ctx.fillStyle = isHighlighted ? "#ff4444" : "#000000";

  ctx.beginPath();
  ctx.moveTo(toPt.x, toPt.y);
  ctx.lineTo(toPt.x - headLength * Math.cos(angle - Math.PI / 6), toPt.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toPt.x - headLength * Math.cos(angle + Math.PI / 6), toPt.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function getRectIntersection(x1, y1, x2, y2, w, h) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { x: x2, y: y2 };

  const hw = w / 2;
  const hh = h / 2;
  const slope = Math.abs(dy / dx);
  const boxSlope = hh / hw;

  let ix, iy;

  if (slope < boxSlope) {
    const signX = dx > 0 ? -1 : 1;
    ix = x2 + signX * hw;
    iy = y2 + (ix - x2) * (dy / dx);
  } else {
    const signY = dy > 0 ? -1 : 1;
    iy = y2 + signY * hh;
    ix = x2 + (iy - y2) * (dx / dy);
  }
  return { x: ix, y: iy };
}

init();
