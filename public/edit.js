const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');

import UndoManager from './undo.js';
const undoManager = new UndoManager();

import { app, db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-ai.js";

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
let mode = 'navigate'; // 'navigate', 'edit-text', 'view-json', 'edit-narrative', 'ai-instruction'
let drawingStartNode = null;
let narrative = []; // Array of { utter, highlightedNodes, highlightedEdges }
let currentNarrativeIndex = -1; // For playback
let editingNarrativeIndex = -1; // For editing existing step
let hoveredEdgeId = null;
let selectedEdgeIds = []; // Multi-selection for edges
let selectedNodeIds = []; // Multi-selection for nodes
let selectedEdgeId = null; // Single edge selection (kept for backward compatibility/keyboard)
let isNodeSelected = true;
let diagramId = new Date().toISOString(); // Unique ID for this diagram
let lastEdited = Date.now(); // Timestamp of last edit
let createdAt = Date.now();
let isPublic = false;
let owner = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    owner = user.uid;
  }
});

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

  let endNode;
  if (selectedNodeIds.length === 1) {
    const node = nodes.find(n => n.id === selectedNodeIds[0]);
    if (node) endNode = node;
  }

  if (!endNode) {
    endNode = getOrCreateNode(cursor.x, cursor.y);
  }

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
  saveDiagramToFirestore();
}

function drawSelfLoop(node, isHighlighted, w, h, isDashed = false, isGhost = false, specialColor = null) {
  const gap = 100; // Reach halfway to next node
  const cx = node.centerX;
  const cy = node.centerY;
  const x = cx - w / 2;
  const y = cy - h / 2;

  let strokeColor = isHighlighted ? "#ff4444" : "#000000";
  if (specialColor) strokeColor = specialColor;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isHighlighted || specialColor ? 12 : 8;

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

  drawArrowhead({ x: x + w + 1, y: y_end }, { x: x + w, y: y_end }, isHighlighted, specialColor);

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
const narrationBanner = document.getElementById('narration-banner');
const aiModal = document.getElementById('ai-modal');
const aiInstructionArea = document.getElementById('ai-instruction');
const aiLoading = document.getElementById('ai-loading');

// Initialize
async function init() {
  // Check if we should load an existing diagram from firestore
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  if (idParam) {
    await loadDiagramFromFirestore(idParam);
  }

  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleInput);
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('dblclick', handleCanvasDblClick);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  handleResize();

  // Push initial state
  undoManager.push(getCurrentState());
}

function getSelectionGridBounds() {
  const activeEdgeIds = [...selectedEdgeIds];
  if (selectedEdgeId && !activeEdgeIds.includes(selectedEdgeId)) activeEdgeIds.push(selectedEdgeId);

  if (selectedNodeIds.length === 0 && activeEdgeIds.length === 0) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let found = false;

  const atomicNodes = new Set();
  function collect(id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    if (node.children) {
      node.children.forEach(collect);
    } else {
      atomicNodes.add(node);
    }
  }

  selectedNodeIds.forEach(collect);
  activeEdgeIds.forEach(edgeId => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      collect(edge.start);
      collect(edge.end);
    }
  });

  atomicNodes.forEach(n => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
    found = true;
  });

  return found ? { minX, maxX, minY, maxY } : null;
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

