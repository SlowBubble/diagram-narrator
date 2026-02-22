import { diagrams as staticDiagrams } from './diagrams.js';
import { diagrams as cantoDiagrams } from './cantoDiagrams.js';
import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const isCanto = urlParams.get('canto') === '1';

// Load diagrams from Firestore and combine with static diagrams
async function loadDiagrams() {
  if (isCanto) {
    return cantoDiagrams;
  }

  const cloudDiagrams = [];

  try {
    const querySnapshot = await getDocs(collection(db, "diagrams"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Handle new format: { diagram: { ... }, info: { ... } }
      if (data.diagram && data.info) {
        if (data.info.isPublic) {
          cloudDiagrams.push({
            ...data.diagram,
            diagramId: data.info.id,
            lastEdited: data.info.lastEdited
          });
        }
      } else {
        // Fallback for old format - assume public if it was already there?
        // Actually the user said "Only show public projects", 
        // and old format doesn't have isPublic. 
        // For safety, let's treat old format as public for now if it has the fields.
        if (data.diagramId && data.lastEdited !== undefined) {
          cloudDiagrams.push(data);
        }
      }
    });
  } catch (e) {
    console.error("Error loading diagrams from Firestore:", e);
  }

  // Sort by most recent lastEdited (descending)
  cloudDiagrams.sort((a, b) => b.lastEdited - a.lastEdited);

  // Combine: firestore diagrams first, then static diagrams
  return [...cloudDiagrams, ...staticDiagrams];
}

let diagrams = [];
console.log('Loaded diagrams:', diagrams);

let currentDiagramIndex = 0;
let currentNarrativeIndex = -1;
const canvas = document.getElementById('diagram-canvas');
const ctx = canvas.getContext('2d');

// Constants x2 (Text was 28->56, so we scale geometry to match text)
const NODE_WIDTH = 400;
const NODE_HEIGHT = 200;
const GRID_X = 600;
const GRID_Y = 350;
const FONT_SIZE = 56;

async function init() {
  diagrams = await loadDiagrams();
  console.log('Loaded diagrams:', diagrams);

  if (isCanto) {
    document.title = "圖表講述";
    document.documentElement.lang = "zh-HK";
  }

  const idParam = urlParams.get('id');
  if (idParam) {
    // Find diagram by diagramId
    const idx = diagrams.findIndex(d => d.diagramId === idParam);
    if (idx >= 0) {
      currentDiagramIndex = idx;
    } else {
      // Try to fetch it specifically if not found in the public list
      try {
        const docRef = doc(db, "diagrams", idParam);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          let diagram = null;
          // Handle new format: { diagram: { ... }, info: { ... } }
          if (data.diagram && data.info) {
            diagram = {
              ...data.diagram,
              diagramId: data.info.id,
              lastEdited: data.info.lastEdited
            };
          } else if (data.diagramId) {
            // Fallback for old format
            diagram = data;
          }

          if (diagram) {
            // Add it to the list so navigation still works
            diagrams.unshift(diagram);
            currentDiagramIndex = 0;
          }
        }
      } catch (e) {
        console.error("Error fetching specific diagram:", e);
      }
    }
  }

  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleInput);
  handleResize(); // Initial size setup and render
  syncURL(); // Update URL with id parameter
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function syncURL() {
  const url = new URL(window.location);
  if (currentDiagramIndex < diagrams.length) {
    const diagram = diagrams[currentDiagramIndex];
    if (diagram.diagramId) {
      url.searchParams.set('id', diagram.diagramId);
    }
  } else {
    url.searchParams.delete('id');
  }

  if (isCanto) {
    url.searchParams.set('canto', '1');
  } else {
    url.searchParams.delete('canto');
  }

  window.history.replaceState({}, '', url);
}

function handleInput(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (e.shiftKey) {
      prevStep();
    } else {
      nextStep();
    }
  } else if (e.key === 'v') {
    // Switch to edit.html with current diagram ID
    if (currentDiagramIndex < diagrams.length) {
      const diagram = diagrams[currentDiagramIndex];
      if (diagram.diagramId) {
        window.location.href = `edit.html?id=${diagram.diagramId}`;
      }
    }
  } else if (e.code === 'ArrowLeft') {
    if (currentDiagramIndex > 0) {
      currentDiagramIndex--;
      currentNarrativeIndex = -1;
      syncURL();
      // If we are coming back from Game Over state, this will restore render
      render();
      speak("");
    }
  } else if (e.code === 'ArrowRight') {
    if (currentDiagramIndex < diagrams.length) {
      currentDiagramIndex++;
      currentNarrativeIndex = -1;
      syncURL();
      if (currentDiagramIndex < diagrams.length) {
        render();
        speak("");
      } else {
        render();
        speak(isCanto ? "遊戲時間結束喇，去休息下啦。" : "Game time is over. Go take a break.");
      }
    }
  }
}

