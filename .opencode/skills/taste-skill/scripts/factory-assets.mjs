#!/usr/bin/env node
// Link this text-core copy of tasteskill to the installed full kit's assets/.
// The kit's scripts resolve assets/ next to this folder, so nothing else changes.
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LINK = join(SKILL, "assets");
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`usage: node factory-assets.mjs [--print]

  --print   print the resolved assets folder and exit; do not link anything

Looks at $TASTE_SKILL_ASSETS, then the kit installed for opencode, Claude Code or agents.
With no full kit on this machine it exits 1 and prints how to install one.`);
  process.exit(0);
}

const candidates = [
  process.env.TASTE_SKILL_ASSETS,
  join(homedir(), ".config", "opencode", "skills", "taste-skill", "assets"),
  join(homedir(), ".claude", "skills", "design-taste-frontend", "assets"),
  join(homedir(), ".agents", "skills", "design-taste-frontend", "assets"),
]
  .filter(Boolean)
  .map((p) => resolve(p))
  .filter((p) => p !== LINK && p !== SKILL);

const valid = (dir) => existsSync(join(dir, "starter.html")) && existsSync(join(dir, "layout", "heroes.json"));
const found = candidates.find(valid);

function fail(message) {
  console.error(message);
  console.error(`
The full kit is 34 MB of assets (starters, UI fragments, moments, effects, photographs, scenes).
Install it, then rerun this script:

  git clone <the tasteskill kit> ~/.config/opencode/skills/taste-skill

or point at an existing copy:

  TASTE_SKILL_ASSETS=/path/to/taste-skill/assets node ${join(SKILL, "scripts", "factory-assets.mjs")}

Steps that need an asset are blocked without it; do not substitute your own files for the kit's.`);
  process.exit(1);
}

if (!found) fail(`No full tasteskill kit found. Looked in:\n${candidates.map((p) => `  ${p}`).join("\n")}`);

if (args.includes("--print")) {
  console.log(found);
  process.exit(0);
}

if (existsSync(LINK)) {
  const stat = lstatSync(LINK);
  if (stat.isSymbolicLink()) {
    console.log(`assets already linked: ${LINK} -> ${found}`);
    process.exit(0);
  }
  console.log(`assets is a real folder (full kit vendored): ${LINK}`);
  process.exit(0);
}

try {
  if (process.platform === "win32") {
    execFileSync("cmd", ["/c", "mklink", "/J", LINK, found], { stdio: "pipe" });
  } else {
    symlinkSync(found, LINK, "dir");
  }
} catch (error) {
  fail(`Could not link ${LINK} -> ${found}\n${error.stderr?.toString().trim() || error.message}`);
}

console.log(`linked ${LINK} -> ${found}`);
