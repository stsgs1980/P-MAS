# Task 2-b: Terrain/Cartographic Design System Restyle

## Summary
Restyled `/home/z/my-project/src/app/page.tsx` dashboard from space theme to terrain/cartographic design system.

## Key Changes Applied
- Main background: `#0a0e1a` → `#000000`
- Header gradient: cyan/violet/emerald → road primary/secondary/highlight
- Logo icon: Tailwind cyan classes → inline style with `#4A90E2`
- All cyan UI chrome → road primary blue `#4A90E2`
- Section backgrounds: `rgba(255,255,255,0.02)` → `rgba(45,45,45,0.3)`
- Section borders: `rgba(255,255,255,0.06)` → `rgba(51,51,51,0.5)`
- Inner cards: `rgba(10,14,26,0.6)` → `rgba(13,13,13,0.8)`
- Footer: `#0D0D0D` background, terrain border, "v4.0 -- Terrain Edition"
- Formula Flow edges: `rgba(74,144,226,0.15)` stroke, `rgba(74,144,226,0.3)` fill

## Preserved
- Role group colors, formula colors, status colors, edge type colors
- Semantic icon colors (emerald, violet, amber)
- Section header left bars
- All data structures and layout

## Verification
- `bun run lint`: 0 errors