async function handleInput(e) {
  if (mode === 'navigate') {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

    if (isArrowKey) {
      if (e.altKey) {
        e.preventDefault();
        let nodesToMove = [];
        const atomicNodes = new Set();
        const collect = (id) => {
          const n = nodes.find(node => node.id === id);
          if (!n) return;
          if (n.children) n.children.forEach(collect);
          else atomicNodes.add(n);
        };

        if (selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(collect);
          nodesToMove = Array.from(atomicNodes);
        } else {
          const nodeAtCursor = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
          if (nodeAtCursor) {
            nodesToMove = [nodeAtCursor];
          }
        }

        if (nodesToMove.length > 0) {
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -1;
          if (e.key === 'ArrowDown') dy = 1;
          if (e.key === 'ArrowLeft') dx = -1;
          if (e.key === 'ArrowRight') dx = 1;

          if (dx !== 0 || dy !== 0) {
            let offset = 1;
            let possible = false;
            while (offset < 100) {
              let collision = false;
              for (const node of nodesToMove) {
                const nx = node.x + dx * offset;
                const ny = node.y + dy * offset;
                if (nx < 0 || ny < 0) {
                  collision = true;
                  break;
                }
                if (nodes.some(n => n.x === nx && n.y === ny && !nodesToMove.includes(n))) {
                  collision = true;
                  break;
                }
              }
              if (!collision) {
                possible = true;
                break;
              }
              offset++;
            }

            if (possible) {
              undoManager.push(getCurrentState());
              nodesToMove.forEach(node => {
                node.x += dx * offset;
                node.y += dy * offset;
              });
              cursor.x += dx * offset;
              cursor.y += dy * offset;
              updateView();
              saveDiagramToFirestore();
              render();
            }
          }
        }
        return;
      }

      const oldX = cursor.x;
      const oldY = cursor.y;
      const oldNode = nodes.find(n => n.x === oldX && n.y === oldY);

      const isMulti = e.metaKey || e.shiftKey;
      let jumped = false;

      if (!isMulti) {
        const bounds = getSelectionGridBounds();
        if (bounds) {
          const isGroup = selectedNodeIds.some(id => nodes.find(n => n.id === id)?.children);
          const isEdge = (selectedEdgeIds.length > 0 || selectedEdgeId !== null);
          const isMultiNode = selectedNodeIds.length > 1;

          if (isGroup || isEdge || isMultiNode) {
            if (e.key === 'ArrowUp') {
              cursor.y = bounds.minY;
              cursor.x = bounds.minX;
            } else if (e.key === 'ArrowDown') {
              cursor.y = bounds.maxY;
              cursor.x = bounds.minX;
            } else if (e.key === 'ArrowLeft') {
              cursor.x = bounds.minX;
              cursor.y = Math.round((bounds.minY + bounds.maxY) / 2);
            } else if (e.key === 'ArrowRight') {
              cursor.x = bounds.maxX;
              cursor.y = Math.round((bounds.minY + bounds.maxY) / 2);
            }
            jumped = true;
          }
        }
      }

      if (!jumped) {
        if (e.key === 'ArrowUp') cursor.y = Math.max(0, cursor.y - 1);
        if (e.key === 'ArrowDown') cursor.y = cursor.y + 1;
        if (e.key === 'ArrowLeft') cursor.x = Math.max(0, cursor.x - 1);
        if (e.key === 'ArrowRight') cursor.x = cursor.x + 1;
      }

      updateView();

      if (!isMulti) {
        selectedEdgeId = null;
        selectedEdgeIds = [];
        selectedNodeIds = [];
        isNodeSelected = true;
      } else {
        // Multi-selection: ensure current node is selected if starting
        if (oldNode && selectedNodeIds.length === 0) {
          selectedNodeIds.push(oldNode.id);
        }

        // Add destination node to selection
        const node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
        if (node && !selectedNodeIds.includes(node.id)) {
          selectedNodeIds.push(node.id);
        }

        // Add edge between old and new if it exists
        if (oldNode && node) {
          const edge = edges.find(e =>
            (e.start === oldNode.id && e.end === node.id) ||
            (e.start === node.id && e.end === oldNode.id)
          );
          if (edge && !selectedEdgeIds.includes(edge.id)) {
            selectedEdgeIds.push(edge.id);
          }
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (edges.length === 0) return;

      const sortedEdges = [...edges].sort((a, b) => {
        const as = getNodeCoords(a.start);
        const ae = getNodeCoords(a.end);
        const bs = getNodeCoords(b.start);
        const be = getNodeCoords(b.end);
        if (as.x !== bs.x) return as.x - bs.x;
        if (as.y !== bs.y) return as.y - bs.y;
        if (ae.x !== be.x) return ae.x - be.x;
        return ae.y - be.y;
      });

      let nextIndex = 0;
      if (!isNodeSelected && (selectedEdgeId || selectedEdgeIds.length > 0)) {
        const currentId = selectedEdgeId || (selectedEdgeIds.length > 0 ? selectedEdgeIds[0] : null);
        const currentIdx = sortedEdges.findIndex(e => e.id === currentId);
        nextIndex = (currentIdx + 1) % sortedEdges.length;
      } else {
        // From a node or potential node
        const currentNode = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
        const selectedGroup = (selectedNodeIds.length === 1) ? nodes.find(n => n.id === selectedNodeIds[0] && n.children) : null;

        const targetNodeId = selectedGroup ? selectedGroup.id : (currentNode ? currentNode.id : null);
        const targetX = selectedGroup ? getNodeCoords(selectedGroup.id).x : cursor.x;
        const targetY = selectedGroup ? getNodeCoords(selectedGroup.id).y : cursor.y;

        let found = false;
        if (targetNodeId) {
          const firstStart = sortedEdges.findIndex(e => e.start === targetNodeId);
          if (firstStart !== -1) {
            nextIndex = firstStart;
            found = true;
          } else {
            const firstEnd = sortedEdges.findIndex(e => e.end === targetNodeId);
            if (firstEnd !== -1) {
              nextIndex = firstEnd;
              found = true;
            }
          }
        }

        if (!found) {
          // Find the edge in the list closest to the node's x and y
          let minDistance = Infinity;
          sortedEdges.forEach((e, idx) => {
            const es = getNodeCoords(e.start);
            const dist = Math.sqrt(Math.pow(es.x - targetX, 2) + Math.pow(es.y - targetY, 2));
            if (dist < minDistance) {
              minDistance = dist;
              nextIndex = idx;
            }
          });
        }
      }

      const nextEdge = sortedEdges[nextIndex];
      selectedEdgeId = nextEdge.id;
      selectedEdgeIds = [nextEdge.id];
      selectedNodeIds = [];
      isNodeSelected = false;
      render();
    }

    if (e.key === 'Enter' && !e.metaKey) {
      e.preventDefault();
      if (selectedNodeIds.length > 1) {
        // Create nodeGroup as a special node
        let idNum = 0;
        while (nodes.some(node => node.id === `group-${idNum}`)) {
          idNum++;
        }
        nodes.push({ id: `group-${idNum}`, children: [...selectedNodeIds] });
        selectedNodeIds = []; // Clear selection after grouping
        saveDiagramToFirestore();
        render();
        return;
      }
      if (drawingStartNode) {
        finishArrowDrawing();
      }
      startEditing();
    }

    if (e.key === 'x') {
      e.preventDefault();
      showJson();
    }

    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      if (currentNarrativeIndex >= 0 && currentNarrativeIndex < narrative.length) {
        startNarrativeEditing(currentNarrativeIndex);
      } else {
        startNarrativeEditing();
      }
    }

    if (e.key === 'a') {
      if (drawingStartNode) {
        finishArrowDrawing();
      } else {
        if (selectedNodeIds.length === 1) {
          const potentialNode = nodes.find(n => n.id === selectedNodeIds[0]);
          if (potentialNode) {
            drawingStartNode = potentialNode;
          }
        }
        if (!drawingStartNode) {
          drawingStartNode = getOrCreateNode(cursor.x, cursor.y);
        }
      }
    }

    if (e.key === 'Backspace') {
      if (e.metaKey) {
        e.preventDefault();
        if (currentNarrativeIndex >= 0 && currentNarrativeIndex < narrative.length) {
          narrative.splice(currentNarrativeIndex, 1);
          if (currentNarrativeIndex >= narrative.length) {
            currentNarrativeIndex = narrative.length - 1;
          }
          updateNarrationBanner();
          saveDiagramToFirestore();
          render();
          if (currentNarrativeIndex >= 0 && currentNarrativeIndex < narrative.length) {
            speak(narrative[currentNarrativeIndex].utter);
          } else {
            speak("");
          }
          return;
        }
        if (confirm('Delete this diagram from cloud storage and start fresh?')) {
          await deleteDoc(doc(db, "diagrams", diagramId));
          window.location.reload();
        }
        return;
      }
      if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0 || selectedEdgeId) {
        const edgesToDelete = new Set(selectedEdgeIds);
        if (selectedEdgeId) edgesToDelete.add(selectedEdgeId);

        edges = edges.filter(e => !edgesToDelete.has(e.id));

        const nodesToDelete = new Set(selectedNodeIds);
        nodesToDelete.forEach(nodeId => {
          nodes = nodes.filter(n => n.id !== nodeId);
          edges = edges.filter(e => e.start !== nodeId && e.end !== nodeId);
          if (drawingStartNode && drawingStartNode.id === nodeId) drawingStartNode = null;
        });

        // Clean up children references in group nodes if a child was deleted
        nodes.forEach(n => {
          if (n.children) {
            n.children = n.children.filter(id => !nodesToDelete.has(id));
          }
        });
        // Remove group nodes that have 1 or 0 children
        nodes = nodes.filter(n => !n.children || n.children.length > 1);

        selectedNodeIds = [];
        selectedEdgeIds = [];
        selectedEdgeId = null;
        saveDiagramToFirestore();
      } else {
        const nodeIndex = nodes.findIndex(n => n.x === cursor.x && n.y === cursor.y);
        if (nodeIndex >= 0) {
          const nodeId = nodes[nodeIndex].id;
          nodes.splice(nodeIndex, 1);
          edges = edges.filter(edge => edge.start !== nodeId && edge.end !== nodeId);
          if (drawingStartNode && drawingStartNode.id === nodeId) {
            drawingStartNode = null;
          }
          // Clean up children references in group nodes if a child was deleted
          nodes.forEach(n => {
            if (n.children) {
              n.children = n.children.filter(id => id !== nodeId);
            }
          });
          // Remove group nodes that have 1 or 0 children
          nodes = nodes.filter(n => !n.children || n.children.length > 1);
          saveDiagramToFirestore();
        }
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      nextStep();
    }

    if (e.key === 'Escape') {
      if (currentNarrativeIndex >= 0) {
        currentNarrativeIndex = -1;
        updateNarrationBanner();
        speak("");
        render();
        return;
      }

      // Not in narrative steps
      if (isNodeSelected) {
        const nodeAtCursor = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
        if (nodeAtCursor) {
          const group = nodes.find(n => n.children && n.children.includes(nodeAtCursor.id));
          if (group) {
            selectedNodeIds = [group.id];
            isNodeSelected = false;
            render();
            return;
          }
        }
      }

      currentNarrativeIndex = -1;
      updateNarrationBanner();
      speak("");
      render();
    }

    if (e.key === 'v') {
      // Switch to index.html with current diagram ID
      if (diagramId) {
        window.location.href = `index.html?id=${diagramId}`;
      }
    }

    // Undo/Redo
    if (e.metaKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        const nextState = undoManager.redo();
        if (nextState) applyState(nextState);
      } else {
        const prevState = undoManager.undo();
        if (prevState) applyState(prevState);
      }
    }

    if (e.key === 'p') {
      e.preventDefault();
      isPublic = !isPublic;
      saveDiagramToFirestore();
      showStatus(`Diagram is now ${isPublic ? 'PUBLIC' : 'PRIVATE'}`);
      render();
    }

    if (e.key === 'd') {
      e.preventDefault();
      const activeEdgeIds = [...selectedEdgeIds];
      if (selectedEdgeId && !activeEdgeIds.includes(selectedEdgeId)) activeEdgeIds.push(selectedEdgeId);

      if (activeEdgeIds.length > 0) {
        undoManager.push(getCurrentState());
        edges.forEach(edge => {
          if (activeEdgeIds.includes(edge.id)) {
            edge.dashed = !edge.dashed;
          }
        });
        saveDiagramToFirestore();
        render();
      }
    }

    if (e.key === 'i') {
      e.preventDefault();
      startAiInstruction();
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
  } else if (mode === 'ai-instruction') {
    // Modal handles focus
  }
}

function handleCanvasClick(e) {
  if (mode !== 'navigate') return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const isMulti = e.metaKey || e.ctrlKey;

  const currentCursorNode = nodes.find(n => n.x === cursor.x && n.y === cursor.y);

  if (hoveredEdgeId) {
    if (isMulti) {
      if (selectedEdgeIds.length === 0 && selectedNodeIds.length === 0 && currentCursorNode) {
        selectedNodeIds.push(currentCursorNode.id);
      }
      if (selectedEdgeIds.includes(hoveredEdgeId)) {
        selectedEdgeIds = selectedEdgeIds.filter(id => id !== hoveredEdgeId);
      } else {
        selectedEdgeIds.push(hoveredEdgeId);
      }
    } else {
      selectedEdgeIds = [hoveredEdgeId];
      selectedNodeIds = [];
      selectedEdgeId = hoveredEdgeId;
      isNodeSelected = false;
    }
    render();
    return;
  }

  const coords = getGridCoords(mouseX, mouseY);
  const gridPoint = getGridPoint(mouseX, mouseY);

  // Helper map needed for group detection
  const nodeMap = buildNodeMap();

  // Check for group clicks (clicking border but not children)
  const groupNode = nodes.find(n => {
    if (!n.children) return false;
    const info = nodeMap[n.id];
    if (!info) return false;
    const dx = Math.abs(gridPoint.x - info.centerX);
    const dy = Math.abs(gridPoint.y - info.centerY);
    if (dx < info.width / 2 && dy < info.height / 2) {
      // It's inside the group. Now check if it's NOT inside any child.
      const insideChild = n.children.some(childId => {
        const cInfo = nodeMap[childId];
        if (!cInfo) return false;
        return Math.abs(gridPoint.x - cInfo.centerX) < cInfo.width / 2 &&
          Math.abs(gridPoint.y - cInfo.centerY) < cInfo.height / 2;
      });
      return !insideChild;
    }
    return false;
  });

  if (groupNode) {
    if (isMulti) {
      if (selectedNodeIds.includes(groupNode.id)) {
        selectedNodeIds = selectedNodeIds.filter(id => id !== groupNode.id);
      } else {
        selectedNodeIds.push(groupNode.id);
      }
    } else {
      selectedNodeIds = [groupNode.id];
      selectedEdgeIds = [];
      selectedEdgeId = null;
      isNodeSelected = false; // Requirement 1: hide cursor node when group selected
    }
    if (drawingStartNode) {
      finishArrowDrawing();
    }
    render();
    return;
  }

  if (coords.isOnNode && coords.x >= 0 && coords.y >= 0) {
    const node = nodes.find(n => n.x === coords.x && n.y === coords.y);

    if (isMulti && selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) {
      if (currentCursorNode && (!node || currentCursorNode.id !== node.id)) {
        selectedNodeIds.push(currentCursorNode.id);
      }
    }

    cursor.x = coords.x;
    cursor.y = coords.y;
    isNodeSelected = true;
    selectedEdgeId = null;

    if (isMulti) {
      if (node) {
        if (selectedNodeIds.includes(node.id)) {
          selectedNodeIds = selectedNodeIds.filter(id => id !== node.id);
        } else {
          selectedNodeIds.push(node.id);
        }
      }
    } else {
      selectedNodeIds = node ? [node.id] : [];
      selectedEdgeIds = [];
    }
    if (drawingStartNode) {
      finishArrowDrawing();
    }
    updateView();
    render();
  } else if (!isMulti) {
    // Clicked empty space
    selectedNodeIds = [];
    selectedEdgeIds = [];
    selectedEdgeId = null;
    isNodeSelected = true;
    render();
  }
}

function handleCanvasMouseMove(e) {
  if (mode !== 'navigate') return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const gridPoint = getGridPoint(mouseX, mouseY);
  const nodeMap = buildNodeMap();

  // Check if we are hovering over any node
  const isOverNode = Object.values(nodeMap).some(node => {
    return Math.abs(gridPoint.x - node.centerX) <= node.width / 2 &&
      Math.abs(gridPoint.y - node.centerY) <= node.height / 2;
  });

  if (isOverNode) {
    if (hoveredEdgeId !== null) {
      hoveredEdgeId = null;
      render();
    }
    return;
  }

  let closestEdgeId = null;
  let minDistance = 50; // Threshold for edge selection

  edges.forEach(edge => {
    const node1 = nodeMap[edge.start];
    const node2 = nodeMap[edge.end];
    if (!node1 || !node2) return;

    let dist;
    if (node1.id === node2.id) {
      // Self loop distance
      dist = getDistanceToSelfLoop(gridPoint, node1);
    } else {
      // Straight line distance - use intersection points to focus on the visible segment
      const startPt = getRectIntersection(node2.centerX, node2.centerY, node1.centerX, node1.centerY, node1.width, node1.height);
      const endPt = getRectIntersection(node1.centerX, node1.centerY, node2.centerX, node2.centerY, node2.width, node2.height);

      dist = getDistanceToSegment(gridPoint, startPt, endPt);
    }

    if (dist < minDistance) {
      minDistance = dist;
      closestEdgeId = edge.id;
    }
  });

  if (hoveredEdgeId !== closestEdgeId) {
    hoveredEdgeId = closestEdgeId;
    render();
  }
}

function getDistanceToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

function getDistanceToSelfLoop(p, node) {
  const cx = node.centerX;
  const cy = node.centerY;
  const w = node.width;
  const h = node.height;
  const gap = 100;

  const x = cx - w / 2;
  const y = cy - h / 2;
  const x_start = x + w * 0.75;
  const y_start = y;

  const points = [
    { x: x_start, y: y_start },
    { x: x_start, y: y_start - gap },
    { x: x + w + gap, y: y_start - gap },
    { x: x + w + gap, y: y + h * 0.25 },
    { x: x + w, y: y + h * 0.25 }
  ];

  let minD = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    minD = Math.min(minD, getDistanceToSegment(p, points[i], points[i + 1]));
  }
  return minD;
}