function render() {
  if (currentDiagramIndex < diagrams.length) {
    console.log(`Rendering diagram index ${currentDiagramIndex}:`, diagrams[currentDiagramIndex].diagramId);
  }
  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // White background

  if (currentDiagramIndex >= diagrams.length) {
    drawGameOver();
    return;
  }

  const diagram = diagrams[currentDiagramIndex];

  // Check for vertical arrows
  let hasVerticalArrow = false;
  const nMap = {};
  diagram.nodes.forEach(n => nMap[n.id] = n);
  for (const edge of diagram.edges) {
    const s = nMap[edge.start];
    const e = nMap[edge.end];
    if (s && e && s.y !== e.y) {
      hasVerticalArrow = true;
      break;
    }
  }
  const baseGap = GRID_Y - NODE_HEIGHT;
  const effectiveGap = hasVerticalArrow ? baseGap : baseGap * 0.25;
  const effectiveGridY = NODE_HEIGHT + effectiveGap;

  let narrativeStep = null;
  if (currentNarrativeIndex >= 0 && currentNarrativeIndex < diagram.narrative.length) {
    narrativeStep = diagram.narrative[currentNarrativeIndex];
  }

  // Calculate Dynamic Node Width
  ctx.font = `bold ${FONT_SIZE}px Inter, sans-serif`; // Use bold for max width calculation
  let maxTextWidth = 0;
  diagram.nodes.forEach(node => {
    if (node.text) {
      const lines = node.text.split('\n');
      lines.forEach(line => {
        const width = ctx.measureText(line).width;
        if (width > maxTextWidth) maxTextWidth = width;
      });
    }
  });

  // Add padding (e.g. 40px)
  const effectiveNodeWidth = Math.max(NODE_WIDTH, maxTextWidth + 40);

  // First pass: Build node context map (coords and sizes)
  const nodeMap = {};

  // Atomic nodes
  diagram.nodes.filter(n => !n.children).forEach(node => {
    const x = node.x * GRID_X;
    const y = node.y * effectiveGridY;
    nodeMap[node.id] = {
      ...node,
      centerX: x,
      centerY: y,
      width: effectiveNodeWidth,
      height: NODE_HEIGHT
    };
  });

  // Second pass: group nodes
  let changed = true;
  while (changed) {
    changed = false;
    diagram.nodes.filter(n => n.children).forEach(n => {
      if (nodeMap[n.id]) return;
      const children = n.children.map(id => nodeMap[id]).filter(Boolean);
      if (children.length === n.children.length) {
        let minCX = Infinity, maxCX = -Infinity, minCY = Infinity, maxCY = -Infinity;
        children.forEach(c => {
          minCX = Math.min(minCX, c.centerX - c.width / 2);
          maxCX = Math.max(maxCX, c.centerX + c.width / 2);
          minCY = Math.min(minCY, c.centerY - c.height / 2);
          maxCY = Math.max(maxCY, c.centerY + c.height / 2);
        });
        const padding = 40;
        nodeMap[n.id] = {
          ...n,
          centerX: (minCX + maxCX) / 2,
          centerY: (minCY + maxCY) / 2,
          width: (maxCX - minCX) + 2 * padding,
          height: (maxCY - minCY) + 2 * padding
        };
        changed = true;
      }
    });
  }

  // Calculate true bounding box of ALL rendered elements
  let minCanvasX = Infinity, maxCanvasX = -Infinity;
  let minCanvasY = Infinity, maxCanvasY = -Infinity;

  Object.values(nodeMap).forEach(node => {
    minCanvasX = Math.min(minCanvasX, node.centerX - node.width / 2);
    maxCanvasX = Math.max(maxCanvasX, node.centerX + node.width / 2);
    minCanvasY = Math.min(minCanvasY, node.centerY - node.height / 2);
    maxCanvasY = Math.max(maxCanvasY, node.centerY + node.height / 2);
  });

  // If no nodes, default to canvas size
  if (minCanvasX === Infinity) {
    minCanvasX = 0; maxCanvasX = canvas.width;
    minCanvasY = 0; maxCanvasY = canvas.height;
  }

  const totalWidth = maxCanvasX - minCanvasX;
  const totalHeight = maxCanvasY - minCanvasY;
  const diagramCenterX = (minCanvasX + maxCanvasX) / 2;
  const diagramCenterY = (minCanvasY + maxCanvasY) / 2;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const scale = Math.min(canvas.width / totalWidth, canvas.height / totalHeight, 1) * 0.9;

  ctx.save();
  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.scale(scale, scale);
  ctx.translate(-diagramCenterX, -diagramCenterY);

  // Draw Node Groups
  diagram.nodes.filter(n => n.children).forEach(group => {
    let isHighlighted = false;
    if (narrativeStep && narrativeStep.highlightedNodes && narrativeStep.highlightedNodes.includes(group.id)) {
      isHighlighted = true;
    }
    drawNodeGroup(group, nodeMap, isHighlighted);
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

    drawEdge(startNode, endNode, isHighlighted, edge.dashed);
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

  ctx.restore();
}

function drawNode(node, isHighlighted) {
  if (!node || node.children) return; // Atomic nodes only
  const { centerX, centerY, text, width } = node;
  const w = width;
  const h = NODE_HEIGHT;
  const x = centerX - w / 2;
  const y = centerY - h / 2;

  // Node Background (Light Tan)
  ctx.fillStyle = "#fff4e0";
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();

  // Text Style
  ctx.fillStyle = isHighlighted ? "#ff0000" : "#000000"; // Red if highlighted, else black
  const fontWeight = isHighlighted ? "bold" : "normal";
  ctx.font = `${fontWeight} ${FONT_SIZE}px Inter, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = (text || "").split('\n');
  if (lines.length > 1) {
    const lineHeight = FONT_SIZE * 1.2;
    const totalHeight = lineHeight * lines.length;
    const startY = centerY - (totalHeight / 2) + (lineHeight / 2);

    lines.forEach((line, i) => {
      ctx.fillText(line, centerX, startY + (i * lineHeight));
    });
  } else if (text) {
    ctx.fillText(text, centerX, centerY);
  }
}

function drawNodeGroup(group, nodeMap, isHighlighted) {
  const info = nodeMap[group.id];
  if (!info) return;

  const x = info.centerX - info.width / 2;
  const y = info.centerY - info.height / 2;
  const w = info.width;
  const h = info.height;

  ctx.strokeStyle = isHighlighted ? "#ff0000" : "#000000";
  ctx.lineWidth = isHighlighted ? 8 : 4;
  ctx.setLineDash([20, 10]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  if (group.text) {
    ctx.font = `bold ${FONT_SIZE * 0.8}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textX = info.centerX;
    const textY = y; // Upper border

    // White shading (outline) to make it look floating above border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 16;
    ctx.lineJoin = "round";
    ctx.strokeText(group.text, textX, textY);

    ctx.fillStyle = isHighlighted ? "#ff0000" : "#000000";
    ctx.fillText(group.text, textX, textY);
  }
}

function drawSelfLoop(node, isHighlighted, w, h, isDashed = false) {
  const gap = 100; // Reach halfway to next node
  const cx = node.centerX;
  const cy = node.centerY;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.strokeStyle = isHighlighted ? "#ff4444" : "#000000";
  ctx.lineWidth = isHighlighted ? 12 : 8;

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
}

function drawEdge(startNode, endNode, isHighlighted, isDashed = false) {
  if (startNode.id === endNode.id) {
    drawSelfLoop(startNode, isHighlighted, startNode.width, startNode.height, isDashed);
    return;
  }

  const startPt = getRectIntersection(endNode.centerX, endNode.centerY, startNode.centerX, startNode.centerY, startNode.width, startNode.height);
  const endPt = getRectIntersection(startNode.centerX, startNode.centerY, endNode.centerX, endNode.centerY, endNode.width, endNode.height);

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
  if (isDashed) {
    ctx.setLineDash([20, 10]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.moveTo(startPt.x, startPt.y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();
  ctx.setLineDash([]);

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
    syncURL();
    if (currentDiagramIndex < diagrams.length) {
      render();
      // Wait for user input to start narrative of next diagram
    } else {
      render();
      speak(isCanto ? "遊戲時間結束喇，去休息下啦。" : "Game time is over. Go take a break.");
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

function prevStep() {
  if (currentDiagramIndex >= diagrams.length) {
    // We are in Game Over. Go back to last diagram.
    currentDiagramIndex = diagrams.length - 1;
    const diagram = diagrams[currentDiagramIndex];
    currentNarrativeIndex = diagram.narrative.length;
    syncURL();
    render();
    speak("");
    return;
  }

  currentNarrativeIndex--;

  if (currentNarrativeIndex < -1) {
    if (currentDiagramIndex > 0) {
      currentDiagramIndex--;
      const diagram = diagrams[currentDiagramIndex];
      currentNarrativeIndex = diagram.narrative.length;
      syncURL();
    } else {
      currentNarrativeIndex = -1;
    }
  }

  render();

  if (currentDiagramIndex < diagrams.length) {
    const diagram = diagrams[currentDiagramIndex];
    if (currentNarrativeIndex >= 0 && currentNarrativeIndex < diagram.narrative.length) {
      const step = diagram.narrative[currentNarrativeIndex];
      speak(step.utter);
    } else {
      speak("");
    }
  }
}

function drawGameOver() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "60px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isCanto ? "遊戲結束" : "Game Over", canvas.width / 2, canvas.height / 2);
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (isCanto) {
      const cantoVoice = voices.find(v =>
        v.lang.includes("zh-HK") ||
        v.name.includes("Cantonese") ||
        v.name.includes("Sin-ji")
      );
      if (cantoVoice) {
        utterance.voice = cantoVoice;
      } else {
        utterance.lang = "zh-HK";
      }
    } else {
      const maleVoice = voices.find(v =>
        v.name.includes("Google US English") ||
        v.name.includes("David") ||
        v.name.includes("Daniel") ||
        v.name.toLowerCase().includes("male")
      );
      if (maleVoice) utterance.voice = maleVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}

if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => { };
}

init();
