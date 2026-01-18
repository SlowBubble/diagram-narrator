import { app, db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-ai.js";

const promptArea = document.getElementById('story-prompt');
const jsonDisplay = document.getElementById('json-display');
const loadingOverlay = document.getElementById('loading-overlay');
const statusMessage = document.getElementById('status-message');
const authStatus = document.getElementById('auth-status');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authStatus.textContent = `Signed in as ${user.email}`;
  } else {
    authStatus.textContent = 'Not signed in (Stories will be saved as anonymous)';
  }
});

promptArea.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const prompt = promptArea.value.trim();
    if (!prompt) return;

    await generateStory(prompt);
  }
});

async function generateStory(userPrompt) {
  loadingOverlay.style.display = 'flex';
  statusMessage.textContent = 'Generating...';

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    const systemPrompt = `You are a specialized assistant that creates educational story structures.
Your goal is to take a story prompt and generate a specific JSON structure.

JSON Structure:
{
  "brokenDownSentences": [
    "sentence 1", ...
  ],
  "vocabs": [
    {
      "brokenDownWord": "word 1",
      "pronunciationParts": ["part 1", ...]
    }, ...
  ]
}

Rules:
1. brokenDownSentences: Break each sentence into natural, easy-to-read phrases using the "|" character.
   - Example: "Daddy took Lisa to the park." -> "Daddy took Lisa|to the park."
2. vocabs: Extract 5-10 key vocabulary words from the story.
3. brokenDownWord: Break the word into syllables using "|".
   - Example: "Daddy" -> "Dad|dy"
4. pronunciationParts: For each syllable in brokenDownWord, provide a phonetic string that the Web Speech API will pronounce correctly in isolation.
   - Example: For "Dad|dy", the parts are "Dad" and "dy".
   - "Dad" is pronounced "dad".
   - "dy" in this context is pronounced "dee".
   - So pronunciationParts would be ["dad", "dee"].
5. The output MUST be ONLY valid JSON. No preamble, no markdown blocks, no trailing commas, and no comments.
6. Ensure all keys and string values are enclosed in double quotes.

Story Prompt: ${userPrompt}
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // More robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Attempt to remove common JSON pitfalls like trailing commas before closing braces/brackets
    const cleanedText = text
      .replace(/,\s*([\}\]])/g, '$1') // Remove trailing commas
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments if any

    const storyJson = JSON.parse(cleanedText);

    // Display JSON
    jsonDisplay.textContent = JSON.stringify(storyJson, null, 2);

    // Save to Firestore
    await saveStoryToFirestore(storyJson);

    statusMessage.textContent = 'Saved to Firestore';
    promptArea.value = '';
    promptArea.focus();

  } catch (error) {
    console.error("Story generation failed:", error);
    statusMessage.textContent = 'Error: ' + error.message;
    alert("Failed to generate story: " + error.message);
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

async function saveStoryToFirestore(storyJson) {
  try {
    const storyId = `story-${Date.now()}`;
    const storyDoc = {
      info: {
        id: storyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        owner: currentUser ? currentUser.uid : 'anonymous',
        isPublic: true, // Default to public for now as per previous patterns
      },
      story: storyJson
    };

    await addDoc(collection(db, "stories"), storyDoc);
    console.log("Story saved with ID: ", storyId);
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}
