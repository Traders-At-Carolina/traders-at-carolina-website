# Placement

Firm logos for the "Where our members go." section on the homepage.

- SVG, or PNG with a transparent background, at least 200px wide.
- Single-colour / monochrome marks read best; they render at ~56px tall.
- Naming: lowercase, hyphenated, e.g. `firm-name.svg`.

## Adding a logo

1. Drop the file in this folder.
2. Add an entry to `placement.json` in this folder:

```json
[
  { "src": "/images/placement/firm-name.svg", "name": "Firm Name" }
]
```

`name` is used as the alt text. While the list is empty the homepage shows a
blank #EBEAE4 block in place of the grid. Only add confirmed firms.
