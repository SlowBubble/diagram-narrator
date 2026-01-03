# wishlist
- Save edit.html to offline storage, and then show them first in index.html
- Design data structure for node group
- select multiple nodes/edges for dialog


# m2m
- Support selecting multiple nodes/edges via the keyboard in edit.html
  - When you press 'shift' while pressing arrow keys, then add the destination node to the selection.

# m2l
- In edit.html
    - Support nodeGroups in the data structure:
    ```
    {
        nodeGroups: {
            nodes: ['node-0', 'node-1']
        }, 
        nodes: [...]
    }
    ```
    - When multiple nodes are selected, and `enter` is pressed, then create a nodeGroup with those nodes.
- Support rendering nodeGroups in index.html and edit.html
  - Just draw a rectangle around the nodes in the nodeGroups with dashed lines.

# m2k (X)
- Support selecting multiple nodes/edges via the mouse in edit.html
  - When you click on a node/edge while holding cmd, then add it to the selection.
- When multiple things are selected while you press `cmd+enter` to create a dialog, you should add all those things to the dialog's highlighted nodes/edges when creating the dialog.

# m2j
- support selecting an edge in edit.html
  - When the mouse is hovering near it, highlight it orange..
  - When the mouse click while hovering near the edge, select it.
  - Highlight the edge in blue when it is selected.
- When an edge is selected, and you press backspace, delete the edge.
- Move to a nearby node if the edge is deleted.

# m2i
- Add mouse support for edit.html
  - Clicking on a node will select it.
  - Double clicking on a node is equivalent to pressing enter on the node.

# m2h
- implement playing out the diaglog in edit.html, similar to index.html, by pressing space.
  - When pressing esc (not in text modal), then you go to the zero step (the start of narration)
# m2g
- For edit.html, allow more nodes than 4x4 if the cursor move beyond the grid
  - Just render 4x4 at any time but show a window that includes the cursor's node.

# m2f
- To make things more intuitive, let's allow an edge to itself for both edit.html and index.html
  - It will just loop in a rectangular manner from north, east, south, west back into the node
# m2e
- Current behavior
  - When I press `a`, start drawing an arrow from the current node.
  - When I press `a` again, end the arrow.
- Want
  - Also allow `enter` after `a` is pressed to end the arrow and then open the text modal for editing text.

# m2d
- Support narrative
  - When I press `cmd+enter` (while not in a text modal), it should open a text modal to add narrative text.
  - When I press enter in the text modal, it should add a new narrative step using the node as the highlighted node.

# m2c
- Support deleting nodes
  - If I press backspace on a node, delete it and remove all edges that start or end at it.

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
    - Press cmd+enter to create new line in the text.
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