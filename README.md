
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