function getGridPoint(mouseX, mouseY) {
  const totalWidth = (3) * GRID_X + NODE_WIDTH + 100;
  const totalHeight = (3) * GRID_Y + NODE_HEIGHT + 100;
  const scale = Math.min(canvas.width / totalWidth, canvas.height / totalHeight, 1) * 0.9;
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  const gridCenterX = (viewX + 1.5) * GRID_X;
  const gridCenterY = (viewY + 1.5) * GRID_Y;

  return {
    x: (mouseX - canvasCenterX) / scale + gridCenterX,
    y: (mouseY - canvasCenterY) / scale + gridCenterY
  };
}

function handleCanvasDblClick(e) {
  if (mode !== 'navigate') return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const coords = getGridCoords(mouseX, mouseY);
  if (coords.isOnNode && coords.x >= 0 && coords.y >= 0) {
    cursor.x = coords.x;
    cursor.y = coords.y;
    updateView();
    if (drawingStartNode) {
      finishArrowDrawing();
    }
    startEditing();
    render();
  }
}

function getGridCoords(mouseX, mouseY) {
  const totalWidth = (3) * GRID_X + NODE_WIDTH + 100;
  const totalHeight = (3) * GRID_Y + NODE_HEIGHT + 100;
  const scale = Math.min(canvas.width / totalWidth, canvas.height / totalHeight, 1) * 0.9;
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  const gridCenterX = (viewX + 1.5) * GRID_X;
  const gridCenterY = (viewY + 1.5) * GRID_Y;

  const gridMouseX = (mouseX - canvasCenterX) / scale + gridCenterX;
  const gridMouseY = (mouseY - canvasCenterY) / scale + gridCenterY;

  const ix = Math.round(gridMouseX / GRID_X);
  const iy = Math.round(gridMouseY / GRID_Y);

  const isOnNode = Math.abs(gridMouseX - ix * GRID_X) < NODE_WIDTH / 2 &&
    Math.abs(gridMouseY - iy * GRID_Y) < NODE_HEIGHT / 2;

  return { x: ix, y: iy, isOnNode };
}

