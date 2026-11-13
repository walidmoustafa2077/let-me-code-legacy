import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));
const skillsDir = join(root, ".opencode", "skills");
const skillNames = readdirSync(skillsDir).filter((entry) =>
  statSync(join(skillsDir, entry)).isDirectory()
);

function frontmatter(file) {
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return fields;
}

test("every skill folder declares the same name in its frontmatter", () => {
  for (const name of skillNames) {
    const fields = frontmatter(join(skillsDir, name, "SKILL.md"));
    assert.ok(fields, `${name}: SKILL.md has no frontmatter`);
    assert.equal(fields.name, name, `${name}: frontmatter name must match the folder`);
    assert.ok(fields.description, `${name}: frontmatter needs a description`);
  }
});

test("agent skill allowlists only name skills that exist", () => {
  const config = readJson("opencode.json");
  for (const [id, agent] of Object.entries(config.agent ?? {})) {
    for (const skill of Object.keys(agent.skill ?? {})) {
      if (skill === "*") continue;
      assert.ok(
        skillNames.includes(skill),
        `agent "${id}" allows "${skill}", which has no .opencode/skills/${skill}/SKILL.md`
      );
    }
  }
});

test("delegation agent map stays inside the configured roster", () => {
  const config = readJson("opencode.json");
  const delegate = readJson("DELEGATE_CONFIG.json");
  const declared = Object.keys(config.agent ?? {});
  for (const id of Object.keys(delegate.agents ?? {})) {
    assert.ok(declared.includes(id), `DELEGATE_CONFIG.json names agent "${id}" with no opencode.json entry`);
  }
});

test("no committed template pins a model that cannot resolve", () => {
  for (const name of ["DELEGATE_CONFIG.json"]) {
    const config = readJson(name);
    for (const key of ["defaultModel", "fallbackModel"]) {
      const value = config[key];
      if (value === undefined) continue;
      assert.match(value, /^[\w.-]+\/[\w.:-]+$/, `${name}: ${key} must be "provider/model", got ${value}`);
    }
  }
});

test("the delegation MCP entry points at a file that exists", () => {
  const config = readJson("opencode.json");
  const entry = config.mcp?.delegation;
  assert.ok(entry, "opencode.json must declare mcp.delegation");
  const script = (entry.command ?? []).find((part) => String(part).endsWith(".ts"));
  assert.ok(script, "mcp.delegation command must run a TypeScript entrypoint");
  assert.ok(existsSync(join(root, script)), `missing MCP entrypoint: ${script}`);
});
