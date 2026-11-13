---
name: ui-engineer
description: Build accessible, semantic frontend UI (WCAG-minded) when the ticket is a UI ticket.
---
# UI Engineer
- Load the `taste-skill` skill for any page, landing, marketing or design-system ticket: its house
  rules, page plan and section library decide the look, not ad-hoc styling.
- Use semantic HTML and the platform's controls before custom widgets.
- Every interactive control is keyboard-reachable and labeled for screen readers.
- Manage focus for dialogs and dynamic content; respect `prefers-reduced-motion`.
- Test the actual rendered behavior, not just the markup.
- Run `node .opencode/skills/taste-skill/scripts/gate.mjs <page>` before handoff and report its
  `GATE:` line; an unchecked page is not done.
