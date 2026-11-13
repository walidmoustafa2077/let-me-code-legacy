# Skills Inventory — taste-skill

**Source:** tasteskill 2.5.1, skill `design-taste-frontend`, from the locally installed kit at `~/.config/opencode/skills/taste-skill` (no upstream repository, licence file or NOTICE shipped with the kit)
**Location:** `.opencode/skills/taste-skill/` — text core only, 37 files, ~2.0 MB
**Vendored:** `SKILL.md`, `references/` (22 files), `scripts/` (12 files + 1 factory-only script), `library/` (`palettes.json`, `type.json`)

| # | Asset | Purpose |
|---|-------|---------|
| 1 | `SKILL.md` | The skill itself: house rules, page plans by business kind, asset matrix, run loop, checklist, never-list |
| 2 | `references/*.md` | Deep guidance — copy, copy-voice, system, layout-v4, sections, sections-library, photos, icons, motion, moments, effects (creative/objects/usage), backgrounds, cards, diagrams, scenes, perf, gate |
| 3 | `scripts/gate.mjs` | The browser checker and finish gate (`GATE: PASS` / `GATE: OPEN` / `--done`) |
| 4 | `scripts/*.mjs` | Kit tooling — `start`, `shoot`, `photos`, `icons`, `perf`, `consistency`, `copy-lint`, `effects`, `moments` |
| 5 | `scripts/factory-assets.mjs` | **Factory-only.** Resolves and links the full kit's `assets/` (see below) |
| 6 | `library/palettes.json`, `library/type.json` | Curated palettes and type pairings |

## What was not vendored

`assets/` — 1,594 files, 33.8 MB of hero templates, UI fragments, licensed
stand-in photographs, shader demos and font files. Vendoring it would bloat the
npm tarball ~35 MB and redistribute third-party media with no licence grant.

Instead `scripts/factory-assets.mjs` finds the locally installed full kit and
creates an `assets/` link inside the vendored skill:

```bash
node .opencode/skills/taste-skill/scripts/factory-assets.mjs --print   # where it would link
node .opencode/skills/taste-skill/scripts/factory-assets.mjs           # create the link
```

Resolution order: `$TASTE_SKILL_ASSETS` → `~/.config/opencode/skills/taste-skill/assets`
→ `~/.claude/skills/design-taste-frontend/assets` → `~/.agents/skills/design-taste-frontend/assets`.
On Windows it creates a junction (`mklink /J`); elsewhere a directory symlink.
The link is gitignored and never committed. When no full kit is installed the
script exits 1 and the skill treats every asset-dependent step as blocked
rather than inventing a substitute.

## Local changes from upstream

1. Renamed the frontmatter `name` from `design-taste-frontend` to `taste-skill`
   so the skill id matches its directory (factory rule).
2. Removed the Claude-only `hooks: Stop:` block. opencode has no skill hooks, so
   the same requirement is now an explicit rule in the body: the agent runs
   `gate.mjs` and reports the `GATE:` line before saying `done`.
3. Added an `## In this factory copy` section covering the text-core scope, the
   assets link, and the gate obligation.
4. Reworded section 4 step 6, which described Claude Code's automatic stop hook.

The upstream `references/` and `scripts/` files are byte-identical to the kit;
the scripts resolve `assets/` relative to themselves, which is why the link
lives inside the skill folder instead of in the script.

## Wiring

- `visualizer` uses it for every page mockup or prototype and must report the
  gate result.
- `ui-engineer` loads it for page, landing, marketing and design-system tickets.
- `senior-dev`, `qa-engineer` and `architect` deliberately do not invoke it.

## Licensing

The kit ships no licence, README or NOTICE. Treat the text core as
**reference material included with attribution, not as a licence grant**: do not
publish the `assets/` tree, and if this repository is redistributed commercially,
confirm terms with the kit author first.
