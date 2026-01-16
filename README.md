# wishlist

# m5c
- Storage format: let's call the unit of storage a "project", which has 2 fields
  - diagram: the diagram JSON
  - info: the metadata, including the id, owner (user id), lastEdited, createdAt, isPublic
- Modify the app logic to use this format.
  - Add a shortcut in edit (`p`) to toggle the project's public status.
  - Only show public projects in index.html.

# m5b
- Use GoogleAuthProvider to sign in
  - In the storage.html, if not sign in, add a sign in at the top (instead of "New Diagram"). If sign in, then show "New Diagram".
# m5a
Move away from local storage and use firestore.
0: move the relevant files to public folder
1: Start with setup (I have run `npm install firebase` already). Here is the setup instruction:
```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAG4cgpGXTDFdKxCwxpEiIm0xsjKDdy3I",
  authDomain: "diagram-flow.firebaseapp.com",
  projectId: "diagram-flow",
  storageBucket: "diagram-flow.firebasestorage.app",
  messagingSenderId: "701657640541",
  appId: "1:701657640541:web:fa9d373423f009c60627b4",
  measurementId: "G-RJZ7XPTE4Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

2: Use firestore.

# m4c
- Support editing the dialog.
  - When the user press space to play the dialog, then he can press `cmd+enter` to edit the current dialog step, or press `cmd+backspace` to delete the current dialog step (instead of deleting the diagram).

# m4b
- Support entering text for nodes that has children, when you press enter on a node that has children, it should open a text modal to enter the text.
  - Render it as text at the upper border of the node, centered.
  - The text needs to have white shading to make it look like it's floating above the border.

# m4a
- For index.html, create a query param canto=1
  - When this is set, then only show the canto diagrams, and use a cantonese voice for utterance.
  - Create cantoDiagrams.js which translates all the diagrams.js into cantonese text and cantonese dialogs.

# m3j
- Add a storage.html page that allows you to view the diagrams in firestore in a table along with the last edited date, sorted by most recent.
  - Add a link to take me to the edit.html page.

# m3i (DONE)
- alt+arrow move a node to another node if that spot is not occupied, otherwise keep going in the same direction until it is.

# m3h
- Let's color a node without children with light tan.

# m3g
- `Tab` should just cycle through the edges
  - Start with the list of edges ordered by the start edge's x and y and the end edge's x and y.
  - From an edge, go to the next edge in the list
  - From a node, go to
    - the first edge that starts at that node if available
    - the first edge that ends at that node if available
    - the next edge in the list closest to the node's x and y.

# m3f
- When pressing `esc` not in text modal or in narrative steps, when a node is selected and is contained in a node group, move the cursor to the node group.
  - Currently, this should be unique, so let's not worry about the case where a node is in multiple node groups.

# m3e
- When I select a node group (without cmd), the original node should not be selected.
  - When navigating with the arrow keys from a node group, just treat it as a giant node, so move to the nodes outside of this giant node.
- When an edge is selected, and I move away from it using an arrow, treat it as a giant node and move to the nodes outside of this giant node.

# m3d
- Add undo.js and support `cmd+z` to undo the last action in edit.html, and `cmd+shift+z` to redo an undone action.

# m3c
- When `a` is pressed, i.e. in edge drawing mode, if I mouse click on a node, then finish drawing the edge with that node as the end node.

# m3b
- In index.html, when iterating through diagrams, use id=diagramId instead of diagram= 
- And in edit.html, allow accessing an existing diagram via id=diagramId also.

# m3a
- Automatically save the JSON in firestore whenever you make a change to the diagram, and update lastEdited using the diagramId as the key. But don't save the empty diagram; only save when something is added to it.
  - `cmd+backspace` will delete the current diagram (add a confirm prompt), and then refresh edit.html to a new diagram
- In index.html, first load all the diagrams (sorted by most to least recent lastEdited field)
  - After that append the existing diagrams in diagrams.js.

# m2n

- edit.html: Change the nodeGroups data structure to just be part of nodes
```
{
    nodes: [
        {
            id: 'node-0',
            'children': ['node-1', 'node-2'],
        }
    ]
}
```
- This allows connecting edges to not just a node but a node group (i.e. a node with a children field)
  - The edge should go to the border of the node group instead of the children node.
- Allow selecting a node group if you click inside th rectangular border but not inside any of the children node.
  - Then, using `a` as before will create an edge to/from the node group.
- Support rendering nodeGroups with this new data structure and edges among them in edit.html and index.html

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