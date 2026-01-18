# wishlist

# m6g
- Add a title also from the generated json.
- form the id from that title (replacing spaces with -).

# m6f
- Refine the prompt about breaking syllables so that the non-vowel should be part of the next syllable if it is sounded with the next vowel.
  - "teacher" is currently "teach|er" but should be "teach|er". "color" is currently "col|or" but should be "co|lor".

# m6e
- Add another input below the text area, that specify the number of sentences to generate. Default to 6.

# m6d
- Refine the prompt some more
  - "together" is currently "to|geth|er" but should be "to|ge|ther".

# m6c
- allow accessing the story via query param `?id=...`

# m6b
- change the theme from dark to light
- Allow the generated json to be edited, and saved when `cmd+s` is pressed
- Edit the prompt to break syllables more precisely like how it is actually read.
  - Currently "shouted" is broken down into "shout|ed", but it should be "shou|ted".
 
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