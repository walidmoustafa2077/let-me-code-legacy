import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { copyTree, linkMachineLocalAssets } from "../lib/scaffold.mjs";

function mkdirLink(target, link) {
  if (process.platform === "win32") {
    execFileSync("cmd", ["/c", "mklink", "/J", link, target], { stdio: "ignore" });
  } else {
    fs.symlinkSync(target, link, "dir");
  }
}

test("copyTree copies real files and skips machine-local links", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lmc-copytree-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const src = path.join(root, "src");
  const dst = path.join(root, "dst");
  const kit = path.join(root, "kit");
  fs.mkdirSync(path.join(src, "nested"), { recursive: true });
  fs.mkdirSync(kit);
  fs.writeFileSync(path.join(src, "nested", "keep.txt"), "kept\n");
  fs.writeFileSync(path.join(kit, "huge.bin"), "not copied\n");

  try {
    mkdirLink(kit, path.join(src, "assets"));
  } catch {
    t.skip("this filesystem cannot create a directory link");
    return;
  }

  const log = copyTree(src, dst);

  assert.equal(fs.readFileSync(path.join(dst, "nested", "keep.txt"), "utf8"), "kept\n");
  assert.equal(fs.existsSync(path.join(dst, "assets")), false);
  assert.deepEqual(
    log.filter((entry) => entry.action === "skipped-link").map((entry) => entry.src),
    [path.join(src, "assets")]
  );
});

function tasteTarget(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lmc-assets-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const script = path.join(
    root,
    ".opencode",
    "skills",
    "taste-skill",
    "scripts",
    "factory-assets.mjs"
  );
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.writeFileSync(script, "// stub\n");
  return root;
}

test("linkMachineLocalAssets is a no-op when the skill is absent", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lmc-assets-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  assert.equal(linkMachineLocalAssets({ targetRoot: root }), null);
});

test("linkMachineLocalAssets records a linked kit", (t) => {
  const root = tasteTarget(t);
  const calls = [];

  const entry = linkMachineLocalAssets({
    targetRoot: root,
    runner: (script, cwd) => {
      calls.push({ script, cwd });
      return "linked assets\n";
    }
  });

  assert.equal(entry.action, "assets-linked");
  assert.deepEqual(calls, [
    {
      script: path.join(
        root,
        ".opencode",
        "skills",
        "taste-skill",
        "scripts",
        "factory-assets.mjs"
      ),
      cwd: root
    }
  ]);
});

test("linkMachineLocalAssets warns instead of throwing when the kit is missing", (t) => {
  const root = tasteTarget(t);

  const entry = linkMachineLocalAssets({
    targetRoot: root,
    runner: () => {
      const error = new Error("Command failed");
      error.stderr = "Install the full kit, then run the helper.\n";
      throw error;
    }
  });

  assert.equal(entry.action, "assets-missing");
  assert.equal(entry.detail, "Install the full kit, then run the helper.");
});