function updateView() {
  if (cursor.x < viewX) viewX = cursor.x;
  if (cursor.x > viewX + 3) viewX = cursor.x - 3;
  if (cursor.y < viewY) viewY = cursor.y;
  if (cursor.y > viewY + 3) viewY = cursor.y - 3;
}

// Text Area specific handling
nodeTextArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      saveNodeText();
    } else {
      // For Cmd+Enter, we want a newline. In a textarea, default behavior
      // for Cmd+Enter is often nothing or submit depending on OS/Browser.
      // Let's force a newline.
      e.preventDefault();
      const start = nodeTextArea.selectionStart;
      const end = nodeTextArea.selectionEnd;
      const value = nodeTextArea.value;
      nodeTextArea.value = value.substring(0, start) + "\n" + value.substring(end);
      nodeTextArea.selectionStart = nodeTextArea.selectionEnd = start + 1;
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelEditing();
  }
});

// Narrative Area specific handling
narrativeTextArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      saveNarrativeStep();
    } else {
      e.preventDefault();
      const start = narrativeTextArea.selectionStart;
      const end = narrativeTextArea.selectionEnd;
      const value = narrativeTextArea.value;
      narrativeTextArea.value = value.substring(0, start) + "\n" + value.substring(end);
      narrativeTextArea.selectionStart = narrativeTextArea.selectionEnd = start + 1;
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelNarrativeEditing();
  }
});

aiInstructionArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      generateDiagramFromAi();
    } else {
      e.preventDefault();
      const start = aiInstructionArea.selectionStart;
      const end = aiInstructionArea.selectionEnd;
      const value = aiInstructionArea.value;
      aiInstructionArea.value = value.substring(0, start) + "\n" + value.substring(end);
      aiInstructionArea.selectionStart = aiInstructionArea.selectionEnd = start + 1;
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelAiInstruction();
  }
});

function startEditing() {
  mode = 'edit-text';
  let node;
  if (selectedNodeIds.length === 1) {
    node = nodes.find(n => n.id === selectedNodeIds[0]);
  } else {
    node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
  }
  nodeTextArea.value = node ? node.text || "" : '';
  textModal.classList.add('active');
  nodeTextArea.focus();
}

async function saveNodeText() {
  const text = nodeTextArea.value.trim();
  let node;
  if (selectedNodeIds.length === 1) {
    node = nodes.find(n => n.id === selectedNodeIds[0]);
  } else {
    node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
  }

  if (text) {
    if (node) {
      node.text = text;
    } else {
      let idNum = 0;
      while (nodes.some(n => n.id === `node-${idNum}`)) {
        idNum++;
      }
      const id = `node-${idNum}`;
      nodes.push({ id, text, x: cursor.x, y: cursor.y });
    }
  } else {
    if (node) {
      if (node.children) {
        node.text = "";
      } else {
        nodes = nodes.filter(n => n.id !== node.id);
        edges = edges.filter(e => e.start !== node.id && e.end !== node.id);
        if (drawingStartNode && drawingStartNode.id === node.id) drawingStartNode = null;
        selectedNodeIds = selectedNodeIds.filter(id => id !== node.id);
      }
    }
  }

  await saveDiagramToFirestore();
  cancelEditing();
}

function cancelEditing() {
  mode = 'navigate';
  textModal.classList.remove('active');
  nodeTextArea.value = '';
  render();
}

function startNarrativeEditing(index = -1) {
  mode = 'edit-narrative';
  editingNarrativeIndex = index;
  if (index >= 0 && index < narrative.length) {
    narrativeTextArea.value = narrative[index].utter;
  } else {
    narrativeTextArea.value = '';
  }
  narrativeModal.classList.add('active');
  narrativeTextArea.focus();
}

