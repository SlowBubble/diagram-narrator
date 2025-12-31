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
      { id: "0", text: "College or\nVocational School", x: 0, y: 0 },
      { id: "1", text: "High School", x: 1, y: 0 },
      { id: "2", text: "Upper School", x: 1, y: 1 },
      { id: "3", text: "Elementary\nSchool", x: 0, y: 1 },
    ],
    edges: [
      { id: "0", start: "1", end: "0" },
      { id: "1", start: "2", end: "1" },
      { id: "2", start: "3", end: "2" },
    ],
    narrative: [
      { utter: "To go to college or vocational school", highlightedNodes: ["0"] },
      { utter: "You have to finish high school", highlightedNodes: ["0", "1"], highlightedEdges: ["0"] },
      { utter: "To go to high school", highlightedNodes: ["1"] },
      { utter: "You have to finish upper school", highlightedNodes: ["2", "1"], highlightedEdges: ["1"] },
      { utter: "To go to upper school", highlightedNodes: ["2"] },
      { utter: "You have to finish elementary school", highlightedNodes: ["3", "2"], highlightedEdges: ["2"] },
    ],
  },
];
