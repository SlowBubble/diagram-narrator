# m2c
- 
# m2b
- Support drawing arrows
  - When I press `a`, start drawing an arrow from the current node.
  - When I press `a` again, end the arrow.
  - Show the arrow as I move the cursor in 0.5 opacity (unless start and end is the same node).
  - If the arrow starts or ends at a non-existent node, just create a node with no text.

# m2a

- Start with edit.html and edit.js
- Goal: build an editor to create a diagram similar to those in diagrams.js.
- Have a canvas for the entire window.
  - Show a grid of nodes (start with 4x4).
  - Have a cursor select which node you are on.
  - arrow keys to move the cursor.
  - Press enter to open a text modal to edit the node text.
    - Press enter in the text modal to create the node with the text.
    - Press shift+enter or cmd+enter to create new line in the text.
    - Press escape to cancel the text modal.
  - Press x will open a text modal showing the diagram in JSON format (pretty, 2 space indent).

# m1c
- Do a final pass to scale the diagram so everything fit in the screen.

# m1b

Separate out diagrams into a single file to import.

# m1a
- Start with index.html and main.js
- Start with the diagrams JS data below.
- Implement a renderer for the static diagram (ignoring the narrative).
  - The nodes don't need any border by default. Use a uniform size for all nodes.
  - The edges will be arrows from start to end.
- When the user press space, move to the next narrative step.
  - The highlighted things should be in red
  - Utter via the speech api. (Use a male voice).
- When done with the narrative, move to the next diagram.
  - When done with all the diagrams, Just render "Game Over" and utter "Game time is over. Go take a break."

JS Data:
diagrams = [
    {
    nodes: [
        {
            id: "0",
            text: "Learn",
            x: 0,
            y: 0,
        },
        {
            id: "1",
            text: "Struggle",
            x: 0,
            y: 1,
        },
        {
            id: "2",
            text: "Challenge",
            x: 1,
            y: 1,
        },
    ],
    edges: [
        {
            id: "0",
            start: "1",
            end: "0",
        },
        {
            id: "1",
            start: "2",
            end: "1",
        },
    ],
    narrative: [
        {
            utter: "To learn",
            highlightedNodes: ["0"],
        },
        {
            utter: "You have to struggle",
            highlightedNodes: ["0", "1"],
            highlightedEdges: ["0"],
        },
        {
            utter: "To struggle",
            highlightedNodes: ["1"],
        },
        {
            utter: "You have to find a suitable challenge",
            highlightedNodes: ["2", "1"],
            highlightedEdges: ["1"],
        }
    ],
    }
]