async function saveNarrativeStep() {
  const text = narrativeTextArea.value.trim();
  if (text) {
    if (editingNarrativeIndex >= 0 && editingNarrativeIndex < narrative.length) {
      narrative[editingNarrativeIndex].utter = text;
      if (editingNarrativeIndex === currentNarrativeIndex) {
        speak(text);
      }
    } else {
      let highlightedNodes = [...selectedNodeIds];
      let highlightedEdges = [...selectedEdgeIds];

      // If nothing is selected, default to the node at the cursor if it exists
      if (highlightedNodes.length === 0 && highlightedEdges.length === 0) {
        const node = nodes.find(n => n.x === cursor.x && n.y === cursor.y);
        if (node) {
          highlightedNodes.push(node.id);
        }
      }

      narrative.push({
        utter: text,
        highlightedNodes: highlightedNodes,
        highlightedEdges: highlightedEdges
      });
    }
  }
  await saveDiagramToFirestore();
  cancelNarrativeEditing();
}

function cancelNarrativeEditing() {
  mode = 'navigate';
  editingNarrativeIndex = -1;
  narrativeModal.classList.remove('active');
  narrativeTextArea.value = '';
  render();
}

function startAiInstruction() {
  mode = 'ai-instruction';
  aiInstructionArea.value = '';
  aiModal.style.display = 'flex';
  aiInstructionArea.focus();
}

function cancelAiInstruction() {
  aiModal.style.display = 'none';
  mode = 'navigate';
}

async function generateDiagramFromAi() {
  const instruction = aiInstructionArea.value.trim();
  if (!instruction) return;

  aiLoading.style.display = 'block';
  aiInstructionArea.disabled = true;

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    const systemPrompt = `You are an expert at creating narrated diagrams. 
Generate a JSON object for a diagram based on the user's instruction.
The output MUST be ONLY valid JSON.

JSON Structure:
{
  "diagramId": "string",
  "nodes": [
    { "id": "node-0", "text": "...", "x": number, "y": number },
    { "id": "group-0", "children": ["node-0", ...] }
  ],
  "edges": [
    { "id": "edge-0", "start": "node-id", "end": "node-id", "dashed": boolean }
  ],
  "narrative": [
    { "utter": "...", "highlightedNodes": ["id", ...], "highlightedEdges": ["id", ...] }
  ]
}

- x and y are grid coordinates (0, 1, 2, ...). 
- highlightedNodes and highlightedEdges should use IDs defined in nodes and edges.
- Keep the node text short (leave the details to the narrative).
- If the node text is longer than 15 characters, add "\\n" to break the text into multiple lines.
- Design the narrative to be Q&A driven. Each step should answer the question from the previous step (if any) and then pose a new premise or question that leads to the next part of the diagram.

Example:
Instruction: "How to make a sandwich"
JSON:
{
  "diagramId": "sandwich-making",
  "nodes": [
    { "id": "bread", "text": "Bread", "x": 0, "y": 0 },
    { "id": "filling", "text": "Filling", "x": 1, "y": 0 },
    { "id": "sandwich", "text": "The Final\\nSandwich", "x": 1, "y": 1 }
  ],
  "edges": [
    { "id": "e1", "start": "bread", "end": "sandwich" },
    { "id": "e2", "start": "filling", "end": "sandwich" }
  ],
  "narrative": [
    { "utter": "To make a sandwich, what is the first ingredient you need?", "highlightedNodes": ["bread"] },
    { "utter": "You need bread. Once you have the bread, what do you put inside?", "highlightedNodes": ["filling"] },
    { "utter": "You add the filling. When you put the filling between the bread, what have you created?", "highlightedNodes": ["sandwich"], "highlightedEdges": ["e1", "e2"] },
    { "utter": "You've created a sandwich! Enjoy!", "highlightedNodes": ["sandwich"] }
  ]
}
`;

    const result = await model.generateContent(`${systemPrompt}\n\nInstruction: "${instruction}"\nJSON:`);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if AI includes it
    if (text.startsWith("```json")) {
      text = text.substring(7, text.lastIndexOf("```"));
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.lastIndexOf("```"));
    }

    const diagram = JSON.parse(text);

    // Update state
    undoManager.push(getCurrentState());

    nodes = diagram.nodes || [];
    edges = diagram.edges || [];
    narrative = diagram.narrative || [];
    diagramId = diagram.diagramId || `ai-gen-${Date.now()}`;
    lastEdited = Date.now();

    saveDiagramToFirestore();
    render();
    cancelAiInstruction();

  } catch (error) {
    console.error("AI Generation failed:", error);
    alert("Failed to generate diagram: " + error.message);
  } finally {
    aiLoading.style.display = 'none';
    aiInstructionArea.disabled = false;
  }
}

