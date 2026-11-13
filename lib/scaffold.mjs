import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".delegation",
  "vendor",
  "dist"
]);

export function timestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function backupFile(dst, date = new Date()) {
  if (!fs.existsSync(dst)) {
    return null;
  }
  const bak = `${dst}.bak-${timestamp(date)}`;
  fs.copyFileSync(dst, bak);
  return bak;
}

export function copyFile(src, dst, { mode = "merge", log = [] } = {}) {
  if (fs.existsSync(dst)) {
    if (mode === "merge") {
      log.push({ action: "kept", dst });
      return dst;
    }
    const bak = `${dst}.bak-${timestamp()}`;
    fs.copyFileSync(dst, bak);
    log.push({ action: "backed-up", dst, bak });
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  log.push({ action: "copied", dst });
  return dst;
}

export function copyTree(srcDir, dstDir, { mode = "merge", skip = SKIP_DIRS, log = [] } = {}) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (skip.has(entry.name)) {
      continue;
    }
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    // Symlinks and Windows junctions point at this machine's filesystem, so
    // recreating them would either fail or leak a path that does not exist on
    // the target. Skip them; the machine-local helper that made the link (for
    // example taste-skill's factory-assets.mjs) recreates it where needed.
    if (entry.isSymbolicLink() || fs.lstatSync(src).isSymbolicLink()) {
      log.push({ action: "skipped-link", src, dst });
      continue;
    }
    if (entry.isDirectory()) {
      copyTree(src, dst, { mode, skip, log });
    } else {
      copyFile(src, dst, { mode, log });
    }
  }
  return log;
}

export function installAssets({ sourceRoot, targetRoot, mode = "merge", log = [] }) {
  copyTree(path.join(sourceRoot, ".opencode"), path.join(targetRoot, ".opencode"), { mode, log });
  copyTree(path.join(sourceRoot, "mcp"), path.join(targetRoot, "mcp"), { mode, log });
  const config = path.join(sourceRoot, "DELEGATE_CONFIG.json");
  if (fs.existsSync(config)) {
    copyFile(config, path.join(targetRoot, "DELEGATE_CONFIG.json"), { mode, log });
  }
  return log;
}

const TASTE_SKILL_ASSETS = path.join(
  ".opencode",
  "skills",
  "taste-skill",
  "assets"
);

// copyTree skips machine-local links, so a scaffolded project starts without
// the taste-skill asset kit. Ask the vendored helper to link the installed kit
// into the new tree. A missing kit is a warning, not a failed scaffold.
export function linkMachineLocalAssets({
  targetRoot,
  log = [],
  env = process.env,
  runner = (script, cwd) =>
    execFileSync(process.execPath, [script], {
      cwd,
      env,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 30_000
    })
} = {}) {
  const script = path.join(
    targetRoot,
    ".opencode",
    "skills",
    "taste-skill",
    "scripts",
    "factory-assets.mjs"
  );
  const link = path.join(targetRoot, TASTE_SKILL_ASSETS);
  if (!fs.existsSync(script)) {
    return null;
  }
  if (fs.existsSync(link)) {
    const entry = { action: "assets-present", link };
    log.push(entry);
    return entry;
  }
  try {
    runner(script, targetRoot);
    const entry = { action: "assets-linked", link };
    log.push(entry);
    return entry;
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    const detail = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? error.message;
    const entry = { action: "assets-missing", link, detail };
    log.push(entry);
    return entry;
  }
}
