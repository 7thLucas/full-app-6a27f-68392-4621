# CaterFlow — Design Guidelines

## Color Palette
| Role | Hex | Usage |
|---|---|---|
| Primary / Emerald | `#1B5E47` | Primary actions, nav, key UI elements |
| Accent / Gold | `#C9932A` | Highlights, CTAs, status accents |
| Background / Cream | `#FAF7F0` | Page backgrounds, card surfaces |
| Body text | `#374151` | Primary body text |
| Muted body | `#4B5563` | Secondary text, labels, captions |

## Typography
- **Font family**: Inter (system-ui fallback)
- **Headings**: Semi-bold to Bold (600–700), clear hierarchy
- **Body**: Regular (400), 16px base, comfortable line-height (1.6)
- **Labels / Captions**: Medium (500), slightly smaller, muted color

## Elevation & Surfaces
- Backgrounds use the Cream (`#FAF7F0`) palette — warm, not clinical white
- Cards: white or very light cream with subtle border (`1px solid rgba(0,0,0,0.07)`) and soft shadow (`0 1px 4px rgba(0,0,0,0.06)`)
- Elevated overlays (modals, dropdowns): white with stronger shadow
- No harsh borders; prefer soft separators and spacing for hierarchy

## Component Style
- **Buttons**: Rounded corners (8px). Primary = Emerald fill + white text. Secondary = outlined or ghost. Accent CTA = Gold fill.
- **Status Badges**: Pill-shaped with muted background tints. Confirmed = emerald tint, Prep = amber tint, Day-of = gold tint, Completed = grey tint.
- **Table / List rows**: Subtle hover state (cream tint), clear row separation.
- **Icons**: Minimal, stroke-based. Consistent 20–24px sizing.
- **Forms**: Clean labels above inputs, generous padding, focus ring using primary emerald.
- **Empty States**: Illustrated or icon-based with a clear single action CTA.

## Layout Principles
- **Sidebar navigation**: Fixed left sidebar for primary nav sections (Dashboard, Events, Menus, Staff, Vendors).
- **Main content area**: Clean, spacious, max-width constrained for readability.
- **Dashboard**: Card grid overview + activity/status list. Prioritise scannability.
- **Responsive**: Desktop-first (operators work on desktop/tablet). Mobile-responsive as secondary.

## Tone in UI Copy
- Calm and directive: "Add event", "Assign staff", "Review menu"
- Outcome-focused confirmations: "Staff assigned", "Menu saved"
- Avoid jargon; use plain operator language
- Error messages: constructive, not alarming

## Reference Apps (Inspiration)
- Linear (clean task/list management, keyboard-friendly)
- Notion (flexible workspace feel)
- Toast POS (domain-specific, operator-first)