function showJson() {
  mode = 'view-json';
  const diagram = {
    diagramId: diagramId,
    lastEdited: lastEdited,
    nodes: nodes.map(n => {
      const node = { id: n.id };
      if (n.text !== undefined) node.text = n.text;
      if (n.x !== undefined) node.x = n.x;
      if (n.y !== undefined) node.y = n.y;
      if (n.children) node.children = n.children;
      return node;
    }),
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

function nextStep() {
  currentNarrativeIndex++;

  if (currentNarrativeIndex > narrative.length) {
    currentNarrativeIndex = -1;
    updateNarrationBanner();
    render();
    speak("");
    return;
  }

  updateNarrationBanner();
  render();

  if (currentNarrativeIndex < narrative.length) {
    const step = narrative[currentNarrativeIndex];
    speak(step.utter);
  } else {
    speak(""); // Neutral state
  }
}

function updateNarrationBanner() {
  if (currentNarrativeIndex >= 0 && currentNarrativeIndex < narrative.length) {
    narrationBanner.textContent = `${currentNarrativeIndex + 1} / ${narrative.length}`;
    narrationBanner.classList.add('active');
  } else {
    narrationBanner.classList.remove('active');
  }
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    if (!text) return;
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
  const nodeMap = buildNodeMap();

  // Determine narrative highlight
  let narrativeStep = null;
  if (currentNarrativeIndex >= 0 && currentNarrativeIndex < narrative.length) {
    narrativeStep = narrative[currentNarrativeIndex];
  }

  // Draw Node Groups
  nodes.filter(n => n.children).forEach(group => {
    let isSelected = selectedNodeIds.includes(group.id);
    let isHighlighted = false;
    if (narrativeStep && narrativeStep.highlightedNodes && narrativeStep.highlightedNodes.includes(group.id)) {
      isHighlighted = true;
    }
    drawNodeGroup(group, nodeMap, isSelected, isHighlighted);
  });

  // Draw Edges
  edges.forEach(edge => {
    const startNode = nodeMap[edge.start];
    const endNode = nodeMap[edge.end];
    if (startNode && endNode) {
      let isHighlighted = false;
      if (narrativeStep && narrativeStep.highlightedEdges && narrativeStep.highlightedEdges.includes(edge.id)) {
        isHighlighted = true;
      }

      let specialColor = null;
      if (selectedEdgeIds.includes(edge.id) || edge.id === selectedEdgeId) {
        specialColor = "#0000ff"; // Blue for selected
      } else if (edge.id === hoveredEdgeId) {
        specialColor = "#ffaa00"; // Orange for hover
      }

      drawEdge(startNode, endNode, isHighlighted, !!edge.dashed, false, specialColor);
    }
  });

  // Ghost Arrow
  if (drawingStartNode) {
    const startNode = nodeMap[drawingStartNode.id];
    // Target is cursor or selected node
    let targetX, targetY, targetW, targetH, targetId;

    if (selectedNodeIds.length === 1 && selectedNodeIds[0] !== drawingStartNode.id) {
      const endInfo = nodeMap[selectedNodeIds[0]];
      targetX = endInfo.centerX;
      targetY = endInfo.centerY;
      targetW = endInfo.width;
      targetH = endInfo.height;
      targetId = selectedNodeIds[0];
    } else {
      targetX = cursor.x * GRID_X;
      targetY = cursor.y * GRID_Y;
      targetW = NODE_WIDTH;
      targetH = NODE_HEIGHT;
      targetId = 'temp';
    }

    // Fake end node for geometry calculation
    const endNode = { id: targetId, centerX: targetX, centerY: targetY, width: targetW, height: targetH };

    drawEdge(startNode, endNode, false, false, true);
  }

  // Draw Grid/Nodes
  for (let x = viewX; x < viewX + 4; x++) {
    for (let y = viewY; y < viewY + 4; y++) {
      const centerX = x * GRID_X;
      const centerY = y * GRID_Y;

      const node = nodes.find(n => n.x === x && n.y === y);
      const isCursor = isNodeSelected && (x === cursor.x && y === cursor.y);

      if (node) {
        let isHighlighted = false;
        if (narrativeStep && narrativeStep.highlightedNodes && narrativeStep.highlightedNodes.includes(node.id)) {
          isHighlighted = true;
        }
        let isSelected = selectedNodeIds.includes(node.id);
        drawNode(node, centerX, centerY, isCursor, isHighlighted, isSelected);
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

function drawNode(node, cx, cy, isCursor, isHighlighted, isSelected) {
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.fillStyle = "#fff4e0"; // Light tan
  ctx.fillRect(x, y, w, h);

  if (isSelected) {
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 12;
    ctx.strokeRect(x, y, w, h);
  } else if (isCursor) {
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  ctx.fillStyle = isHighlighted ? "#ff0000" : "#000000";
  ctx.font = `bold ${FONT_SIZE}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = (node.text || "").split('\n');
  if (lines.length > 1) {
    const lineHeight = FONT_SIZE * 1.2;
    const totalHeight = lineHeight * lines.length;
    const startY = cy - (totalHeight / 2) + (lineHeight / 2);

    lines.forEach((line, i) => {
      ctx.fillText(line, cx, startY + (i * lineHeight));
    });
  } else if (node.text) {
    ctx.fillText(node.text, cx, cy);
  }
}


function getNodeCoords(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };
  if (node.x !== undefined && node.y !== undefined) return { x: node.x, y: node.y };
  if (node.children && node.children.length > 0) {
    let sx = 0, sy = 0;
    node.children.forEach(cid => {
      const c = getNodeCoords(cid);
      sx += c.x; sy += c.y;
    });
    return { x: sx / node.children.length, y: sy / node.children.length };
  }
  return { x: 0, y: 0 };
}

function buildNodeMap() {
  const nodeMap = {};
  // First pass: atomic nodes
  nodes.filter(n => !n.children).forEach(n => {
    nodeMap[n.id] = {
      ...n,
      centerX: n.x * GRID_X,
      centerY: n.y * GRID_Y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    };
  });

  // Second pass: group nodes (loop to handle possible nesting, though we added only 1 level for now)
  let changed = true;
  while (changed) {
    changed = false;
    nodes.filter(n => n.children).forEach(n => {
      if (nodeMap[n.id]) return;
      const children = n.children.map(id => nodeMap[id]).filter(Boolean);
      if (children.length === n.children.length) {
        // Calculate bounding box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        children.forEach(c => {
          minX = Math.min(minX, c.centerX - c.width / 2);
          maxX = Math.max(maxX, c.centerX + c.width / 2);
          minY = Math.min(minY, c.centerY - c.height / 2);
          maxY = Math.max(maxY, c.centerY + c.height / 2);
        });
        const padding = 40;
        nodeMap[n.id] = {
          ...n,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
          width: (maxX - minX) + 2 * padding,
          height: (maxY - minY) + 2 * padding
        };
        changed = true;
      }
    });
  }
  return nodeMap;
}

function drawNodeGroup(group, nodeMap, isSelected, isHighlighted) {
  const info = nodeMap[group.id];
  if (!info) return;

  const x = info.centerX - info.width / 2;
  const y = info.centerY - info.height / 2;
  const w = info.width;
  const h = info.height;

  ctx.strokeStyle = isSelected ? "#0000ff" : (isHighlighted ? "#ff0000" : "#000000");
  ctx.lineWidth = isSelected || isHighlighted ? 8 : 4;
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

// Helper functions for Arrow Drawing
function drawEdge(startNode, endNode, isHighlighted, isDashed = false, isGhost = false, specialColor = null) {
  if (startNode.id === endNode.id) {
    drawSelfLoop(startNode, isHighlighted, NODE_WIDTH, NODE_HEIGHT, isDashed, isGhost, specialColor);
    return;
  }

  const startPt = getRectIntersection(endNode.centerX, endNode.centerY, startNode.centerX, startNode.centerY, startNode.width, startNode.height);
  const endPt = getRectIntersection(startNode.centerX, startNode.centerY, endNode.centerX, endNode.centerY, endNode.width, endNode.height);

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

  let strokeColor = isHighlighted ? "#ff4444" : "#000000";
  if (specialColor) strokeColor = specialColor;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isHighlighted || specialColor ? 12 : 8;

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
  ctx.moveTo(startPt.x, startPt.y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrowhead(startPt, endPt, isHighlighted, specialColor);

  if (isGhost) {
    ctx.restore();
  }
}

function drawArrowhead(fromPt, toPt, isHighlighted, specialColor = null) {
  const headLength = 40;
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const angle = Math.atan2(dy, dx);

  let fillColor = isHighlighted ? "#ff4444" : "#000000";
  if (specialColor) fillColor = specialColor;

  ctx.fillStyle = fillColor;

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

async function loadDiagramFromFirestore(id) {
  try {
    const docRef = doc(db, "diagrams", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let diagramData;

      // Handle new format: { diagram: { ... }, info: { ... } }
      if (data.diagram && data.info) {
        diagramData = data.diagram;
        diagramId = data.info.id || id;
        lastEdited = data.info.lastEdited || Date.now();
        createdAt = data.info.createdAt || Date.now();
        isPublic = data.info.isPublic || false;
        owner = data.info.owner || null;
      } else {
        // Fallback for old format
        diagramData = data;
        diagramId = data.diagramId || id;
        lastEdited = data.lastEdited || Date.now();
        createdAt = lastEdited;
        isPublic = false;
        owner = null;
      }

      if (diagramData.nodes) {
        nodes = diagramData.nodes;
      }
      if (diagramData.edges) {
        edges = diagramData.edges;
      }
      if (diagramData.narrative) {
        narrative = diagramData.narrative;
      }

      // Initialize undo stack with the loaded state
      undoManager.push(getCurrentState());
      render();
    }
  } catch (e) {
    console.error('Failed to load diagram from Firestore:', e);
  }
}

async function saveDiagramToFirestore() {
  // Don't save empty diagrams
  if (nodes.length === 0 && edges.length === 0 && narrative.length === 0) {
    return;
  }

  const state = getCurrentState();
  undoManager.push(state);

  lastEdited = Date.now();

  const project = {
    diagram: {
      nodes: nodes.map(n => {
        const node = { id: n.id };
        if (n.text !== undefined) node.text = n.text;
        if (n.x !== undefined) node.x = n.x;
        if (n.y !== undefined) node.y = n.y;
        if (n.children) node.children = n.children;
        return node;
      }),
      edges: edges,
      narrative: narrative
    },
    info: {
      id: diagramId,
      owner: auth.currentUser ? auth.currentUser.uid : owner,
      lastEdited: lastEdited,
      createdAt: createdAt,
      isPublic: isPublic
    }
  };

  try {
    await setDoc(doc(db, "diagrams", diagramId), project);
  } catch (e) {
    console.error("Error saving to Firestore:", e);
  }
}

function getCurrentState() {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    narrative: JSON.parse(JSON.stringify(narrative)),
    cursor: { ...cursor },
    viewX,
    viewY,
    selectedNodeIds: [...selectedNodeIds],
    selectedEdgeIds: [...selectedEdgeIds],
    selectedEdgeId,
    isNodeSelected
  };
}

async function applyState(state) {
  nodes = state.nodes;
  edges = state.edges;
  narrative = state.narrative;
  cursor = state.cursor;
  viewX = state.viewX;
  viewY = state.viewY;
  selectedNodeIds = state.selectedNodeIds;
  selectedEdgeIds = state.selectedEdgeIds;
  selectedEdgeId = state.selectedEdgeId;
  isNodeSelected = state.isNodeSelected;

  // Save to Firestore without pushing to undo stack again
  lastEdited = Date.now();
  const project = {
    diagram: {
      nodes: nodes,
      edges: edges,
      narrative: narrative
    },
    info: {
      id: diagramId,
      owner: auth.currentUser ? auth.currentUser.uid : owner,
      lastEdited: lastEdited,
      createdAt: createdAt,
      isPublic: isPublic
    }
  };
  try {
    await setDoc(doc(db, "diagrams", diagramId), project);
  } catch (e) {
    console.error("Error saving to Firestore (undo/redo):", e);
  }
  render();
}

init();

function showStatus(text) {
  const banner = document.getElementById('status-banner');
  if (!banner) return;
  banner.textContent = text;
  banner.classList.add('active');
  setTimeout(() => {
    banner.classList.remove('active');
  }, 3000);
}
