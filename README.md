# Ciné Langue

A no-nonsense French (and Spanish) trainer for someone with rusty school grammar who wants to follow New Wave films in the original.

No build step, no account, no server: open `index.html` in a browser. Progress lives in the browser's localStorage (export it from Settings).

## What's in it

- **Review**: spaced-repetition sentence cards. You *type* the missing word in a real sentence (no multiple choice), then hear the whole sentence read aloud. Decks: core French, spoken/colloquial French, grammar-in-context, film vocabulary, plus your own cards.
- **Conjugate**: typed drills over 70 French / 60 Spanish verbs and 8 tenses each, including the passé simple used in film narration. Tracks accuracy by tense.
- **Dictation**: hear a sentence (system text-to-speech), type it, get a word-level diff.
- **Subtitle prep**: load a film's French `.srt`. It lists the words you probably don't know, most frequent first, each with the line it comes from. Mark them known or turn the line into a card in one click.
- **Films**: a New Wave ladder ordered by listening difficulty, with a method for watching to learn. The Spanish side has Buñuel, Saura, Erice, Berlanga and others.
- **Grammar**: compact refresher on the rules that rust first.

## Running

```bash
open index.html
```

or serve it (any static server works):

```bash
python3 -m http.server 8765
```

Audio uses your OS voices. On macOS, add an Enhanced/Premium French or Spanish voice in System Settings → Accessibility → Spoken Content → System voice → Manage Voices.

## Hosting

It's a static site: enable GitHub Pages on `main` (root) and it works as-is.

## Adding content

Deck files live in `data/<lang>/`. Cloze format: `"sentence with {answer/alt}|English|hint|note"`. Flip format: `"front|back|note"`.
