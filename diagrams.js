export const diagrams = [
  {
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
      { utter: "To learn", highlightedNodes: ["0"] },
      { utter: "You have to struggle", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To struggle", highlightedNodes: ["1"] },
      { utter: "You have to find a good challenge that is not too easy, but not too hard either.", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] }
    ],
  },
  {
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
      { utter: "To rent your own place", highlightedNodes: ["0"] },
      { utter: "You have to earn money", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To earn money", highlightedNodes: ["1"] },
      { utter: "You have to learn valuable skills", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] }
    ],
  },
  {
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
      { utter: "To go to high school", highlightedNodes: ["0"] },
      { utter: "You have to finish upper school", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To go to upper school", highlightedNodes: ["1"] },
      { utter: "You have to finish elementary school", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] },
      { utter: "To go to elementary school", highlightedNodes: ["2"] },
      { utter: "You have to finish preschool", highlightedNodes: ["3", "2"], highlightedEdges: ["2"] },
    ],
  },
  {
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
      { utter: "Next stop, Porter Square. Doors open on your left.", highlightedNodes: ["0"] },
      { utter: "Next stop, Harvard Square. Doors open on your right.", highlightedNodes: ["1"], highlightedEdges: ["0"] },
      { utter: "Next stop, Central Square. Doors open on your right.", highlightedNodes: ["2"], highlightedEdges: ["1"] },
      { utter: "Next stop, Kendall Square. Doors open on your right.", highlightedNodes: ["3"], highlightedEdges: ["2"] },
    ],
  },
  {
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
      { utter: "To solve a big problem", highlightedNodes: ["0"] },
      { utter: "You have to break it down into smaller parts", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "After you have broken it into smaller parts", highlightedNodes: ["1"] },
      { utter: "You have to solve each part", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] },
      { utter: "After you have solved each part", highlightedNodes: ["2"] },
      { utter: "You have to combine the solutions together", highlightedNodes: ["3", "2"], highlightedEdges: ["2"] },
      { utter: "Combining the solutions will help you solve the big problem", highlightedNodes: ["3", "0"], highlightedEdges: ["3"] },
    ],
  },
  {
    nodes: [
      { id: "0", text: "Run", x: 0, y: 0 },
      { id: "1", text: "Crash", x: 0, y: 1 },
      { id: "2", text: "Cry", x: 1, y: 1 },
    ],
    edges: [
      { id: "0", start: "0", end: "1" },
      { id: "1", start: "1", end: "2" },
    ],
    narrative: [
      { utter: "If you run in the building", highlightedNodes: ["0"] },
      { utter: "You may crash into someone", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "If you crash", highlightedNodes: ["1"] },
      { utter: "You will cry", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] },
      { utter: "So, the moral of the story is, don't run in the building." },
    ],
  },
  {
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
      { utter: "If you score in the 90% range on your test", highlightedNodes: ["n1"] },
      { utter: "You will get an A", highlightedNodes: ["n1", "g1"], highlightedEdges: ["0"] },
      { utter: "If you score in the 80% range on your test", highlightedNodes: ["n2"] },
      { utter: "You will get a B", highlightedNodes: ["n2", "g2"], highlightedEdges: ["1"] },
      { utter: "If you score in the 70% range on your test", highlightedNodes: ["n3"] },
      { utter: "You will get a C", highlightedNodes: ["n3", "g3"], highlightedEdges: ["2"] },
      { utter: "If you score in the 60% range on your test", highlightedNodes: ["n4"] },
      { utter: "You will get a D", highlightedNodes: ["n4", "g4"], highlightedEdges: ["3"] },
      { utter: "If you score below 60% on your test", highlightedNodes: ["n5"] },
      { utter: "You will get an F", highlightedNodes: ["n5", "g5"], highlightedEdges: ["4"] },
    ],
  },
];
