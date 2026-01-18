# wishlist

# m6a

- Create a editStory.html and editStory.js app
- At the top, you have text area for a prompt to generate a story, which is auto-focused when you open the page.
- When the user press enter, it calls gemini api (similar to the generate narrative feature) with a prompt to generate a JSON for this story structure
```
{
  brokenDownSentences: [
    'sentence 1', ...
  ],
  vocabs: [
    {
      brokenDownWord: 'word 1',
      pronunciationParts: ['part 1', ...], 
    }, ...
  ],
}
```
  - Prompt for the sentences to be broken down into easy-to-read phrases, via "|". Fo example, "Daddy took Lisa to the park." should be broken down into "Daddy took Lisa|to the park.".
  - Prompt for the vocabs to be broken down into syllables, via "|". For example, "Daddy" should be broken down into "Dad|dy", and we should provide a clear way for the Web Speech API to pronounce each part since it can be ambiguous sometimes. E.g. "Dad|dy" should be pronounced as "dad", and "dy" should be pronounced as "dee".
- Render the pretty JSON below the top textarea with 2 indent.
- Save the JSON in a new firestore collection called "stories"
```
{
  info: {
    id: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    owner: string,
    isPublic: boolean,
  },
  story: generated_json
}
```