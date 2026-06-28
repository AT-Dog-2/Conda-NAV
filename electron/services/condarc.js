const fs = require('fs');
const path = require('path');
const os = require('os');

function condarcCandidates() {
  const home = os.homedir();
  const list = [
    path.join(home, '.condarc'),
    path.join(home, '.conda', '.condarc'),
  ];
  if (process.platform === 'win32') {
    if (process.env.USERPROFILE) {
      list.push(path.join(process.env.USERPROFILE, '.condarc'));
    }
    if (process.env.APPDATA) {
      list.push(path.join(process.env.APPDATA, 'conda', '.condarc'));
    }
  }
  return [...new Set(list)];
}

function stripQuotes(s) {
  return s.trim().replace(/^["']|["']$/g, '');
}

function parseCondarcFile(filePath) {
  const result = { root_prefix: '', envs_dirs: [] };
  if (!fs.existsSync(filePath)) return result;

  let text;
  try { text = fs.readFileSync(filePath, 'utf-8'); } catch { return result; }

  const rootMatch = text.match(/^root_prefix:\s*(.+)$/m);
  if (rootMatch) result.root_prefix = stripQuotes(rootMatch[1]);

  const blockMatch = text.match(/envs_dirs:\s*\n((?:[ \t]+-\s*.+\n?)+)/);
  if (blockMatch) {
    for (const line of blockMatch[1].split('\n')) {
      const m = line.match(/^\s*-\s*(.+)/);
      if (m) result.envs_dirs.push(stripQuotes(m[1]));
    }
  }

  const inlineMatch = text.match(/envs_dirs:\s*\[([^\]]*)\]/s);
  if (inlineMatch) {
    for (const part of inlineMatch[1].split(',')) {
      const p = stripQuotes(part);
      if (p) result.envs_dirs.push(p);
    }
  }

  return result;
}

// ── TTL 缓存：避免启动时多次读取同一 .condarc ──────────
let _condarcCache = null;
let _condarcCacheTime = 0;
const CONDARC_CACHE_TTL = 30000;

function readCondarc() {
  const now = Date.now();
  if (_condarcCache && now - _condarcCacheTime < CONDARC_CACHE_TTL) return _condarcCache;

  const merged = { root_prefix: '', envs_dirs: [] };
  for (const file of condarcCandidates()) {
    const parsed = parseCondarcFile(file);
    if (parsed.root_prefix && !merged.root_prefix) merged.root_prefix = parsed.root_prefix;
    for (const d of parsed.envs_dirs) {
      if (!merged.envs_dirs.includes(d)) merged.envs_dirs.push(d);
    }
  }
  _condarcCache = merged;
  _condarcCacheTime = now;
  return merged;
}

/** 强制刷新缓存（设置变更后调用） */
function invalidateCondarcCache() {
  _condarcCache = null;
  _condarcCacheTime = 0;
}

module.exports = { readCondarc, condarcCandidates, invalidateCondarcCache };
