# LingoLab

An intensive French and Spanish trainer for someone with rusty school grammar who wants real comprehension. The long-term goal is following films in the original. Built to be harder than Duolingo: everything is typed recall or production, nothing is multiple choice.

No build step, no account, no server: open `index.html`. Progress lives in the browser's localStorage (export it from Settings).

## Train

- **Review**: spaced-repetition sentence cards. You *type* the missing word, then hear the whole sentence. Decks: Core, Everyday life, Conversation, Grammar in context, Spoken (colloquial), Film vocabulary, plus your own cards. Intensity presets: 15 / 30 / 50 new cards a day.
- **Translate**: English → target language, whole sentences, scored word by word against a model answer.
- **Conjugate**: typed drills over 70 French / 60 Spanish verbs and 8 tenses each, with accuracy tracked per tense.
- **Dictation**: hear a sentence, type it, get a word-level diff.
- **Grammar**: compact refresher on the rules that rust first.

## Cinema

- **Films**: a ladder ordered by listening difficulty (French New Wave; Buñuel, Saura, Erice, Berlanga and others for Spanish), a method for watching to learn, and "watched" tracking.
- **Subtitle prep**: load a film's `.srt`. It lists the words you likely don't know, most frequent first, each with the line it comes from, and turns lines into cards in one click.

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
