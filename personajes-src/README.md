# personajes-src

The source sheets of the characters (`src/lib/personaje.ts`): one image per character, the same cat
in six moods on a 3 × 2 grid. The app never reads these — it reads the cut sprites in
`public/personajes/<id>/<mode>.webp`.

## Adding a character

1. **Generate the sheet** (Figma MCP `generate_image`, model `gemini-3.1-flash-lite-image`, 1536 × 1024).
   Keep the cat paragraph word for word — it is what makes every sheet the same cat:

   > Character model sheet of ONE original cute kawaii cartoon cat: clean uniform black outlines, flat
   > fills, simple round shapes, minimal detail. The cat is small and round, cream-white fur with a soft
   > peach patch on its left ear, tiny dot eyes, a small pink nose, short stubby limbs, standing upright.
   > This time the cat is dressed as a **⟨OUTFIT⟩**. The SAME cat appears six times in a neat 3 by 2 grid,
   > full body, each with a different mood shown through face and pose: 1) deeply focused, eyes narrowed;
   > 2) happy and sociable, big smile, waving; 3) excited with many ideas, star-shaped sparkling eyes,
   > little stars and sparks around the head; 4) overwhelmed, dizzy swirl eyes and swirl lines above the
   > head, ears down; 5) resting calmly, eyes closed, curled up asleep; 6) stuck and hesitant, looking
   > sideways, one paw raised, unsure. Plain white background, no text, no labels, no borders, no shadows
   > on the floor. Absolutely no blue anywhere.

   The order of the six moods is the order of the modes: hiperfoco · conectada · mil ideas · saturada ·
   recargando · no arranco.

2. **Save it** here as `<id>.jpg` and **cut it**:

   ```
   node scripts/cutout-personaje.cjs personajes-src/<id>.jpg public/personajes/<id> hiperfoco,conectada,mil-ideas,saturada,recargando,no-arranco
   ```

3. **Look at every sprite on every mode colour** before shipping: the cut removes the paper by a flood
   fill from the border, so a gap in an outline can eat part of a drawing.

4. **Add it** to `personajes` in `src/lib/personaje.ts` with the garden size at which it arrives.

The style is original: inspired by the clean line of newspaper comic strips, never a copy of an existing
character — this repo is public.
