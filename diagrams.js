export const diagrams = [
  {
    diagramId: "learn-struggle-challenge",
    nodes: [
      { id: "0", text: "Learn", x: 0, y: 0 },
      { id: "1", text: "Struggle", x: 0, y: 1 },
      { id: "2", text: "Challenge", x: 1, y: 1 },
    ],
    edges: [
      { id: "0", start: "1", end: "0" },
      { id: "1", start: "2", end: "1" },
    ],
    narrative: [
      { utter: "To learn, what do you need to do?", highlightedNodes: ["0"] },
      { utter: "You have to struggle", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To struggle, what do you need to do?", highlightedNodes: ["1"] },
      { utter: "You have to find a good challenge that is not too easy, but not too hard either.", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] }
    ],
  },
  {
    diagramId: "rent-earn-learn",
    nodes: [
      { id: "0", text: "Rent", x: 0, y: 0 },
      { id: "1", text: "Earn", x: 0, y: 1 },
      { id: "2", text: "Learn", x: 1, y: 1 },
    ],
    edges: [
      { id: "0", start: "1", end: "0" },
      { id: "1", start: "2", end: "1" },
    ],
    narrative: [
      { utter: "To rent your own place, what do you need to do?", highlightedNodes: ["0"] },
      { utter: "You have to earn money", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To earn money, what do you need to do?", highlightedNodes: ["1"] },
      { utter: "You have to learn valuable skills", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] }
    ],
  },
  {
    diagramId: "school-progression",
    nodes: [
      { id: "0", text: "High\nSchool", x: 0, y: 0 },
      { id: "1", text: "Upper\nSchool", x: 1, y: 0 },
      { id: "2", text: "Elementary\nSchool", x: 1, y: 1 },
      { id: "3", text: "Preschool", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "1", end: "0" },
      { id: "1", start: "2", end: "1" },
      { id: "2", start: "3", end: "2" },
    ],
    narrative: [
      { utter: "To go to high school, what do you need to do?", highlightedNodes: ["0"] },
      { utter: "You have to finish upper school", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To go to upper school, what do you need to do?", highlightedNodes: ["1"] },
      { utter: "You have to finish elementary school", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] },
      { utter: "To go to elementary school, what do you need to do?", highlightedNodes: ["2"] },
      { utter: "You have to finish preschool", highlightedNodes: ["3", "2"], highlightedEdges: ["2"] },
    ],
  },
  {
    diagramId: "red-line-stops",
    nodes: [
      { id: "0", text: "Porter", x: 0, y: 0 },
      { id: "1", text: "Harvard", x: 0, y: 1 },
      { id: "2", text: "Central", x: 1, y: 2 },
      { id: "3", text: "Kendall", x: 2, y: 2 },
    ],
    edges: [
      { id: "0", start: "0", end: "1" },
      { id: "1", start: "1", end: "2" },
      { id: "2", start: "2", end: "3" },
    ],
    narrative: [
      { utter: "Next stop", highlightedNodes: ["0"] },
      { utter: "Porter Square. Doors open on your left.", highlightedNodes: ["0"] },
      { utter: "Next stop", highlightedEdges: ["0"] },
      { utter: "Harvard Square. Doors open on your right.", highlightedNodes: ["1"], highlightedEdges: ["0"] },
      { utter: "Next stop", highlightedEdges: ["1"] },
      { utter: "Central Square. Doors open on your right.", highlightedNodes: ["2"], highlightedEdges: ["1"] },
      { utter: "Next stop", highlightedEdges: ["2"] },
      { utter: "Kendall Square. Doors open on your right.", highlightedNodes: ["3"], highlightedEdges: ["2"] },
    ],
  },
  {
    diagramId: "big-problem-breakdown",
    nodes: [
      { id: "0", text: "Big problem", x: 0, y: 0 },
      { id: "1", text: "Break it down", x: 1, y: 0 },
      { id: "2", text: "Solve each part", x: 1, y: 1 },
      { id: "3", text: "Combine", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "1", end: "0" },
      { id: "1", start: "2", end: "1" },
      { id: "2", start: "3", end: "2" },
      { id: "3", start: "3", end: "0", dashed: true },
    ],
    narrative: [
      { utter: "To solve a big problem, what do you need to do?", highlightedNodes: ["0"], highlightedEdges: ["0"] },
      { utter: "You have to break it down into smaller parts", highlightedNodes: ["1"], highlightedEdges: ["0"] },
      { utter: "After you have broken it into smaller parts, what do you need to do?", highlightedNodes: ["1"], highlightedEdges: ["1"] },
      { utter: "You have to solve each part", highlightedNodes: ["2"], highlightedEdges: ["1"] },
      { utter: "After you have solved each part, what do you need to do?", highlightedNodes: ["2"], highlightedEdges: ["2"] },
      { utter: "You have to combine the solutions together", highlightedNodes: ["3"], highlightedEdges: ["2"] },
      { utter: "What happen when you combine the solutions together?", highlightedNodes: ["3"], highlightedEdges: ["3"] },
      { utter: "My friend, you would have solved the big problem.", highlightedNodes: ["0"] },
    ],
  },
  {
    diagramId: "run-crash-cry-learn",
    nodes: [
      { id: "0", text: "Run", x: 0, y: 0 },
      { id: "1", text: "Crash", x: 0, y: 1 },
      { id: "2", text: "Cry", x: 1, y: 1 },
      { id: "3", text: "Learn", x: 1, y: 0 },
    ],
    edges: [
      { id: "0", start: "0", end: "1" },
      { id: "1", start: "1", end: "2" },
      { id: "2", start: "2", end: "3" },
    ],
    narrative: [
      { utter: "If you run in the building, what would happen?", highlightedNodes: ["0"] },
      { utter: "You may crash into someone", highlightedNodes: ["1"], highlightedEdges: ["0"] },
      { utter: "If you crash, what would happen?", highlightedNodes: ["1"] },
      { utter: "You will cry.", highlightedNodes: ["2"], highlightedEdges: ["1"] },
      { utter: "What happens after you cry?", highlightedNodes: ["2"], highlightedEdges: ["2"] },
      { utter: "You will learn from your mistake and stop running in the building.", highlightedNodes: ["3"], highlightedEdges: ["2"] },
    ],
  },
  {
    diagramId: "grade-scale",
    nodes: [
      { id: "n1", text: "90-100%", x: 0, y: 0 },
      { id: "g1", text: "A", x: 1, y: 0 },
      { id: "n2", text: "80-90%", x: 0, y: 1 },
      { id: "g2", text: "B", x: 1, y: 1 },
      { id: "n3", text: "70-80%", x: 0, y: 2 },
      { id: "g3", text: "C", x: 1, y: 2 },
      { id: "n4", text: "60-70%", x: 0, y: 3 },
      { id: "g4", text: "D", x: 1, y: 3 },
      { id: "n5", text: "0-60%", x: 0, y: 4 },
      { id: "g5", text: "F", x: 1, y: 4 },
    ],
    edges: [
      { id: "0", start: "n1", end: "g1" },
      { id: "1", start: "n2", end: "g2" },
      { id: "2", start: "n3", end: "g3" },
      { id: "3", start: "n4", end: "g4" },
      { id: "4", start: "n5", end: "g5" },
    ],
    narrative: [
      { utter: "If you score in the 90% range on your test, what grade will you get?", highlightedNodes: ["n1"] },
      { utter: "You will get an A", highlightedNodes: ["g1"], highlightedEdges: ["0"] },
      { utter: "If you score in the 80% range on your test, what grade will you get?", highlightedNodes: ["n2"] },
      { utter: "You will get a B", highlightedNodes: ["g2"], highlightedEdges: ["1"] },
      { utter: "If you score in the 70% range on your test, what grade will you get?", highlightedNodes: ["n3"] },
      { utter: "You will get a C", highlightedNodes: ["g3"], highlightedEdges: ["2"] },
      { utter: "If you score in the 60% range on your test, what grade will you get?", highlightedNodes: ["n4"] },
      { utter: "You will get a D", highlightedNodes: ["g4"], highlightedEdges: ["3"] },
      { utter: "If you score below 60% on your test, what grade will you get?", highlightedNodes: ["n5"] },
      { utter: "You will get an F", highlightedNodes: ["g5"], highlightedEdges: ["4"] },
    ],
  },
  {
    diagramId: "clock-hours",
    nodes: [
      { id: "c", text: "Hour", x: 1, y: 1 },
      { id: "0", text: "12", x: 1, y: 0 },
      { id: "15", text: "3", x: 2, y: 1 },
      { id: "30", text: "6", x: 1, y: 2 },
      { id: "45", text: "9", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "c", end: "0" },
      { id: "15", start: "c", end: "15" },
      { id: "30", start: "c", end: "30" },
      { id: "45", start: "c", end: "45" },
    ],
    narrative: [
      { utter: "Let's learn the hours on the clock face", highlightedNodes: ["c"] },
      { utter: "When the hour hand points up, what time is it?", highlightedEdges: ["0"] },
      { utter: "it is 12 o'clock", highlightedEdges: ["0"], highlightedNodes: ["0"] },
      { utter: "When the hour hand points right, what time is it?", highlightedEdges: ["15"] },
      { utter: "it is 3 o'clock", highlightedEdges: ["15"], highlightedNodes: ["15"] },
      { utter: "When the hour hand points down, what time is it?", highlightedEdges: ["30"] },
      { utter: "it is 6 o'clock", highlightedEdges: ["30"], highlightedNodes: ["30"] },
      { utter: "When the hour hand points left, what time is it?", highlightedEdges: ["45"] },
      { utter: "it is 9 o'clock", highlightedEdges: ["45"], highlightedNodes: ["45"] },
      { utter: "When the hour hand points up, what time is it?", highlightedEdges: ["0"] },
      { utter: "we are back to 12 o'clock", highlightedEdges: ["0"], highlightedNodes: ["0"] },
    ],
  },
  {
    diagramId: "clock-minutes",
    nodes: [
      { id: "c", text: "Minutes", x: 1, y: 1 },
      { id: "0", text: "0", x: 1, y: 0 },
      { id: "15", text: "15", x: 2, y: 1 },
      { id: "30", text: "30", x: 1, y: 2 },
      { id: "45", text: "45", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "c", end: "0" },
      { id: "15", start: "c", end: "15" },
      { id: "30", start: "c", end: "30" },
      { id: "45", start: "c", end: "45" },
    ],
    narrative: [
      { utter: "Let's learn the minute on the clock face", highlightedNodes: ["c"] },
      { utter: "When the minute hand points up, how many minutes into the hour is it?", highlightedEdges: ["0"] },
      { utter: "it is 0 minutes into the hour", highlightedEdges: ["0"], highlightedNodes: ["0"] },
      { utter: "When the minute hand points right, how many minutes into the hour is it?", highlightedEdges: ["15"] },
      { utter: "it is 15 minutes into the hour", highlightedEdges: ["15"], highlightedNodes: ["15"] },
      { utter: "When the minute hand points down, how many minutes into the hour is it?", highlightedEdges: ["30"] },
      { utter: "it is 30 minutes into the hour", highlightedEdges: ["30"], highlightedNodes: ["30"] },
      { utter: "When the minute hand points left, how many minutes into the hour is it?", highlightedEdges: ["45"] },
      { utter: "it is 45 minutes into the hour", highlightedEdges: ["45"], highlightedNodes: ["45"] },
      { utter: "When the minute hand points up, how many minutes into the hour is it?", highlightedEdges: ["0"] },
      { utter: "It is 0 minutes into the next hour", highlightedEdges: ["0"], highlightedNodes: ["0"] },
    ],
  },
  {
    diagramId: "compass-basic",
    nodes: [
      { id: "c", text: "Compass\nDirection", x: 1, y: 1 },
      { id: "0", text: "North", x: 1, y: 0 },
      { id: "15", text: "East", x: 2, y: 1 },
      { id: "30", text: "South", x: 1, y: 2 },
      { id: "45", text: "West", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "c", end: "0" },
      { id: "15", start: "c", end: "15" },
      { id: "30", start: "c", end: "30" },
      { id: "45", start: "c", end: "45" },
    ],
    narrative: [
      { utter: "Let's learn the directions on a compass", highlightedNodes: ["c"] },
      { utter: "When the compass points up, what direction is it pointing?", highlightedEdges: ["0"] },
      { utter: "It is pointing North", highlightedEdges: ["0"], highlightedNodes: ["0"] },
      { utter: "When the compass points right, what direction is it pointing?", highlightedEdges: ["15"] },
      { utter: "It is pointing East", highlightedEdges: ["15"], highlightedNodes: ["15"] },
      { utter: "When the compass points down, what direction is it pointing?", highlightedEdges: ["30"] },
      { utter: "It is pointing South", highlightedEdges: ["30"], highlightedNodes: ["30"] },
      { utter: "When the compass points left, what direction is it pointing?", highlightedEdges: ["45"] },
      { utter: "It is pointing West", highlightedEdges: ["45"], highlightedNodes: ["45"] },
    ],
  },
  {
    diagramId: "compass-advanced",
    nodes: [
      { id: "c", text: "Compass\nDirection", x: 1, y: 1 },
      { id: "0", text: "North", x: 1, y: 0 },
      { id: "ne", text: "Northeast", x: 2, y: 0 },
      { id: "15", text: "East", x: 2, y: 1 },
      { id: "se", text: "Southeast", x: 2, y: 2 },
      { id: "30", text: "South", x: 1, y: 2 },
      { id: "sw", text: "Southwest", x: 0, y: 2 },
      { id: "45", text: "West", x: 0, y: 1 },
      { id: "nw", text: "Northwest", x: 0, y: 0 },
    ],
    edges: [
      { id: "0", start: "c", end: "0" },
      { id: "ne", start: "c", end: "ne" },
      { id: "15", start: "c", end: "15" },
      { id: "se", start: "c", end: "se" },
      { id: "30", start: "c", end: "30" },
      { id: "sw", start: "c", end: "sw" },
      { id: "45", start: "c", end: "45" },
      { id: "nw", start: "c", end: "nw" },
    ],
    narrative: [
      { utter: "Let's learn the directions on a compass", highlightedNodes: ["c"] },
      { utter: "When the compass points up, what direction is it pointing?", highlightedEdges: ["0"] },
      { utter: "It is pointing North", highlightedEdges: ["0"], highlightedNodes: ["0"] },
      { utter: "When the compass points up and right, what direction is it pointing?", highlightedEdges: ["ne"] },
      { utter: "It is pointing Northeast", highlightedEdges: ["ne"], highlightedNodes: ["ne"] },
      { utter: "When the compass points right, what direction is it pointing?", highlightedEdges: ["15"] },
      { utter: "It is pointing East", highlightedEdges: ["15"], highlightedNodes: ["15"] },
      { utter: "When the compass points down and right, what direction is it pointing?", highlightedEdges: ["se"] },
      { utter: "It is pointing Southeast", highlightedEdges: ["se"], highlightedNodes: ["se"] },
      { utter: "When the compass points down, what direction is it pointing?", highlightedEdges: ["30"] },
      { utter: "It is pointing South", highlightedEdges: ["30"], highlightedNodes: ["30"] },
      { utter: "When the compass points down and left, what direction is it pointing?", highlightedEdges: ["sw"] },
      { utter: "It is pointing Southwest", highlightedEdges: ["sw"], highlightedNodes: ["sw"] },
      { utter: "When the compass points left, what direction is it pointing?", highlightedEdges: ["45"] },
      { utter: "It is pointing West", highlightedEdges: ["45"], highlightedNodes: ["45"] },
      { utter: "When the compass points up and left, what direction is it pointing?", highlightedEdges: ["nw"] },
      { utter: "It is pointing Northwest", highlightedEdges: ["nw"], highlightedNodes: ["nw"] },
    ],
  },
  {
    diagramId: "repetitive-task",
    nodes: [
      { id: "0", text: "Task", x: 1, y: 1 },
    ],
    edges: [
      { id: "loop", start: "0", end: "0" },
    ],
    narrative: [
      { utter: "Some tasks are repetitive.", highlightedNodes: ["0"] },
      { utter: "They just keep going in a loop.", highlightedNodes: ["0"], highlightedEdges: ["loop"] },
    ],
  },
  {
    "diagramId": "family-tree",
    "lastEdited": 1767477837010,
    "nodes": [
      {
        "id": "node-0",
        "text": "Mommy",
        "x": 0,
        "y": 1
      },
      {
        "id": "node-1",
        "text": "Daddy",
        "x": 1,
        "y": 1
      },
      {
        "id": "group-0",
        "children": [
          "node-1",
          "node-0"
        ]
      },
      {
        "id": "node-2",
        "text": "Brother",
        "x": 0,
        "y": 2
      },
      {
        "id": "node-3",
        "text": "Me",
        "x": 1,
        "y": 2
      },
      {
        "id": "node-4",
        "text": "Grandma",
        "x": 1,
        "y": 0
      },
      {
        "id": "node-5",
        "text": "Grandpa",
        "x": 2,
        "y": 0
      },
      {
        "id": "group-1",
        "children": [
          "node-5",
          "node-4"
        ]
      },
      {
        "id": "node-6",
        "text": "Uncle",
        "x": 2,
        "y": 1
      },
      {
        "id": "node-7",
        "text": "Auntie",
        "x": 3,
        "y": 1
      },
      {
        "id": "group-2",
        "children": [
          "node-6",
          "node-7"
        ]
      },
      {
        "id": "node-8",
        "text": "Cousin",
        "x": 2,
        "y": 2
      },
      {
        "id": "group-3",
        "children": [
          "node-1",
          "node-0"
        ]
      }
    ],
    "edges": [
      {
        "id": "edge-0",
        "start": "group-0",
        "end": "node-3"
      },
      {
        "id": "edge-1",
        "start": "group-0",
        "end": "node-2"
      },
      {
        "id": "edge-2",
        "start": "group-1",
        "end": "node-1"
      },
      {
        "id": "edge-3",
        "start": "group-2",
        "end": "node-8"
      },
      {
        "id": "edge-4",
        "start": "group-1",
        "end": "node-6"
      }
    ],
    "narrative": [
      {
        "utter": "This is me.",
        "highlightedNodes": [
          "node-3"
        ],
        "highlightedEdges": []
      },
      {
        "utter": "These are my parents.",
        "highlightedNodes": [
          "group-0"
        ],
        "highlightedEdges": []
      },
      {
        "utter": "These are my grandparents. They are my Daddy's parents.",
        "highlightedNodes": [
          "node-1",
          "group-1"
        ],
        "highlightedEdges": [
          "edge-0",
          "edge-2"
        ]
      },
      {
        "utter": "This is my Uncle. He is my Daddy's brother.",
        "highlightedNodes": [
          "node-1",
          "group-1",
          "node-6"
        ],
        "highlightedEdges": [
          "edge-0",
          "edge-2",
          "edge-4"
        ]
      },
      {
        "utter": "This is my cousin. He is my uncle's daughter.",
        "highlightedNodes": [
          "node-1",
          "group-1",
          "node-8",
          "group-2"
        ],
        "highlightedEdges": [
          "edge-0",
          "edge-2",
          "edge-4",
          "edge-3"
        ]
      }
    ]
  },
  {
    "diagramId": "solar-system",
    "nodes": [
      {
        "id": "node-0",
        "text": "Sun",
        "x": 1,
        "y": 0
      },
      {
        "id": "node-1",
        "text": "Mercury",
        "x": 2,
        "y": 0
      },
      {
        "id": "node-2",
        "text": "Venus",
        "x": 2,
        "y": 1
      },
      {
        "id": "node-3",
        "text": "Earth",
        "x": 2,
        "y": 2
      },
      {
        "id": "node-4",
        "text": "Mars",
        "x": 1,
        "y": 3
      },
      {
        "id": "node-5",
        "text": "Jupiter",
        "x": 0,
        "y": 3
      }
    ],
    "edges": [
      {
        "id": "edge-0",
        "start": "node-0",
        "end": "node-1"
      },
      {
        "id": "edge-1",
        "start": "node-0",
        "end": "node-2"
      },
      {
        "id": "edge-2",
        "start": "node-0",
        "end": "node-3"
      },
      {
        "id": "edge-3",
        "start": "node-0",
        "end": "node-4"
      },
      {
        "id": "edge-4",
        "start": "node-0",
        "end": "node-5"
      }
    ],
    "narrative": [
      {
        "utter": "What planet is closest to the Sun?",
        "highlightedEdges": [
          "edge-0"
        ],
      },
      {
        "utter": "It is Mercury",
        "highlightedNodes": [
          "node-1"
        ],
      },
      {
        "utter": "What planet is the second closest to the Sun?",
        "highlightedEdges": [
          "edge-1"
        ],
      },
      {
        "utter": "It is Venus",
        "highlightedNodes": [
          "node-2"
        ],
      },
      {
        "utter": "What planet is the third closest to the Sun?",
        "highlightedEdges": [
          "edge-2"
        ],
      },
      {
        "utter": "It is Earth",
        "highlightedNodes": [
          "node-3"
        ],
      },
      {
        "utter": "What planet is the fourth closest to the Sun?",
        "highlightedEdges": [
          "edge-3"
        ],
      },
      {
        "utter": "It is Mars",
        "highlightedNodes": [
          "node-4"
        ],
      },
      {
        "utter": "What planet is the fifth closest to the Sun?",
        "highlightedEdges": [
          "edge-4"
        ],
      },
      {
        "utter": "It is Jupiter",
        "highlightedNodes": [
          "node-5"
        ],
      },
    ]
  },
];
