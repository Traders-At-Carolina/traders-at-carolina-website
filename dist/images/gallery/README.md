# Gallery

Event photos for the auto-scrolling strip on the homepage.

- 3:2 or 4:3 aspect ratio, at least 1200px wide, JPG.
- Cards render at 520x340 with `object-fit: cover`, so keep subjects near the centre.
- Naming: lowercase, hyphenated, e.g. `kickoff-night.jpg`.

## Adding a photo (two steps, no layout code)

1. Drop the file in this folder.
2. Add an entry to `gallery.json` in this same folder.

`gallery.json` format:

```json
[
  { "src": "/images/gallery/kickoff-night.jpg", "caption": "[Caption]" }
]
```

- `src` is the public path, so it starts with `/images/gallery/`.
- `caption` is the line shown under the card.
- While the list is empty the homepage renders neutral placeholder cards instead.
