import { diagrams } from './diagrams.js';

let currentDiagramIndex = 0;
let currentNarrativeIndex = -1;
const canvas = document.getElementById('diagram-canvas');
const ctx = canvas.getContext('2d');

// Constants x2 (Text was 28->56, so we scale geometry to match text)
const NODE_WIDTH = 400;
const NODE_HEIGHT = 200;
const GRID_X = 600;
const GRID_Y = 400;
const FONT_SIZE = 56;

function init() {
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleInput);
  handleResize(); // Initial size setup and render
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function handleInput(e) {
  if (e.code === 'Space') {
    nextStep();
  }
}

function render() {
  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // White background

  if (currentDiagramIndex >= diagrams.length) {
    drawGameOver();
    return;
  }

  const diagram = diagrams[currentDiagramIndex];
  let narrativeStep = null;
  if (currentNarrativeIndex >= 0 && currentNarrativeIndex < diagram.narrative.length) {
    narrativeStep = diagram.narrative[currentNarrativeIndex];
  }

  // Dynamic Centering Calculation
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  diagram.nodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  });

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const gridSpanX = (maxX + minX) * GRID_X / 2;
  const gridSpanY = (maxY + minY) * GRID_Y / 2;

  const offsetX = canvasCenterX - gridSpanX;
  const offsetY = canvasCenterY - gridSpanY;

  const nodeMap = {};

  // First pass: Calculate positions with dynamic offset
  diagram.nodes.forEach(node => {
    const x = node.x * GRID_X + offsetX;
    const y = node.y * GRID_Y + offsetY;
    nodeMap[node.id] = { ...node, centerX: x, centerY: y };
  });

  // Draw Edges
  diagram.edges.forEach(edge => {
    const startNode = nodeMap[edge.start];
    const endNode = nodeMap[edge.end];
    if (!startNode || !endNode) return;

    let isHighlighted = false;
    if (narrativeStep && narrativeStep.highlightedEdges && narrativeStep.highlightedEdges.includes(edge.id)) {
      isHighlighted = true;
    }

    drawEdge(startNode, endNode, isHighlighted);
  });

  // Draw Nodes
  diagram.nodes.forEach(nodeRaw => {
    const node = nodeMap[nodeRaw.id];
    let isHighlighted = false;
    if (narrativeStep && narrativeStep.highlightedNodes && narrativeStep.highlightedNodes.includes(node.id)) {
      isHighlighted = true;
    }
    drawNode(node, isHighlighted);
  });
}

function drawNode(node, isHighlighted) {
  const { centerX, centerY, text } = node;
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  const x = centerX - w / 2;
  const y = centerY - h / 2;

  // Node Background (Always White)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();

  // Text Style
  ctx.fillStyle = isHighlighted ? "#ff0000" : "#000000"; // Red if highlighted, else black
  const fontWeight = isHighlighted ? "bold" : "normal";
  ctx.font = `${fontWeight} ${FONT_SIZE}px Inter, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, centerX, centerY);
}

function drawEdge(startNode, endNode, isHighlighted) {
  const startPt = getRectIntersection(endNode.centerX, endNode.centerY, startNode.centerX, startNode.centerY, NODE_WIDTH, NODE_HEIGHT);
  const endPt = getRectIntersection(startNode.centerX, startNode.centerY, endNode.centerX, endNode.centerY, NODE_WIDTH, NODE_HEIGHT);

  const headLength = 40; // 2x bigger head

  // Calculate shortening to stop line at base of arrow head
  const dx = endPt.x - startPt.x;
  const dy = endPt.y - startPt.y;
  const angle = Math.atan2(dy, dx);
  const fullLength = Math.sqrt(dx * dx + dy * dy);

  // Triangle altitude = length * cos(30)
  const altitude = headLength * Math.cos(Math.PI / 6);
  // Extra buffer to ensure it doesn't poke through due to linecap/rounding
  const shortenBy = altitude;

  const lineLen = Math.max(0, fullLength - shortenBy);
  const lineEndX = startPt.x + Math.cos(angle) * lineLen;
  const lineEndY = startPt.y + Math.sin(angle) * lineLen;

  ctx.strokeStyle = isHighlighted ? "#ff4444" : "#000000";
  ctx.lineWidth = isHighlighted ? 12 : 8; // 2x thicker

  ctx.beginPath();
  ctx.moveTo(startPt.x, startPt.y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  drawArrowhead(startPt, endPt, isHighlighted);
}

function drawArrowhead(fromPt, toPt, isHighlighted) {
  const headLength = 40; // 2x bigger
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const angle = Math.atan2(dy, dx);

  ctx.fillStyle = isHighlighted ? "#ff4444" : "#000000";

  ctx.beginPath();
  ctx.moveTo(toPt.x, toPt.y); // Tip

  // Point 2
  ctx.lineTo(toPt.x - headLength * Math.cos(angle - Math.PI / 6), toPt.y - headLength * Math.sin(angle - Math.PI / 6));

  // Point 3
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

function nextStep() {
  if (currentDiagramIndex >= diagrams.length) return;

  const diagram = diagrams[currentDiagramIndex];
  currentNarrativeIndex++;

  // Allow one extra step for neutral state (index == length)
  // If we go past that (index > length), we move to next diagram
  if (currentNarrativeIndex > diagram.narrative.length) {
    currentDiagramIndex++;
    currentNarrativeIndex = -1;
    if (currentDiagramIndex < diagrams.length) {
      render();
      // Wait for user input to start narrative of next diagram
    } else {
      drawGameOver();
    }
    return;
  }

  render();

  if (currentNarrativeIndex < diagram.narrative.length) {
    const step = diagram.narrative[currentNarrativeIndex];
    speak(step.utter);
  } else {
    // Neutral state (index == length)
    speak(""); // Silence
  }
}

function drawGameOver() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "60px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);

  document.removeEventListener('keydown', handleInput);
  speak("Game time is over. Go take a break.");
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v =>
      v.name.includes("Google US English") ||
      v.name.includes("David") ||
      v.name.includes("Daniel") ||
      v.name.toLowerCase().includes("male")
    );
    if (maleVoice) utterance.voice = maleVoice;
    window.speechSynthesis.speak(utterance);
  }
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => { };
}

init();
